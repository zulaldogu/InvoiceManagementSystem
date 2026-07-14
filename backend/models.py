from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Numeric, Text
from sqlalchemy.sql import func

from database import Base

class User(Base):
    __tablename__ = "Users"

    UserId = Column(Integer, primary_key=True, index=True)
    UserName = Column(String(50), nullable=False)
    Password = Column(String(255), nullable=False)
    RecordDate = Column(DateTime, server_default=func.now())


class Customer(Base):
    __tablename__ = "Customer"

    CustomerId = Column(Integer, primary_key=True, index=True)
    TaxNumber = Column(String(20))
    Title = Column(String(100), nullable=False)
    Address = Column(Text)
    EMail = Column(String(100))
    UserId = Column(Integer, ForeignKey("Users.UserId"))
    RecordDate = Column(DateTime, server_default=func.now())

class Product(Base):
    __tablename__ = "Product"

    ProductId = Column(Integer, primary_key=True, index=True)
    ProductCode = Column(String(50))
    ProductName = Column(String(100), nullable=False)
    UnitPrice = Column(Numeric(18, 2), nullable=False)
    VatRate = Column(Numeric(5, 2))
    UserId = Column(Integer, ForeignKey("Users.UserId"))
    RecordDate = Column(DateTime, server_default=func.now())


class Invoice(Base):
    __tablename__ = "Invoice"

    InvoiceId = Column(Integer, primary_key=True, index=True)
    CustomerId = Column(Integer, ForeignKey("Customer.CustomerId"))
    InvoiceNumber = Column(String(20), nullable=False)
    InvoiceDate = Column(DateTime)
    TotalAmount = Column(Numeric(18, 2))
    UserId = Column(Integer, ForeignKey("Users.UserId"))
    RecordDate = Column(DateTime, server_default=func.now())


class InvoiceLine(Base):
    __tablename__ = "InvoiceLine"

    InvoiceLineId = Column(Integer, primary_key=True, index=True)
    InvoiceId = Column(Integer, ForeignKey("Invoice.InvoiceId"))
    ProductId = Column(Integer, ForeignKey("Product.ProductId"))
    ItemName = Column(String(100))
    Quantity = Column(Integer, nullable=False)
    Price = Column(Numeric(18, 2), nullable=False)
    UserId = Column(Integer, ForeignKey("Users.UserId"))
    RecordDate = Column(DateTime, server_default=func.now())

class Profile(Base):
    __tablename__ = "Profile"

    ProfileId = Column(Integer, primary_key=True, index=True)
    ProfileName = Column(String(100), nullable=False)
    Description = Column(String(255))
    UserId = Column(Integer, ForeignKey("Users.UserId"))
    RecordDate = Column(DateTime, server_default=func.now())


class Role(Base):
    __tablename__ = "Role"

    RoleId = Column(Integer, primary_key=True, index=True)
    RoleName = Column(String(100), nullable=False)
    Description = Column(String(255))
    UserId = Column(Integer, ForeignKey("Users.UserId"))
    RecordDate = Column(DateTime, server_default=func.now())


class ProfileRole(Base):
    __tablename__ = "ProfileRole"

    ProfileRoleId = Column(Integer, primary_key=True, index=True)
    ProfileId = Column(Integer, ForeignKey("Profile.ProfileId"), nullable=False)
    RoleId = Column(Integer, ForeignKey("Role.RoleId"), nullable=False)
    UserId = Column(Integer, ForeignKey("Users.UserId"))
    RecordDate = Column(DateTime, server_default=func.now())


class UserProfile(Base):
    __tablename__ = "UserProfile"

    UserProfileId = Column(Integer, primary_key=True, index=True)
    UserId = Column(Integer, ForeignKey("Users.UserId"), nullable=False)
    ProfileId = Column(Integer, ForeignKey("Profile.ProfileId"), nullable=False)
    RecordDate = Column(DateTime, server_default=func.now())