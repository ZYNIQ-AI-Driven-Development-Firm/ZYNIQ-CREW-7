from __future__ import annotations

from io import BytesIO
from typing import Any
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


def list_artifacts(run_id: UUID) -> list[dict[str, Any]]:
    """List all artifacts for a given run."""
    client = get_minio()
    prefix = f"runs/{run_id}/"
    
    artifacts = []
    try:
        objects = client.list_objects(settings.S3_BUCKET, prefix=prefix, recursive=True)
        for obj in objects:
            # Get file content
            response = client.get_object(settings.S3_BUCKET, obj.object_name)
            content = response.read().decode('utf-8', errors='ignore')
            response.close()
            response.release_conn()
            
            artifacts.append({
                'path': obj.object_name.replace(prefix, ''),
                'content': content,
                'size': obj.size,
                'last_modified': obj.last_modified.isoformat() if obj.last_modified else None,
            })
    except Exception as e:
        # Return empty list if bucket doesn't exist or other errors
        print(f"Failed to list artifacts for run {run_id}: {e}")
        return []
    
    return artifacts


def signed_url(object_key: str, expires: int = 3600) -> str:
    client = get_minio()
    return client.presigned_get_object(settings.S3_BUCKET, object_key, expires=expires)

