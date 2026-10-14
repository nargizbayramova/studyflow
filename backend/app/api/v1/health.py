from fastapi import APIRouter, Depends, Response, status
from sqlalchemy import text
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.database import get_db
from app.schemas.health import HealthResponse

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Liveness & database health check",
    responses={503: {"model": HealthResponse, "description": "Database unreachable"}},
)
def health(response: Response, db: Session = Depends(get_db)) -> HealthResponse:
    """Used by Docker/monitoring probes (checked every 60s per the monitoring matrix)."""
    try:
        db.execute(text("SELECT 1"))
        return HealthResponse(status="ok", database="up", version=settings.VERSION)
    except Exception:
        response.status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        return HealthResponse(status="degraded", database="down", version=settings.VERSION)
