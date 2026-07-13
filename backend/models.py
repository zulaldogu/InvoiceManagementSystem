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
    ItemName = Column(String(100), nullable=False)
    Quantity = Column(Integer, nullable=False)
    Price = Column(Numeric(18, 2), nullable=False)
    UserId = Column(Integer, ForeignKey("Users.UserId"))
    RecordDate = Column(DateTime, server_default=func.now())