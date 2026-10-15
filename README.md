# AcademicPlanner – AI-Powered Academic Planner 🎓

Monorepo:

```
academic-planner/
├── backend/    # FastAPI + PostgreSQL + Alembic
└── frontend/   # React + Tailwind + TypeScript (later)
```

## Run the backend (Docker)

```bash
cd backend
cp .env.example .env
docker compose up --build
```

- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc
- OpenAPI JSON: http://localhost:8000/api/v1/openapi.json
- Health: http://localhost:8000/api/v1/health

Migrations are applied automatically on container start.

## Local development (without backend container)

```bash
cd backend
docker compose up -d db
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
alembic upgrade head
uvicorn app.main:app --reload
```

## Migrations

```bash
alembic revision --autogenerate -m "describe change"
alembic upgrade head
```

## Database schema

`users` 1─* `courses` 1─* `tasks` 1─* `study_blocks`; `users` 1─* `availability_slots`.

## Auth, CRUD & monitoring (Phase 2)

- Register at `POST /api/v1/auth/register`, then click **Authorize** in Swagger (username = email).
- Endpoints:
  - `/auth/*`: registration, login (JWT), profile management (`GET`, `PATCH`).
  - `/courses`: list (with `semester` and `include_archived` filters), create, get, edit/archive (`PATCH`), delete (`DELETE`).
  - `/tasks`: list (filters: `course_id`, `type`, `status`, `priority`, `due_from`, `due_to`, search `q`), create, get, update (`PATCH`), delete (`DELETE`).
  - `/availability`: list weekly availability slots, create, get (`GET /{slot_id}`), update (`PATCH /{slot_id}`), delete (`DELETE /{slot_id}`).
  - `/study-blocks`: study session blocks for tasks (filters: `task_id`, `status`, `start_from`, `start_to`), create, get, update/mark completed (`PATCH`), delete (`DELETE`).
- Telegram alerts: set `TELEGRAM_BOT_TOKEN` and `TELEGRAM_CHAT_ID` in `.env`; without them alerts are only logged.

## Tests

```bash
pip install -r requirements-dev.txt
pytest -q
```
