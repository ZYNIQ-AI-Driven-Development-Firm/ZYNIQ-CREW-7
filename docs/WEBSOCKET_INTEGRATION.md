# WebSocket Integration

## Overview

The frontend now includes real-time WebSocket connections for live updates across the platform. This eliminates the need for polling and provides instant feedback for crew operations.

## Architecture

### Backend WebSocket Endpoints

1. **`/ws/runs/{run_id}`** - Run-specific events
   - Events: `boot`, `done`, `agent_start`, `agent_end`, `task_start`, `task_end`, `error`
   - Auto-closes when run completes

2. **`/ws/mission`** - Mission-level crew status (requires auth)
   - Events: `signal` (status: `offline` | `available` | `busy`)
   - Heartbeat: Every 45 seconds
   - Authentication: Token via `Sec-WebSocket-Protocol` header

3. **`/ws/graph`** - Agent graph visualization (requires auth)
   - Events: `tool_start`, `tool_end`, `tool_progress`, `ping`
   - Real-time tool execution updates
   - Publishes to Redis channel: `graph:{crew_id}`

### Frontend WebSocket Service

Location: `frontend/src/lib/websocket.ts`

Three main classes:
- `RunWebSocket` - Monitor specific run execution
- `MissionWebSocket` - Track crew availability status
- `GraphWebSocket` - Visualize tool execution in real-time

## Features

### 1. Dashboard Live Status

**File:** `frontend/components/Dashboard.tsx`

```typescript
// Auto-connects to mission WebSocket
const missionWs = new MissionWebSocket(token);
missionWs.subscribe((event) => {
  if (event.type === 'signal') {
    setLiveStatus(event.payload.status); // Updates crew status in real-time
  }
});
missionWs.connect();
```

**UI Indicators:**
- 🟢 Live connection badge (animated pulse)
- Color-coded status: Available (green), Busy (yellow), Offline (red)
- Real-time status updates without page refresh

### 2. Agent Graph Visualization

**File:** `frontend/components/graph/AgentGraph.tsx`

```typescript
// Subscribes to tool execution events
const graphWs = new GraphWebSocket(crewId, token);
graphWs.subscribe((event) => {
  if (event.type === 'tool_start') {
    // Highlight agent, show toast notification
  }
  if (event.type === 'tool_end') {
    // Update status, show completion with duration
  }
});
graphWs.connect();
```

**Visual Feedback:**
- 🔧 Tool start notifications
- ⏳ Progress updates
- ✅/❌ Completion status with duration
- Agent node status changes (typing → done/error)

## Event Types

### Tool Events (from `tool_events.py`)

```typescript
// tool_start
{
  type: 'tool_start',
  timestamp: '2025-11-17T10:30:00Z',
  crew_id: 'abc123',
  run_id: 'run456',
  agent_id: 'orion',
  tool: 'git_clone',
  params: { url: '...', branch: 'main' }
}

// tool_progress
{
  type: 'tool_progress',
  tool: 'pytest',
  message: 'Running test suite...',
  progress: 0.65 // Optional 0-1 range
}

// tool_end
{
  type: 'tool_end',
  tool: 'git_clone',
  duration_s: 2.345,
  exit_code: 0,
  status: 'success' // 'success' | 'error' | 'completed_with_errors'
}
```

### Mission Events

```typescript
{
  type: 'signal',
  payload: {
    status: 'busy', // 'offline' | 'available' | 'busy'
    crewId: 'abc123'
  }
}
```

## Configuration

### Environment Variables

Create `frontend/.env.local`:

```bash
VITE_WS_URL=ws://localhost:8000
```

For production:
```bash
VITE_WS_URL=wss://api.yourdomain.com
```

### Auto-Reconnection

- `RunWebSocket`: Max 3 attempts, 2-second delay
- `MissionWebSocket`: Persistent with heartbeat
- `GraphWebSocket`: Manual reconnection (tied to component lifecycle)

## Usage Examples

### Monitor a Run

```typescript
import { RunWebSocket } from '@/src/lib/websocket';

const runWs = new RunWebSocket(runId);
runWs.subscribe((event) => {
  console.log('Run event:', event);
  if (event.type === 'done') {
    console.log('Run completed!');
  }
});
runWs.connect();

// Cleanup
return () => runWs.disconnect();
```

