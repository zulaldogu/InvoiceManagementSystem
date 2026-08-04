from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

import models
import schemas
from database import get_db
from security import get_current_user, require_super_admin


router = APIRouter(
    prefix="/companies",
    tags=["Companies"],
)


@router.post("/", response_model=schemas.CompanyResponse)
def create_company(
    company: schemas.CompanyCreate,
    current_user: Annotated[
        models.User,
        Depends(require_super_admin),
    ],
    db: Session = Depends(get_db),
):
    company_code = company.CompanyCode.strip().upper()

    existing_code = db.query(models.Company).filter(
        models.Company.CompanyCode == company_code
    ).first()

    if existing_code is not None:
        raise HTTPException(
            status_code=400,
            detail="Company code already exists",
        )

    if company.TaxNumber is not None:
        existing_tax_number = db.query(models.Company).filter(
            models.Company.TaxNumber == company.TaxNumber
        ).first()

        if existing_tax_number is not None:
            raise HTTPException(
                status_code=400,
                detail="Tax number already exists",
            )

    new_company = models.Company(
        CompanyCode=company_code,
        CompanyName=company.CompanyName.strip(),
        TaxNumber=company.TaxNumber,
        Address=company.Address,
        EMail=company.EMail,
        IsActive=company.IsActive,
    )

    db.add(new_company)
    db.commit()
    db.refresh(new_company)

    return new_company


@router.get("/", response_model=list[schemas.CompanyResponse])
def get_companies(
    current_user: Annotated[
        models.User,
        Depends(require_super_admin),
    ],
    db: Session = Depends(get_db),
):
    return db.query(models.Company).order_by(
        models.Company.CompanyName
    ).all()


@router.get("/current", response_model=schemas.CompanyResponse)
def get_current_company(
    current_user: Annotated[
        models.User,
        Depends(get_current_user),
    ],
    db: Session = Depends(get_db),
):
    if current_user.CompanyId is None:
        raise HTTPException(
            status_code=404,
            detail="Current user does not have a company",
        )

    company = db.query(models.Company).filter(
        models.Company.CompanyId == current_user.CompanyId
    ).first()

    if company is None:
        raise HTTPException(
            status_code=404,
            detail="Company not found",
        )

    return company


@router.get(
    "/{company_id}",
    response_model=schemas.CompanyResponse,
)
def get_company(
    company_id: int,
    current_user: Annotated[
        models.User,
        Depends(get_current_user),
    ],
    db: Session = Depends(get_db),
):
    if (
        not current_user.IsSuperAdmin
        and current_user.CompanyId != company_id
    ):
        raise HTTPException(
            status_code=403,
            detail="You cannot access another company",
        )

    company = db.query(models.Company).filter(
        models.Company.CompanyId == company_id
    ).first()

    if company is None:
        raise HTTPException(
            status_code=404,
            detail="Company not found",
        )

    return company


@router.put(
    "/{company_id}",
    response_model=schemas.CompanyResponse,
)
def update_company(
    company_id: int,
    updated_company: schemas.CompanyUpdate,
    current_user: Annotated[
        models.User,
        Depends(require_super_admin),
    ],
    db: Session = Depends(get_db),
):
    company = db.query(models.Company).filter(
        models.Company.CompanyId == company_id
    ).first()

    if company is None:
        raise HTTPException(
            status_code=404,
            detail="Company not found",
        )

    update_data = updated_company.model_dump(exclude_unset=True)

    if "CompanyCode" in update_data:
        company_code = update_data["CompanyCode"].strip().upper()

        existing_code = db.query(models.Company).filter(
            models.Company.CompanyCode == company_code,
            models.Company.CompanyId != company_id,
        ).first()

        if existing_code is not None:
            raise HTTPException(
                status_code=400,
                detail="Company code already exists",
            )

        update_data["CompanyCode"] = company_code

    if "CompanyName" in update_data:
        update_data["CompanyName"] = update_data[
            "CompanyName"
        ].strip()

    if (
        "TaxNumber" in update_data
        and update_data["TaxNumber"] is not None
    ):
        existing_tax_number = db.query(models.Company).filter(
            models.Company.TaxNumber == update_data["TaxNumber"],
            models.Company.CompanyId != company_id,
        ).first()

        if existing_tax_number is not None:
            raise HTTPException(
                status_code=400,
                detail="Tax number already exists",
            )

    for field_name, value in update_data.items():
        setattr(company, field_name, value)

    db.commit()
    db.refresh(company)

    return company


@router.delete("/{company_id}")
def deactivate_company(
    company_id: int,
    current_user: Annotated[
        models.User,
        Depends(require_super_admin),
    ],
    db: Session = Depends(get_db),
):
    company = db.query(models.Company).filter(
        models.Company.CompanyId == company_id
    ).first()

    if company is None:
        raise HTTPException(
            status_code=404,
            detail="Company not found",
        )

    if not company.IsActive:
        raise HTTPException(
            status_code=400,
            detail="Company is already inactive",
        )

    company.IsActive = False
    db.commit()

    return {"message": "Company deactivated successfully"}