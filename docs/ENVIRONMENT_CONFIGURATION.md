# Environment Configuration Guide

## Centralized Configuration

All environment variables for ZYNIQ-CREW7 are centralized in the **root `.env` file**. This approach ensures consistency across all services and simplifies configuration management.

## File Structure

```
ZYNIQ-CREW7/
├── .env                    # ⭐ MAIN configuration file (all variables)
├── frontend/
│   ├── .env               # Frontend overrides (VITE_* only)
│   ├── .env.example       # Template for frontend variables
│   └── .env.docker        # Docker-specific frontend config
└── backend/
    └── docker/
        └── compose.yml    # References root .env file
```

## Variable Categories

### 1. Backend Services
Located in root `.env`:
- Database (PostgreSQL, pgAdmin)
- Cache (Redis)
- Vector DB (Qdrant)
- Object Storage (MinIO/S3)
- LLM Services (Ollama, OpenAI, Gemini, AimalAPI)
- Email (SMTP)
- Authentication & Security
- Observability (OpenTelemetry)

### 2. Frontend Services
Located in root `.env` (with `VITE_` prefix):
- API endpoints
- WebSocket URLs
- Environment-specific URLs

**Important:** Vite only exposes variables that start with `VITE_` to the browser for security.

## Configuration Priority

1. **Root `.env`** - Master configuration file
2. **Service-specific `.env`** - Optional overrides (e.g., `frontend/.env`)
3. **Docker Compose** - Can override with `environment:` section
4. **System environment variables** - Highest priority (overrides all files)

## Usage

### Development
```bash
# 1. Copy and configure root .env (already exists)
cp .env.example .env  # (if starting fresh)

# 2. Start all services
./start.sh

# Services automatically load from root .env
```

### Docker
```bash
# Docker Compose automatically loads root .env
docker-compose -f backend/docker/compose.yml up
```

### Frontend Only
```bash
cd frontend
npm run dev
# Loads from frontend/.env (which can override root .env)
```

## Key Variables Reference

### Backend API
```env
DB_URL=postgresql+psycopg://crew7:crew7@localhost:5432/crew7
REDIS_URL=redis://localhost:6379/0
QDRANT_URL=http://localhost:6333
OLLAMA_BASE_URL=http://localhost:11434
```

### Frontend (Browser-accessible)
```env
VITE_API_URL=http://localhost:8080
VITE_API_BASE=http://localhost:8080
VITE_WS_URL=ws://localhost:8080
```

### LLM Configuration
```env
# OpenAI
OPENAI_API_KEY=your-key-here

# Gemini
GEMINI_API_KEY=your-key-here
GEMINI_MODEL_NAME=gemini-1.5-flash

# AimalAPI
AIMALAPI_API_KEY=your-key-here
AIMALAPI_MODEL=gpt-4o-mini

# Role-specific models
AIMAL_BACKEND_MODEL=gpt-4o-mini
AIMAL_FRONTEND_MODEL=gpt-4o-mini
AIMAL_QA_MODEL=gpt-4o-mini
```

## Security Best Practices

1. **Never commit `.env` files** - Already in `.gitignore`
2. **Use `.env.example` files** - Template without sensitive values
3. **Rotate credentials regularly** - Especially API keys and secrets
4. **Use different values per environment** - Dev, staging, production
5. **Frontend variables are PUBLIC** - Only use `VITE_*` for non-sensitive config

## Production Deployment

For production, set environment variables directly in your hosting platform:
- Vercel: Project Settings → Environment Variables
- Docker: Use secrets or encrypted env files
- Kubernetes: Use ConfigMaps and Secrets
- Cloud platforms: Use their secret management services

## Troubleshooting

### Frontend can't see environment variables
- Ensure variable starts with `VITE_`
- Restart dev server after changing `.env`
- Check `import.meta.env.VITE_API_URL` in code

### Backend can't connect to services
- Verify service URLs in root `.env`
- Check if services are running: `docker ps`
- Test connectivity: `curl http://localhost:8080/health`

### Docker Compose not loading variables
- Ensure `env_file: - ../../.env` is present
- Check file permissions (must be readable)
- Verify no syntax errors in `.env` file

## Migration Notes

Previously, environment variables were scattered across:
- `frontend/.env` (port 8000)
- `backend/docker/.env`
- Various service configs

**Now centralized** in root `.env` with consistent port (8080) and structure.
