"""Initial schema: categories, statements, transactions.

Revision ID: 001
Revises:
Create Date: 2026-03-15

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "categories",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("name", sa.String(length=128), nullable=False),
        sa.Column("slug", sa.String(length=64), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_categories_slug"), "categories", ["slug"], unique=True)

    op.execute(
        """
        DO $$ BEGIN
            CREATE TYPE banktype AS ENUM ('chase', 'boa', 'apple_card', 'wells_fargo');
        EXCEPTION
            WHEN duplicate_object THEN NULL;
        END $$;
        """
    )
    bank_type_enum = postgresql.ENUM(
        "chase", "boa", "apple_card", "wells_fargo", name="banktype", create_type=False
    )
    op.create_table(
        "statements",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("filename", sa.String(length=256), nullable=False),
        sa.Column("bank_type", bank_type_enum, nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_statements_bank_type"), "statements", ["bank_type"], unique=False)

    op.create_table(
        "transactions",
        sa.Column("id", sa.Integer(), autoincrement=True, nullable=False),
        sa.Column("statement_id", sa.Integer(), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("amount", sa.Numeric(precision=14, scale=2), nullable=False),
        sa.Column("merchant", sa.String(length=512), nullable=False),
        sa.Column("normalized_merchant", sa.String(length=512), nullable=True),
        sa.Column("raw_description", sa.String(length=1024), nullable=True),
        sa.Column("category_id", sa.Integer(), nullable=True),
        sa.Column("is_anomalous", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("is_subscription", sa.Boolean(), nullable=False, server_default=sa.text("false")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.ForeignKeyConstraint(["category_id"], ["categories.id"], ondelete="SET NULL"),
        sa.ForeignKeyConstraint(["statement_id"], ["statements.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index(op.f("ix_transactions_category_id"), "transactions", ["category_id"], unique=False)
    op.create_index(op.f("ix_transactions_date"), "transactions", ["date"], unique=False)
    op.create_index(op.f("ix_transactions_statement_id"), "transactions", ["statement_id"], unique=False)


def downgrade() -> None:
    op.drop_index(op.f("ix_transactions_statement_id"), table_name="transactions")
    op.drop_index(op.f("ix_transactions_date"), table_name="transactions")
    op.drop_index(op.f("ix_transactions_category_id"), table_name="transactions")
    op.drop_table("transactions")
    op.drop_index(op.f("ix_statements_bank_type"), table_name="statements")
    op.drop_table("statements")
    op.execute("DROP TYPE IF EXISTS banktype")
    op.drop_index(op.f("ix_categories_slug"), table_name="categories")
    op.drop_table("categories")
