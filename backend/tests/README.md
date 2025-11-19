# Backend API Testing

Comprehensive test suite for all ZYNIQ-CREW-7 backend API endpoints using pytest.

## Test Structure

Tests are organized by router in the `api/` directory, with each test file corresponding to its router:

### API Tests (`tests/api/`)
- **conftest.py** - Shared pytest fixtures and test setup
- **test_health.py** - Health check endpoints (`app.routes.health`)
- **test_auth.py** - Authentication endpoints (`app.routes.auth`)
- **test_crews.py** - Crew management endpoints (`app.routes.crews`)
- **test_agents.py** - Agent CRUD endpoints (`app.routes.agents`)
- **test_marketplace.py** - Marketplace endpoints (`app.routes.marketplace`)
- **test_runs.py** - Run execution endpoints (`app.routes.runs`)
- **test_metadata.py** - NFT metadata endpoints (`app.routes.metadata`)
- **test_memory.py** - Vector memory endpoints (`app.routes.memory`)
- **test_ratings.py** - Rating endpoints (`app.routes.ratings`)
- **test_pricing.py** - Pricing endpoints (`app.routes.pricing`)
- **test_dashboard_stats.py** - Dashboard statistics (`app.routes.dashboard_stats`)
- **test_settings.py** - User/org settings (`app.routes.settings`)
- **test_billing.py** - Billing/wallet endpoints (`app.routes.billing`)
- **test_crew_portfolio.py** - Crew portfolio endpoints (`app.routes.crew_portfolio`)
- **test_env_setup.py** - Environment setup (`app.routes.env_setup`)
- **test_graph.py** - Graph/workflow endpoints (`app.routes.graph`)
- **test_tools.py** - Tool execution endpoints (`app.routes.tools`)
- **test_evals.py** - Evaluation endpoints (`app.routes.evals`)
- **test_stream.py** - SSE streaming endpoints (`app.routes.stream`)
- **test_ws.py** - WebSocket endpoints (`app.routes.ws`)

### Legacy Tests
- **test_api_endpoints.py** - Original comprehensive test file (kept for reference)
- **test_api_flow.py** - Integration tests for auth and run flows
- **test_agents_api.py** - Detailed agent CRUD operations tests
- **test_memory_api.py** - Memory/vector store API tests
- **test_metadata_api.py** - NFT metadata endpoint examples

## Installation

Install test dependencies:

```bash
cd backend
pip install -r requirements.txt
```

## Running Tests

### Run All API Tests

```bash
pytest tests/api/
```

### Run All Tests (including legacy)

```bash
pytest tests/
```

### Run Specific Router Tests

```bash
# Test only auth endpoints
pytest tests/api/test_auth.py -v

# Test only crew endpoints
pytest tests/api/test_crews.py -v

# Test only agent endpoints
pytest tests/api/test_agents.py -v
```

### Run Specific Test

```bash
pytest tests/api/test_health.py::test_health_check -v
```

### Run with Verbose Output

```bash
pytest tests/api/ -v
```

## Structure

```
backend/tests/
├── api/                          # New organized test structure
│   ├── conftest.py              # Shared fixtures (client, auth, crews)
│   ├── test_health.py           # Health endpoints
│   ├── test_auth.py             # Authentication
│   ├── test_crews.py            # Crew management
│   ├── test_agents.py           # Agent CRUD
│   ├── test_marketplace.py      # Marketplace operations
│   ├── test_runs.py             # Run execution
│   ├── test_metadata.py         # NFT metadata
│   ├── test_memory.py           # Vector memory
│   ├── test_ratings.py          # Ratings
│   ├── test_pricing.py          # Pricing
│   ├── test_dashboard_stats.py  # Dashboard
│   ├── test_settings.py         # Settings
│   ├── test_billing.py          # Billing/Wallet
│   ├── test_crew_portfolio.py   # Portfolio
│   ├── test_env_setup.py        # Environment
│   ├── test_graph.py            # Graph/Workflow
│   ├── test_tools.py            # Tools
│   ├── test_evals.py            # Evaluations
│   ├── test_stream.py           # SSE Streaming
│   └── test_ws.py               # WebSocket
├── test_api_endpoints.py        # Legacy comprehensive test
├── test_api_flow.py             # Legacy integration test
├── test_agents_api.py           # Legacy agent tests
├── test_memory_api.py           # Legacy memory tests
├── test_metadata_api.py         # Legacy metadata examples
└── README.md                    # Updated documentation
```