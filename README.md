# ZYNIQ-CREW7

Multi-agent orchestration platform powered by CrewAI, with real-time visualization and advanced workflow management.

## 🚀 Features

### Core Capabilities
- **Multi-Agent Orchestration**: CrewAI-powered agent coordination with specialized roles
- **Real-Time Visualization**: XYFlow graph canvas with live agent status updates
- **Mission Control**: WebSocket-based event streaming and run management
- **Advanced Analytics**: Dashboard with success rates, latency metrics, and token usage
- **Graph Persistence**: JSONB-based layout storage with automatic saving

### Tech Stack

#### Backend
- **Framework**: FastAPI with async/await
- **Database**: PostgreSQL 16 with SQLAlchemy 2.0
- **Migrations**: Alembic 1.17.2 (auto-generated from models)
- **Caching**: Redis (pub/sub + queue)
- **Vector DB**: Qdrant for embeddings
- **Storage**: MinIO (S3-compatible)
- **LLM**: Ollama with GPU acceleration
- **AI Frameworks**: CrewAI, LangChain, LiteLLM
- **Observability**: OpenTelemetry + Prometheus metrics

#### Frontend
- **Framework**: React 18 + TypeScript
- **Visualization**: XYFlow/ReactFlow for agent graphs
- **Styling**: Custom CSS design system
- **State**: React hooks with WebSocket integration

#### Infrastructure
- **Containerization**: Docker Compose (all services)
- **Reverse Proxy**: Nginx
- **Database Admin**: pgAdmin 8.12
- **Process Manager**: Gunicorn with Uvicorn workers
- **Frontend**: Dockerized Vite dev server with hot-reload

## 📦 Project Structure

```
ZYNIQ-CREW7/
├── backend/
│   ├── app/
│   │   ├── routes/          # API endpoints
│   │   ├── services/        # Business logic
│   │   ├── models/          # SQLAlchemy models
│   │   ├── agents/          # CrewAI agent definitions
│   │   ├── crewai/          # CrewAI adapters
│   │   └── infra/           # Infrastructure clients
│   ├── alembic/             # Database migrations (Alembic)
│   │   ├── versions/        # Migration files
│   │   └── env.py           # Alembic environment
│   ├── docker/
│   │   ├── compose.yml      # Service orchestration
│   │   ├── Dockerfile.api   # API container
│   │   └── nginx.conf       # Reverse proxy config
│   ├── alembic.ini          # Alembic configuration
│   ├── db-migrate.sh        # Migration helper script
│   └── requirements.txt     # Python dependencies
└── frontend/
    ├── components/          # React components
    │   ├── graph/          # XYFlow graph components
    │   └── Notifications/  # Signal feed
    ├── pages/              # Page components
    ├── styles/             # CSS design system
    └── package.json        # Node dependencies
```

## 🛠️ Setup

### Prerequisites
- Docker & Docker Compose
- Node.js 18+
- GPU (optional, for Ollama acceleration)

### Environment Variables

**All environment variables are centralized in the root `.env` file.**

```bash
# Copy the example file and configure your values
cp .env.example .env
```

Key variables to configure:
- Database credentials (PostgreSQL)
- API keys (OpenAI, Gemini, AimalAPI)
- Service endpoints (Redis, Qdrant, MinIO)
- Frontend URLs (VITE_API_URL, VITE_WS_URL)

**📚 See [docs/ENVIRONMENT_CONFIGURATION.md](docs/ENVIRONMENT_CONFIGURATION.md) for complete configuration guide.**

### Quick Start

#### Option 1: Automated Setup (Recommended)

```bash
# Clone repository
git clone https://github.com/your-org/ZYNIQ-CREW7.git
cd ZYNIQ-CREW7

# Create .env file (see Environment Variables section above)
cp .env.example .env

# Run automated setup script
./start.sh    # For bash
# or
./start.fish  # For fish shell
```

The `start.sh` script performs a **complete automated setup**:

