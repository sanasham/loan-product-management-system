-- Create the User-Defined Table Type for bulk operations
CREATE TYPE dbo.LoanProductTableType AS TABLE (
    ProductID NVARCHAR(50) NOT NULL,
    ProductName NVARCHAR(255) NOT NULL,
    LoanStartDate DATE NOT NULL,
    WithdrawnDate DATE NULL,
    Pricing DECIMAL(5,2) NOT NULL,
    PRIMARY KEY (ProductID)
);
GO



CREATE TABLE dbo.Users (
    UserID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    Username NVARCHAR(100) NOT NULL UNIQUE,
    Email NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(255) NOT NULL,
    IsActive BIT NOT NULL DEFAULT 1,
    CreatedDate DATETIME2(3) NOT NULL DEFAULT SYSDATETIME()
);


CREATE TABLE dbo.LoanProductHistory (
    HistoryID BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    ProductID NVARCHAR(50) NOT NULL,
    ProductName NVARCHAR(255) NOT NULL,
    
    -- Changed fields
    OldPricing DECIMAL(5,2) NULL,  -- NULL for INSERT operations
    NewPricing DECIMAL(5,2) NOT NULL,
    OldWithdrawnDate DATE NULL,
    NewWithdrawnDate DATE NULL,
    
    -- Change tracking
    ChangeType NVARCHAR(10) NOT NULL CHECK (ChangeType IN ('INSERT', 'UPDATE')),
    ChangeDate DATETIME2(3) NOT NULL DEFAULT SYSDATETIME(),
    ChangedBy NVARCHAR(100) NOT NULL,
    
    -- Indexes
    INDEX IX_LoanProductHistory_ProductID_ChangeDate NONCLUSTERED (ProductID, ChangeDate DESC),
    INDEX IX_LoanProductHistory_ChangeDate NONCLUSTERED (ChangeDate)
);

CREATE TABLE dbo.LoanProducts (
    ProductID NVARCHAR(50) NOT NULL PRIMARY KEY,
    ProductName NVARCHAR(255) NOT NULL,
    LoanStartDate DATE NOT NULL,
    WithdrawnDate DATE NULL,  -- NULL = active, NOT NULL = inactive
    Pricing DECIMAL(5,2) NOT NULL,  -- Interest rate (e.g., 5.25 for 5.25%)
    IsActive AS (CASE WHEN WithdrawnDate IS NULL OR WithdrawnDate > GETDATE() THEN 1 ELSE 0 END) PERSISTED,
    
    -- Audit columns
    CreatedDate DATETIME2(3) NOT NULL DEFAULT SYSDATETIME(),
    CreatedBy NVARCHAR(100) NOT NULL,
    UpdatedDate DATETIME2(3) NULL,
    UpdatedBy NVARCHAR(100) NULL,
    
    -- Indexes
    INDEX IX_LoanProducts_IsActive NONCLUSTERED (IsActive) INCLUDE (ProductName, Pricing),
    INDEX IX_LoanProducts_ProductName NONCLUSTERED (ProductName)
);