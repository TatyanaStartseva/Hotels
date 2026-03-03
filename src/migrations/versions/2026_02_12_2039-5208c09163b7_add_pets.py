"""add pets

Revision ID: 5208c09163b7
Revises: 19334ef1a6a2
Create Date: 2026-02-12 20:39:40.951273

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "5208c09163b7"
down_revision: Union[str, None] = "19334ef1a6a2"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

from sqlalchemy.dialects import postgresql


def upgrade() -> None:
    op.create_table(
        "pets",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("user_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=False),

        sa.Column("temperature_min", sa.Float(), nullable=True),
        sa.Column("temperature_max", sa.Float(), nullable=True),
        sa.Column("humidity_min", sa.Float(), nullable=True),
        sa.Column("humidity_max", sa.Float(), nullable=True),

        sa.Column("conditions", sa.Text(), nullable=True),

        sa.Column("vaccinations", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
        sa.Column("chip_id", sa.String(), nullable=True),

        sa.Column("diet_type", sa.String(), nullable=True),
        sa.Column("diet_details", sa.Text(), nullable=True),
        sa.Column("feedings_per_day", sa.Integer(), nullable=True),

        sa.Column("license_required", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("license_number", sa.String(), nullable=True),

        sa.Column("cohabitation_allowed", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("cohabitation_notes", sa.Text(), nullable=True),
        sa.Column("compatible_species", postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    )

    op.add_column("bookings", sa.Column("pet_id", sa.Integer(), nullable=True))
    op.create_foreign_key("fk_bookings_pet_id", "bookings", "pets", ["pet_id"], ["id"])
    op.create_index("ix_bookings_pet_id", "bookings", ["pet_id"])


def downgrade() -> None:
    op.drop_index("ix_bookings_pet_id", table_name="bookings")
    op.drop_constraint("fk_bookings_pet_id", "bookings", type_="foreignkey")
    op.drop_column("bookings", "pet_id")
    op.drop_table("pets")

