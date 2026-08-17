import os

import models
from database import SessionLocal
from demo_records import seed_admin_demo_records
from demo_accounts import seed_company_demo_accounts
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
        seed_company_demo_accounts(
            db,
            user.UserId,
        )

        seed_admin_demo_records(
            db,
            company,
            user,
        )

        db.commit()
        print("Secure Docker demo data is ready.")

    except Exception:
        db.rollback()
        raise

    finally:
        db.close()