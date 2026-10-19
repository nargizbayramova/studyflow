from pydantic import BaseModel


class FieldError(BaseModel):
    field: str
    message: str


class ErrorResponse(BaseModel):
    detail: str
    error_code: str
    status_code: int
    field_errors: list[FieldError] | None = None
