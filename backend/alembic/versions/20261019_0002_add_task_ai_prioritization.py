"""add_task_ai_prioritization

Revision ID: 0002
Revises: 0001
Create Date: 2026-10-19 14:25:00.000000
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "0002"
down_revision: Union[str, None] = "0001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("tasks", sa.Column("priority_rank", sa.Integer(), nullable=True))
    op.add_column("tasks", sa.Column("urgency_level", sa.String(length=20), nullable=True))
    op.add_column("tasks", sa.Column("ai_recommendation", sa.Text(), nullable=True))
    op.create_index(op.f("ix_tasks_priority_rank"), "tasks", ["priority_rank"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_tasks_priority_rank"), table_name="tasks")
    op.drop_column("tasks", "ai_recommendation")
    op.drop_column("tasks", "urgency_level")
    op.drop_column("tasks", "priority_rank")
