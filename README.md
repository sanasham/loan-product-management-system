# Loan Product Management System

Skeleton backend for uploading and processing loan product batches.

Quick start

```bash
npm install
# compile
npm run build
# or run with ts-node
npm start
```

Files live under `src/`.

![data layer](image.png)






📝 Test Scenarios by Category
System Health:

✅ Health check
✅ API info

File Upload:

✅ Valid new products
✅ Valid updates
✅ Invalid file types
✅ Missing columns
✅ File too large
✅ Empty files

Data Validation:

✅ Negative pricing
✅ Invalid dates
✅ Missing required fields
✅ Withdrawn before start date

Processing:

✅ Monitor all status states
✅ Chunk-based processing
✅ Reconciliation accuracy

Products:

✅ Pagination (various page sizes)
✅ Search functionality
✅ Get by ID
✅ History tracking

Error Handling:

✅ 404 - Not found
✅ 400 - Bad request
✅ 429 - Rate limiting





===============================================

-- =============================================
-- Loan Product Management System
-- Complete Database Schema (Based on PCX.ListOfProducts)
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
-- STEP 1: Create Users Table
-- =============================================
IF OBJECT_ID('dbo.Users', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.Users (
        UserID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        Username NVARCHAR(100) NOT NULL UNIQUE,
        Email NVARCHAR(255) NOT NULL,
        FullName NVARCHAR(255) NOT NULL,
        Department NVARCHAR(100) NULL,
        Role NVARCHAR(50) NULL,
        IsActive BIT NOT NULL DEFAULT 1,
        CreatedDate DATETIME2(3) NOT NULL DEFAULT SYSDATETIME()
    );
    
    -- Insert default users
    INSERT INTO Users (Username, Email, FullName, Department, Role) VALUES
    ('system', 'system@bank.com', 'System Administrator', 'IT', 'Admin'),
    ('jsmith', 'john.smith@bank.com', 'John Smith', 'Loan Operations', 'Manager'),
    ('mjones', 'mary.jones@bank.com', 'Mary Jones', 'Loan Operations', 'Officer');
END;
GO

-- =============================================
-- STEP 2: Create LoanProducts Table (Current State)
-- Exact replica of PCX.ListOfProducts with audit columns
-- =============================================
IF OBJECT_ID('dbo.LoanProducts', 'U') IS NOT NULL
    DROP TABLE dbo.LoanProducts;
GO

CREATE TABLE dbo.LoanProducts (
    -- Primary Key (using MSP-LBG Product Code as unique identifier)
    ProductID NVARCHAR(50) NOT NULL PRIMARY KEY, -- Maps to [MSP-LBG Product Code]
    
    -- Product Basic Info
    [Launch Date] NVARCHAR(MAX) NULL,
    [Brand] NVARCHAR(100) NULL,
    [Withdraw Date] NVARCHAR(MAX) NULL,
    [Withdraw Code] NVARCHAR(MAX) NULL,
    [MSP-LBG Product Code] NVARCHAR(MAX) NULL,
    [Channel Type] NVARCHAR(MAX) NULL,
    [Customer Type] NVARCHAR(MAX) NULL,

    -- Term and Type
    [Term] DECIMAL(5,2) NULL,
    [Type] NVARCHAR(50) NULL,

    -- BOE and Rate Tiers (8 tiers)
    [BOE1+/-] DECIMAL(5,2) NULL,
    [Rate1] DECIMAL(5,2) NULL,
    [Until1] NVARCHAR(MAX) NULL,

    [BOE2+/-] DECIMAL(5,2) NULL,
    [Rate2] DECIMAL(5,2) NULL,
    [Until2] NVARCHAR(MAX) NULL,

    [BOE3+/-] DECIMAL(5,2) NULL,
    [Rate3] DECIMAL(5,2) NULL,
    [Until3] NVARCHAR(MAX) NULL,

    [BOE4+/-] DECIMAL(5,2) NULL,
    [Rate4] DECIMAL(5,2) NULL,
    [Until4] NVARCHAR(MAX) NULL,

    [BOE5+/-] DECIMAL(5,2) NULL,
    [Rate5] DECIMAL(5,2) NULL,
    [Until5] NVARCHAR(MAX) NULL,

    [BOE6+/-] DECIMAL(5,2) NULL,
    [Rate6] DECIMAL(5,2) NULL,
    [Until6] NVARCHAR(MAX) NULL,

    [BOE7+/-] DECIMAL(5,2) NULL,
    [Rate7] DECIMAL(5,2) NULL,
    [Until7] NVARCHAR(MAX) NULL,

    [BOE8+/-] DECIMAL(5,2) NULL,
    [Rate8] DECIMAL(5,2) NULL,
    [Until8] NVARCHAR(MAX) NULL,

    -- Fees
    [Product Fee (£)] INT NULL,
    [Product Fee (%)] INT NULL,

    -- Loan Limits
    [Min Loan] INT NULL,
    [Max Loan] INT NULL,
    [Min LTV] INT NULL,
    [Max LTV] INT NULL,

    -- Additional Information
    [Additional info] NVARCHAR(MAX) NULL,
    [Must Complete By] NVARCHAR(MAX) NULL,
    [Product Fee Acknum] NVARCHAR(50) NULL,
    [Repayment APR] DECIMAL(5,2) NULL,
    [Scheme Type] NVARCHAR(MAX) NULL,
    [Portable Product] NVARCHAR(50) NULL,
    [Panel Number] INT NULL,
    [Payee Number] NVARCHAR(50) NULL,
    [Interest Calculation] NVARCHAR(50) NULL,
    [Link to HVR / HHVR] NVARCHAR(50) NULL,
    [Refund of Val] NVARCHAR(50) NULL,
    [Val Refund Acknum] NVARCHAR(50) NULL,
    [Free Val] NVARCHAR(50) NULL,
    [Free Conveyancing] NVARCHAR(50) NULL,
    [DAF to be waived] NVARCHAR(50) NULL,
    [HLC Free] NVARCHAR(50) NULL,

    -- Cashback
    [Cashback (£)] INT NULL,
    [Cashback (%)] NVARCHAR(50) NULL,
    [Cashback Acknum] NVARCHAR(50) NULL,
    [Proc Fee Code] NVARCHAR(50) NULL,
    [Proc Fee Narrative] NVARCHAR(50) NULL,

    -- Tied Text Fields
    [Tied Insurance Free Format Text] NVARCHAR(MAX) NULL,
    [Tied Non Insurance Free Format Text] NVARCHAR(MAX) NULL,
    [Tied Incentivised Free Format Text] NVARCHAR(MAX) NULL,
    [Narrative] NVARCHAR(MAX) NULL,

    -- Credit and Scoring
    [Best Credit Score Applicable] NVARCHAR(50) NULL,
    [Worst Credit Score Applicable] NVARCHAR(50) NULL,
    [CarbonOffset (%)] NVARCHAR(50) NULL,
    [Calculator] NVARCHAR(50) NULL,
    [Extras] INT NULL,
    [BERR (Government Reporting)] NVARCHAR(50) NULL,

    -- ERC (Early Repayment Charge) Rates (8 tiers)
    [ERC Rate1] DECIMAL(5,2) NULL,
    [ERC Until1] NVARCHAR(MAX) NULL,
    [ERC Rate2] DECIMAL(5,2) NULL,
    [ERC Until2] NVARCHAR(MAX) NULL,
    [ERC Rate3] DECIMAL(5,2) NULL,
    [ERC Until3] NVARCHAR(MAX) NULL,
    [ERC Rate4] DECIMAL(5,2) NULL,
    [ERC Until4] NVARCHAR(MAX) NULL,
    [ERC Rate5] DECIMAL(5,2) NULL,
    [ERC Until5] NVARCHAR(MAX) NULL,
    [ERC Rate6] DECIMAL(5,2) NULL,
    [ERC Until6] NVARCHAR(MAX) NULL,
    [ERC Rate7] DECIMAL(5,2) NULL,
    [ERC Until7] NVARCHAR(MAX) NULL,
    [ERC Rate8] DECIMAL(5,2) NULL,
    [ERC Until8] NVARCHAR(MAX) NULL,

    -- Cashback Limits
    [Cashback Minimum Amount] INT NULL,
    [Cashback Maximum Amount] INT NULL,
    [Cashback Type] NVARCHAR(50) NULL,
    [Repayment Fees] NVARCHAR(MAX) NULL,

    -- Portable Tied Text
    [Portable Tied Non Insurance Free Format Text] NVARCHAR(MAX) NULL,
    [Portable Tied Incentivised Free Format Text] NVARCHAR(MAX) NULL,

    -- UFSS Product Codes
    [UFSS Interest Only Product Code (CGM)] NVARCHAR(50) NULL,
    [UFSS Repayment Product Code (CGM)] NVARCHAR(50) NULL,
    [UFSS Interest Only Product Code (MOR)] NVARCHAR(50) NULL,
    [UFSS Repayment Product Code (MOR)] NVARCHAR(50) NULL,
    [UFSS Interest Only Product Code (LBM)] NVARCHAR(50) NULL,
    [UFSS Repayment Product Code (LBM)] NVARCHAR(50) NULL,
    [UFSS Interest Only Product Code (BMG)] NVARCHAR(50) NULL,
    [UFSS Repayment Product Code (BMG)] NVARCHAR(50) NULL,

    -- Account and Product Details
    [Account Type] NVARCHAR(50) NULL,
    [Current Product Cessation Type] NVARCHAR(50) NULL,
    [Risk Type] INT NULL,
    [Product String] NVARCHAR(MAX) NULL,
    [Withdrawn SOLAR code] NVARCHAR(50) NULL,
    [SOLAR CODE] NVARCHAR(50) NULL,
    [CHAPS Fee] INT NULL,
    [Channel Type / Category] NVARCHAR(MAX) NULL,
    [Core / Exclusive] NVARCHAR(50) NULL,
    [Offset Available] NVARCHAR(50) NULL,
    [CI] NVARCHAR(50) NULL,
    [IO] NVARCHAR(50) NULL,
    [ERC Term (Yrs)] INT NULL,
    [Individual LOP] NVARCHAR(MAX) NULL,
    [ERC Code] NVARCHAR(50) NULL,
    [Complete By] NVARCHAR(50) NULL,
    [MPET Valuation] NVARCHAR(50) NULL,
    [MPET Legal] NVARCHAR(50) NULL,
    [Core] NVARCHAR(50) NULL,
    [IRLID] NVARCHAR(50) NULL,
    [Interest Rate Code] NVARCHAR(50) NULL,
    [Mortgage Type] INT NULL,

    -- Computed Column (IsActive based on Withdraw Date)
    IsActive AS (CASE 
        WHEN [Withdraw Date] IS NULL OR [Withdraw Date] = '' OR TRY_CAST([Withdraw Date] AS DATE) > GETDATE() 
        THEN 1 
        ELSE 0 
    END) PERSISTED,
    
    -- Audit Columns
    CreatedDate DATETIME2(3) NOT NULL DEFAULT SYSDATETIME(),
    CreatedBy NVARCHAR(100) NOT NULL,
    UpdatedDate DATETIME2(3) NULL,
    UpdatedBy NVARCHAR(100) NULL
);
GO

-- Indexes for LoanProducts
CREATE INDEX IX_LoanProducts_IsActive ON dbo.LoanProducts(IsActive);
CREATE INDEX IX_LoanProducts_Brand ON dbo.LoanProducts([Brand]);
CREATE INDEX IX_LoanProducts_Type ON dbo.LoanProducts([Type]);
CREATE INDEX IX_LoanProducts_LaunchDate ON dbo.LoanProducts([Launch Date]);
CREATE INDEX IX_LoanProducts_ChannelType ON dbo.LoanProducts([Channel Type]);
GO

-- =============================================
-- STEP 3: Create LoanProductHistory Table (Audit Trail)
-- =============================================
IF OBJECT_ID('dbo.LoanProductHistory', 'U') IS NOT NULL
    DROP TABLE dbo.LoanProductHistory;
GO

CREATE TABLE dbo.LoanProductHistory (
    HistoryID BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    ProductID NVARCHAR(50) NOT NULL,
    
    -- Store complete before/after snapshots as JSON
    OldRecordJSON NVARCHAR(MAX) NULL, -- NULL for INSERT operations
    NewRecordJSON NVARCHAR(MAX) NOT NULL,
    
    -- Track specific key changes for quick queries
    OldRate1 DECIMAL(5,2) NULL,
    NewRate1 DECIMAL(5,2) NULL,
    OldWithdrawDate NVARCHAR(MAX) NULL,
    NewWithdrawDate NVARCHAR(MAX) NULL,
    OldProductFee INT NULL,
    NewProductFee INT NULL,
    
    -- Change Metadata
    ChangeType NVARCHAR(10) NOT NULL CHECK (ChangeType IN ('INSERT', 'UPDATE')),
    ChangeDescription NVARCHAR(500) NULL,
    ChangeDate DATETIME2(3) NOT NULL DEFAULT SYSDATETIME(),
    ChangedBy NVARCHAR(100) NOT NULL,
    
    -- Indexes
    INDEX IX_LoanProductHistory_ProductID_ChangeDate NONCLUSTERED (ProductID, ChangeDate DESC),
    INDEX IX_LoanProductHistory_ChangeDate NONCLUSTERED (ChangeDate DESC),
    INDEX IX_LoanProductHistory_ChangedBy NONCLUSTERED (ChangedBy)
);
GO

-- =============================================
-- STEP 4: Create LoanProductsStaging Table
-- =============================================
IF OBJECT_ID('dbo.LoanProductsStaging', 'U') IS NOT NULL
    DROP TABLE dbo.LoanProductsStaging;
GO

CREATE TABLE dbo.LoanProductsStaging (
    StagingID BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
    BatchID UNIQUEIDENTIFIER NOT NULL,
    RowNumber INT NOT NULL,
    
    -- All columns from LoanProducts (except computed and audit columns)
    ProductID NVARCHAR(50) NOT NULL,
    [Launch Date] NVARCHAR(MAX) NULL,
    [Brand] NVARCHAR(100) NULL,
    [Withdraw Date] NVARCHAR(MAX) NULL,
    [Withdraw Code] NVARCHAR(MAX) NULL,
    [MSP-LBG Product Code] NVARCHAR(MAX) NULL,
    [Channel Type] NVARCHAR(MAX) NULL,
    [Customer Type] NVARCHAR(MAX) NULL,
    [Term] DECIMAL(5,2) NULL,
    [Type] NVARCHAR(50) NULL,
    [BOE1+/-] DECIMAL(5,2) NULL,
    [Rate1] DECIMAL(5,2) NULL,
    [Until1] NVARCHAR(MAX) NULL,
    [BOE2+/-] DECIMAL(5,2) NULL,
    [Rate2] DECIMAL(5,2) NULL,
    [Until2] NVARCHAR(MAX) NULL,
    [BOE3+/-] DECIMAL(5,2) NULL,
    [Rate3] DECIMAL(5,2) NULL,
    [Until3] NVARCHAR(MAX) NULL,
    [BOE4+/-] DECIMAL(5,2) NULL,
    [Rate4] DECIMAL(5,2) NULL,
    [Until4] NVARCHAR(MAX) NULL,
    [BOE5+/-] DECIMAL(5,2) NULL,
    [Rate5] DECIMAL(5,2) NULL,
    [Until5] NVARCHAR(MAX) NULL,
    [BOE6+/-] DECIMAL(5,2) NULL,
    [Rate6] DECIMAL(5,2) NULL,
    [Until6] NVARCHAR(MAX) NULL,
    [BOE7+/-] DECIMAL(5,2) NULL,
    [Rate7] DECIMAL(5,2) NULL,
    [Until7] NVARCHAR(MAX) NULL,
    [BOE8+/-] DECIMAL(5,2) NULL,
    [Rate8] DECIMAL(5,2) NULL,
    [Until8] NVARCHAR(MAX) NULL,
    [Product Fee (£)] INT NULL,
    [Product Fee (%)] INT NULL,
    [Min Loan] INT NULL,
    [Max Loan] INT NULL,
    [Min LTV] INT NULL,
    [Max LTV] INT NULL,
    [Additional info] NVARCHAR(MAX) NULL,
    [Must Complete By] NVARCHAR(MAX) NULL,
    [Product Fee Acknum] NVARCHAR(50) NULL,
    [Repayment APR] DECIMAL(5,2) NULL,
    [Scheme Type] NVARCHAR(MAX) NULL,
    [Portable Product] NVARCHAR(50) NULL,
    [Panel Number] INT NULL,
    [Payee Number] NVARCHAR(50) NULL,
    [Interest Calculation] NVARCHAR(50) NULL,
    [Link to HVR / HHVR] NVARCHAR(50) NULL,
    [Refund of Val] NVARCHAR(50) NULL,
    [Val Refund Acknum] NVARCHAR(50) NULL,
    [Free Val] NVARCHAR(50) NULL,
    [Free Conveyancing] NVARCHAR(50) NULL,
    [DAF to be waived] NVARCHAR(50) NULL,
    [HLC Free] NVARCHAR(50) NULL,
    [Cashback (£)] INT NULL,
    [Cashback (%)] NVARCHAR(50) NULL,
    [Cashback Acknum] NVARCHAR(50) NULL,
    [Proc Fee Code] NVARCHAR(50) NULL,
    [Proc Fee Narrative] NVARCHAR(50) NULL,
    [Tied Insurance Free Format Text] NVARCHAR(MAX) NULL,
    [Tied Non Insurance Free Format Text] NVARCHAR(MAX) NULL,
    [Tied Incentivised Free Format Text] NVARCHAR(MAX) NULL,
    [Narrative] NVARCHAR(MAX) NULL,
    [Best Credit Score Applicable] NVARCHAR(50) NULL,
    [Worst Credit Score Applicable] NVARCHAR(50) NULL,
    [CarbonOffset (%)] NVARCHAR(50) NULL,
    [Calculator] NVARCHAR(50) NULL,
    [Extras] INT NULL,
    [BERR (Government Reporting)] NVARCHAR(50) NULL,
    [ERC Rate1] DECIMAL(5,2) NULL,
    [ERC Until1] NVARCHAR(MAX) NULL,
    [ERC Rate2] DECIMAL(5,2) NULL,
    [ERC Until2] NVARCHAR(MAX) NULL,
    [ERC Rate3] DECIMAL(5,2) NULL,
    [ERC Until3] NVARCHAR(MAX) NULL,
    [ERC Rate4] DECIMAL(5,2) NULL,
    [ERC Until4] NVARCHAR(MAX) NULL,
    [ERC Rate5] DECIMAL(5,2) NULL,
    [ERC Until5] NVARCHAR(MAX) NULL,
    [ERC Rate6] DECIMAL(5,2) NULL,
    [ERC Until6] NVARCHAR(MAX) NULL,
    [ERC Rate7] DECIMAL(5,2) NULL,
    [ERC Until7] NVARCHAR(MAX) NULL,
    [ERC Rate8] DECIMAL(5,2) NULL,
    [ERC Until8] NVARCHAR(MAX) NULL,
    [Cashback Minimum Amount] INT NULL,
    [Cashback Maximum Amount] INT NULL,
    [Cashback Type] NVARCHAR(50) NULL,
    [Repayment Fees] NVARCHAR(MAX) NULL,
    [Portable Tied Non Insurance Free Format Text] NVARCHAR(MAX) NULL,
    [Portable Tied Incentivised Free Format Text] NVARCHAR(MAX) NULL,
    [UFSS Interest Only Product Code (CGM)] NVARCHAR(50) NULL,
    [UFSS Repayment Product Code (CGM)] NVARCHAR(50) NULL,
    [UFSS Interest Only Product Code (MOR)] NVARCHAR(50) NULL,
    [UFSS Repayment Product Code (MOR)] NVARCHAR(50) NULL,
    [UFSS Interest Only Product Code (LBM)] NVARCHAR(50) NULL,
    [UFSS Repayment Product Code (LBM)] NVARCHAR(50) NULL,
    [UFSS Interest Only Product Code (BMG)] NVARCHAR(50) NULL,
    [UFSS Repayment Product Code (BMG)] NVARCHAR(50) NULL,
    [Account Type] NVARCHAR(50) NULL,
    [Current Product Cessation Type] NVARCHAR(50) NULL,
    [Risk Type] INT NULL,
    [Product String] NVARCHAR(MAX) NULL,
    [Withdrawn SOLAR code] NVARCHAR(50) NULL,
    [SOLAR CODE] NVARCHAR(50) NULL,
    [CHAPS Fee] INT NULL,
    [Channel Type / Category] NVARCHAR(MAX) NULL,
    [Core / Exclusive] NVARCHAR(50) NULL,
    [Offset Available] NVARCHAR(50) NULL,
    [CI] NVARCHAR(50) NULL,
    [IO] NVARCHAR(50) NULL,
    [ERC Term (Yrs)] INT NULL,
    [Individual LOP] NVARCHAR(MAX) NULL,
    [ERC Code] NVARCHAR(50) NULL,
    [Complete By] NVARCHAR(50) NULL,
    [MPET Valuation] NVARCHAR(50) NULL,
    [MPET Legal] NVARCHAR(50) NULL,
    [Core] NVARCHAR(50) NULL,
    [IRLID] NVARCHAR(50) NULL,
    [Interest Rate Code] NVARCHAR(50) NULL,
    [Mortgage Type] INT NULL,
    
    -- Processing Metadata
    ValidationStatus NVARCHAR(20) DEFAULT 'PENDING' CHECK (ValidationStatus IN ('PENDING', 'VALID', 'INVALID', 'PROCESSED')),
    ValidationErrors NVARCHAR(MAX) NULL,
    ProcessedDate DATETIME2(3) NULL,
    
    -- Audit
    UploadedDate DATETIME2(3) DEFAULT SYSDATETIME(),
    UploadedBy NVARCHAR(100) NOT NULL,
    
    INDEX IX_Staging_BatchID NONCLUSTERED (BatchID, ValidationStatus)
);
GO

-- =============================================
-- STEP 5: Create UploadBatches Table
-- =============================================
IF OBJECT_ID('dbo.UploadBatches', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.UploadBatches (
        BatchID UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
        FileName NVARCHAR(500) NOT NULL,
        TotalRecords INT NOT NULL,
        ValidRecords INT DEFAULT 0,
        InvalidRecords INT DEFAULT 0,
        ProcessedRecords INT DEFAULT 0,
        
        BatchStatus NVARCHAR(20) DEFAULT 'UPLOADED' CHECK (BatchStatus IN 
            ('UPLOADED', 'VALIDATING', 'VALIDATED', 'PROCESSING', 'COMPLETED', 'FAILED')),
        
        UploadedDate DATETIME2(3) DEFAULT SYSDATETIME(),
        UploadedBy NVARCHAR(100) NOT NULL,
        ProcessingStarted DATETIME2(3) NULL,
        ProcessingCompleted DATETIME2(3) NULL,
        
        INDEX IX_Batches_Status NONCLUSTERED (BatchStatus, UploadedDate DESC),
        INDEX IX_Batches_UploadedBy NONCLUSTERED (UploadedBy, UploadedDate DESC)
    );
END;
GO

-- =============================================
-- STEP 6: Create ProcessingLog Table
-- =============================================
IF OBJECT_ID('dbo.ProcessingLog', 'U') IS NULL
BEGIN
    CREATE TABLE dbo.ProcessingLog (
        LogID BIGINT IDENTITY(1,1) PRIMARY KEY,
        BatchID UNIQUEIDENTIFIER NOT NULL,
        ChunkNumber INT NOT NULL,
        RecordsProcessed INT NOT NULL,
        RecordsCreated INT NOT NULL,
        RecordsUpdated INT NOT NULL,
        RecordsSkipped INT NOT NULL,
        ProcessingTime INT NOT NULL, -- milliseconds
        LogDate DATETIME2(3) DEFAULT SYSDATETIME(),
        
        INDEX IX_Log_BatchID NONCLUSTERED (BatchID, ChunkNumber)
    );
END;
GO

PRINT 'Database schema created successfully!';
GO
