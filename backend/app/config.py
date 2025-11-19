import os
from pydantic import BaseModel, Field


class Settings(BaseModel):
    APP_NAME: str = "crew7-api"
    APP_ENV: str = os.getenv("APP_ENV", "dev")
    APP_SECRET: str = os.getenv("APP_SECRET", "dev-secret-please-change")
    DB_URL: str = os.getenv("DB_URL", "postgresql+psycopg://crew7:crew7@localhost:5432/crew7")
    REDIS_URL: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    QDRANT_URL: str = os.getenv("QDRANT_URL", "http://localhost:6333")
    S3_ENDPOINT: str = os.getenv("S3_ENDPOINT", "http://localhost:9000")
    S3_BUCKET: str = os.getenv("S3_BUCKET", "crew7-artifacts")
    S3_ACCESS_KEY: str = os.getenv("S3_ACCESS_KEY", "crew7")
    S3_SECRET_KEY: str = os.getenv("S3_SECRET_KEY", "crew7pass")
    S3_SECURE: bool = os.getenv("S3_SECURE", "false").lower() == "true"
    MODEL_GENERAL: str = os.getenv("CREW7_MODEL_GENERAL", os.getenv("MODEL_GENERAL", "gpt-5-mini"))
    MODEL_CODE: str = os.getenv("CREW7_MODEL_CODE", "codellama:instruct")
    MODEL_EMBED: str = os.getenv("CREW7_EMBED_MODEL", os.getenv("MODEL_EMBED", "all-minilm:latest"))
    OLLAMA_BASE_URL: str = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
    WORKSPACES_ROOT: str = os.getenv("WORKSPACES_ROOT", "/tmp/crew7_workspaces")
    SANDBOX_IMAGE: str = os.getenv("SANDBOX_IMAGE", "python:3.11-slim")
    STRIPE_SECRET: str = os.getenv("STRIPE_SECRET", "")
    STRIPE_PRICE_CREDITS: str = os.getenv("STRIPE_PRICE_CREDITS", "")
    CREDITS_PER_RUN: int = int(os.getenv("CREDITS_PER_RUN", "10"))

    @property
    def CORS_ORIGINS(self) -> list[str]:
        """Parse CORS_ORIGINS from comma-separated string or use default."""
        cors_env = os.getenv("CORS_ORIGINS", "")
        if cors_env:
            return [origin.strip() for origin in cors_env.split(",")]
        return ["http://localhost:5173", "http://localhost:3000"]


settings = Settings()
