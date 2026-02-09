-- Get product by ID with full details
CREATE OR ALTER PROCEDURE dbo.usp_GetProductById
    @ProductID NVARCHAR(50)
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT
        ProductID,
        ProductName,
        LoanStartDate,
        WithdrawnDate,
        Pricing,
        IsActive,
        CreatedDate,
        CreatedBy,
        UpdatedDate,
        UpdatedBy
    FROM dbo.LoanProducts
    WHERE ProductID = @ProductID;
END;
GO

-- Get pricing history for a product
CREATE OR ALTER PROCEDURE dbo.usp_GetProductHistory
    @ProductID NVARCHAR(50),
    @MonthsBack INT = 12
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @StartDate DATETIME2(3) = DATEADD(MONTH, -@MonthsBack, SYSDATETIME());
    
    SELECT
        HistoryID,
        ProductID,
        ProductName,
        OldPricing,
        NewPricing,
        OldWithdrawnDate,
        NewWithdrawnDate,
        ChangeType,
        ChangeDate,
        ChangedBy
    FROM dbo.LoanProductHistory
    WHERE ProductID = @ProductID
      AND ChangeDate >= @StartDate
    ORDER BY ChangeDate DESC;
END;
GO

-- Get all products with pagination
CREATE OR ALTER PROCEDURE dbo.usp_GetProducts
    @PageNumber INT = 1,
    @PageSize INT = 50,
    @SearchTerm NVARCHAR(255) = NULL,
    @ActiveOnly BIT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT
        ProductID,
        ProductName,
        LoanStartDate,
        WithdrawnDate,
        Pricing,
        IsActive,
        UpdatedDate,
        UpdatedBy
    FROM dbo.LoanProducts
    WHERE (@SearchTerm IS NULL OR ProductName LIKE '%' + @SearchTerm + '%' OR ProductID LIKE '%' + @SearchTerm + '%')
      AND (@ActiveOnly IS NULL OR IsActive = @ActiveOnly)
    ORDER BY ProductName
    OFFSET (@PageNumber - 1) * @PageSize ROWS
    FETCH NEXT @PageSize ROWS ONLY;
    
    -- Return total count
    SELECT COUNT(*) AS TotalRecords
    FROM dbo.LoanProducts
    WHERE (@SearchTerm IS NULL OR ProductName LIKE '%' + @SearchTerm + '%' OR ProductID LIKE '%' + @SearchTerm + '%')
      AND (@ActiveOnly IS NULL OR IsActive = @ActiveOnly);
END;
GO