1. ✅ **Environment Setup** - Loads and validates `.env` variables
2. ✅ **Container Management** - Stops existing containers for clean start
3. ✅ **Image Building** - Builds Docker images (API, worker, frontend)
4. ✅ **Database Initialization** - Starts PostgreSQL and Redis
5. ✅ **Migration Application** - Runs Alembic migrations automatically
6. ✅ **User Creation** - Creates default user with wallet
7. ✅ **Service Startup** - Starts all services (API, worker, Ollama, etc.)
8. ✅ **Frontend Launch** - Starts Vite dev server on port 3000
9. ✅ **Health Verification** - Confirms all services are running

**First run:** 8-12 minutes (Docker builds)  
**Subsequent runs:** 30-60 seconds (cached images)

#### Option 2: Manual Setup

1. **Clone repository**
```bash
git clone https://github.com/your-org/ZYNIQ-CREW7.git
cd ZYNIQ-CREW7
```

2. **Start database and Redis**
```bash
cd backend/docker
docker-compose up -d db redis
```

3. **Run migrations**
```bash
# Wait for database to be ready
docker-compose exec -T db pg_isready -U crew7

# Apply migrations
docker-compose exec -T api alembic upgrade head
```

4. **Start all services**
```bash
docker-compose up -d
```

5. **Access services**
- **Frontend**: http://localhost:3000 (Dockerized with hot-reload)
- **API**: http://localhost:8080/api
- **Direct API**: http://localhost:8000
- **pgAdmin**: http://localhost:5050
- **MinIO Console**: http://localhost:9001

### Service Management

```bash
# View logs
docker-compose logs -f api        # Backend API logs
docker-compose logs -f frontend   # Frontend logs
docker-compose logs -f db         # Database logs

# Restart services
docker-compose restart api
docker-compose restart frontend

# Rebuild frontend after changes
docker-compose up -d --build frontend

# Stop all services
docker-compose down

# Stop and remove volumes (clean slate)
./cleanup.sh --volumes

# Remove everything including images
./cleanup.sh --all
```

## 🔧 Development

### Database Migrations Workflow

When you modify SQLAlchemy models in `backend/app/models/`:

1. **Create Migration**
```bash
cd backend
./db-migrate.sh create "describe your changes"
```

2. **Review Generated Migration**
```bash
# Check the new file in alembic/versions/
cat alembic/versions/xxxxx_describe_your_changes.py
```

3. **Test Migration**
```bash
# Apply migration
./db-migrate.sh upgrade

# Verify database schema
docker-compose exec -T db psql -U crew7 -d crew7 -c "\d+ table_name"
```

4. **Rollback if Needed**
```bash
./db-migrate.sh downgrade  # Go back one version
```

5. **Commit Both Files**
```bash
git add app/models/your_model.py
git add alembic/versions/xxxxx_describe_your_changes.py
git commit -m "Add new model and migration"
```

### Clean Database Reset

To start with a fresh database (⚠️ **deletes all data**):

```bash
# Stop containers and remove volumes
cd backend/docker
docker-compose down -v

# Start fresh with automated migrations
cd ../..
./start.sh
```

Or use the convenience script:

```bash
./reset-db.sh
```

### API Endpoints

#### Authentication
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login and get JWT token

#### Crews
- `GET /crews` - List crews
- `POST /crews` - Create crew
- `GET /crews/{id}` - Get crew details

#### Runs
- `POST /runs` - Start crew run
- `GET /runs/{id}` - Get run details
- `GET /runs/stats` - Get analytics
- `POST /runs/{id}/pause` - Pause run
- `POST /runs/{id}/resume` - Resume run
- `POST /runs/{id}/cancel` - Cancel run

#### Graph
- `GET /graph/{crew_id}` - Get graph layout
- `PUT /graph/{crew_id}` - Save graph layout

#### WebSockets
- `WS /ws/mission` - Mission event stream
- `WS /ws/graph` - Agent graph updates
- `WS /ws/runs/{id}` - Run progress stream

### Frontend Components

