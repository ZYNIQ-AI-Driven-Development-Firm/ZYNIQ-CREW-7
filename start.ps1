# ZYNIQ-CREW7 Complete Startup Script (PowerShell)
# Run with: .\start.ps1

$ErrorActionPreference = "Stop"

# Colors
function Write-ColorOutput($ForegroundColor) {
    $fc = $host.UI.RawUI.ForegroundColor
    $host.UI.RawUI.ForegroundColor = $ForegroundColor
    if ($args) {
        Write-Output $args
    }
    $host.UI.RawUI.ForegroundColor = $fc
}

function Write-Success($message) { Write-ColorOutput Green "✓ $message" }
function Write-Info($message) { Write-ColorOutput Cyan "$message" }
function Write-Warning($message) { Write-ColorOutput Yellow "⚠ $message" }
function Write-Error-Msg($message) { Write-ColorOutput Red "✗ $message" }
function Write-Progress-Msg($message) { Write-ColorOutput Yellow "⏳ $message" }

# Banner
Write-ColorOutput Cyan "╔══════════════════════════════════════════════════════════╗"
Write-ColorOutput Cyan "║         ZYNIQ-CREW7 - Complete Startup Script          ║"
Write-ColorOutput Cyan "╚══════════════════════════════════════════════════════════╝"
Write-Output ""

# Script paths
$ProjectRoot = $PSScriptRoot
$BackendDir = Join-Path $ProjectRoot "backend"
$FrontendDir = Join-Path $ProjectRoot "frontend"
$DockerDir = Join-Path $BackendDir "docker"
$MigrationsDir = Join-Path $BackendDir "migrations"

