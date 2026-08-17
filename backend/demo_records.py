from datetime import datetime
from decimal import Decimal

from sqlalchemy.orm import Session

import models
from invoice_calculations import (
    apply_line_calculation,
    recalculate_invoice_totals,
)


ADMIN_CUSTOMERS = [
    (
        "1234567890",
        "Demo Teknoloji Ltd. Şti.",
        "Mersin Teknopark",
        "demo@example.com",
    ),
    (
        "2345678901",
        "Akdeniz Yazılım A.Ş.",
        "Yenişehir, Mersin",
        "bilgi@akdenizyazilim.com",
    ),
    (
        "3456789012",
        "Mersin Lojistik Ltd. Şti.",
        "Akdeniz, Mersin",
        "operasyon@mersinlojistik.com",
    ),
    (
        "4567890123",
        "Toros Gıda San. ve Tic. A.Ş.",
        "Tarsus, Mersin",
        "muhasebe@torosgida.com",
    ),
    (
        "5678901234",
        "Çukurova Eğitim Hizmetleri Ltd. Şti.",
        "Seyhan, Adana",
        "iletisim@cukurovaegitim.com",
    ),
    (
        "6789012345",
        "Atlas Mimarlık ve Mühendislik A.Ş.",
        "Mezitli, Mersin",
        "proje@atlasmimarlik.com",
    ),
]

ADMIN_PRODUCTS = [
    ("DEMO-001", "Danışmanlık Hizmeti", "500.00", "20.00"),
    ("YAZ-001", "Kurumsal Yazılım Lisansı", "4500.00", "20.00"),
    ("BAK-001", "Aylık Bakım Hizmeti", "1250.00", "20.00"),
    ("EGT-001", "Teknik Eğitim Hizmeti", "2000.00", "20.00"),
    ("TAS-001", "Grafik Tasarım Hizmeti", "1750.00", "20.00"),
    ("DON-001", "Ağ Donanımı Paketi", "6800.00", "20.00"),
    ("KIT-001", "Teknik Eğitim Kitabı", "350.00", "10.00"),
    ("GID-001", "Kurumsal İkram Paketi", "900.00", "10.00"),
]

ADMIN_INVOICES = [
    (
        "INV-2026-001",
        "1234567890",
        "2026-08-01",
        [
            ("DEMO-001", 2, "0.00", "0.00"),
        ],
    ),
    (
        "INV-2026-002",
        "2345678901",
        "2026-08-03",
        [
            ("YAZ-001", 1, "20.00", "0.00"),
            ("BAK-001", 2, "20.00", "0.00"),
        ],
    ),
    (
        "INV-2026-003",
        "3456789012",
        "2026-08-05",
        [
            ("DON-001", 1, "20.00", "5.00"),
            ("TAS-001", 2, "20.00", "0.00"),
        ],
    ),
    (
        "INV-2026-004",
        "4567890123",
        "2026-08-08",
        [
            ("GID-001", 5, "10.00", "0.00"),
            ("BAK-001", 1, "20.00", "0.00"),
        ],
    ),
    (
        "INV-2026-005",
        "5678901234",
        "2026-08-12",
        [
            ("EGT-001", 3, "20.00", "0.00"),
            ("KIT-001", 20, "10.00", "0.00"),
        ],
    ),
    (
        "INV-2026-006",
        "6789012345",
        "2026-08-18",
        [
            ("TAS-001", 3, "20.00", "0.00"),
            ("YAZ-001", 1, "20.00", "0.00"),
        ],
    ),
    (
        "INV-2026-007",
        "1234567890",
        "2026-08-24",
        [
            ("BAK-001", 4, "20.00", "0.00"),
            ("DON-001", 1, "20.00", "10.00"),
        ],
    ),
]


COMPANY_CUSTOMERS = [
    (
        "7132456801",
        "Nova Dijital Sistemler A.Ş.",
        "Yenişehir, Mersin",
        "finans@novadijital.com",
    ),
    (
        "7132456802",
        "Liman Lojistik ve Ticaret Ltd. Şti.",
        "Akdeniz, Mersin",
        "muhasebe@limanlojistik.com",
    ),
    (
        "7132456803",
        "Çınar Eğitim Teknolojileri A.Ş.",
        "Mezitli, Mersin",
        "bilgi@cinaregitim.com",
    ),
    (
        "7132456804",
        "Güney Mimarlık ve Mühendislik Ltd. Şti.",
        "Tarsus, Mersin",
        "proje@guneymimarlik.com",
    ),
    (
        "7132456805",
        "Mavi Kurumsal Çözümler A.Ş.",
        "Seyhan, Adana",
        "iletisim@mavikurumsal.com",
    ),
]

COMPANY_PRODUCTS = [
    (
        "SRV-101",
        "Uygulama Destek Paketi",
        "1800.00",
        "20.00",
    ),
    (
        "SRV-102",
        "Bulut Yedekleme Hizmeti",
        "950.00",
        "20.00",
    ),
    (
        "SRV-103",
        "Personel Teknik Eğitimi",
        "2200.00",
        "20.00",
    ),
    (
        "LIC-101",
        "Kurumsal Uygulama Lisansı",
        "5200.00",
        "20.00",
    ),
    (
        "DON-101",
        "Ofis Ağ Donanımı Paketi",
        "7400.00",
        "20.00",
    ),
    (
        "KIT-101",
        "Eğitim Dokümanı Seti",
        "400.00",
        "10.00",
    ),
]

