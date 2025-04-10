"""add location in the hotels

Revision ID: 07ce6594f3b7
Revises: 3b0cc6af126b
Create Date: 2025-03-30 13:15:50.009963

"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "07ce6594f3b7"
down_revision: Union[str, None] = "3b0cc6af126b"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.add_column(
        "hotels", sa.Column("location", sa.String(length=100), nullable=False)
    )
    # ### end Alembic commands ###


def downgrade() -> None:
    """Downgrade schema."""
    # ### commands auto generated by Alembic - please adjust! ###
    op.drop_column("hotels", "location")
    # ### end Alembic commands ###
