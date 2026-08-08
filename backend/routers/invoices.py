from decimal import Decimal
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from auth import require_role
from database import get_db
from invoice_calculations import (
    ZERO,
    apply_line_calculation,
    recalculate_invoice_totals,
)


router = APIRouter(
    prefix="/invoices",
    tags=["Invoices"],
)


def get_company_id(current_user: models.User) -> int:
    if current_user.CompanyId is None:
        raise HTTPException(
            status_code=400,
            detail="Current user does not have a company context",
        )

    return current_user.CompanyId


def build_invoice_response(
    invoice: models.Invoice,
    db: Session,
) -> dict:
    lines = (
        db.query(models.InvoiceLine)
        .filter(
            models.InvoiceLine.InvoiceId == invoice.InvoiceId,
            models.InvoiceLine.CompanyId == invoice.CompanyId,
        )
        .order_by(models.InvoiceLine.InvoiceLineId)
        .all()
    )

    return {
        "InvoiceId": invoice.InvoiceId,
        "CustomerId": invoice.CustomerId,
        "InvoiceNumber": invoice.InvoiceNumber,
        "InvoiceDate": invoice.InvoiceDate,
        "Subtotal": invoice.Subtotal,
        "VatTotal": invoice.VatTotal,
        "ExciseTaxTotal": invoice.ExciseTaxTotal,
        "TotalAmount": invoice.TotalAmount,
        "CompanyId": invoice.CompanyId,
        "UserId": invoice.UserId,
        "RecordDate": invoice.RecordDate,
        "Lines": lines,
    }


@router.post("/", response_model=schemas.InvoiceResponse)
def create_invoice(
    invoice: schemas.InvoiceCreate,
    current_user: Annotated[
        models.User,
        Depends(require_role("MANAGE_INVOICES")),
    ],
    db: Session = Depends(get_db),
):
    company_id = get_company_id(current_user)
    invoice_number = invoice.InvoiceNumber.strip()

    customer = (
        db.query(models.Customer)
        .filter(
            models.Customer.CustomerId == invoice.CustomerId,
            models.Customer.CompanyId == company_id,
        )
        .first()
    )

    if customer is None:
        raise HTTPException(
            status_code=404,
            detail="Customer not found",
        )

    existing_invoice = (
        db.query(models.Invoice)
        .filter(
            models.Invoice.CompanyId == company_id,
            models.Invoice.InvoiceNumber == invoice_number,
        )
        .first()
    )

    if existing_invoice is not None:
        raise HTTPException(
            status_code=400,
            detail="Invoice number already exists in this company",
        )

    try:
        new_invoice = models.Invoice(
            CustomerId=invoice.CustomerId,
            InvoiceNumber=invoice_number,
            InvoiceDate=invoice.InvoiceDate,
            Subtotal=ZERO,
            VatTotal=ZERO,
            ExciseTaxTotal=ZERO,
            TotalAmount=ZERO,
            CompanyId=company_id,
            UserId=current_user.UserId,
        )

        db.add(new_invoice)
        db.flush()

        for line in invoice.Lines:
            product = (
                db.query(models.Product)
                .filter(
                    models.Product.ProductId == line.ProductId,
                    models.Product.CompanyId == company_id,
                )
                .first()
            )

            if product is None:
                raise HTTPException(
                    status_code=404,
                    detail=f"Product not found: {line.ProductId}",
                )

            line_price = (
                line.Price
                if line.Price is not None
                else Decimal(product.UnitPrice)
            )

            vat_rate = (
                line.VatRate
                if line.VatRate is not None
                else Decimal(product.VatRate or ZERO)
            )

            new_line = models.InvoiceLine(
                InvoiceId=new_invoice.InvoiceId,
                ProductId=product.ProductId,
                ItemName=product.ProductName,
                Quantity=line.Quantity,
                Price=line_price,
                VatRate=vat_rate,
                ExciseTaxRate=line.ExciseTaxRate,
                CompanyId=company_id,
                UserId=current_user.UserId,
            )

            apply_line_calculation(new_line)
            db.add(new_line)

        db.flush()

        recalculate_invoice_totals(
            new_invoice.InvoiceId,
            company_id,
            db,
        )

        db.commit()
        db.refresh(new_invoice)

    except Exception:
        db.rollback()
        raise

    return build_invoice_response(new_invoice, db)


