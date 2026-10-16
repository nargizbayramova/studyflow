from fastapi import APIRouter

from app.api.v1 import auth, availability, courses, health, schedule, study_blocks, tasks

api_router = APIRouter()
for module in (health, auth, courses, tasks, availability, study_blocks, schedule):
    api_router.include_router(module.router)
