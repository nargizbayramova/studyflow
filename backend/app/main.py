import logging
import time
from collections.abc import AsyncIterator
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.router import api_router
from app.core.config import settings
from app.services import monitoring

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s [%(name)s] %(message)s")
logger = logging.getLogger("studyflow")

DESCRIPTION = """
**StudyFlow** – AI-powered academic planner & workload balancer.

Interactive docs: **Swagger UI** at `/docs`, **ReDoc** at `/redoc`,
raw OpenAPI schema at `/api/v1/openapi.json`.

Click **Authorize** and log in with your email as *username* to call protected endpoints.
"""

TAGS_METADATA = [
    {"name": "Health", "description": "Service and database health probes."},
    {"name": "Auth", "description": "Registration, login (JWT) and profile."},
    {"name": "Courses", "description": "Course management (archive or delete)."},
    {"name": "Tasks", "description": "Assignments, exams, quizzes, milestones."},
    {"name": "Schedule", "description": "Weekly availability."},
    {"name": "Study Blocks", "description": "Study session blocks for academic tasks (FR-09, FR-10)."},
]


@asynccontextmanager
async def lifespan(_: FastAPI) -> AsyncIterator[None]:
    await monitoring.start()
    yield
    await monitoring.stop()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=DESCRIPTION,
    openapi_tags=TAGS_METADATA,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)


@app.middleware("http")
async def monitor_requests(request: Request, call_next) -> Response:
    """Feeds latency / unhandled-error / DB-error alert rules."""
    start = time.perf_counter()
    try:
        response = await call_next(request)
    except Exception as e:
        logger.exception("Unhandled error on %s %s", request.method, request.url.path)
        monitoring.record_exception(e)
        response = JSONResponse({"detail": "Internal Server Error"}, status_code=500)
    monitoring.record_latency(time.perf_counter() - start)
    return response


# Added after the monitor so it wraps it: 500 responses still carry CORS headers.
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router, prefix=settings.API_V1_PREFIX)


@app.get("/", include_in_schema=False)
def root() -> dict[str, str]:
    return {"name": settings.PROJECT_NAME, "docs": "/docs"}