@router.get("/", response_model=list[schemas.InvoiceResponse])
def get_invoices(
    current_user: Annotated[
        models.User,
        Depends(require_role("VIEW_INVOICES")),
    ],
    db: Session = Depends(get_db),
):
    company_id = get_company_id(current_user)

    invoices = (
        db.query(models.Invoice)
        .filter(models.Invoice.CompanyId == company_id)
        .order_by(
            models.Invoice.InvoiceDate.desc(),
            models.Invoice.InvoiceId.desc(),
        )
        .all()
    )

    return [
        build_invoice_response(invoice, db)
        for invoice in invoices
    ]


@router.get(
    "/{invoice_id}",
    response_model=schemas.InvoiceDetailResponse,
)
def get_invoice(
    invoice_id: int,
    current_user: Annotated[
        models.User,
        Depends(require_role("VIEW_INVOICES")),
    ],
    db: Session = Depends(get_db),
):
    company_id = get_company_id(current_user)

    invoice = (
        db.query(models.Invoice)
        .filter(
            models.Invoice.InvoiceId == invoice_id,
            models.Invoice.CompanyId == company_id,
        )
        .first()
    )

    if invoice is None:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found",
        )

    return build_invoice_response(invoice, db)


@router.put(
    "/{invoice_id}",
    response_model=schemas.InvoiceResponse,
)
def update_invoice(
    invoice_id: int,
    updated_invoice: schemas.InvoiceUpdate,
    current_user: Annotated[
        models.User,
        Depends(require_role("MANAGE_INVOICES")),
    ],
    db: Session = Depends(get_db),
):
    company_id = get_company_id(current_user)

    invoice = (
        db.query(models.Invoice)
        .filter(
            models.Invoice.InvoiceId == invoice_id,
            models.Invoice.CompanyId == company_id,
        )
        .first()
    )

    if invoice is None:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found",
        )

    update_data = updated_invoice.model_dump(exclude_unset=True)

    if "CustomerId" in update_data:
        customer = (
            db.query(models.Customer)
            .filter(
                models.Customer.CustomerId
                == update_data["CustomerId"],
                models.Customer.CompanyId == company_id,
            )
            .first()
        )

        if customer is None:
            raise HTTPException(
                status_code=404,
                detail="Customer not found",
            )

    if (
        "InvoiceNumber" in update_data
        and update_data["InvoiceNumber"] is not None
    ):
        invoice_number = update_data["InvoiceNumber"].strip()

        existing_invoice = (
            db.query(models.Invoice)
            .filter(
                models.Invoice.CompanyId == company_id,
                models.Invoice.InvoiceNumber == invoice_number,
                models.Invoice.InvoiceId != invoice_id,
            )
            .first()
        )

        if existing_invoice is not None:
            raise HTTPException(
                status_code=400,
                detail="Invoice number already exists in this company",
            )

        update_data["InvoiceNumber"] = invoice_number

    for field_name, value in update_data.items():
        setattr(invoice, field_name, value)

    invoice.UserId = current_user.UserId

    db.commit()
    db.refresh(invoice)

    return build_invoice_response(invoice, db)


@router.delete("/{invoice_id}")
def delete_invoice(
    invoice_id: int,
    current_user: Annotated[
        models.User,
        Depends(require_role("MANAGE_INVOICES")),
    ],
    db: Session = Depends(get_db),
):
    company_id = get_company_id(current_user)

    invoice = (
        db.query(models.Invoice)
        .filter(
            models.Invoice.InvoiceId == invoice_id,
            models.Invoice.CompanyId == company_id,
        )
        .first()
    )

    if invoice is None:
        raise HTTPException(
            status_code=404,
            detail="Invoice not found",
        )

    try:
        (
            db.query(models.InvoiceLine)
            .filter(
                models.InvoiceLine.InvoiceId == invoice_id,
                models.InvoiceLine.CompanyId == company_id,
            )
            .delete(synchronize_session=False)
        )

        db.delete(invoice)
        db.commit()

    except Exception:
        db.rollback()
        raise

    return {
        "message": (
            "Invoice and related invoice lines deleted successfully"
        )
    }