# ZYNIQ-CREW7 Quick Start Guide

## 🚀 One-Command Setup & Start

### For Linux/Mac (Bash):
```bash
chmod +x start.sh
./start.sh
```

### For Windows (PowerShell):
```powershell
```

---

## 📋 What the Script Does

The startup script automatically handles:

1. ✅ **Loads Environment Variables** from `.env`
2. ✅ **Stops Existing Containers** (clean slate)
3. ✅ **Builds Docker Containers** (backend API + all services)
4. ✅ **Starts Database & Redis** (waits for ready state)
5. ✅ **Runs All Migrations** in order:
   - Auth & Organization tables
   - Crew graphs
   - Crypto/wallet tables
   - Run tokens
   - User roles
   - **NEW:** Agents table
6. ✅ **Creates Test User** using credentials from `.env`:
   - Email: `DEFAULT_USER_EMAIL`
   - Password: `DEFAULT_USER_PASSWORD`
   - Credits: `DEFAULT_USER_CREDITS`
7. ✅ **Sets Up Wallet** with initial credits
8. ✅ **Starts All Services** (API, worker, Ollama, MinIO, etc.)
9. ✅ **Starts Frontend Dev Server** (Vite on port 3000)
10. ✅ **Health Checks** - Verifies everything is running

---

## 🌐 Services Available After Startup

| Service | URL | Description |
|---------|-----|-------------|
| **Frontend** | http://localhost:3000 | React + Vite UI |
| **API** | http://localhost:8000 | FastAPI backend |
| **API Docs** | http://localhost:8000/docs | Swagger/OpenAPI |
| **pgAdmin** | http://localhost:5050 | Database admin |
| **MinIO** | http://localhost:9000 | S3-compatible storage |
| **Redis** | localhost:6379 | Cache & sessions |
| **PostgreSQL** | localhost:5432 | Main database |
| **Ollama** | http://localhost:11434 | LLM inference |
| **Qdrant** | http://localhost:6333 | Vector database |

---

## 🔑 Default Test User

After running the script, login with:

```
Email:    admin@crew7.ai
Password: Admin@123
Credits:  100,000
```

(These are loaded from your `.env` file)

---

## 🧪 Testing the New Features

### 1. Login
- Open http://localhost:3000
- Login with credentials above

### 2. Test Agent System
- Navigate to any crew detail page
- Click "Agents" tab
- See 7 auto-created agents:
  - 1 Orchestrator
  - 6 Specialist agents (role-based)
- Click any agent to see full details

### 3. Test Rating System
- Click "Ratings" tab
- Click "Rate This Crew"
- Select 1-5 stars
- Write optional review
- Submit and see updated statistics
- View rating distribution chart

### 4. Test Pricing System
- Click "Pricing" tab
- See dynamic rental price
- See dynamic buyout price
- Expand breakdown to see:
  - Level multiplier
  - Rarity multiplier
  - Success rate bonus
  - Rating bonus
  - Demand multiplier

---

## 🛠️ Manual Steps (None Required!)

The script handles everything automatically. No manual steps needed! 🎉

---

## 📝 Useful Commands

### View Logs
```bash
# API logs
docker compose -f backend/docker/compose.yml logs -f api

# All services logs
docker compose -f backend/docker/compose.yml logs -f

# Frontend logs (bash)
tail -f /tmp/crew7-frontend.log

# Frontend logs (PowerShell)
Get-Content $env:TEMP\crew7-frontend.log -Wait
```

### Restart Services
```bash
# Restart API only
docker compose -f backend/docker/compose.yml restart api

# Restart all backend services
docker compose -f backend/docker/compose.yml restart
```

### Stop Everything
```bash
# Stop backend services
docker compose -f backend/docker/compose.yml down

# Stop frontend (find and kill the npm process)
pkill -f "vite"  # Linux/Mac
# Or press Ctrl+C in PowerShell window
```

