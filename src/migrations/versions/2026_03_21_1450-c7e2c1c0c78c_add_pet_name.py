"""add pet name

Revision ID: c7e2c1c0c78c
Revises: 00929b2629e1
Create Date: 2026-03-21 14:50:17.870106

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "c7e2c1c0c78c"
down_revision: Union[str, None] = "00929b2629e1"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("pets", sa.Column("name", sa.String(length=100), nullable=True))

    op.execute("UPDATE pets SET name = 'Питомец' WHERE name IS NULL")
    op.alter_column("pets", "name", nullable=False)


def downgrade() -> None:
    op.drop_column("pets", "name")