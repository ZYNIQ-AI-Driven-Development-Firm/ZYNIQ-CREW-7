from __future__ import annotations

from prometheus_client.core import GaugeMetricFamily, REGISTRY

from app.infra.redis_client import get_redis


_RUNS_STARTED_KEY = "metrics:runs_started"
_RUNS_DONE_KEY = "metrics:runs_done"


def record_run_started(crew_id: str) -> None:
    try:
        redis = get_redis()
        redis.hincrby(_RUNS_STARTED_KEY, crew_id, 1)
    except Exception:  # noqa: BLE001 - metrics best effort
        pass


def record_run_done(crew_id: str, status: str) -> None:
    try:
        redis = get_redis()
        redis.hincrby(_RUNS_DONE_KEY, f"{crew_id}:{status}", 1)
    except Exception:  # noqa: BLE001 - metrics best effort
        pass


class _RunMetricsCollector:
    def collect(self):  # type: ignore[override]
        redis = None
        try:
            redis = get_redis()
        except Exception:  # pragma: no cover - redis offline
            return

        started_metrics = GaugeMetricFamily(
            "crew7_runs_started_total",
            "Runs started",
            labels=["crew_id"],
        )
        try:
            started_values = redis.hgetall(_RUNS_STARTED_KEY) or {}
        except Exception:  # pragma: no cover - redis offline
            return
        for crew_id, value in started_values.items():
            started_metrics.add_metric([crew_id], int(value))
        yield started_metrics

        done_metrics = GaugeMetricFamily(
            "crew7_runs_done_total",
            "Runs finished",
            labels=["crew_id", "status"],
        )
        try:
            done_values = redis.hgetall(_RUNS_DONE_KEY) or {}
        except Exception:  # pragma: no cover - redis offline
            return
        for key, value in done_values.items():
            try:
                crew_id, status = key.split(":", 1)
            except ValueError:
                continue
            done_metrics.add_metric([crew_id, status], int(value))
        yield done_metrics


_collector = _RunMetricsCollector()
_collector_registered = False


def register_metrics_collector() -> None:
    global _collector_registered
    if _collector_registered:
        return
    try:
        REGISTRY.register(_collector)
    except ValueError:
        _collector_registered = True
    else:
        _collector_registered = True
