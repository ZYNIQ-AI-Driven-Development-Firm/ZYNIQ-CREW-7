from __future__ import annotations

from io import BytesIO
from uuid import UUID

from app.config import settings
from app.infra.s3_client import get_minio


def put_artifact(
    run_id: UUID,
    filename: str,
    content: bytes,
    content_type: str = "application/octet-stream",
) -> str:
    client = get_minio()
    key = f"runs/{run_id}/{filename}"
    client.put_object(
        bucket_name=settings.S3_BUCKET,
        object_name=key,
        data=BytesIO(content),
        length=len(content),
        content_type=content_type,
    )
    return f"s3://{settings.S3_BUCKET}/{key}"


def signed_url(object_key: str, expires: int = 3600) -> str:
    client = get_minio()
    return client.presigned_get_object(settings.S3_BUCKET, object_key, expires=expires)
