"""Add invoice tax fields.

Revision ID: c6ff8d0444f3
Revises: 0ec247c60326
Create Date: 2026-08-08 15:32:23.136649
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "c6ff8d0444f3"
down_revision: Union[str, Sequence[str], None] = "0ec247c60326"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    """Add tax totals while preserving existing invoice amounts."""
    op.execute(
        sa.text(
            'UPDATE "Invoice" '
            'SET "TotalAmount" = 0 '
            'WHERE "TotalAmount" IS NULL'
        )
    )

    with op.batch_alter_table("Invoice", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "Subtotal",
                sa.Numeric(precision=18, scale=2),
                server_default="0",
                nullable=False,
            )
        )
        batch_op.add_column(
            sa.Column(
                "VatTotal",
                sa.Numeric(precision=18, scale=2),
                server_default="0",
                nullable=False,
            )
        )
        batch_op.add_column(
            sa.Column(
                "ExciseTaxTotal",
                sa.Numeric(precision=18, scale=2),
                server_default="0",
                nullable=False,
            )
        )
        batch_op.alter_column(
            "TotalAmount",
            existing_type=sa.Numeric(precision=18, scale=2),
            nullable=False,
        )

    with op.batch_alter_table("InvoiceLine", schema=None) as batch_op:
        batch_op.add_column(
            sa.Column(
                "VatRate",
                sa.Numeric(precision=5, scale=2),
                server_default="0",
                nullable=False,
            )
        )
        batch_op.add_column(
            sa.Column(
                "ExciseTaxRate",
                sa.Numeric(precision=5, scale=2),
                server_default="0",
                nullable=False,
            )
        )
        batch_op.add_column(
            sa.Column(
                "Subtotal",
                sa.Numeric(precision=18, scale=2),
                server_default="0",
                nullable=False,
            )
        )
        batch_op.add_column(
            sa.Column(
                "VatAmount",
                sa.Numeric(precision=18, scale=2),
                server_default="0",
                nullable=False,
            )
        )
        batch_op.add_column(
            sa.Column(
                "ExciseTaxAmount",
                sa.Numeric(precision=18, scale=2),
                server_default="0",
                nullable=False,
            )
        )
        batch_op.add_column(
            sa.Column(
                "LineTotal",
                sa.Numeric(precision=18, scale=2),
                server_default="0",
                nullable=False,
            )
        )

    op.execute(
        sa.text(
            'UPDATE "InvoiceLine" '
            'SET "VatRate" = 0, '
            '"ExciseTaxRate" = 0, '
            '"Subtotal" = ROUND("Quantity" * "Price", 2), '
            '"VatAmount" = 0, '
            '"ExciseTaxAmount" = 0, '
            '"LineTotal" = ROUND("Quantity" * "Price", 2)'
        )
    )

    op.execute(
        sa.text(
            'UPDATE "Invoice" '
            'SET "Subtotal" = COALESCE(('
            'SELECT SUM("InvoiceLine"."LineTotal") '
            'FROM "InvoiceLine" '
            'WHERE "InvoiceLine"."InvoiceId" = '
            '"Invoice"."InvoiceId"'
            '), "TotalAmount", 0), '
            '"VatTotal" = 0, '
            '"ExciseTaxTotal" = 0, '
            '"TotalAmount" = COALESCE(('
            'SELECT SUM("InvoiceLine"."LineTotal") '
            'FROM "InvoiceLine" '
            'WHERE "InvoiceLine"."InvoiceId" = '
            '"Invoice"."InvoiceId"'
            '), "TotalAmount", 0)'
        )
    )


def downgrade() -> None:
    """Remove invoice tax fields."""
    with op.batch_alter_table("InvoiceLine", schema=None) as batch_op:
        batch_op.drop_column("LineTotal")
        batch_op.drop_column("ExciseTaxAmount")
        batch_op.drop_column("VatAmount")
        batch_op.drop_column("Subtotal")
        batch_op.drop_column("ExciseTaxRate")
        batch_op.drop_column("VatRate")

    with op.batch_alter_table("Invoice", schema=None) as batch_op:
        batch_op.alter_column(
            "TotalAmount",
            existing_type=sa.Numeric(precision=18, scale=2),
            nullable=True,
        )
        batch_op.drop_column("ExciseTaxTotal")
        batch_op.drop_column("VatTotal")
        batch_op.drop_column("Subtotal")