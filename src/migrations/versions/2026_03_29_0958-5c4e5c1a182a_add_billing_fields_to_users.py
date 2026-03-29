"""add billing fields to users

Revision ID: 5c4e5c1a182a
Revises: 420b1df0b4e3
Create Date: 2026-03-29 09:58:33.927530

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "5c4e5c1a182a"
down_revision: Union[str, None] = "420b1df0b4e3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


from alembic import op
import sqlalchemy as sa


def upgrade():
    op.add_column("users", sa.Column("subscription_plan", sa.String(length=50), nullable=True))
    op.add_column("users", sa.Column("subscription_status", sa.String(length=30), nullable=False, server_default="free"))
    op.add_column("users", sa.Column("payment_provider", sa.String(length=30), nullable=True))
    op.add_column("users", sa.Column("provider_customer_id", sa.String(length=200), nullable=True))
    op.add_column("users", sa.Column("provider_subscription_id", sa.String(length=200), nullable=True))
    op.add_column("users", sa.Column("subscription_started_at", sa.DateTime(), nullable=True))
    op.add_column("users", sa.Column("subscription_ends_at", sa.DateTime(), nullable=True))


def downgrade():
    op.drop_column("users", "subscription_ends_at")
    op.drop_column("users", "subscription_started_at")
    op.drop_column("users", "provider_subscription_id")
    op.drop_column("users", "provider_customer_id")
    op.drop_column("users", "payment_provider")
    op.drop_column("users", "subscription_status")
    op.drop_column("users", "subscription_plan")