# Full-Stack SaaS Crew - Testing Guide

## 🚀 Quick Start (5 minutes)

### 1. Start Backend
```bash
cd backend
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Start Frontend
```bash
cd frontend
npm run dev
```

### 3. Test API Endpoint (Optional)
```bash
# From backend directory
python tests/test_fullstack_crew_live.py
```

## 📋 Testing Checklist

### ✅ Backend Integration
- [ ] Server starts without errors
- [ ] POST /crews/fullstack/run endpoint available
- [ ] Crew auto-creation works on first call
- [ ] Orchestrator detects crew_type="fullstack_saas"
- [ ] 7 agents execute in sequence

### ✅ Frontend Integration
- [ ] UI shows crew selector toggle
- [ ] "Standard (5 agents)" and "Full-Stack SaaS (7 agents)" buttons visible
- [ ] Clicking Full-Stack button highlights it
- [ ] Prompt submission calls runFullStackCrew()
- [ ] Graph shows 7 agents (not 5)

### ✅ End-to-End Flow
- [ ] Login successful
- [ ] Select "Full-Stack SaaS Crew"
- [ ] Submit prompt: "Build a simple todo app"
- [ ] See "🚀 Starting Full-Stack SaaS Crew" in logs
- [ ] Watch 7 agents execute:
  1. Orchestrator (Gemini)
  2. Backend Architect (aimalapi)
  3. Backend Implementer (aimalapi)
  4. Frontend Architect (aimalapi)
  5. Frontend Implementer (aimalapi)
  6. QA Engineer (aimalapi)
  7. DevOps Engineer (aimalapi)
- [ ] Graph visualization updates
- [ ] Memory stored in Qdrant
- [ ] Final output returned

## 🧪 Test Commands

### API Test (Python)
```bash
cd backend
python tests/test_fullstack_crew_live.py
```

### Manual API Test (curl)
```bash
# 1. Login
TOKEN=$(curl -s -X POST http://localhost:8000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@crew7.ai","password":"Admin@123"}' | jq -r .access)

# 2. Start Full-Stack Crew
curl -X POST http://localhost:8000/crews/fullstack/run \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "Build a simple blog with user authentication",
    "inputs": {}
  }'
```

### Verify Crew Type Detection
```bash
# Check logs for:
# "🚀 Initializing Full-Stack SaaS Crew (7 specialized agents)..."
```

## 📊 Expected Results

### Backend Logs
```
INFO: Uvicorn running on http://127.0.0.1:8000
POST /crews/fullstack/run - 200 OK
🚀 Initializing Full-Stack SaaS Crew (7 specialized agents)...
Agent orchestrator starting...
Agent backend_architect starting...
Agent backend_implementer starting...
Agent frontend_architect starting...
Agent frontend_implementer starting...
Agent qa_engineer starting...
Agent devops_engineer starting...
```

### Frontend UI
- Crew selector shows: `Standard (5 agents)` | `🚀 Full-Stack SaaS (7 agents)`
- Selected crew highlighted in red (#ea2323)
- Helper text: "✨ Specialized for building complete applications"
- Graph shows 7 agent cards (not 5)

### API Response
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "crew_id": "550e8400-e29b-41d4-a716-446655440001",
  "status": "queued",
  "prompt": "Build a simple blog with user authentication",
  "created_at": "2024-01-15T10:30:00Z"
}
```

## 🎯 Demo Scenarios

### Scenario 1: Simple Todo App (2-3 minutes)
```
Build a simple todo app with:
- User authentication
- CRUD operations for todos
- Mark as complete functionality
- Clean React UI with Tailwind
```

### Scenario 2: Subscription SaaS (5-7 minutes)
```
Build a subscription management SaaS with:
- User signup and login
- Stripe integration for payments
- Three pricing tiers (Basic, Pro, Enterprise)
- Admin dashboard
- React frontend with TypeScript
- FastAPI backend
```

### Scenario 3: Real-time Chat App (4-6 minutes)
```
Build a real-time chat application with:
- WebSocket support
- Multiple chat rooms
- User presence indicators
- Message history
- React frontend with modern UI
- Python backend with FastAPI
```

