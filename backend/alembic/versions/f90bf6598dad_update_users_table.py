"""update users table

Revision ID: f90bf6598dad
Revises: 
Create Date: 2025-11-02 20:59:08.609232

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = 'f90bf6598dad'
down_revision: Union[str, Sequence[str], None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Upgrade schema."""
    op.execute(
        """
ALTER TABLE users
ADD COLUMN role ENUM('doctor', 'patient') DEFAULT 'patient';
"""
    )
    pass

def downgrade() -> None:
    """Downgrade schema."""
    op.execute("""
ALTER TABLE users
DROP COLUMN role
""")
    pass
