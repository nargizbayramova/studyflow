from typing import Literal

from pydantic import BaseModel, Field


class HealthResponse(BaseModel):
    status: Literal["ok", "degraded"] = Field(description="Overall service status")
    database: Literal["up", "down"] = Field(description="PostgreSQL connectivity")
    version: str