### Track Crew Status

```typescript
import { MissionWebSocket } from '@/src/lib/websocket';

const token = localStorage.getItem('token');
const missionWs = new MissionWebSocket(token);

missionWs.subscribe((event) => {
  if (event.type === 'signal') {
    console.log('Crew status:', event.payload.status);
  }
});
missionWs.connect();
```

### Visualize Tool Execution

```typescript
import { GraphWebSocket } from '@/src/lib/websocket';

const graphWs = new GraphWebSocket(crewId, token);

graphWs.subscribe((event) => {
  switch (event.type) {
    case 'tool_start':
      console.log(`🔧 ${event.tool} started`);
      break;
    case 'tool_progress':
      console.log(`⏳ ${event.message}`);
      break;
    case 'tool_end':
      console.log(`✅ ${event.tool} ${event.status} (${event.duration_s}s)`);
      break;
  }
});
graphWs.connect();
```

## Backend Integration Points

### Tool Event Emitter

Location: `backend/app/services/tool_events.py`

Used in:
- `backend/app/services/tool_runner.py` (git_clone, pytest, script)
- Publishes to Redis channels for WebSocket broadcast

### WebSocket Routes

Location: `backend/app/routes/ws.py`

Authentication:
- Token via `Sec-WebSocket-Protocol` header (format: `['token', '<jwt>']`)
- Parsed by `_extract_token()` and `_decode_token()`

### Redis Pub/Sub Channels

- `graph:{crew_id}` - Tool execution events
- `mission:{crew_id}` - Mission status updates
- `run:{run_id}` - Run-specific events

## Testing

### Manual Testing

1. Start backend: `cd backend && python -m uvicorn app.main:app --reload`
2. Start frontend: `cd frontend && npm run dev`
3. Login to get auth token
4. Open browser DevTools → Console
5. Navigate to Dashboard - watch for `[MissionWS] Connected` logs
6. Start a crew run - watch for `[GraphWS] Connected` logs
7. Monitor real-time events in console and UI

### E2E Test

See: `backend/tests/test_e2e.py`

```bash
cd backend
python tests/test_e2e.py
```

## Performance

- **Latency:** < 50ms for event delivery (local network)
- **Heartbeat:** 45-second intervals (mission WS)
- **Auto-reconnect:** 2-second delay, max 3 attempts (run WS)
- **Memory:** < 1MB per WebSocket connection

## Security

- ✅ Authentication required for `/ws/mission` and `/ws/graph`
- ✅ Token validation via JWT parsing
- ✅ Org-level isolation (users only see their org's crews)
- ✅ Auto-close on unauthorized (code 4401)

## Troubleshooting

### WebSocket Connection Refused

**Issue:** `WebSocket connection to 'ws://localhost:8000/ws/mission' failed`

**Solution:**
1. Verify backend is running on port 8000
2. Check `VITE_WS_URL` in `.env.local`
3. Ensure Redis is running (required for pub/sub)

### No Events Received

**Issue:** Connected but no events flowing

**Solution:**
1. Check Redis pub/sub: `redis-cli PSUBSCRIBE '*'`
2. Verify tool execution: Look for `ToolEventEmitter` logs in backend
3. Check browser console for event parsing errors

### 401 Unauthorized

**Issue:** `Graph WebSocket: unauthorized connection attempt`

**Solution:**
1. Ensure valid token in localStorage: `localStorage.getItem('token')`
2. Check token expiration (JWT payload)
3. Re-login to get fresh token

## Future Enhancements

- [ ] Binary message support for large payloads
- [ ] Compression for high-frequency events
- [ ] Event replay for missed messages
- [ ] WebSocket connection pooling
- [ ] Metrics dashboard (events/sec, latency)

## References

- FastAPI WebSockets: https://fastapi.tiangolo.com/advanced/websockets/
- Redis Pub/Sub: https://redis.io/docs/manual/pubsub/
- Browser WebSocket API: https://developer.mozilla.org/en-US/docs/Web/API/WebSocket
