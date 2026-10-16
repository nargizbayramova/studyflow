import asyncio
import os
from typing import TypeVar

from google import genai
from google.genai import types
from pydantic import BaseModel

from app.core.config import settings

MODEL_ID = os.getenv("GEMINI_MODEL", settings.GEMINI_MODEL or "gemini-3.1-flash-lite-preview")

T = TypeVar("T", bound=BaseModel)


def _get_client() -> genai.Client:
    api_key = os.getenv("GEMINI_API_KEY") or settings.GEMINI_API_KEY
    return genai.Client(api_key=api_key)


async def generate_structured(system_prompt: str, user_payload: str, schema: type[T]) -> T:
    # shortcut: no failure tracking yet, add Telegram alerting in monitoring phase
    client = _get_client()
    response = await asyncio.wait_for(
        client.aio.models.generate_content(
            model=MODEL_ID,
            contents=user_payload,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                response_schema=schema,
                temperature=0.2,
            ),
        ),
        timeout=10.0,
    )
    if getattr(response, "parsed", None) is not None and isinstance(response.parsed, schema):
        return response.parsed
    return schema.model_validate_json(response.text)
