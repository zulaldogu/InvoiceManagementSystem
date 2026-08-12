import os

from sqlalchemy.orm import Session

import models
from security import hash_password, verify_password


COMPANY_ROLE_NAMES = (
    "VIEW_CUSTOMERS",
    "MANAGE_CUSTOMERS",
    "MANAGE_PRODUCTS",
    "VIEW_INVOICES",
    "MANAGE_INVOICES",
)

VIEWER_ROLE_NAMES = (
    "VIEW_CUSTOMERS",
    "VIEW_INVOICES",
)


def get_required_password(variable_name: str) -> str:
    password = os.getenv(variable_name)

    if password is None or len(password) < 8:
        raise RuntimeError(
            f"{variable_name} must contain at least 8 characters."
        )

    return password


def ensure_user(
    db: Session,
    username: str,
    password: str,
    company_id: int,
) -> models.User:
    user = (
        db.query(models.User)
        .filter(models.User.UserName == username)
        .first()
    )

    if user is None:
        user = models.User(
            UserName=username,
            Password=hash_password(password),
            CompanyId=company_id,
            IsSuperAdmin=False,
            IsActive=True,
        )
        db.add(user)
        db.flush()
    else:
        user.CompanyId = company_id
        user.IsSuperAdmin = False
        user.IsActive = True

        if not verify_password(password, user.Password):
            user.Password = hash_password(password)

    return user


def ensure_profile(
    db: Session,
    profile_name: str,
    description: str,
    company_id: int,
    creator_user_id: int,
) -> models.Profile:
    profile = (
        db.query(models.Profile)
        .filter(
            models.Profile.ProfileName == profile_name,
            models.Profile.CompanyId == company_id,
        )
        .first()
    )

    if profile is None:
        profile = models.Profile(
            ProfileName=profile_name,
            Description=description,
            CompanyId=company_id,
            UserId=creator_user_id,
        )
        db.add(profile)
        db.flush()
    else:
        profile.Description = description
        profile.UserId = creator_user_id

    return profile


def ensure_user_profile(
    db: Session,
    user: models.User,
    profile: models.Profile,
    company_id: int,
) -> None:
    assignment = (
        db.query(models.UserProfile)
        .filter(
            models.UserProfile.UserId == user.UserId,
            models.UserProfile.ProfileId == profile.ProfileId,
            models.UserProfile.CompanyId == company_id,
        )
        .first()
    )

    if assignment is None:
        db.add(
            models.UserProfile(
                UserId=user.UserId,
                ProfileId=profile.ProfileId,
                CompanyId=company_id,
            )
        )


def ensure_profile_roles(
    db: Session,
    profile: models.Profile,
    roles: list[models.Role],
    company_id: int,
    creator_user_id: int,
) -> None:
    for role in roles:
        assignment = (
            db.query(models.ProfileRole)
            .filter(
                models.ProfileRole.ProfileId == profile.ProfileId,
                models.ProfileRole.RoleId == role.RoleId,
                models.ProfileRole.CompanyId == company_id,
            )
            .first()
        )

        if assignment is None:
            db.add(
                models.ProfileRole(
                    ProfileId=profile.ProfileId,
                    RoleId=role.RoleId,
                    CompanyId=company_id,
                    UserId=creator_user_id,
                )
            )


def seed_company_demo_accounts(
    db: Session,
    creator_user_id: int,
) -> None:
    manager_username = os.getenv(
        "DEMO_COMPANY_MANAGER_USERNAME",
        "companymanager",
    )
    manager_password = get_required_password(
        "DEMO_COMPANY_MANAGER_PASSWORD"
    )
    viewer_username = os.getenv(
        "DEMO_COMPANY_VIEWER_USERNAME",
        "companyviewer",
    )
    viewer_password = get_required_password(
        "DEMO_COMPANY_VIEWER_PASSWORD"
    )

    company = (
        db.query(models.Company)
        .filter(models.Company.CompanyCode == "STAJ-TEST")
        .first()
    )

    if company is None:
        company = models.Company(
            CompanyCode="STAJ-TEST",
            CompanyName="Staj Test Teknoloji A.Ş.",
            TaxNumber="1122334455",
            Address="Mersin Teknopark",
            EMail="test@stajfirma.com",
            IsActive=True,
        )
        db.add(company)
        db.flush()
    else:
        company.IsActive = True

    roles_by_name: dict[str, models.Role] = {}

    for role_name in COMPANY_ROLE_NAMES:
        role = (
            db.query(models.Role)
            .filter(
                models.Role.RoleName == role_name,
                models.Role.CompanyId == company.CompanyId,
            )
            .first()
        )

        if role is None:
            role = models.Role(
                RoleName=role_name,
                Description=f"Application permission for {role_name}",
                CompanyId=company.CompanyId,
                UserId=creator_user_id,
            )
            db.add(role)
            db.flush()
        else:
            role.UserId = creator_user_id

        roles_by_name[role_name] = role

    manager_profile = ensure_profile(
        db,
        "COMPANY_MANAGER",
        "Company management application permissions",
        company.CompanyId,
        creator_user_id,
    )
    viewer_profile = ensure_profile(
        db,
        "COMPANY_VIEWER",
        "Customer and invoice read-only access",
        company.CompanyId,
        creator_user_id,
    )

    manager_user = ensure_user(
        db,
        manager_username,
        manager_password,
        company.CompanyId,
    )
    viewer_user = ensure_user(
        db,
        viewer_username,
        viewer_password,
        company.CompanyId,
    )

    ensure_user_profile(
        db,
        manager_user,
        manager_profile,
        company.CompanyId,
    )
    ensure_user_profile(
        db,
        viewer_user,
        viewer_profile,
        company.CompanyId,
    )

    ensure_profile_roles(
        db,
        manager_profile,
        list(roles_by_name.values()),
        company.CompanyId,
        creator_user_id,
    )
    ensure_profile_roles(
        db,
        viewer_profile,
        [
            roles_by_name[role_name]
            for role_name in VIEWER_ROLE_NAMES
        ],
        company.CompanyId,
        creator_user_id,
    )