#### Key Components
- `Dashboard` - Analytics overview
- `AgentGraph` - XYFlow visualization
- `SignalFeed` - Notification stream
- `ChatSurface` - Chat interface
- `AgentIcon` - Animated agent avatars

#### Graph Node Events
```typescript
{
  "type": "agent_start",
  "agent": "backend_dev",
  "status": "typing"
}
```

## 📊 Database Schema & Migrations

### Migration Strategy

This project uses **Alembic** for database schema management:

- **Auto-generated migrations** from SQLAlchemy models
- **Version controlled** - All migrations in `backend/alembic/versions/`
- **Automatic application** - `start.sh` runs migrations on startup
- **Rollback support** - Can upgrade/downgrade to any version
- **No manual SQL** - Schema changes are code-first

### Migration Commands

```bash
# Apply all pending migrations
cd backend
./db-migrate.sh upgrade

# Check current migration status
./db-migrate.sh current

# View migration history
./db-migrate.sh history

# Create new migration after model changes
./db-migrate.sh create "add new column"

# Rollback last migration
./db-migrate.sh downgrade
```

### Main Tables

**Core Tables:**
- `users` - User accounts with org_id and role
- `wallets` - Crypto wallet addresses per user
- `crews` - Crew definitions with metadata
- `agents` - Individual agents (7 per crew)
- `runs` - Execution history with status tracking
- `crew_graphs` - Graph layout persistence (JSONB)
- `audit_logs` - Activity tracking

**Crypto/NFT Tables:**
- `user_wallets` - User-wallet associations
- `token_balances` - Token holdings per wallet
- `token_transactions` - Transaction history
- `crew_rentals` - Rental agreements
- `crew_portfolios` - NFT ownership tracking

**Analytics Tables:**
- `crew_xp` - Experience points and leveling
- `crew_ratings` - User ratings and reviews
- `evalcases` - Evaluation test cases

### Enum Types

- `runstatus` - queued, running, succeeded, failed, cancelled
- `chaintype` - ethereum, polygon, base, arbitrum, optimism
- `transactiondirection` - inbound, outbound

## 🐳 Docker Services

| Service | Port | Description |
|---------|------|-------------|
| api | 8000 | FastAPI application |
| worker | - | RQ worker for background jobs |
| db | 5432 | PostgreSQL database |
| redis | 6379 | Cache & pub/sub |
| qdrant | 6333 | Vector database |
| minio | 9000/9001 | Object storage |
| ollama | 11434 | LLM inference |
| nginx | 8080 | Reverse proxy |
| otel-collector | 4317/4318 | Telemetry collector |
| pgadmin | 5050 | Database admin UI |

## 🎨 Design System

### Color Palette
- Primary: `#3b82f6` (Blue 500)
- Success: `#10b981` (Green 500)
- Warning: `#f59e0b` (Amber 500)
- Error: `#ef4444` (Red 500)
- Background: `#0f172a` (Slate 900)

### Animations
- `c7-glow` - Subtle pulse (2s)
- `c7-typing` - Intense glow (1.5s)
- `c7-pulse-glow` - Continuous pulse
- `ring` - Success rate indicator

## 🔐 Security

- JWT-based authentication
- Bcrypt password hashing (cost factor 12)
- Org-level data isolation
- Role-based access control
- CORS configuration
- Rate limiting (TODO)

## 🚧 Roadmap

- [ ] Wire orchestrator → WebSocket events
- [ ] Implement rate limiting
- [ ] Add Traces viewer page
- [ ] Environment variables management UI
- [ ] LLM connections panel
- [ ] Marketplace for agent templates
- [ ] GitHub PR automation tool
- [ ] Multi-language support

## 📝 License

Proprietary - ZYNIQ Solutions © 2025

## 👥 Team

Developed by ZYNIQ Solutions
- Website: https://zyniq.solutions
- Email: admin_ibrahim@zyniq.solutions

## 🤝 Contributing

Internal project - contact team lead for contribution guidelines.

---

Built with ❤️ using CrewAI, FastAPI, and React