## 🐛 Troubleshooting

### Issue: "401 Unauthorized"
**Solution:** Check .env file has valid API keys:
```bash
GEMINI_API_KEY=AIzaSyBKAVgpX8dKHKROm7yScXGqalMdFeD1AuA
AIMALAPI_API_KEY=f087a4f57fb040c08f0fbb6605333ba0
```

### Issue: Only 5 agents execute (not 7)
**Solution:** Check crew_type in database:
```sql
SELECT id, name, recipe_json->>'crew_type' FROM crews WHERE name = 'Full-Stack SaaS Crew';
-- Should show: fullstack_saas
```

### Issue: Frontend doesn't show selector
**Solution:** 
1. Clear browser cache
2. Check console for errors
3. Verify crewType state initialized: `const [crewType, setCrewType] = useState<'standard' | 'fullstack'>('standard');`

### Issue: Models not responding
**Solution:**
1. Check API keys in .env
2. Verify internet connection
3. Check model quotas (Gemini, aimalapi)
4. Fall back to Ollama if needed

## 📝 Success Criteria

✅ **Backend:** Endpoint creates/retrieves crew with crew_type="fullstack_saas"  
✅ **Orchestrator:** Routes to make_fullstack_saas_crew() for 7-agent team  
✅ **Frontend:** UI toggles between Standard and Full-Stack crews  
✅ **Integration:** Full mission completes with all 7 agents executing  
✅ **Memory:** Qdrant stores context from all agent interactions  
✅ **Events:** WebSocket streams 8 event types to frontend  

## ⏱️ Time Estimates

- Backend startup: 30 seconds
- Frontend startup: 20 seconds
- Login: 10 seconds
- Mission submission: 5 seconds
- **Total crew execution: 3-10 minutes** (depends on prompt complexity)
- Graph visualization: Real-time

## 🎬 Demo Script

1. **Login** → Show landing page → Click "Get Started"
2. **Crew Selection** → Show toggle → Click "Full-Stack SaaS (7 agents)"
3. **Mission Prompt** → Enter: "Build a simple todo app"
4. **Watch Graph** → Point out 7 agents lighting up sequentially
5. **Explain Flow:**
   - Orchestrator (Gemini) plans the mission
   - Backend Architect designs API structure
   - Backend Implementer writes FastAPI code
   - Frontend Architect designs UI components
   - Frontend Implementer writes React code
   - QA Engineer creates tests
   - DevOps Engineer sets up Docker
6. **Show Results** → Display generated code artifacts
7. **Highlight Memory** → Explain Qdrant vector storage

## 🚀 Advanced Testing

### Load Test (Multiple Missions)
```python
import asyncio
from test_fullstack_crew_live import test_fullstack_crew

async def load_test():
    tasks = [test_fullstack_crew() for _ in range(5)]
    await asyncio.gather(*tasks)

asyncio.run(load_test())
```

### Rate Limiting Verification
```bash
# Should enforce 20 requests/minute
for i in {1..25}; do
  curl -X POST http://localhost:8000/crews/fullstack/run \
    -H "Authorization: Bearer $TOKEN" \
    -H "Content-Type: application/json" \
    -d '{"prompt":"Test"}' &
done
# Expect 429 Too Many Requests after 20 calls
```

### Memory Persistence Test
```python
# Run 3 missions with related prompts
# Verify later missions reference earlier context
prompts = [
    "Build a user authentication system",
    "Add password reset functionality to the auth system",
    "Add OAuth login to the existing auth"
]
# Check if agents reference previous mission's output
```

## 📚 Documentation References

- **Backend API:** `backend/app/routes/crews.py` (Line 140-220)
- **Orchestrator:** `backend/app/services/orchestrator_service.py` (Line 113-135)
- **Crew Factory:** `backend/app/crewai/fullstack_crew.py`
- **Frontend API:** `frontend/src/lib/api.ts` (Line 88-96)
- **Frontend UI:** `frontend/App.tsx` (Crew selector at line ~1570)

---

**Status:** ✅ READY FOR TESTING  
**Last Updated:** 2024-01-15  
**Completion:** 95% (UI + integration complete, testing remaining)
