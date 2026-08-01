from decimal import Decimal

from database import SessionLocal
import models


def seed_demo_data():
    db = SessionLocal()

    try:
        user = db.query(models.User).filter(
            models.User.UserId == 1
        ).first()

        if user is None:
            user = models.User(
                UserId=1,
                UserName="demo",
                Password="demo123",
            )
            db.add(user)
            db.flush()

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
                models.Role.RoleName == role_name
            ).first()

            if role is None:
                role = models.Role(
                    RoleName=role_name,
                    Description=f"Demo permission: {role_name}",
                    UserId=user.UserId,
                )
                db.add(role)
                db.flush()

            roles.append(role)

        profile = db.query(models.Profile).filter(
            models.Profile.ProfileName == "Demo Administrator"
        ).first()

        if profile is None:
            profile = models.Profile(
                ProfileName="Demo Administrator",
                Description="Docker demo profile",
                UserId=user.UserId,
            )
            db.add(profile)
            db.flush()

        user_profile = db.query(models.UserProfile).filter(
            models.UserProfile.UserId == user.UserId,
            models.UserProfile.ProfileId == profile.ProfileId,
        ).first()

        if user_profile is None:
            db.add(
                models.UserProfile(
                    UserId=user.UserId,
                    ProfileId=profile.ProfileId,
                )
            )

        for role in roles:
            profile_role = db.query(models.ProfileRole).filter(
                models.ProfileRole.ProfileId == profile.ProfileId,
                models.ProfileRole.RoleId == role.RoleId,
            ).first()

            if profile_role is None:
                db.add(
                    models.ProfileRole(
                        ProfileId=profile.ProfileId,
                        RoleId=role.RoleId,
                        UserId=user.UserId,
                    )
                )

        product = db.query(models.Product).filter(
            models.Product.ProductCode == "DEMO-001"
        ).first()

        if product is None:
            product = models.Product(
                ProductCode="DEMO-001",
                ProductName="Danışmanlık Hizmeti",
                UnitPrice=Decimal("500.00"),
                VatRate=Decimal("20.00"),
                UserId=user.UserId,
            )
            db.add(product)
            db.flush()

        customer = db.query(models.Customer).filter(
            models.Customer.TaxNumber == "1234567890"
        ).first()

        if customer is None:
            customer = models.Customer(
                TaxNumber="1234567890",
                Title="Demo Teknoloji Ltd. Şti.",
                Address="Mersin Teknopark",
                EMail="demo@example.com",
                UserId=user.UserId,
            )
            db.add(customer)
            db.flush()

        invoice = db.query(models.Invoice).filter(
            models.Invoice.InvoiceNumber == "DEMO-INV-001"
        ).first()

        if invoice is None:
            invoice = models.Invoice(
                CustomerId=customer.CustomerId,
                InvoiceNumber="DEMO-INV-001",
                TotalAmount=Decimal("0.00"),
                UserId=user.UserId,
            )
            db.add(invoice)
            db.flush()

        invoice_line = db.query(models.InvoiceLine).filter(
            models.InvoiceLine.InvoiceId == invoice.InvoiceId,
            models.InvoiceLine.ProductId == product.ProductId,
        ).first()

        if invoice_line is None:
            invoice_line = models.InvoiceLine(
                InvoiceId=invoice.InvoiceId,
                ProductId=product.ProductId,
                ItemName=product.ProductName,
                Quantity=2,
                Price=product.UnitPrice,
                UserId=user.UserId,
            )
            db.add(invoice_line)
            db.flush()

        invoice_lines = db.query(models.InvoiceLine).filter(
            models.InvoiceLine.InvoiceId == invoice.InvoiceId
        ).all()

        invoice.TotalAmount = sum(
            Decimal(line.Quantity) * Decimal(line.Price)
            for line in invoice_lines
        )

        db.commit()
        print("Demo data is ready.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()