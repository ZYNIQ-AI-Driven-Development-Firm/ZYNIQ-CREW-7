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
│   ├── docker/
│   │   ├── compose.yml      # Service orchestration
│   │   ├── Dockerfile.api   # API container
│   │   └── nginx.conf       # Reverse proxy config
│   ├── migrations/          # Database migrations
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

Create `.env` file in project root:

```bash
# Database
POSTGRES_USER=crew7
POSTGRES_PASSWORD=crew7_secure_password
POSTGRES_DB=crew7
POSTGRES_PORT=5432

# Redis
REDIS_PORT=6379

# Qdrant
QDRANT_PORT=6333

# MinIO
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadmin
MINIO_PORT=9000
MINIO_CONSOLE_PORT=9001

# Ollama
OLLAMA_PORT=11434

# pgAdmin
PGADMIN_EMAIL=admin@zyniq.solutions
PGADMIN_PASSWORD=admin@123
PGADMIN_PORT=5050

# Application
JWT_SECRET=your-super-secret-jwt-key-change-in-production
OPENAI_API_KEY=sk-your-openai-key (optional)
```

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

The script will:
- Build all Docker containers (backend + frontend)
- Start all services
- Apply database migrations
- Create test user
- Configure wallet with initial credits

#### Option 2: Manual Setup

1. **Clone repository**
```bash
git clone https://github.com/your-org/ZYNIQ-CREW7.git
cd ZYNIQ-CREW7
```

2. **Start all services (including frontend)**
```bash
cd backend/docker
docker-compose up -d
```

3. **Check service status**
```bash
docker-compose ps
```

4. **Access services**
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

## 📊 Database Schema

### Main Tables
- `users` - User accounts with org_id
- `crews` - Crew definitions
- `runs` - Execution history
- `crew_graphs` - Graph layout persistence (JSONB)
- `audit_logs` - Activity tracking

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