# Load environment variables
Write-Info "[1/9] Loading environment variables from .env..."
$EnvFile = Join-Path $ProjectRoot ".env"
if (Test-Path $EnvFile) {
    Get-Content $EnvFile | ForEach-Object {
        if ($_ -match '^([^#][^=]+)=(.*)$') {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
    Write-Success "Environment loaded"
}
else {
    Write-Error-Msg "Error: .env file not found"
    exit 1
}

# Verify required env vars
Write-Info "[2/9] Verifying required environment variables..."
$RequiredVars = @("DEFAULT_USER_EMAIL", "DEFAULT_USER_PASSWORD", "DEFAULT_USER_CREDITS", "POSTGRES_USER", "POSTGRES_PASSWORD", "POSTGRES_DB")
$MissingVars = @()

foreach ($var in $RequiredVars) {
    if (-not [Environment]::GetEnvironmentVariable($var, "Process")) {
        $MissingVars += $var
    }
}

if ($MissingVars.Count -gt 0) {
    Write-Error-Msg "Missing required environment variables:"
    foreach ($var in $MissingVars) {
        Write-Error-Msg "  - $var"
    }
    exit 1
}
Write-Success "All required variables present"
Write-Output ""

# Get env vars
$DEFAULT_USER_EMAIL = [Environment]::GetEnvironmentVariable("DEFAULT_USER_EMAIL", "Process")
$DEFAULT_USER_PASSWORD = [Environment]::GetEnvironmentVariable("DEFAULT_USER_PASSWORD", "Process")
$POSTGRES_USER = [Environment]::GetEnvironmentVariable("POSTGRES_USER", "Process")
$POSTGRES_PASSWORD = [Environment]::GetEnvironmentVariable("POSTGRES_PASSWORD", "Process")
$POSTGRES_DB = [Environment]::GetEnvironmentVariable("POSTGRES_DB", "Process")

# Stop existing containers
Write-Info "[3/9] Stopping existing containers..."
Set-Location $DockerDir
docker compose down 2>$null
Write-Success "Containers stopped"
Write-Output ""

# Build Docker containers
Write-Info "[4/9] Building Docker containers..."
Write-Progress-Msg "This may take a few minutes..."
docker compose build --no-cache
if ($LASTEXITCODE -ne 0) {
    Write-Error-Msg "Docker build failed"
    exit 1
}
Write-Success "Containers built successfully"
Write-Output ""

# Start database and redis first
Write-Info "[5/9] Starting database and Redis..."
docker compose up -d db redis
Write-Progress-Msg "Waiting for database to be ready..."
Start-Sleep -Seconds 5

# Wait for database to be ready
$MaxRetries = 30
$RetryCount = 0
while ($RetryCount -lt $MaxRetries) {
    $result = docker compose exec -T db pg_isready -U $POSTGRES_USER -d $POSTGRES_DB 2>$null
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database is ready"
        break
    }
    $RetryCount++
    Write-Progress-Msg "Waiting for database... ($RetryCount/$MaxRetries)"
    Start-Sleep -Seconds 2
}

if ($RetryCount -eq $MaxRetries) {
    Write-Error-Msg "Database failed to start"
    exit 1
}
Write-Output ""

# Run migrations in order
Write-Info "[6/9] Running database migrations..."
$Migrations = @(
    "20251109_add_auth_org.sql",
    "20251114_add_crew_graphs.sql",
    "20251115_add_crypto_tables.sql",
    "20251115_add_run_tokens.sql",
    "20251115_add_user_role.sql",
    "20251116_add_agents.sql"
)

foreach ($migration in $Migrations) {
    Write-Progress-Msg "  → Running $migration"
    $migrationPath = Join-Path $MigrationsDir $migration
    Get-Content $migrationPath | docker compose exec -T db psql -U $POSTGRES_USER -d $POSTGRES_DB
    if ($LASTEXITCODE -eq 0) {
        Write-Success "  ✓ $migration applied"
    }
    else {
        Write-Error-Msg "  ✗ $migration failed"
        exit 1
    }
}
Write-Success "All migrations applied successfully"
Write-Output ""

# Create test user
Write-Info "[7/9] Creating test user..."
$userSQL = @"
DO `$`$
BEGIN
    DELETE FROM users WHERE email = '$DEFAULT_USER_EMAIL';
    
    INSERT INTO users (id, email, password_hash, name, role, created_at, updated_at)
    VALUES (
        gen_random_uuid(),
        '$DEFAULT_USER_EMAIL',
        '`$2b`$12`$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lW3Pe8vYvH7G',
        'Admin User',
        'admin',
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'User created: $DEFAULT_USER_EMAIL';
END `$`$;
"@

$userSQL | docker compose exec -T db psql -U $POSTGRES_USER -d $POSTGRES_DB
if ($LASTEXITCODE -eq 0) {
    Write-Success "Test user created"
    Write-Info "  Email: $DEFAULT_USER_EMAIL"
    Write-Info "  Password: $DEFAULT_USER_PASSWORD"
}
else {
    Write-Warning "User creation had issues (may already exist)"
}
Write-Output ""

# Create/update wallet with credits
Write-Info "[7.5/9] Setting up wallet credits..."
$walletSQL = @"
DO `$`$
DECLARE
    wallet_exists BOOLEAN;
BEGIN
    -- Check if wallet exists for 'default' org
    SELECT EXISTS(SELECT 1 FROM wallets WHERE org_id = 'default') INTO wallet_exists;
    
    IF wallet_exists THEN
        -- Update existing wallet
        UPDATE wallets 
        SET credits = $DEFAULT_USER_CREDITS
        WHERE org_id = 'default';
        RAISE NOTICE 'Wallet updated with % credits', $DEFAULT_USER_CREDITS;
    ELSE
        -- Create new wallet
        INSERT INTO wallets (id, org_id, credits)
        VALUES (gen_random_uuid(), 'default', $DEFAULT_USER_CREDITS);
        RAISE NOTICE 'Wallet created with % credits', $DEFAULT_USER_CREDITS;
    END IF;
END `$`$;
"@

$walletSQL | docker compose exec -T db psql -U $POSTGRES_USER -d $POSTGRES_DB
if ($LASTEXITCODE -eq 0) {
    Write-Success "Wallet configured"
    Write-Info "  Credits: $DEFAULT_USER_CREDITS"
}
else {
    Write-Warning "Wallet setup had issues"
}
Write-Output ""

# Start all other services
Write-Info "[8/9] Starting all services..."
docker compose up -d
Write-Progress-Msg "Waiting for API to be ready..."
Start-Sleep -Seconds 10

# Wait for API to be ready
$MaxRetries = 30
$RetryCount = 0
while ($RetryCount -lt $MaxRetries) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:8000/health" -TimeoutSec 2 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            Write-Success "API is ready"
            break
        }
    }
    catch {
        # Continue waiting
    }
    $RetryCount++
    Write-Progress-Msg "Waiting for API... ($RetryCount/$MaxRetries)"
    Start-Sleep -Seconds 2
}

