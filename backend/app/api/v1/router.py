from fastapi import APIRouter

from app.api.v1 import auth, availability, courses, health, tasks

api_router = APIRouter()
for module in (health, auth, courses, tasks, availability):
    api_router.include_router(module.router)
