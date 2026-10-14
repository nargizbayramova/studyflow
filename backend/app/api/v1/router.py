from fastapi import APIRouter

from app.api.v1 import health

api_router = APIRouter()
api_router.include_router(health.router)

# Phase 2: auth, courses, tasks, schedule routers get registered here.
