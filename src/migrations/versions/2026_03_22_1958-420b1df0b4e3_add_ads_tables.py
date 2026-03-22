"""add ads tables

Revision ID: 420b1df0b4e3
Revises: c7e2c1c0c78c
Create Date: 2026-03-22 19:58:29.472105

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "420b1df0b4e3"
down_revision: Union[str, None] = "c7e2c1c0c78c"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "ads",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("owner_id", sa.Integer(), sa.ForeignKey("users.id"), nullable=True),
        sa.Column("title", sa.String(length=200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("image_url", sa.String(length=500), nullable=True),
        sa.Column("target_url", sa.String(length=500), nullable=True),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default=sa.text("true")),
        sa.Column("plan_name", sa.String(length=50), nullable=False, server_default="basic"),
        sa.Column("weight", sa.Integer(), nullable=False, server_default="1"),
        sa.Column("created_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )

    op.create_table(
        "ad_impressions",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("ad_id", sa.Integer(), sa.ForeignKey("ads.id"), nullable=False),
        sa.Column("shown_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_index("ix_ad_impressions_ad_id", "ad_impressions", ["ad_id"])

    op.create_table(
        "ad_clicks",
        sa.Column("id", sa.Integer(), primary_key=True),
        sa.Column("ad_id", sa.Integer(), sa.ForeignKey("ads.id"), nullable=False),
        sa.Column("clicked_at", sa.DateTime(), nullable=False, server_default=sa.text("CURRENT_TIMESTAMP")),
    )
    op.create_index("ix_ad_clicks_ad_id", "ad_clicks", ["ad_id"])


def downgrade() -> None:
    op.drop_index("ix_ad_clicks_ad_id", table_name="ad_clicks")
    op.drop_table("ad_clicks")

    op.drop_index("ix_ad_impressions_ad_id", table_name="ad_impressions")
    op.drop_table("ad_impressions")

    op.drop_table("ads")
