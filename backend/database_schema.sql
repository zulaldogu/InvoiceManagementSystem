-- Kullanıcılar Tablosu
CREATE TABLE Users (
    UserId INTEGER PRIMARY KEY AUTOINCREMENT
    UserName VARCHAR(50) NOT NULL,
    Password VARCHAR(255) NOT NULL,
    RecordDate DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Müşteriler Tablosu
CREATE TABLE Customer (
    CustomerId INTEGER PRIMARY KEY AUTOINCREMENT
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
    InvoiceId INTEGER PRIMARY KEY AUTOINCREMENT
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
    InvoiceLineId INTEGER PRIMARY KEY AUTOINCREMENT,
    InvoiceId INT,
    ProductId INT,
    ItemName VARCHAR(100),
    Quantity INT NOT NULL,
    Price DECIMAL(18, 2) NOT NULL,
    UserId INT,
    RecordDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (InvoiceId) REFERENCES Invoice(InvoiceId),
    FOREIGN KEY (ProductId) REFERENCES Product(ProductId),
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- Ürünler Tablosu
CREATE TABLE Product (
    ProductId INTEGER PRIMARY KEY AUTOINCREMENT,
    ProductCode VARCHAR(50),
    ProductName VARCHAR(100) NOT NULL,
    UnitPrice DECIMAL(18, 2) NOT NULL,
    VatRate DECIMAL(5, 2),
    UserId INT,
    RecordDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- Profil Tablosu
CREATE TABLE Profile (
    ProfileId INTEGER PRIMARY KEY AUTOINCREMENT,
    ProfileName VARCHAR(100) NOT NULL,
    Description VARCHAR(255),
    UserId INT,
    RecordDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- Rol / Yetki Tablosu
CREATE TABLE Role (
    RoleId INTEGER PRIMARY KEY AUTOINCREMENT,
    RoleName VARCHAR(100) NOT NULL,
    Description VARCHAR(255),
    UserId INT,
    RecordDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- Profil - Rol İlişki Tablosu
CREATE TABLE ProfileRole (
    ProfileRoleId INTEGER PRIMARY KEY AUTOINCREMENT,
    ProfileId INT NOT NULL,
    RoleId INT NOT NULL,
    UserId INT,
    RecordDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (ProfileId) REFERENCES Profile(ProfileId),
    FOREIGN KEY (RoleId) REFERENCES Role(RoleId),
    FOREIGN KEY (UserId) REFERENCES Users(UserId)
);

-- Kullanıcı - Profil İlişki Tablosu
CREATE TABLE UserProfile (
    UserProfileId INTEGER PRIMARY KEY AUTOINCREMENT,
    UserId INT NOT NULL,
    ProfileId INT NOT NULL,
    RecordDate DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserId) REFERENCES Users(UserId),
    FOREIGN KEY (ProfileId) REFERENCES Profile(ProfileId)
);