from fastapi import APIRouter, Response, status
from sqlalchemy import text

from app.api.deps import DbSession
from app.core.config import settings
from app.schemas.health import HealthResponse
from app.services import monitoring

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Liveness & database health check",
    responses={503: {"model": HealthResponse, "description": "Database unreachable"}},
)
async def health(response: Response, db: DbSession) -> HealthResponse:
    """Used by Docker/monitoring probes (checked every 60s per the monitoring matrix)."""
    try:
        await db.execute(text("SELECT 1"))
        return HealthResponse(status="ok", database="up", version=settings.VERSION)
    except Exception:
        monitoring.record_db_error()
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return HealthResponse(status="degraded", database="down", version=settings.VERSION)
