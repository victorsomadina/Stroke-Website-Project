"""update users table again

Revision ID: 0383c0e82b56
Revises: f90bf6598dad
Create Date: 2025-11-02 21:38:50.506109

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '0383c0e82b56'
down_revision: Union[str, Sequence[str], None] = 'f90bf6598dad'
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute("""
ALTER TABLE users
ADD COLUMN phoneNumber int,
ADD COLUMN DOB date,
ADD COLUMN gender ENUM('male', 'female')
        """)
    pass


def downgrade() -> None:
    """Downgrade schema."""
    pass
