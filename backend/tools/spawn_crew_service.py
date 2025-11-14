#!/usr/bin/env python3
from __future__ import annotations

import sys

TEMPLATE = """
  {service}:
    image: crew7-api:latest
    environment:
      - CREW_ID={crew_id}
      - ROLE={role}
      - OLLAMA_BASE_URL=http://ollama:11434
      - DB_URL=postgresql+psycopg://crew7:crew7@db:5432/crew7
      - REDIS_URL=redis://redis:6379/0
      - QDRANT_URL=http://qdrant:6333
      - S3_ENDPOINT=http://minio:9000
      - S3_BUCKET=crew7-artifacts
      - S3_ACCESS_KEY=crew7
      - S3_SECRET_KEY=crew7pass
    depends_on: [db, redis, qdrant, minio, ollama]
"""


def main() -> None:
    if len(sys.argv) < 2:
        print("usage: spawn_crew_service.py <CREW_ID> [role]", file=sys.stderr)
        sys.exit(1)
    crew_id = sys.argv[1]
    role = sys.argv[2] if len(sys.argv) > 2 else "backend"
    service = f"crew_{crew_id.replace('-', '')[:8]}"
    print(TEMPLATE.format(service=service, crew_id=crew_id, role=role))


if __name__ == "__main__":
    main()
