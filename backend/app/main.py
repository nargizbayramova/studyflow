from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router
from app.core.config import settings

DESCRIPTION = """
**StudyFlow** – AI-powered academic planner & workload balancer.

Interactive docs: **Swagger UI** at `/docs`, **ReDoc** at `/redoc`,
raw OpenAPI schema at `/api/v1/openapi.json`.
"""

TAGS_METADATA = [
    {"name": "Health", "description": "Service and database health probes."},
    {"name": "Auth", "description": "Registration, login (JWT) and profile. *(Phase 2)*"},
    {"name": "Courses", "description": "Course management. *(Phase 2)*"},
    {"name": "Tasks", "description": "Assignments, exams, quizzes, milestones. *(Phase 2)*"},
    {"name": "Schedule", "description": "Availability and AI study schedule. *(Phase 2+)*"},
]

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description=DESCRIPTION,
    openapi_tags=TAGS_METADATA,
    openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
    docs_url="/docs",
    redoc_url="/redoc",
)

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
