"""add images column to hotels

Revision ID: c685a8f3d6ab
Revises: 5c4e5c1a182a
Create Date: 2026-03-30 19:32:55.459195

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "c685a8f3d6ab"
down_revision: Union[str, None] = "5c4e5c1a182a"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "hotels",
        sa.Column(
            "images",
            postgresql.JSON(astext_type=sa.Text()),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("hotels", "images")