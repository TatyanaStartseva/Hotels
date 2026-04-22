"""add hotel owner role and hotel owner fields

Revision ID: 3b0acc37fec7
Revises: c685a8f3d6ab
Create Date: 2026-04-22 01:52:29.016000

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "3b0acc37fec7"
down_revision: Union[str, None] = "c685a8f3d6ab"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("is_hotel_owner", sa.Boolean(), nullable=False, server_default=sa.text("false"))
    )

    op.add_column(
        "hotels",
        sa.Column("owner_id", sa.Integer(), nullable=True)
    )
    op.add_column(
        "hotels",
        sa.Column("status", sa.String(length=20), nullable=False, server_default="draft")
    )

    op.create_foreign_key(
        "fk_hotels_owner_id_users",
        "hotels",
        "users",
        ["owner_id"],
        ["id"],
    )

    op.execute("UPDATE hotels SET status = 'published' WHERE status IS NULL")

    op.alter_column("users", "is_hotel_owner", server_default=None)
    op.alter_column("hotels", "status", server_default=None)


def downgrade() -> None:
    op.drop_constraint("fk_hotels_owner_id_users", "hotels", type_="foreignkey")
    op.drop_column("hotels", "status")
    op.drop_column("hotels", "owner_id")
    op.drop_column("users", "is_hotel_owner")