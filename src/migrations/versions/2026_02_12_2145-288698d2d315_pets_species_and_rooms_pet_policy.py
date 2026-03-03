"""pets species and rooms pet policy

Revision ID: 288698d2d315
Revises: 5208c09163b7
Create Date: 2026-02-12 21:45:08.412303

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision: str = "288698d2d315"
down_revision: Union[str, None] = "5208c09163b7"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # pets.species
    op.add_column("pets", sa.Column("species", sa.String(), nullable=False, server_default="unknown"))

    # rooms policy fields
    op.add_column("rooms", sa.Column("allowed_species", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column("rooms", sa.Column("temp_min", sa.Float(), nullable=True))
    op.add_column("rooms", sa.Column("temp_max", sa.Float(), nullable=True))
    op.add_column("rooms", sa.Column("humidity_min", sa.Float(), nullable=True))
    op.add_column("rooms", sa.Column("humidity_max", sa.Float(), nullable=True))
    op.add_column("rooms", sa.Column("room_conditions", sa.Text(), nullable=True))

    op.add_column("rooms", sa.Column("vaccinations_required", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column("rooms", sa.Column("chip_required", sa.Boolean(), nullable=False, server_default=sa.text("false")))

    op.add_column("rooms", sa.Column("diet_supported", postgresql.JSONB(astext_type=sa.Text()), nullable=True))
    op.add_column("rooms", sa.Column("feedings_per_day_max", sa.Integer(), nullable=True))

    op.add_column("rooms", sa.Column("license_required", sa.Boolean(), nullable=False, server_default=sa.text("false")))
    op.add_column("rooms", sa.Column("cohabitation_allowed", sa.Boolean(), nullable=False, server_default=sa.text("true")))


def downgrade() -> None:
    op.drop_column("rooms", "cohabitation_allowed")
    op.drop_column("rooms", "license_required")
    op.drop_column("rooms", "feedings_per_day_max")
    op.drop_column("rooms", "diet_supported")
    op.drop_column("rooms", "chip_required")
    op.drop_column("rooms", "vaccinations_required")
    op.drop_column("rooms", "room_conditions")
    op.drop_column("rooms", "humidity_max")
    op.drop_column("rooms", "humidity_min")
    op.drop_column("rooms", "temp_max")
    op.drop_column("rooms", "temp_min")
    op.drop_column("rooms", "allowed_species")

    op.drop_column("pets", "species")
