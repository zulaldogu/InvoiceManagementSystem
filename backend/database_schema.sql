-- Kullanıcılar Tablosu
CREATE TABLE Users (
    UserId INT PRIMARY KEY,
    UserName VARCHAR(50) NOT NULL,
    Password VARCHAR(255) NOT NULL,
    RecordDate DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Müşteriler Tablosu
CREATE TABLE Customer (
    CustomerId INT PRIMARY KEY,
    TaxNumber VARCHAR(20),
    Title VARCHAR(100) NOT NULL,
    Address TEXT,
    EMail VARCHAR(100),
    UserId INT,
    RecordDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- Fatura Üst Bilgisi Tablosu
CREATE TABLE Invoice (
    InvoiceId INT PRIMARY KEY,
    CustomerId INT,
    InvoiceNumber VARCHAR(20) NOT NULL,
    InvoiceDate DATETIME,
    TotalAmount DECIMAL(18, 2),
    UserId INT,
    RecordDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (CustomerId) REFERENCES Customer(CustomerId),
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- Fatura Kalemleri (Detay) Tablosu
CREATE TABLE InvoiceLine (
    InvoiceLineId INT PRIMARY KEY,
    InvoiceId INT,
    ItemName VARCHAR(100) NOT NULL,
    Quantity INT NOT NULL,
    Price DECIMAL(18, 2) NOT NULL,
    UserId INT,
    RecordDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (InvoiceId) REFERENCES Invoice(InvoiceId),
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);