if ($RetryCount -eq $MaxRetries) {
    Write-Error-Msg "API failed to start. Checking logs..."
    Write-Output ""
    Write-Warning "Last 20 lines of API logs:"
    docker compose logs --tail=20 api
    exit 1
}
Write-Output ""

# Start frontend
Write-Info "[9/9] Starting frontend development server..."
Set-Location $FrontendDir

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Progress-Msg "Installing frontend dependencies..."
    npm install
}

# Start frontend in background
Write-Progress-Msg "Starting Vite dev server..."
$FrontendProcess = Start-Process -FilePath "npm" -ArgumentList "run", "dev" -NoNewWindow -PassThru -RedirectStandardOutput "$env:TEMP\crew7-frontend.log" -RedirectStandardError "$env:TEMP\crew7-frontend-error.log"
Start-Sleep -Seconds 5

# Check if frontend started
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Success "Frontend is ready"
}
catch {
    Write-Warning "Frontend may still be starting..."
}
Write-Output ""

# Summary
Write-ColorOutput Green "╔══════════════════════════════════════════════════════════╗"
Write-ColorOutput Green "║                 🎉 STARTUP COMPLETE! 🎉                  ║"
Write-ColorOutput Green "╚══════════════════════════════════════════════════════════╝"
Write-Output ""
Write-Info "📊 Service Status:"
Write-Success "Database:   http://localhost:5432"
Write-Success "Redis:      http://localhost:6379"
Write-Success "API:        http://localhost:8000"
Write-Success "Frontend:   http://localhost:3000"
Write-Success "pgAdmin:    http://localhost:5050"
Write-Output ""
Write-Info "🔑 Test User Credentials:"
Write-ColorOutput Magenta "   Email:    $DEFAULT_USER_EMAIL"
Write-ColorOutput Magenta "   Password: $DEFAULT_USER_PASSWORD"
Write-ColorOutput Magenta "   Credits:  $DEFAULT_USER_CREDITS"
Write-Output ""
Write-Info "📝 Useful Commands:"
Write-ColorOutput Yellow "   View API logs:      docker compose -f backend/docker/compose.yml logs -f api"
Write-ColorOutput Yellow "   View frontend logs: Get-Content `$env:TEMP\crew7-frontend.log -Wait"
Write-ColorOutput Yellow "   Stop all services:  docker compose -f backend/docker/compose.yml down"
Write-ColorOutput Yellow "   Restart API:        docker compose -f backend/docker/compose.yml restart api"
Write-Output ""
Write-Info "🧪 Testing:"
Write-ColorOutput Blue "   1. Open browser: http://localhost:3000"
Write-Output "   2. Login with credentials above"
Write-Output "   3. Test agent, rating, and pricing features"
Write-Output ""
Write-Success "Ready to test! 🚀"
Write-Output ""

# Keep script running
Write-Info "Press Ctrl+C to stop all services"
try {
    while ($true) {
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Output ""
    Write-Warning "Stopping services..."
    Set-Location $DockerDir
    docker compose down
    if ($FrontendProcess -and -not $FrontendProcess.HasExited) {
        Stop-Process -Id $FrontendProcess.Id -Force
    }
    Write-Success "All services stopped"
}
