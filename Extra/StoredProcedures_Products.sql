-- =============================================
-- Stored Procedures for Product Management
-- Complete set of procedures for ProductService
-- =============================================
USE LoanProductDB;
GO

-- =============================================
-- PROCEDURE: usp_SearchProducts
-- Advanced product search with multiple criteria
-- =============================================
IF OBJECT_ID('dbo.usp_SearchProducts', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_SearchProducts;
GO

CREATE PROCEDURE dbo.usp_SearchProducts
    @ProductID NVARCHAR(50) = NULL,
    @Brand NVARCHAR(255) = NULL,
    @Type NVARCHAR(255) = NULL,
    @MinRate DECIMAL(5,2) = NULL,
    @MaxRate DECIMAL(5,2) = NULL,
    @ChannelType NVARCHAR(255) = NULL,
    @CustomerType NVARCHAR(255) = NULL,
    @MinLTV DECIMAL(5,2) = NULL,
    @MaxLTV DECIMAL(5,2) = NULL,
    @ActiveOnly BIT = NULL,
    @PageNumber INT = 1,
    @PageSize INT = 50
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @Offset INT = (@PageNumber - 1) * @PageSize;

    -- Return paginated results
    SELECT 
        ProductID,
        [Launch Date],
        [Brand],
        [Withdraw Date],
        [Withdraw Code],
        [MSP-LBG Product Code],
        [Channel Type],
        [Customer Type],
        [Term],
        [Type],
        [Rate1],
        [Product Fee (£)],
        [Min Loan],
        [Max Loan],
        [Min LTV],
        [Max LTV],
        IsActive,
        CreatedDate,
        CreatedBy,
        UpdatedDate,
        UpdatedBy
    FROM LoanProducts
    WHERE (@ProductID IS NULL OR ProductID LIKE '%' + @ProductID + '%')
        AND (@Brand IS NULL OR [Brand] LIKE '%' + @Brand + '%')
        AND (@Type IS NULL OR [Type] LIKE '%' + @Type + '%')
        AND (@MinRate IS NULL OR [Rate1] >= @MinRate)
        AND (@MaxRate IS NULL OR [Rate1] <= @MaxRate)
        AND (@ChannelType IS NULL OR [Channel Type] = @ChannelType)
        AND (@CustomerType IS NULL OR [Customer Type] = @CustomerType)
        AND (@MinLTV IS NULL OR [Min LTV] <= @MinLTV)
        AND (@MaxLTV IS NULL OR [Max LTV] >= @MaxLTV)
        AND (@ActiveOnly IS NULL OR IsActive = @ActiveOnly)
    ORDER BY [Launch Date] DESC, ProductID
    OFFSET @Offset ROWS
    FETCH NEXT @PageSize ROWS ONLY;

    -- Return total count
    SELECT COUNT(*) as TotalRecords
    FROM LoanProducts
    WHERE (@ProductID IS NULL OR ProductID LIKE '%' + @ProductID + '%')
        AND (@Brand IS NULL OR [Brand] LIKE '%' + @Brand + '%')
        AND (@Type IS NULL OR [Type] LIKE '%' + @Type + '%')
        AND (@MinRate IS NULL OR [Rate1] >= @MinRate)
        AND (@MaxRate IS NULL OR [Rate1] <= @MaxRate)
        AND (@ChannelType IS NULL OR [Channel Type] = @ChannelType)
        AND (@CustomerType IS NULL OR [Customer Type] = @CustomerType)
        AND (@MinLTV IS NULL OR [Min LTV] <= @MinLTV)
        AND (@MaxLTV IS NULL OR [Max LTV] >= @MaxLTV)
        AND (@ActiveOnly IS NULL OR IsActive = @ActiveOnly);
END;
GO

-- =============================================
-- PROCEDURE: usp_GetProductsByBrand
-- Get all products for a specific brand
-- =============================================
IF OBJECT_ID('dbo.usp_GetProductsByBrand', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_GetProductsByBrand;
GO

CREATE PROCEDURE dbo.usp_GetProductsByBrand
    @Brand NVARCHAR(255),
    @ActiveOnly BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM LoanProducts
    WHERE [Brand] = @Brand
        AND (@ActiveOnly = 0 OR IsActive = 1)
    ORDER BY [Launch Date] DESC;
END;
GO

-- =============================================
-- PROCEDURE: usp_GetProductsByType
-- Get all products for a specific type
-- =============================================
IF OBJECT_ID('dbo.usp_GetProductsByType', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_GetProductsByType;
GO

CREATE PROCEDURE dbo.usp_GetProductsByType
    @Type NVARCHAR(255),
    @ActiveOnly BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM LoanProducts
    WHERE [Type] = @Type
        AND (@ActiveOnly = 0 OR IsActive = 1)
    ORDER BY [Rate1] ASC, [Launch Date] DESC;
END;
GO

-- =============================================
-- PROCEDURE: usp_GetRecentlyUpdatedProducts
-- Get products updated in the last N days
-- =============================================
IF OBJECT_ID('dbo.usp_GetRecentlyUpdatedProducts', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_GetRecentlyUpdatedProducts;
GO

CREATE PROCEDURE dbo.usp_GetRecentlyUpdatedProducts
    @Days INT = 7,
    @Limit INT = 50
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (@Limit) *
    FROM LoanProducts
    WHERE UpdatedDate >= DATEADD(DAY, -@Days, SYSDATETIME())
    ORDER BY UpdatedDate DESC;
END;
GO

-- =============================================
-- PROCEDURE: usp_GetProductsWithRateChanges
-- Get products with rate changes in a date range
-- =============================================
IF OBJECT_ID('dbo.usp_GetProductsWithRateChanges', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_GetProductsWithRateChanges;
GO

CREATE PROCEDURE dbo.usp_GetProductsWithRateChanges
    @StartDate DATETIME2(3),
    @EndDate DATETIME2(3) = NULL
AS
BEGIN
    SET NOCOUNT ON;

    IF @EndDate IS NULL
        SET @EndDate = SYSDATETIME();

    SELECT 
        h.*,
        p.[Brand],
        p.[Type],
        p.[MSP-LBG Product Code]
    FROM LoanProductHistory h
    INNER JOIN LoanProducts p ON h.ProductID = p.ProductID
    WHERE h.ChangeDate BETWEEN @StartDate AND @EndDate
        AND h.ChangeType IN ('INSERT', 'UPDATE')
        AND (h.OldRate1 IS NULL OR h.OldRate1 != h.NewRate1)
    ORDER BY h.ChangeDate DESC;
END;
GO

-- =============================================
-- PROCEDURE: usp_GetProductsByRateRange
-- Get products within a rate range
-- =============================================
IF OBJECT_ID('dbo.usp_GetProductsByRateRange', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_GetProductsByRateRange;
GO

CREATE PROCEDURE dbo.usp_GetProductsByRateRange
    @MinRate DECIMAL(5,2),
    @MaxRate DECIMAL(5,2),
    @ActiveOnly BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM LoanProducts
    WHERE [Rate1] BETWEEN @MinRate AND @MaxRate
        AND (@ActiveOnly = 0 OR IsActive = 1)
    ORDER BY [Rate1] ASC, [Launch Date] DESC;
END;
GO

-- =============================================
-- PROCEDURE: usp_GetProductsByLTV
-- Get products matching a specific LTV
-- =============================================
IF OBJECT_ID('dbo.usp_GetProductsByLTV', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_GetProductsByLTV;
GO

CREATE PROCEDURE dbo.usp_GetProductsByLTV
    @LTV DECIMAL(5,2),
    @ActiveOnly BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM LoanProducts
    WHERE [Min LTV] <= @LTV 
        AND [Max LTV] >= @LTV
        AND (@ActiveOnly = 0 OR IsActive = 1)
    ORDER BY [Rate1] ASC, [Launch Date] DESC;
END;
GO

-- =============================================
-- PROCEDURE: usp_GetWithdrawnProducts
-- Get withdrawn products
-- =============================================
IF OBJECT_ID('dbo.usp_GetWithdrawnProducts', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_GetWithdrawnProducts;
GO

CREATE PROCEDURE dbo.usp_GetWithdrawnProducts
    @SinceDate NVARCHAR(50) = NULL,
    @Limit INT = 100
AS
BEGIN
    SET NOCOUNT ON;

    SELECT TOP (@Limit) *
    FROM LoanProducts
    WHERE [Withdraw Date] IS NOT NULL
        AND (@SinceDate IS NULL OR [Withdraw Date] >= @SinceDate)
    ORDER BY [Withdraw Date] DESC;
END;
GO

-- =============================================
-- PROCEDURE: usp_GetProductStatistics
-- Get overall product statistics
-- =============================================
IF OBJECT_ID('dbo.usp_GetProductStatistics', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_GetProductStatistics;
GO

CREATE PROCEDURE dbo.usp_GetProductStatistics
AS
BEGIN
    SET NOCOUNT ON;

    SELECT 
        COUNT(*) as TotalProducts,
        SUM(CASE WHEN IsActive = 1 THEN 1 ELSE 0 END) as ActiveProducts,
        SUM(CASE WHEN [Withdraw Date] IS NOT NULL THEN 1 ELSE 0 END) as WithdrawnProducts,
        AVG(CAST([Rate1] as FLOAT)) as AverageRate,
        COUNT(DISTINCT [Brand]) as BrandCount,
        COUNT(DISTINCT [Type]) as TypeCount
    FROM LoanProducts;
END;
GO

-- =============================================
-- PROCEDURE: usp_GetBrands
-- Get distinct brands
-- =============================================
IF OBJECT_ID('dbo.usp_GetBrands', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_GetBrands;
GO

CREATE PROCEDURE dbo.usp_GetBrands
AS
BEGIN
    SET NOCOUNT ON;

    SELECT DISTINCT [Brand]
    FROM LoanProducts
    WHERE [Brand] IS NOT NULL
    ORDER BY [Brand];
END;
GO

-- =============================================
-- PROCEDURE: usp_GetProductTypes
-- Get distinct product types
-- =============================================
IF OBJECT_ID('dbo.usp_GetProductTypes', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_GetProductTypes;
GO

CREATE PROCEDURE dbo.usp_GetProductTypes
AS
BEGIN
    SET NOCOUNT ON;

    SELECT DISTINCT [Type]
    FROM LoanProducts
    WHERE [Type] IS NOT NULL
    ORDER BY [Type];
END;
GO

-- =============================================
-- PROCEDURE: usp_GetChannelTypes
-- Get distinct channel types
-- =============================================
IF OBJECT_ID('dbo.usp_GetChannelTypes', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_GetChannelTypes;
GO

CREATE PROCEDURE dbo.usp_GetChannelTypes
AS
BEGIN
    SET NOCOUNT ON;

    SELECT DISTINCT [Channel Type]
    FROM LoanProducts
    WHERE [Channel Type] IS NOT NULL
    ORDER BY [Channel Type];
END;
GO

-- =============================================
-- PROCEDURE: usp_CompareProducts
-- Compare multiple products side by side
-- =============================================
IF OBJECT_ID('dbo.usp_CompareProducts', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_CompareProducts;
GO

CREATE PROCEDURE dbo.usp_CompareProducts
    @ProductIDs NVARCHAR(MAX) -- Comma-separated list of ProductIDs
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM LoanProducts
    WHERE ProductID IN (
        SELECT value 
        FROM STRING_SPLIT(@ProductIDs, ',')
    )
    ORDER BY [Rate1] ASC;
END;
GO

-- =============================================
-- PROCEDURE: usp_GetProductsExpiringSoon
-- Get products expiring soon based on Must Complete By
-- =============================================
IF OBJECT_ID('dbo.usp_GetProductsExpiringSoon', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_GetProductsExpiringSoon;
GO

CREATE PROCEDURE dbo.usp_GetProductsExpiringSoon
    @DaysAhead INT = 30
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM LoanProducts
    WHERE [Must Complete By] IS NOT NULL
        AND TRY_CAST([Must Complete By] as DATE) BETWEEN CAST(GETDATE() as DATE) 
            AND DATEADD(DAY, @DaysAhead, CAST(GETDATE() as DATE))
        AND IsActive = 1
    ORDER BY TRY_CAST([Must Complete By] as DATE) ASC;
END;
GO

-- =============================================
-- PROCEDURE: usp_UpdateProductActiveStatus
-- Update product active status
-- =============================================
IF OBJECT_ID('dbo.usp_UpdateProductActiveStatus', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_UpdateProductActiveStatus;
GO

CREATE PROCEDURE dbo.usp_UpdateProductActiveStatus
    @ProductID NVARCHAR(50),
    @IsActive BIT,
    @UpdatedBy NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;

    BEGIN TRY
        -- Capture old state
        DECLARE @OldIsActive BIT;
        SELECT @OldIsActive = IsActive 
        FROM LoanProducts 
        WHERE ProductID = @ProductID;

        -- Update product
        UPDATE LoanProducts
        SET IsActive = @IsActive,
            UpdatedDate = SYSDATETIME(),
            UpdatedBy = @UpdatedBy
        WHERE ProductID = @ProductID;

        -- Log to history if status changed
        IF @OldIsActive != @IsActive
        BEGIN
            INSERT INTO LoanProductHistory (
                ProductID,
                ChangeType,
                ChangeDescription,
                ChangedBy
            )
            VALUES (
                @ProductID,
                'UPDATE',
                'Active status changed from ' + CAST(@OldIsActive as NVARCHAR(1)) + ' to ' + CAST(@IsActive as NVARCHAR(1)),
                @UpdatedBy
            );
        END;

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- =============================================
-- PROCEDURE: usp_SoftDeleteProduct
-- Soft delete a product (withdraw)
-- =============================================
IF OBJECT_ID('dbo.usp_SoftDeleteProduct', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_SoftDeleteProduct;
GO

CREATE PROCEDURE dbo.usp_SoftDeleteProduct
    @ProductID NVARCHAR(50),
    @WithdrawDate NVARCHAR(50),
    @WithdrawCode NVARCHAR(50),
    @UpdatedBy NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;

    BEGIN TRANSACTION;

    BEGIN TRY
        -- Capture old state for audit
        DECLARE @OldWithdrawDate NVARCHAR(50);
        SELECT @OldWithdrawDate = [Withdraw Date]
        FROM LoanProducts 
        WHERE ProductID = @ProductID;

        -- Update product
        UPDATE LoanProducts
        SET IsActive = 0,
            [Withdraw Date] = @WithdrawDate,
            [Withdraw Code] = @WithdrawCode,
            UpdatedDate = SYSDATETIME(),
            UpdatedBy = @UpdatedBy
        WHERE ProductID = @ProductID;

        -- Log to history
        INSERT INTO LoanProductHistory (
            ProductID,
            OldWithdrawDate,
            NewWithdrawDate,
            ChangeType,
            ChangeDescription,
            ChangedBy
        )
        VALUES (
            @ProductID,
            @OldWithdrawDate,
            @WithdrawDate,
            'UPDATE',
            'Product withdrawn with code: ' + @WithdrawCode,
            @UpdatedBy
        );

        COMMIT TRANSACTION;
    END TRY
    BEGIN CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;
GO

-- =============================================
-- PROCEDURE: usp_GetProductsByCustomerType
-- Get products by customer type
-- =============================================
IF OBJECT_ID('dbo.usp_GetProductsByCustomerType', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_GetProductsByCustomerType;
GO

CREATE PROCEDURE dbo.usp_GetProductsByCustomerType
    @CustomerType NVARCHAR(255),
    @ActiveOnly BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM LoanProducts
    WHERE [Customer Type] = @CustomerType
        AND (@ActiveOnly = 0 OR IsActive = 1)
    ORDER BY [Rate1] ASC, [Launch Date] DESC;
END;
GO

-- =============================================
-- PROCEDURE: usp_GetProductsByChannelType
-- Get products by channel type
-- =============================================
IF OBJECT_ID('dbo.usp_GetProductsByChannelType', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_GetProductsByChannelType;
GO

CREATE PROCEDURE dbo.usp_GetProductsByChannelType
    @ChannelType NVARCHAR(255),
    @ActiveOnly BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM LoanProducts
    WHERE [Channel Type] = @ChannelType
        AND (@ActiveOnly = 0 OR IsActive = 1)
    ORDER BY [Rate1] ASC, [Launch Date] DESC;
END;
GO

-- =============================================
-- PROCEDURE: usp_GetProductsWithCashback
-- Get products offering cashback
-- =============================================
IF OBJECT_ID('dbo.usp_GetProductsWithCashback', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_GetProductsWithCashback;
GO

CREATE PROCEDURE dbo.usp_GetProductsWithCashback
    @ActiveOnly BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM LoanProducts
    WHERE ([Cashback (£)] > 0 OR [Cashback (%)] > 0)
        AND (@ActiveOnly = 0 OR IsActive = 1)
    ORDER BY [Cashback (£)] DESC, [Cashback (%)] DESC;
END;
GO

-- =============================================
-- PROCEDURE: usp_GetProductsWithNoFee
-- Get products with no product fee
-- =============================================
IF OBJECT_ID('dbo.usp_GetProductsWithNoFee', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_GetProductsWithNoFee;
GO

CREATE PROCEDURE dbo.usp_GetProductsWithNoFee
    @ActiveOnly BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    SELECT *
    FROM LoanProducts
    WHERE ([Product Fee (£)] = 0 OR [Product Fee (£)] IS NULL)
        AND ([Product Fee (%)] = 0 OR [Product Fee (%)] IS NULL)
        AND (@ActiveOnly = 0 OR IsActive = 1)
    ORDER BY [Rate1] ASC;
END;
GO

-- =============================================
-- PROCEDURE: usp_GetTopProducts
-- Get top N products by criteria
-- =============================================
IF OBJECT_ID('dbo.usp_GetTopProducts', 'P') IS NOT NULL
    DROP PROCEDURE dbo.usp_GetTopProducts;
GO

CREATE PROCEDURE dbo.usp_GetTopProducts
    @Limit INT = 10,
    @OrderBy NVARCHAR(50) = 'Rate', -- Rate, Fee, LTV, Launch
    @OrderDirection NVARCHAR(4) = 'ASC', -- ASC or DESC
    @ActiveOnly BIT = 1
AS
BEGIN
    SET NOCOUNT ON;

    DECLARE @SQL NVARCHAR(MAX);

    SET @SQL = N'
        SELECT TOP (@Limit) *
        FROM LoanProducts
        WHERE (@ActiveOnly = 0 OR IsActive = 1)
        ORDER BY ';

    -- Add ORDER BY clause based on parameter
    IF @OrderBy = 'Rate'
        SET @SQL = @SQL + '[Rate1]';
    ELSE IF @OrderBy = 'Fee'
        SET @SQL = @SQL + '[Product Fee (£)]';
    ELSE IF @OrderBy = 'LTV'
        SET @SQL = @SQL + '[Max LTV]';
    ELSE IF @OrderBy = 'Launch'
        SET @SQL = @SQL + '[Launch Date]';
    ELSE
        SET @SQL = @SQL + '[Rate1]'; -- Default

    SET @SQL = @SQL + ' ' + @OrderDirection;

    EXEC sp_executesql @SQL, 
        N'@Limit INT, @ActiveOnly BIT', 
        @Limit = @Limit, 
        @ActiveOnly = @ActiveOnly;
END;
GO

PRINT 'All product management stored procedures created successfully!';
GO
