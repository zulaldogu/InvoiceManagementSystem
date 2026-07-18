from datetime import datetime
from decimal import Decimal
from typing import Optional, List

from pydantic import BaseModel, ConfigDict, Field


class UserBase(BaseModel):
    UserName: str


class UserCreate(UserBase):
    Password: str


class UserResponse(UserBase):
    UserId: int
    RecordDate: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class LoginRequest(BaseModel):
    UserName: str
    Password: str


class CustomerBase(BaseModel):
    TaxNumber: Optional[str] = None
    Title: str
    Address: Optional[str] = None
    EMail: Optional[str] = None
    UserId: Optional[int] = None


class CustomerCreate(CustomerBase):
    pass


class CustomerUpdate(BaseModel):
    TaxNumber: Optional[str] = None
    Title: Optional[str] = None
    Address: Optional[str] = None
    EMail: Optional[str] = None
    UserId: Optional[int] = None


class CustomerResponse(CustomerBase):
    CustomerId: int
    RecordDate: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ProductBase(BaseModel):
    ProductCode: Optional[str] = None
    ProductName: str
    UnitPrice: Decimal
    VatRate: Optional[Decimal] = None
    UserId: Optional[int] = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(BaseModel):
    ProductCode: Optional[str] = None
    ProductName: Optional[str] = None
    UnitPrice: Optional[Decimal] = None
    VatRate: Optional[Decimal] = None
    UserId: Optional[int] = None


class ProductResponse(ProductBase):
    ProductId: int
    RecordDate: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class RoleBase(BaseModel):
    RoleName: str
    Description: Optional[str] = None
    UserId: Optional[int] = None


class RoleCreate(RoleBase):
    pass


class RoleUpdate(BaseModel):
    RoleName: Optional[str] = None
    Description: Optional[str] = None
    UserId: Optional[int] = None


class RoleResponse(RoleBase):
    RoleId: int
    RecordDate: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ProfileBase(BaseModel):
    ProfileName: str
    Description: Optional[str] = None
    UserId: Optional[int] = None


class ProfileCreate(ProfileBase):
    pass


class ProfileUpdate(BaseModel):
    ProfileName: Optional[str] = None
    Description: Optional[str] = None
    UserId: Optional[int] = None


class ProfileResponse(ProfileBase):
    ProfileId: int
    RecordDate: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class ProfileRoleBase(BaseModel):
    ProfileId: int
    RoleId: int
    UserId: Optional[int] = None


class ProfileRoleCreate(ProfileRoleBase):
    pass


class ProfileRoleResponse(ProfileRoleBase):
    ProfileRoleId: int
    RecordDate: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class UserProfileBase(BaseModel):
    UserId: int
    ProfileId: int


class UserProfileCreate(UserProfileBase):
    pass


class UserProfileResponse(UserProfileBase):
    UserProfileId: int
    RecordDate: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class InvoiceLineBase(BaseModel):
    InvoiceId: int
    ProductId: int
    ItemName: Optional[str] = None
    Quantity: int
    Price: Decimal
    UserId: Optional[int] = None


class InvoiceLineCreate(InvoiceLineBase):
    pass


class InvoiceLineUpdate(BaseModel):
    ProductId: Optional[int] = None
    ItemName: Optional[str] = None
    Quantity: Optional[int] = None
    Price: Optional[Decimal] = None
    UserId: Optional[int] = None


class InvoiceLineResponse(InvoiceLineBase):
    InvoiceLineId: int
    InvoiceId: Optional[int] = None
    RecordDate: Optional[datetime] = None

    model_config = ConfigDict(from_attributes=True)


class InvoiceBase(BaseModel):
    CustomerId: Optional[int] = None
    InvoiceNumber: str
    InvoiceDate: Optional[datetime] = None
    TotalAmount: Optional[Decimal] = None
    UserId: Optional[int] = None


class InvoiceCreate(InvoiceBase):
    Lines: List[InvoiceLineCreate] = Field(default_factory=list)


class InvoiceUpdate(BaseModel):
    CustomerId: Optional[int] = None
    InvoiceNumber: Optional[str] = None
    InvoiceDate: Optional[datetime] = None
    TotalAmount: Optional[Decimal] = None
    UserId: Optional[int] = None
    Lines: Optional[List[InvoiceLineCreate]] = None


class InvoiceDelete(BaseModel):
    InvoiceId: int


class InvoiceResponse(InvoiceBase):
    InvoiceId: int
    RecordDate: Optional[datetime] = None
    Lines: List[InvoiceLineResponse] = Field(default_factory=list)

    model_config = ConfigDict(from_attributes=True)


class InvoiceListRequest(BaseModel):
    StartDate: datetime
    EndDate: datetime