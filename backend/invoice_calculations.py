from decimal import Decimal, ROUND_HALF_UP

from fastapi import HTTPException
from sqlalchemy.orm import Session

import models


MONEY_STEP = Decimal("0.01")
RATE_STEP = Decimal("0.01")
HUNDRED = Decimal("100.00")
ZERO = Decimal("0.00")


def money(value: Decimal | int | str | None) -> Decimal:
    """Round a monetary value to two decimal places."""
    return Decimal(value or ZERO).quantize(
        MONEY_STEP,
        rounding=ROUND_HALF_UP,
    )


def rate(value: Decimal | int | str | None) -> Decimal:
    """Normalize a percentage rate to two decimal places."""
    return Decimal(value or ZERO).quantize(
        RATE_STEP,
        rounding=ROUND_HALF_UP,
    )


def calculate_line_amounts(
    quantity: int,
    price: Decimal,
    vat_rate: Decimal,
    excise_tax_rate: Decimal,
) -> dict[str, Decimal]:
    """Calculate subtotal, excise tax, VAT, and payable line total."""
    normalized_price = money(price)
    normalized_vat_rate = rate(vat_rate)
    normalized_excise_tax_rate = rate(excise_tax_rate)

    subtotal = money(Decimal(quantity) * normalized_price)

    excise_tax_amount = money(
        subtotal * normalized_excise_tax_rate / HUNDRED
    )

    vat_base = subtotal + excise_tax_amount
    vat_amount = money(
        vat_base * normalized_vat_rate / HUNDRED
    )

    line_total = money(
        subtotal + excise_tax_amount + vat_amount
    )

    return {
        "Price": normalized_price,
        "VatRate": normalized_vat_rate,
        "ExciseTaxRate": normalized_excise_tax_rate,
        "Subtotal": subtotal,
        "VatAmount": vat_amount,
        "ExciseTaxAmount": excise_tax_amount,
        "LineTotal": line_total,
    }


def apply_line_calculation(
    invoice_line: models.InvoiceLine,
) -> None:
    """Apply calculated tax values to an invoice line model."""
    amounts = calculate_line_amounts(
        quantity=invoice_line.Quantity,
        price=Decimal(invoice_line.Price),
        vat_rate=Decimal(invoice_line.VatRate or ZERO),
        excise_tax_rate=Decimal(
            invoice_line.ExciseTaxRate or ZERO
        ),
    )

    for field_name, value in amounts.items():
        setattr(invoice_line, field_name, value)


def recalculate_invoice_totals(
    invoice_id: int,
    company_id: int,
    db: Session,
) -> models.Invoice:
    """Recalculate all invoice totals from persisted line values."""
    invoice = db.query(models.Invoice).filter(
        models.Invoice.InvoiceId == invoice_id,
        models.Invoice.CompanyId == company_id,
    ).first()

    if invoice is None:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found",
        )

    invoice_lines = db.query(models.InvoiceLine).filter(
        models.InvoiceLine.InvoiceId == invoice_id,
        models.InvoiceLine.CompanyId == company_id,
    ).all()

    invoice.Subtotal = money(
        sum(
            (
                Decimal(line.Subtotal or ZERO)
                for line in invoice_lines
            ),
            ZERO,
        )
    )
    invoice.VatTotal = money(
        sum(
            (
                Decimal(line.VatAmount or ZERO)
                for line in invoice_lines
            ),
            ZERO,
        )
    )
    invoice.ExciseTaxTotal = money(
        sum(
            (
                Decimal(line.ExciseTaxAmount or ZERO)
                for line in invoice_lines
            ),
            ZERO,
        )
    )
    invoice.TotalAmount = money(
        sum(
            (
                Decimal(line.LineTotal or ZERO)
                for line in invoice_lines
            ),
            ZERO,
        )
    )

    return invoice