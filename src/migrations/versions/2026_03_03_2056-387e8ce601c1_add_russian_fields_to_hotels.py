"""add russian fields to hotels

Revision ID: 387e8ce601c1
Revises: 288698d2d315
Create Date: 2026-03-03 20:56:16.531445

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "387e8ce601c1"
down_revision: Union[str, None] = "288698d2d315"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("hotels", sa.Column("location_ru", sa.String(length=100), nullable=True))
    # опционально: русское название отеля
    op.add_column("hotels", sa.Column("title_ru", sa.String(length=200), nullable=True))


def downgrade() -> None:
    op.drop_column("hotels", "title_ru")
    op.drop_column("hotels", "location_ru")