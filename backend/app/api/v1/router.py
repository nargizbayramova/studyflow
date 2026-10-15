from fastapi import APIRouter

from app.api.v1 import auth, availability, courses, health, study_blocks, tasks

api_router = APIRouter()
for module in (health, auth, courses, tasks, availability, study_blocks):
    api_router.include_router(module.router)
