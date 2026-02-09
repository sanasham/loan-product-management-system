-- =============================================
-- Loan Product Management System
-- Database Setup Script
-- =============================================

USE master;
GO

-- Create database if not exists
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'LoanProductDB')
BEGIN
    CREATE DATABASE LoanProductDB;
END;
GO

USE LoanProductDB;
GO

-- =============================================
-- STEP 1: Create Tables
-- =============================================

-- Users table
IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        UserID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Username NVARCHAR(100) NOT NULL UNIQUE,
        Email NVARCHAR(255) NOT NULL,
        FullName NVARCHAR(255) NOT NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedDate DATETIME2(3) NOT NULL DEFAULT SYSDATETIME()
    );
END;
GO

-- LoanProducts table (current state)
IF OBJECT_ID('dbo.LoanProducts', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.LoanProducts (
        ProductID NVARCHAR(50) NOT NULL PRIMARY KEY,
        ProductName NVARCHAR(255) NOT NULL,
        LoanStartDate DATE NOT NULL,
        WithdrawnDate DATE NULL,
        Pricing DECIMAL(5,2) NOT NULL,
        IsActive AS (CASE WHEN WithdrawnDate IS NULL OR WithdrawnDate > GETDATE() THEN 1 ELSE 0 END) PERSISTED,
        CreatedDate DATETIME2(3) NOT NULL DEFAULT SYSDATETIME(),
        CreatedBy NVARCHAR(100) NOT NULL,
        UpdatedDate DATETIME2(3) NULL,
        UpdatedBy NVARCHAR(100) NULL
    );
    
    CREATE INDEX IX_LoanProducts_IsActive 
    ON dbo.LoanProducts(IsActive) INCLUDE (ProductName, Pricing);
    
    CREATE INDEX IX_LoanProducts_ProductName 
    ON dbo.LoanProducts(ProductName);
END;
GO

-- LoanProductHistory table (audit trail)
IF OBJECT_ID('dbo.LoanProductHistory', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.LoanProductHistory (
        HistoryID BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        ProductID NVARCHAR(50) NOT NULL,
        ProductName NVARCHAR(255) NOT NULL,
        OldPricing DECIMAL(5,2) NULL,
        NewPricing DECIMAL(5,2) NOT NULL,
        OldWithdrawnDate DATE NULL,
        NewWithdrawnDate DATE NULL,
        ChangeType NVARCHAR(10) NOT NULL CHECK (ChangeType IN ('INSERT', 'UPDATE')),
        ChangeDate DATETIME2(3) NOT NULL DEFAULT SYSDATETIME(),
        ChangedBy NVARCHAR(100) NOT NULL
    );
    
    CREATE INDEX IX_LoanProductHistory_ProductID_ChangeDate 
    ON dbo.LoanProductHistory(ProductID, ChangeDate DESC);
    
    CREATE INDEX IX_LoanProductHistory_ChangeDate 
    ON dbo.LoanProductHistory(ChangeDate);
END;
GO

-- =============================================
-- STEP 2: Create Table-Valued Parameter Type
-- =============================================

IF TYPE_ID('dbo.LoanProductTableType') IS NOT NULL
    DROP TYPE dbo.LoanProductTableType;
GO

CREATE TYPE dbo.LoanProductTableType AS TABLE (
    ProductID NVARCHAR(50) NOT NULL,
    ProductName NVARCHAR(255) NOT NULL,
    LoanStartDate DATE NOT NULL,
    WithdrawnDate DATE NULL,
    Pricing DECIMAL(5,2) NOT NULL,
    PRIMARY KEY (ProductID)
);
GO

-- =============================================
-- STEP 3: Create Stored Procedures
-- =============================================
-- (Stored procedures already defined above)

PRINT 'Database setup completed successfully!';
GO