### Database Access
```bash
# Connect to PostgreSQL
docker compose -f backend/docker/compose.yml exec db psql -U crew7 -d crew7

# Run SQL query
docker compose -f backend/docker/compose.yml exec -T db psql -U crew7 -d crew7 -c "SELECT * FROM users;"

# Check agents table
docker compose -f backend/docker/compose.yml exec -T db psql -U crew7 -d crew7 -c "SELECT COUNT(*) FROM agents;"
```

---

## 🔧 Troubleshooting

### API Won't Start
```bash
# Check API logs
docker compose -f backend/docker/compose.yml logs api

# Check if database is ready
docker compose -f backend/docker/compose.yml exec db pg_isready -U crew7

# Rebuild and restart
docker compose -f backend/docker/compose.yml down
docker compose -f backend/docker/compose.yml build --no-cache
./start.sh
```

### Frontend Won't Start
```bash
# Check if port 3000 is in use
lsof -i :3000  # Linux/Mac
netstat -ano | findstr :3000  # Windows

# Kill process and restart
cd frontend
npm run dev
```

### Database Issues
```bash
# Drop and recreate database
docker compose -f backend/docker/compose.yml down -v  # ⚠️ Deletes all data!
./start.sh
```

### Migration Errors
```bash
# Check which migrations ran
docker compose -f backend/docker/compose.yml exec -T db psql -U crew7 -d crew7 -c "\dt"

# Re-run specific migration
docker compose -f backend/docker/compose.yml exec -T db psql -U crew7 -d crew7 < backend/migrations/20251116_add_agents.sql
```

---

## 📦 What's Included

### Backend Services (Docker Compose)
- **API** - FastAPI server with 50+ endpoints
- **Worker** - Background task processor
- **PostgreSQL** - Main database
- **Redis** - Caching & sessions (5-min TTL)
- **Qdrant** - Vector database for embeddings
- **MinIO** - S3-compatible object storage
- **Ollama** - Local LLM inference
- **pgAdmin** - Database management UI

### Frontend
- **React** - UI framework
- **TypeScript** - Type safety
- **Vite** - Fast dev server & bundler
- **Tailwind CSS** - Styling
- **React Router** - Navigation
- **Lucide Icons** - Icon library

### Database Schema (Fully Migrated)
- Users & Organizations
- Crews & Agents (7 per crew)
- Runs & Tokens
- Ratings (1-5 stars with reviews)
- Crypto/Wallets
- NFT Metadata

---

## 🎯 Next Steps After Setup

1. **Explore the UI** - Navigate through different sections
2. **Create a Crew** - Test agent auto-creation (7 agents)
3. **Rate a Crew** - Submit ratings and see statistics
4. **Check Pricing** - View dynamic pricing with breakdowns
5. **View Agents** - Click agents to see full details
6. **Test API Directly** - Visit http://localhost:8000/docs

---

## 📚 Additional Documentation

- `API_TEST_REPORT.md` - Complete API endpoint documentation
- `FRONTEND_INTEGRATION_COMPLETE.md` - Frontend component details
- Backend docs: `backend/README.md`
- Frontend docs: `frontend/README.md`

---

## 💡 Pro Tips

1. **First Run Takes Longer** - Docker images need to download (5-10 min)
2. **Subsequent Runs Are Fast** - Cached images (30-60 sec)
3. **Keep Terminal Open** - Frontend runs in foreground (Bash) or background (PowerShell)
4. **Use pgAdmin** - Great for inspecting database visually
5. **Check Swagger Docs** - Interactive API testing at `/docs`

---

## 🐛 Known Issues

1. **API Container Startup** - If API fails, check logs for import errors
2. **Port Conflicts** - Ensure ports 3000, 5432, 6379, 8000 are free
3. **Docker Memory** - Ensure Docker has at least 4GB RAM allocated
4. **Windows Path Issues** - Use PowerShell, not CMD

---

## 🆘 Need Help?

1. Check logs (see commands above)
2. Review `API_TEST_REPORT.md` for known issues
3. Ensure `.env` file has all required variables
4. Try rebuilding with `--no-cache` flag

---

**Happy Testing! 🚀**
