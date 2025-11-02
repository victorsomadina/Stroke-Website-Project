"""modify phone number

Revision ID: 17fbf664d382
Revises: 0383c0e82b56
Create Date: 2025-11-02 22:04:42.583384

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '17fbf664d382'
down_revision: Union[str, Sequence[str], None] = '0383c0e82b56'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("""
ALTER TABLE users
MODIFY COLUMN phoneNumber VARCHAR(20);
""")
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
