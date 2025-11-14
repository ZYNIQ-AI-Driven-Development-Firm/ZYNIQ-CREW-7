from __future__ import annotations

from typing import Optional

from minio import Minio

from app.config import settings

_s3: Optional[Minio] = None


def get_minio() -> Minio:
    global _s3
    if _s3 is None:
        _s3 = Minio(
            settings.S3_ENDPOINT.replace("http://", "").replace("https://", ""),
            access_key=settings.S3_ACCESS_KEY,
            secret_key=settings.S3_SECRET_KEY,
            secure=settings.S3_SECURE,
        )
        if not _s3.bucket_exists(settings.S3_BUCKET):
            _s3.make_bucket(settings.S3_BUCKET)
    return _s3
