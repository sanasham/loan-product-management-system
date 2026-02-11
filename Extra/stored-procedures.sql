-- =============================================
-- Stored Procedures for Loan Product Management
-- Based on PCX.ListOfProducts structure
-- =============================================

USE LoanProductDB;
GO

-- =============================================
-- Helper function to generate column list dynamically
-- =============================================

-- =============================================
-- PROCEDURE: usp_ValidateStagingBatch
-- Validates all staging records for a batch
-- =============================================
IF OBJECT_ID('dbo.usp_ValidateStagingBatch', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_ValidateStagingBatch;
GO

CREATE PROCEDURE dbo.usp_ValidateStagingBatch
    @BatchID UNIQUEIDENTIFIER
AS
BEGIN
    SET NOCOUNT ON;
    
    BEGIN TRY
        -- Update batch status to VALIDATING
        UPDATE UploadBatches
        SET BatchStatus = 'VALIDATING'
        WHERE BatchID = @BatchID;
        
        -- Validate all staging records
        -- Basic validation: ProductID must not be empty
        UPDATE s
        SET 
            ValidationStatus = CASE
                WHEN LEN(LTRIM(RTRIM(s.ProductID))) = 0 THEN 'INVALID'
                WHEN s.[Rate1] < 0 OR s.[Rate1] > 100 THEN 'INVALID'
                ELSE 'VALID'
            END,
            ValidationErrors = CASE
                WHEN LEN(LTRIM(RTRIM(s.ProductID))) = 0 THEN 'Missing ProductID'
                WHEN s.[Rate1] < 0 OR s.[Rate1] > 100 THEN 'Invalid Rate1: must be between 0 and 100'
                ELSE NULL
            END
        FROM LoanProductsStaging s
        WHERE s.BatchID = @BatchID;
        
        -- Update batch with validation counts
        UPDATE b
        SET 
            ValidRecords = (
                SELECT COUNT(*) 
                FROM LoanProductsStaging 
                WHERE BatchID = @BatchID AND ValidationStatus = 'VALID'
            ),
            InvalidRecords = (
                SELECT COUNT(*) 
                FROM LoanProductsStaging 
                WHERE BatchID = @BatchID AND ValidationStatus = 'INVALID'
            ),
            BatchStatus = 'VALIDATED'
        FROM UploadBatches b
        WHERE b.BatchID = @BatchID;
        
    END TRY
    BEGIN CATCH
        -- Mark batch as failed on error
        UPDATE UploadBatches
        SET BatchStatus = 'FAILED'
        WHERE BatchID = @BatchID;
        
        THROW;
    END CATCH
END;
GO

-- =============================================
-- PROCEDURE: usp_ProcessChunk
-- Processes a chunk of validated staging records
-- =============================================
IF OBJECT_ID('dbo.usp_ProcessChunk', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_ProcessChunk;
GO

CREATE PROCEDURE dbo.usp_ProcessChunk
    @BatchID UNIQUEIDENTIFIER,
    @ChunkNumber INT,
    @ChunkSize INT,
    @Username NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;
    
    DECLARE @Offset INT = @ChunkNumber * @ChunkSize;
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Temporary table to capture results
        DECLARE @Results TABLE (
            Action NVARCHAR(10),
            ProductID NVARCHAR(50),
            OldRate1 DECIMAL(5,2),
            NewRate1 DECIMAL(5,2),
            OldWithdrawDate NVARCHAR(MAX),
            NewWithdrawDate NVARCHAR(MAX),
            OldProductFee INT,
            NewProductFee INT,
            OldRecordJSON NVARCHAR(MAX),
            NewRecordJSON NVARCHAR(MAX)
        );
        
        -- Get chunk data into temp table
        SELECT * INTO #ChunkData
        FROM LoanProductsStaging
        WHERE BatchID = @BatchID 
          AND ValidationStatus = 'VALID'
        ORDER BY StagingID
        OFFSET @Offset ROWS FETCH NEXT @ChunkSize ROWS ONLY;
        
        -- UPDATE existing products that have changes
        UPDATE p
        SET 
            [Launch Date] = c.[Launch Date],
            [Brand] = c.[Brand],
            [Withdraw Date] = c.[Withdraw Date],
            [Withdraw Code] = c.[Withdraw Code],
            [MSP-LBG Product Code] = c.[MSP-LBG Product Code],
            [Channel Type] = c.[Channel Type],
            [Customer Type] = c.[Customer Type],
            [Term] = c.[Term],
            [Type] = c.[Type],
            [BOE1+/-] = c.[BOE1+/-],
            [Rate1] = c.[Rate1],
            [Until1] = c.[Until1],
            [BOE2+/-] = c.[BOE2+/-],
            [Rate2] = c.[Rate2],
            [Until2] = c.[Until2],
            [BOE3+/-] = c.[BOE3+/-],
            [Rate3] = c.[Rate3],
            [Until3] = c.[Until3],
            [BOE4+/-] = c.[BOE4+/-],
            [Rate4] = c.[Rate4],
            [Until4] = c.[Until4],
            [BOE5+/-] = c.[BOE5+/-],
            [Rate5] = c.[Rate5],
            [Until5] = c.[Until5],
            [BOE6+/-] = c.[BOE6+/-],
            [Rate6] = c.[Rate6],
            [Until6] = c.[Until6],
            [BOE7+/-] = c.[BOE7+/-],
            [Rate7] = c.[Rate7],
            [Until7] = c.[Until7],
            [BOE8+/-] = c.[BOE8+/-],
            [Rate8] = c.[Rate8],
            [Until8] = c.[Until8],
            [Product Fee (£)] = c.[Product Fee (£)],
            [Product Fee (%)] = c.[Product Fee (%)],
            [Min Loan] = c.[Min Loan],
            [Max Loan] = c.[Max Loan],
            [Min LTV] = c.[Min LTV],
            [Max LTV] = c.[Max LTV],
            [Additional info] = c.[Additional info],
            [Must Complete By] = c.[Must Complete By],
            [Product Fee Acknum] = c.[Product Fee Acknum],
            [Repayment APR] = c.[Repayment APR],
            [Scheme Type] = c.[Scheme Type],
            [Portable Product] = c.[Portable Product],
            [Panel Number] = c.[Panel Number],
            [Payee Number] = c.[Payee Number],
            [Interest Calculation] = c.[Interest Calculation],
            [Link to HVR / HHVR] = c.[Link to HVR / HHVR],
            [Refund of Val] = c.[Refund of Val],
            [Val Refund Acknum] = c.[Val Refund Acknum],
            [Free Val] = c.[Free Val],
            [Free Conveyancing] = c.[Free Conveyancing],
            [DAF to be waived] = c.[DAF to be waived],
            [HLC Free] = c.[HLC Free],
            [Cashback (£)] = c.[Cashback (£)],
            [Cashback (%)] = c.[Cashback (%)],
            [Cashback Acknum] = c.[Cashback Acknum],
            [Proc Fee Code] = c.[Proc Fee Code],
            [Proc Fee Narrative] = c.[Proc Fee Narrative],
            [Tied Insurance Free Format Text] = c.[Tied Insurance Free Format Text],
            [Tied Non Insurance Free Format Text] = c.[Tied Non Insurance Free Format Text],
            [Tied Incentivised Free Format Text] = c.[Tied Incentivised Free Format Text],
            [Narrative] = c.[Narrative],
            [Best Credit Score Applicable] = c.[Best Credit Score Applicable],
            [Worst Credit Score Applicable] = c.[Worst Credit Score Applicable],
            [CarbonOffset (%)] = c.[CarbonOffset (%)],
            [Calculator] = c.[Calculator],
            [Extras] = c.[Extras],
            [BERR (Government Reporting)] = c.[BERR (Government Reporting)],
            [ERC Rate1] = c.[ERC Rate1],
            [ERC Until1] = c.[ERC Until1],
            [ERC Rate2] = c.[ERC Rate2],
            [ERC Until2] = c.[ERC Until2],
            [ERC Rate3] = c.[ERC Rate3],
            [ERC Until3] = c.[ERC Until3],
            [ERC Rate4] = c.[ERC Rate4],
            [ERC Until4] = c.[ERC Until4],
            [ERC Rate5] = c.[ERC Rate5],
            [ERC Until5] = c.[ERC Until5],
            [ERC Rate6] = c.[ERC Rate6],
            [ERC Until6] = c.[ERC Until6],
            [ERC Rate7] = c.[ERC Rate7],
            [ERC Until7] = c.[ERC Until7],
            [ERC Rate8] = c.[ERC Rate8],
            [ERC Until8] = c.[ERC Until8],
            [Cashback Minimum Amount] = c.[Cashback Minimum Amount],
            [Cashback Maximum Amount] = c.[Cashback Maximum Amount],
            [Cashback Type] = c.[Cashback Type],
            [Repayment Fees] = c.[Repayment Fees],
            [Portable Tied Non Insurance Free Format Text] = c.[Portable Tied Non Insurance Free Format Text],
            [Portable Tied Incentivised Free Format Text] = c.[Portable Tied Incentivised Free Format Text],
            [UFSS Interest Only Product Code (CGM)] = c.[UFSS Interest Only Product Code (CGM)],
            [UFSS Repayment Product Code (CGM)] = c.[UFSS Repayment Product Code (CGM)],
            [UFSS Interest Only Product Code (MOR)] = c.[UFSS Interest Only Product Code (MOR)],
            [UFSS Repayment Product Code (MOR)] = c.[UFSS Repayment Product Code (MOR)],
            [UFSS Interest Only Product Code (LBM)] = c.[UFSS Interest Only Product Code (LBM)],
            [UFSS Repayment Product Code (LBM)] = c.[UFSS Repayment Product Code (LBM)],
            [UFSS Interest Only Product Code (BMG)] = c.[UFSS Interest Only Product Code (BMG)],
            [UFSS Repayment Product Code (BMG)] = c.[UFSS Repayment Product Code (BMG)],
            [Account Type] = c.[Account Type],
            [Current Product Cessation Type] = c.[Current Product Cessation Type],
            [Risk Type] = c.[Risk Type],
            [Product String] = c.[Product String],
            [Withdrawn SOLAR code] = c.[Withdrawn SOLAR code],
            [SOLAR CODE] = c.[SOLAR CODE],
            [CHAPS Fee] = c.[CHAPS Fee],
            [Channel Type / Category] = c.[Channel Type / Category],
            [Core / Exclusive] = c.[Core / Exclusive],
            [Offset Available] = c.[Offset Available],
            [CI] = c.[CI],
            [IO] = c.[IO],
            [ERC Term (Yrs)] = c.[ERC Term (Yrs)],
            [Individual LOP] = c.[Individual LOP],
            [ERC Code] = c.[ERC Code],
            [Complete By] = c.[Complete By],
            [MPET Valuation] = c.[MPET Valuation],
            [MPET Legal] = c.[MPET Legal],
            [Core] = c.[Core],
            [IRLID] = c.[IRLID],
            [Interest Rate Code] = c.[Interest Rate Code],
            [Mortgage Type] = c.[Mortgage Type],
            UpdatedDate = SYSDATETIME(),
            UpdatedBy = @Username
        OUTPUT 
            'UPDATE',
            inserted.ProductID,
            deleted.[Rate1],
            inserted.[Rate1],
            deleted.[Withdraw Date],
            inserted.[Withdraw Date],
            deleted.[Product Fee (£)],
            inserted.[Product Fee (£)],
            (SELECT * FROM deleted FOR JSON PATH, WITHOUT_ARRAY_WRAPPER),
            (SELECT * FROM inserted FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
        INTO @Results
        FROM LoanProducts p
        INNER JOIN #ChunkData c ON p.ProductID = c.ProductID
        WHERE 
            -- Check if anything has changed
            ISNULL(p.[Rate1], -1) != ISNULL(c.[Rate1], -1)
            OR ISNULL(p.[Withdraw Date], '') != ISNULL(c.[Withdraw Date], '')
            OR ISNULL(p.[Product Fee (£)], -1) != ISNULL(c.[Product Fee (£)], -1)
            OR ISNULL(p.[Brand], '') != ISNULL(c.[Brand], '')
            OR ISNULL(p.[Type], '') != ISNULL(c.[Type], '');
        
        -- INSERT new products
        INSERT INTO LoanProducts (
            ProductID,
            [Launch Date], [Brand], [Withdraw Date], [Withdraw Code], 
            [MSP-LBG Product Code], [Channel Type], [Customer Type],
            [Term], [Type],
            [BOE1+/-], [Rate1], [Until1],
            [BOE2+/-], [Rate2], [Until2],
            [BOE3+/-], [Rate3], [Until3],
            [BOE4+/-], [Rate4], [Until4],
            [BOE5+/-], [Rate5], [Until5],
            [BOE6+/-], [Rate6], [Until6],
            [BOE7+/-], [Rate7], [Until7],
            [BOE8+/-], [Rate8], [Until8],
            [Product Fee (£)], [Product Fee (%)],
            [Min Loan], [Max Loan], [Min LTV], [Max LTV],
            [Additional info], [Must Complete By], [Product Fee Acknum],
            [Repayment APR], [Scheme Type], [Portable Product],
            [Panel Number], [Payee Number], [Interest Calculation],
            [Link to HVR / HHVR], [Refund of Val], [Val Refund Acknum],
            [Free Val], [Free Conveyancing], [DAF to be waived], [HLC Free],
            [Cashback (£)], [Cashback (%)], [Cashback Acknum],
            [Proc Fee Code], [Proc Fee Narrative],
            [Tied Insurance Free Format Text], [Tied Non Insurance Free Format Text],
            [Tied Incentivised Free Format Text], [Narrative],
            [Best Credit Score Applicable], [Worst Credit Score Applicable],
            [CarbonOffset (%)], [Calculator], [Extras], [BERR (Government Reporting)],
            [ERC Rate1], [ERC Until1], [ERC Rate2], [ERC Until2],
            [ERC Rate3], [ERC Until3], [ERC Rate4], [ERC Until4],
            [ERC Rate5], [ERC Until5], [ERC Rate6], [ERC Until6],
            [ERC Rate7], [ERC Until7], [ERC Rate8], [ERC Until8],
            [Cashback Minimum Amount], [Cashback Maximum Amount], [Cashback Type],
            [Repayment Fees],
            [Portable Tied Non Insurance Free Format Text],
            [Portable Tied Incentivised Free Format Text],
            [UFSS Interest Only Product Code (CGM)], [UFSS Repayment Product Code (CGM)],
            [UFSS Interest Only Product Code (MOR)], [UFSS Repayment Product Code (MOR)],
            [UFSS Interest Only Product Code (LBM)], [UFSS Repayment Product Code (LBM)],
            [UFSS Interest Only Product Code (BMG)], [UFSS Repayment Product Code (BMG)],
            [Account Type], [Current Product Cessation Type], [Risk Type],
            [Product String], [Withdrawn SOLAR code], [SOLAR CODE],
            [CHAPS Fee], [Channel Type / Category], [Core / Exclusive],
            [Offset Available], [CI], [IO], [ERC Term (Yrs)],
            [Individual LOP], [ERC Code], [Complete By],
            [MPET Valuation], [MPET Legal], [Core], [IRLID],
            [Interest Rate Code], [Mortgage Type],
            CreatedBy
        )
        OUTPUT 
            'INSERT',
            inserted.ProductID,
            NULL,
            inserted.[Rate1],
            NULL,
            inserted.[Withdraw Date],
            NULL,
            inserted.[Product Fee (£)],
            NULL,
            (SELECT * FROM inserted FOR JSON PATH, WITHOUT_ARRAY_WRAPPER)
        INTO @Results
        SELECT 
            c.ProductID,
            c.[Launch Date], c.[Brand], c.[Withdraw Date], c.[Withdraw Code],
            c.[MSP-LBG Product Code], c.[Channel Type], c.[Customer Type],
            c.[Term], c.[Type],
            c.[BOE1+/-], c.[Rate1], c.[Until1],
            c.[BOE2+/-], c.[Rate2], c.[Until2],
            c.[BOE3+/-], c.[Rate3], c.[Until3],
            c.[BOE4+/-], c.[Rate4], c.[Until4],
            c.[BOE5+/-], c.[Rate5], c.[Until5],
            c.[BOE6+/-], c.[Rate6], c.[Until6],
            c.[BOE7+/-], c.[Rate7], c.[Until7],
            c.[BOE8+/-], c.[Rate8], c.[Until8],
            c.[Product Fee (£)], c.[Product Fee (%)],
            c.[Min Loan], c.[Max Loan], c.[Min LTV], c.[Max LTV],
            c.[Additional info], c.[Must Complete By], c.[Product Fee Acknum],
            c.[Repayment APR], c.[Scheme Type], c.[Portable Product],
            c.[Panel Number], c.[Payee Number], c.[Interest Calculation],
            c.[Link to HVR / HHVR], c.[Refund of Val], c.[Val Refund Acknum],
            c.[Free Val], c.[Free Conveyancing], c.[DAF to be waived], c.[HLC Free],
            c.[Cashback (£)], c.[Cashback (%)], c.[Cashback Acknum],
            c.[Proc Fee Code], c.[Proc Fee Narrative],
            c.[Tied Insurance Free Format Text], c.[Tied Non Insurance Free Format Text],
            c.[Tied Incentivised Free Format Text], c.[Narrative],
            c.[Best Credit Score Applicable], c.[Worst Credit Score Applicable],
            c.[CarbonOffset (%)], c.[Calculator], c.[Extras], c.[BERR (Government Reporting)],
            c.[ERC Rate1], c.[ERC Until1], c.[ERC Rate2], c.[ERC Until2],
            c.[ERC Rate3], c.[ERC Until3], c.[ERC Rate4], c.[ERC Until4],
            c.[ERC Rate5], c.[ERC Until5], c.[ERC Rate6], c.[ERC Until6],
            c.[ERC Rate7], c.[ERC Until7], c.[ERC Rate8], c.[ERC Until8],
            c.[Cashback Minimum Amount], c.[Cashback Maximum Amount], c.[Cashback Type],
            c.[Repayment Fees],
            c.[Portable Tied Non Insurance Free Format Text],
            c.[Portable Tied Incentivised Free Format Text],
            c.[UFSS Interest Only Product Code (CGM)], c.[UFSS Repayment Product Code (CGM)],
            c.[UFSS Interest Only Product Code (MOR)], c.[UFSS Repayment Product Code (MOR)],
            c.[UFSS Interest Only Product Code (LBM)], c.[UFSS Repayment Product Code (LBM)],
            c.[UFSS Interest Only Product Code (BMG)], c.[UFSS Repayment Product Code (BMG)],
            c.[Account Type], c.[Current Product Cessation Type], c.[Risk Type],
            c.[Product String], c.[Withdrawn SOLAR code], c.[SOLAR CODE],
            c.[CHAPS Fee], c.[Channel Type / Category], c.[Core / Exclusive],
            c.[Offset Available], c.[CI], c.[IO], c.[ERC Term (Yrs)],
            c.[Individual LOP], c.[ERC Code], c.[Complete By],
            c.[MPET Valuation], c.[MPET Legal], c.[Core], c.[IRLID],
            c.[Interest Rate Code], c.[Mortgage Type],
            @Username
        FROM #ChunkData c
        WHERE NOT EXISTS (
            SELECT 1 FROM LoanProducts p WHERE p.ProductID = c.ProductID
        );
        
        -- Insert audit records into history
        INSERT INTO LoanProductHistory (
            ProductID,
            OldRecordJSON,
            NewRecordJSON,
            OldRate1,
            NewRate1,
            OldWithdrawDate,
            NewWithdrawDate,
            OldProductFee,
            NewProductFee,
            ChangeType,
            ChangedBy
        )
        SELECT 
            ProductID,
            OldRecordJSON,
            NewRecordJSON,
            OldRate1,
            NewRate1,
            OldWithdrawDate,
            NewWithdrawDate,
            OldProductFee,
            NewProductFee,
            Action,
            @Username
        FROM @Results;
        
        -- Mark staging records as processed
        UPDATE LoanProductsStaging
        SET ValidationStatus = 'PROCESSED', ProcessedDate = SYSDATETIME()
        WHERE StagingID IN (SELECT StagingID FROM #ChunkData);
        
        -- Return statistics
        SELECT 
            Action,
            COUNT(*) as Count
        FROM @Results
        GROUP BY Action;
        
        DROP TABLE #ChunkData;
        
        COMMIT TRANSACTION;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        THROW;
    END CATCH
END;
GO

-- =============================================
-- PROCEDURE: usp_GetProducts
-- Get paginated list of products
-- =============================================
IF OBJECT_ID('dbo.usp_GetProducts', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_GetProducts;
GO

CREATE PROCEDURE dbo.usp_GetProducts
    @PageNumber INT = 1,
    @PageSize INT = 50,
    @SearchTerm NVARCHAR(255) = NULL,
    @ActiveOnly BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT
        ProductID,
        [MSP-LBG Product Code],
        [Brand],
        [Type],
        [Rate1],
        [Launch Date],
        [Withdraw Date],
        [Product Fee (£)],
        IsActive,
        CreatedDate,
        CreatedBy,
        UpdatedDate,
        UpdatedBy
    FROM LoanProducts
    WHERE 
        (@SearchTerm IS NULL OR 
         [MSP-LBG Product Code] LIKE '%' + @SearchTerm + '%' OR 
         [Brand] LIKE '%' + @SearchTerm + '%' OR 
         ProductID LIKE '%' + @SearchTerm + '%')
        AND (@ActiveOnly IS NULL OR IsActive = @ActiveOnly)
    ORDER BY [Launch Date] DESC, ProductID
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
    
    -- Return total count
    SELECT COUNT(*) AS TotalRecords
    FROM LoanProducts
    WHERE 
        (@SearchTerm IS NULL OR 
         [MSP-LBG Product Code] LIKE '%' + @SearchTerm + '%' OR 
         [Brand] LIKE '%' + @SearchTerm + '%' OR 
         ProductID LIKE '%' + @SearchTerm + '%')
        AND (@ActiveOnly IS NULL OR IsActive = @ActiveOnly);
END;
GO

-- =============================================
-- PROCEDURE: usp_GetProductById
-- Get single product by ID
-- =============================================
IF OBJECT_ID('dbo.usp_GetProductById', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_GetProductById;
GO

CREATE PROCEDURE dbo.usp_GetProductById
    @ProductID NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT * 
    FROM LoanProducts
    WHERE ProductID = @ProductID;
END;
GO

-- =============================================
-- PROCEDURE: usp_GetProductHistory
-- Get product change history
-- =============================================
IF OBJECT_ID('dbo.usp_GetProductHistory', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_GetProductHistory;
GO

CREATE PROCEDURE dbo.usp_GetProductHistory
    @ProductID NVARCHAR(50),
    @MonthsBack INT = 12
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @StartDate DATETIME2(3) = DATEADD(MONTH, -@MonthsBack, SYSDATETIME());
    
    SELECT
        HistoryID,
        ProductID,
        OldRecordJSON,
        NewRecordJSON,
        OldRate1,
        NewRate1,
        OldWithdrawDate,
        NewWithdrawDate,
        OldProductFee,
        NewProductFee,
        ChangeType,
        ChangeDescription,
        ChangeDate,
        ChangedBy
    FROM LoanProductHistory
    WHERE ProductID = @ProductID
      AND ChangeDate >= @StartDate
    ORDER BY ChangeDate DESC;
END;
GO

PRINT 'All stored procedures created successfully!';
GO