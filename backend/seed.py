import os
from decimal import Decimal

import models
from database import SessionLocal
from security import hash_password, verify_password


def seed_demo_data():
    db = SessionLocal()

    demo_username = os.getenv(
        "DEMO_ADMIN_USERNAME",
        "admin",
    )
    demo_password = os.getenv("DEMO_ADMIN_PASSWORD")

    if demo_password is None or len(demo_password) < 8:
        raise RuntimeError(
            "DEMO_ADMIN_PASSWORD must contain at least 8 characters."
        )

    try:
        company = db.query(models.Company).filter(
            models.Company.CompanyCode == "DEMO"
        ).first()

        if company is None:
            company = models.Company(
                CompanyCode="DEMO",
                CompanyName="Demo Teknoloji A.Ş.",
                TaxNumber="9876543210",
                Address="Mersin Teknopark",
                EMail="info@demoteknoloji.com",
                IsActive=True,
            )
            db.add(company)
            db.flush()
        else:
            company.IsActive = True

        user = db.query(models.User).filter(
            models.User.UserName == demo_username
        ).first()

        if user is None:
            user = models.User(
                UserName=demo_username,
                Password=hash_password(demo_password),
                CompanyId=company.CompanyId,
                IsSuperAdmin=True,
                IsActive=True,
            )
            db.add(user)
            db.flush()
        else:
            user.CompanyId = company.CompanyId
            user.IsSuperAdmin = True
            user.IsActive = True

            if not verify_password(
                demo_password,
                user.Password,
            ):
                user.Password = hash_password(demo_password)

        role_names = [
            "VIEW_CUSTOMERS",
            "MANAGE_CUSTOMERS",
            "MANAGE_PRODUCTS",
            "VIEW_INVOICES",
            "MANAGE_INVOICES",
        ]

        roles = []

        for role_name in role_names:
            role = db.query(models.Role).filter(
                models.Role.RoleName == role_name,
                models.Role.CompanyId == company.CompanyId,
            ).first()

            if role is None:
                role = models.Role(
                    RoleName=role_name,
                    Description=f"Demo permission: {role_name}",
                    CompanyId=company.CompanyId,
                    UserId=user.UserId,
                )
                db.add(role)
                db.flush()
            else:
                role.UserId = user.UserId

            roles.append(role)

        profile = db.query(models.Profile).filter(
            models.Profile.ProfileName == "Demo Administrator",
            models.Profile.CompanyId == company.CompanyId,
        ).first()

        if profile is None:
            profile = models.Profile(
                ProfileName="Demo Administrator",
                Description="Docker demo administrator profile",
                CompanyId=company.CompanyId,
                UserId=user.UserId,
            )
            db.add(profile)
            db.flush()
        else:
            profile.UserId = user.UserId

        user_profile = db.query(models.UserProfile).filter(
            models.UserProfile.UserId == user.UserId,
            models.UserProfile.ProfileId == profile.ProfileId,
            models.UserProfile.CompanyId == company.CompanyId,
        ).first()

        if user_profile is None:
            db.add(
                models.UserProfile(
                    UserId=user.UserId,
                    ProfileId=profile.ProfileId,
                    CompanyId=company.CompanyId,
                )
            )

        for role in roles:
            profile_role = db.query(models.ProfileRole).filter(
                models.ProfileRole.ProfileId == profile.ProfileId,
                models.ProfileRole.RoleId == role.RoleId,
                models.ProfileRole.CompanyId == company.CompanyId,
            ).first()

            if profile_role is None:
                db.add(
                    models.ProfileRole(
                        ProfileId=profile.ProfileId,
                        RoleId=role.RoleId,
                        CompanyId=company.CompanyId,
                        UserId=user.UserId,
                    )
                )

        product = db.query(models.Product).filter(
            models.Product.ProductCode == "DEMO-001",
            models.Product.CompanyId == company.CompanyId,
        ).first()

        if product is None:
            product = models.Product(
                ProductCode="DEMO-001",
                ProductName="Danışmanlık Hizmeti",
                UnitPrice=Decimal("500.00"),
                VatRate=Decimal("20.00"),
                CompanyId=company.CompanyId,
                UserId=user.UserId,
            )
            db.add(product)
            db.flush()
        else:
            product.UserId = user.UserId

        customer = db.query(models.Customer).filter(
            models.Customer.TaxNumber == "1234567890",
            models.Customer.CompanyId == company.CompanyId,
        ).first()

        if customer is None:
            customer = models.Customer(
                TaxNumber="1234567890",
                Title="Demo Teknoloji Ltd. Şti.",
                Address="Mersin Teknopark",
                EMail="demo@example.com",
                CompanyId=company.CompanyId,
                UserId=user.UserId,
            )
            db.add(customer)
            db.flush()
        else:
            customer.UserId = user.UserId

        invoice = db.query(models.Invoice).filter(
            models.Invoice.InvoiceNumber == "DEMO-INV-001",
            models.Invoice.CompanyId == company.CompanyId,
        ).first()

        if invoice is None:
            invoice = models.Invoice(
                CustomerId=customer.CustomerId,
                InvoiceNumber="DEMO-INV-001",
                TotalAmount=Decimal("0.00"),
                CompanyId=company.CompanyId,
                UserId=user.UserId,
            )
            db.add(invoice)
            db.flush()
        else:
            invoice.CustomerId = customer.CustomerId
            invoice.UserId = user.UserId

        invoice_line = db.query(models.InvoiceLine).filter(
            models.InvoiceLine.InvoiceId == invoice.InvoiceId,
            models.InvoiceLine.ProductId == product.ProductId,
            models.InvoiceLine.CompanyId == company.CompanyId,
        ).first()

        if invoice_line is None:
            invoice_line = models.InvoiceLine(
                InvoiceId=invoice.InvoiceId,
                ProductId=product.ProductId,
                ItemName=product.ProductName,
                Quantity=2,
                Price=product.UnitPrice,
                CompanyId=company.CompanyId,
                UserId=user.UserId,
            )
            db.add(invoice_line)
            db.flush()
        else:
            invoice_line.UserId = user.UserId

        invoice_lines = db.query(models.InvoiceLine).filter(
            models.InvoiceLine.InvoiceId == invoice.InvoiceId,
            models.InvoiceLine.CompanyId == company.CompanyId,
        ).all()

        invoice.TotalAmount = sum(
            (
                Decimal(line.Quantity) * Decimal(line.Price)
                for line in invoice_lines
            ),
            Decimal("0.00"),
        )

        db.commit()
        print("Secure Docker demo data is ready.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()