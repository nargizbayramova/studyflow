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
