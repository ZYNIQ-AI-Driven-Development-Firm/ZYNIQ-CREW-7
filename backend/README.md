## Crew-7 API (Milestone 4)

Milestone 4 layers in RAG-backed orchestration (Ollama embeddings + Qdrant), a guarded toolbelt, Redis Streams pub/sub for multi-process streaming, JWT auth with org tenancy and per-crew API keys, plus a helper script for spawning crew containers. Redis, Qdrant, MinIO, and Ollama remain the core infrastructure.

```bash
# inside the Ollama container or against localhost, pull required models once
curl localhost:11434/api/pull -d '{"name":"llama3:instruct"}'
curl localhost:11434/api/pull -d '{"name":"all-minilm:latest"}'
```

```bash
# dev local
uvicorn app.main:app --reload

# docker-compose
cd docker && docker compose up --build

# quick checks
curl localhost:8000/health

# register & login to get a JWT
curl -s -X POST localhost:8000/auth/register -H "content-type: application/json" \
  -d '{"email":"a@b.com","password":"pass"}'
TOK=$(curl -s -X POST localhost:8000/auth/login -H "content-type: application/json" \
  -d '{"email":"a@b.com","password":"pass"}' | jq -r .access)

# create an org-scoped crew and rotate an API key
CREW=$(curl -s -X POST localhost:8000/crews -H "authorization: Bearer $TOK" \
  -H "content-type: application/json" -d '{"name":"RAG Alpha","role":"backend","is_public":true}')
CREW_ID=$(echo $CREW | jq -r .id)
API_KEY=$(curl -s -X POST localhost:8000/crews/$CREW_ID/apikey -H "authorization: Bearer $TOK" | jq -r .api_key)

# start a run using either Bearer auth or the per-crew key
RUN=$(curl -s -X POST localhost:8000/runs/crew/$CREW_ID -H "authorization: Bearer $TOK" \
  -H "content-type: application/json" -d '{"prompt":"Draft a launch plan","inputs":{"tier":"gold"}}')
RUN_ID=$(echo $RUN | jq -r .id)
curl localhost:8000/events/runs/$RUN_ID

# SSE/WS history is backed by Redis Streams
curl -H "x-crew-key: $API_KEY" localhost:8000/runs/$RUN_ID

# marketplace discovery (public crews only)
curl localhost:8000/marketplace
curl localhost:8000/marketplace/$CREW_ID

# crew metrics (requires Bearer auth)
curl localhost:8000/crews/$CREW_ID/metrics -H "authorization: Bearer $TOK"
```

Artifacts are saved at `s3://crew7-artifacts/runs/<RUN_ID>/...`, Redis hashes live under each crew’s `kv_namespace`, and transcripts/plan summaries persist to Qdrant with real embeddings for downstream RAG. Ollama streams tokens back to `/events/runs/{id}` while Redis Streams ensures replay across workers. Use `backend/tools/spawn_crew_service.py <CREW_ID>` to print a docker-compose service block for running a dedicated crew container.