COMPANY_INVOICES = [
    (
        "STAJ-INV-001",
        "7132456801",
        "2026-08-04",
        [
            ("SRV-101", 2, "20.00", "0.00"),
            ("KIT-101", 5, "10.00", "0.00"),
        ],
    ),
    (
        "STAJ-INV-002",
        "7132456802",
        "2026-08-08",
        [
            ("LIC-101", 1, "20.00", "0.00"),
            ("SRV-102", 2, "20.00", "0.00"),
        ],
    ),
    (
        "STAJ-INV-003",
        "7132456803",
        "2026-08-12",
        [
            ("DON-101", 1, "20.00", "5.00"),
            ("SRV-101", 1, "20.00", "0.00"),
        ],
    ),
    (
        "STAJ-INV-004",
        "7132456804",
        "2026-08-18",
        [
            ("SRV-103", 3, "20.00", "0.00"),
        ],
    ),
    (
        "STAJ-INV-005",
        "7132456805",
        "2026-08-24",
        [
            ("SRV-102", 6, "20.00", "0.00"),
            ("KIT-101", 10, "10.00", "0.00"),
        ],
    ),
]


def seed_record_set(
    db: Session,
    company: models.Company,
    user: models.User,
    customer_specs: list[tuple[str, str, str, str]],
    product_specs: list[tuple[str, str, str, str]],
    invoice_specs: list[
        tuple[
            str,
            str,
            str,
            list[tuple[str, int, str, str]],
        ]
    ],
) -> None:
    customers_by_tax_number: dict[str, models.Customer] = {}

    for tax_number, title, address, email in customer_specs:
        customer = db.query(models.Customer).filter(
            models.Customer.TaxNumber == tax_number,
            models.Customer.CompanyId == company.CompanyId,
        ).first()

        if customer is None:
            customer = models.Customer(
                TaxNumber=tax_number,
                Title=title,
                Address=address,
                EMail=email,
                CompanyId=company.CompanyId,
                UserId=user.UserId,
            )
            db.add(customer)
            db.flush()
        else:
            customer.Title = title
            customer.Address = address
            customer.EMail = email
            customer.UserId = user.UserId

        customers_by_tax_number[tax_number] = customer

    products_by_code: dict[str, models.Product] = {}

    for code, name, unit_price, vat_rate in product_specs:
        product = db.query(models.Product).filter(
            models.Product.ProductCode == code,
            models.Product.CompanyId == company.CompanyId,
        ).first()

        if product is None:
            product = models.Product(
                ProductCode=code,
                ProductName=name,
                UnitPrice=Decimal(unit_price),
                VatRate=Decimal(vat_rate),
                CompanyId=company.CompanyId,
                UserId=user.UserId,
            )
            db.add(product)
            db.flush()
        else:
            product.ProductName = name
            product.UnitPrice = Decimal(unit_price)
            product.VatRate = Decimal(vat_rate)
            product.UserId = user.UserId

        products_by_code[code] = product

    for (
        invoice_number,
        customer_tax_number,
        invoice_date,
        line_specs,
    ) in invoice_specs:
        customer = customers_by_tax_number[
            customer_tax_number
        ]

        invoice = db.query(models.Invoice).filter(
            models.Invoice.InvoiceNumber == invoice_number,
            models.Invoice.CompanyId == company.CompanyId,
        ).first()

        if invoice is None:
            invoice = models.Invoice(
                CustomerId=customer.CustomerId,
                InvoiceNumber=invoice_number,
                InvoiceDate=datetime.fromisoformat(invoice_date),
                Subtotal=Decimal("0.00"),
                VatTotal=Decimal("0.00"),
                ExciseTaxTotal=Decimal("0.00"),
                TotalAmount=Decimal("0.00"),
                CompanyId=company.CompanyId,
                UserId=user.UserId,
            )
            db.add(invoice)
            db.flush()
        else:
            invoice.CustomerId = customer.CustomerId
            invoice.InvoiceDate = datetime.fromisoformat(
                invoice_date
            )
            invoice.UserId = user.UserId

        for (
            product_code,
            quantity,
            vat_rate,
            excise_tax_rate,
        ) in line_specs:
            product = products_by_code[product_code]

            invoice_line = db.query(
                models.InvoiceLine
            ).filter(
                models.InvoiceLine.InvoiceId
                == invoice.InvoiceId,
                models.InvoiceLine.ProductId
                == product.ProductId,
                models.InvoiceLine.CompanyId
                == company.CompanyId,
            ).first()

            if invoice_line is None:
                invoice_line = models.InvoiceLine(
                    InvoiceId=invoice.InvoiceId,
                    ProductId=product.ProductId,
                    ItemName=product.ProductName,
                    Quantity=quantity,
                    Price=product.UnitPrice,
                    VatRate=Decimal(vat_rate),
                    ExciseTaxRate=Decimal(
                        excise_tax_rate
                    ),
                    CompanyId=company.CompanyId,
                    UserId=user.UserId,
                )
                db.add(invoice_line)
            else:
                invoice_line.ItemName = product.ProductName
                invoice_line.Quantity = quantity
                invoice_line.Price = product.UnitPrice
                invoice_line.VatRate = Decimal(vat_rate)
                invoice_line.ExciseTaxRate = Decimal(
                    excise_tax_rate
                )
                invoice_line.UserId = user.UserId

            apply_line_calculation(invoice_line)

        db.flush()

        recalculate_invoice_totals(
            invoice.InvoiceId,
            company.CompanyId,
            db,
        )


def seed_admin_demo_records(
    db: Session,
    company: models.Company,
    user: models.User,
) -> None:
    seed_record_set(
        db,
        company,
        user,
        ADMIN_CUSTOMERS,
        ADMIN_PRODUCTS,
        ADMIN_INVOICES,
    )


def seed_company_demo_records(
    db: Session,
    company: models.Company,
    user: models.User,
) -> None:
    seed_record_set(
        db,
        company,
        user,
        COMPANY_CUSTOMERS,
        COMPANY_PRODUCTS,
        COMPANY_INVOICES,
    )