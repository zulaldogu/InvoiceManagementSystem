from datetime import datetime
from decimal import Decimal
from typing import Optional, List

from pydantic import BaseModel, ConfigDict, Field


class UserBase(BaseModel):
    UserName: str


class UserCreate(UserBase):
    Password: str = Field(min_length=8)
    CompanyId: Optional[int] = None
    IsSuperAdmin: bool = False
    IsActive: bool = True


class UserUpdate(BaseModel):
    UserName: Optional[str] = None
    Password: Optional[str] = Field(default=None, min_length=8)
    IsActive: Optional[bool] = None


class UserResponse(UserBase):
    UserId: int
    CompanyId: Optional[int] = None
    IsSuperAdmin: bool = False
    IsActive: bool = True
    RecordDate: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    UserName: str
    Password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str


class TokenPayload(BaseModel):
    user_id: int
    company_id: Optional[int] = None
    is_super_admin: bool = False


class CompanyBase(BaseModel):
    CompanyCode: str
    CompanyName: str
    TaxNumber: Optional[str] = None
    Address: Optional[str] = None
    EMail: Optional[str] = None
    IsActive: bool = True


class CompanyCreate(CompanyBase):
    pass


class CompanyUpdate(BaseModel):
    CompanyCode: Optional[str] = None
    CompanyName: Optional[str] = None
    TaxNumber: Optional[str] = None
    Address: Optional[str] = None
    EMail: Optional[str] = None
    IsActive: Optional[bool] = None


class CompanyResponse(CompanyBase):
    CompanyId: int
    RecordDate: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CustomerBase(BaseModel):
    TaxNumber: Optional[str] = None
    Title: str
    Address: Optional[str] = None
    EMail: Optional[str] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    TaxNumber: Optional[str] = None
    Title: Optional[str] = None
    Address: Optional[str] = None
    EMail: Optional[str] = None


class CustomerResponse(CustomerBase):
    CustomerId: int
    CompanyId: Optional[int] = None
    UserId: Optional[int] = None
    RecordDate: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ProductBase(BaseModel):
    ProductCode: Optional[str] = None
    ProductName: str
    UnitPrice: Decimal = Field(ge=0)
    VatRate: Optional[Decimal] = Field(
        default=None,
        ge=0,
        le=100,
    )


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    ProductCode: Optional[str] = None
    ProductName: Optional[str] = None
    UnitPrice: Optional[Decimal] = Field(default=None, ge=0)
    VatRate: Optional[Decimal] = Field(
        default=None,
        ge=0,
        le=100,
    )


class ProductResponse(ProductBase):
    ProductId: int
    CompanyId: Optional[int] = None
    UserId: Optional[int] = None
    RecordDate: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class RoleBase(BaseModel):
    RoleName: str = Field(min_length=1, max_length=100)
    Description: Optional[str] = Field(
        default=None,
        max_length=255,
    )


class RoleCreate(RoleBase):
    CompanyId: int = Field(gt=0)


class RoleUpdate(BaseModel):
    RoleName: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    Description: Optional[str] = Field(
        default=None,
        max_length=255,
    )


class RoleResponse(RoleBase):
    RoleId: int
    CompanyId: int
    UserId: Optional[int] = None
    RecordDate: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ProfileBase(BaseModel):
    ProfileName: str = Field(min_length=1, max_length=100)
    Description: Optional[str] = Field(
        default=None,
        max_length=255,
    )


class ProfileCreate(ProfileBase):
    CompanyId: int = Field(gt=0)


class ProfileUpdate(BaseModel):
    ProfileName: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=100,
    )
    Description: Optional[str] = Field(
        default=None,
        max_length=255,
    )


class ProfileResponse(ProfileBase):
    ProfileId: int
    CompanyId: int
    UserId: Optional[int] = None
    RecordDate: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ProfileRoleCreate(BaseModel):
    ProfileId: int = Field(gt=0)
    RoleId: int = Field(gt=0)


class ProfileRoleResponse(ProfileRoleCreate):
    ProfileRoleId: int
    CompanyId: int
    UserId: Optional[int] = None
    RecordDate: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserProfileCreate(BaseModel):
    UserId: int = Field(gt=0)
    ProfileId: int = Field(gt=0)


class UserProfileResponse(UserProfileCreate):
    UserProfileId: int
    CompanyId: int
    RecordDate: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class CurrentAuthorizationResponse(BaseModel):
    UserId: int
    CompanyId: Optional[int] = None
    IsSuperAdmin: bool
    Profiles: List[str] = Field(default_factory=list)
    Roles: List[str] = Field(default_factory=list)


class InvoiceLineCreate(BaseModel):
    ProductId: int
    Quantity: int = Field(gt=0)
    Price: Optional[Decimal] = Field(default=None, ge=0)
    VatRate: Optional[Decimal] = Field(
        default=None,
        ge=0,
        le=100,
    )
    ExciseTaxRate: Decimal = Field(
        default=Decimal("0.00"),
        ge=0,
        le=100,
    )


class InvoiceLineCreateRequest(InvoiceLineCreate):
    InvoiceId: int


class InvoiceLineUpdate(BaseModel):
    ProductId: Optional[int] = None
    Quantity: Optional[int] = Field(default=None, gt=0)
    Price: Optional[Decimal] = Field(default=None, ge=0)
    VatRate: Optional[Decimal] = Field(
        default=None,
        ge=0,
        le=100,
    )
    ExciseTaxRate: Optional[Decimal] = Field(
        default=None,
        ge=0,
        le=100,
    )


class InvoiceLineResponse(BaseModel):
    InvoiceLineId: int
    InvoiceId: int
    ProductId: int
    ItemName: Optional[str] = None
    Quantity: int
    Price: Decimal
    VatRate: Decimal
    ExciseTaxRate: Decimal
    Subtotal: Decimal
    VatAmount: Decimal
    ExciseTaxAmount: Decimal
    LineTotal: Decimal
    CompanyId: Optional[int] = None
    UserId: Optional[int] = None
    RecordDate: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class InvoiceBase(BaseModel):
    CustomerId: int
    InvoiceNumber: str = Field(min_length=1, max_length=20)
    InvoiceDate: Optional[datetime] = None


class InvoiceCreate(InvoiceBase):
    Lines: List[InvoiceLineCreate] = Field(default_factory=list)


class InvoiceUpdate(BaseModel):
    CustomerId: Optional[int] = None
    InvoiceNumber: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=20,
    )
    InvoiceDate: Optional[datetime] = None


class InvoiceResponse(InvoiceBase):
    InvoiceId: int
    Subtotal: Decimal
    VatTotal: Decimal
    ExciseTaxTotal: Decimal
    TotalAmount: Decimal
    CompanyId: Optional[int] = None
    UserId: Optional[int] = None
    RecordDate: Optional[datetime] = None
    Lines: List[InvoiceLineResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class InvoiceListRequest(BaseModel):
    StartDate: datetime
    EndDate: datetime


class InvoiceDetailResponse(InvoiceResponse):
    pass