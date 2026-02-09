CREATE OR ALTER PROCEDURE dbo.usp_MergeLoanProducts
    @Products dbo.LoanProductTableType READONLY,
    @Username NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    SET XACT_ABORT ON;  -- Automatic rollback on error
    
    BEGIN TRANSACTION;
    
    BEGIN TRY
        -- Temporary table to capture MERGE OUTPUT
        DECLARE @MergeOutput TABLE (
            ActionType NVARCHAR(10),
            ProductID NVARCHAR(50),
            ProductName NVARCHAR(255),
            OldPricing DECIMAL(5,2),
            NewPricing DECIMAL(5,2),
            OldWithdrawnDate DATE,
            NewWithdrawnDate DATE
        );
        
        -- MERGE statement with OUTPUT clause
        MERGE INTO dbo.LoanProducts AS target
        USING @Products AS source
        ON target.ProductID = source.ProductID
        
        -- UPDATE when product exists AND something changed
        WHEN MATCHED AND (
            target.Pricing != source.Pricing OR
            ISNULL(target.WithdrawnDate, '9999-12-31') != ISNULL(source.WithdrawnDate, '9999-12-31') OR
            target.ProductName != source.ProductName OR
            target.LoanStartDate != source.LoanStartDate
        )
        THEN UPDATE SET
            ProductName = source.ProductName,
            LoanStartDate = source.LoanStartDate,
            WithdrawnDate = source.WithdrawnDate,
            Pricing = source.Pricing,
            UpdatedDate = SYSDATETIME(),
            UpdatedBy = @Username
        
        -- INSERT when product doesn't exist
        WHEN NOT MATCHED BY TARGET
        THEN INSERT (
            ProductID,
            ProductName,
            LoanStartDate,
            WithdrawnDate,
            Pricing,
            CreatedBy
        )
        VALUES (
            source.ProductID,
            source.ProductName,
            source.LoanStartDate,
            source.WithdrawnDate,
            source.Pricing,
            @Username
        )
        
        -- OUTPUT clause captures what happened
        OUTPUT
            $action AS ActionType,
            COALESCE(inserted.ProductID, deleted.ProductID) AS ProductID,
            COALESCE(inserted.ProductName, deleted.ProductName) AS ProductName,
            deleted.Pricing AS OldPricing,
            inserted.Pricing AS NewPricing,
            deleted.WithdrawnDate AS OldWithdrawnDate,
            inserted.WithdrawnDate AS NewWithdrawnDate
        INTO @MergeOutput;
        
        -- Insert audit records for all changes
        INSERT INTO dbo.LoanProductHistory (
            ProductID,
            ProductName,
            OldPricing,
            NewPricing,
            OldWithdrawnDate,
            NewWithdrawnDate,
            ChangeType,
            ChangedBy
        )
        SELECT
            ProductID,
            ProductName,
            OldPricing,
            NewPricing,
            OldWithdrawnDate,
            NewWithdrawnDate,
            ActionType,
            @Username
        FROM @MergeOutput
        WHERE ActionType IN ('INSERT', 'UPDATE');
        
        -- Return reconciliation summary
        SELECT
            ActionType,
            ProductID,
            ProductName,
            OldPricing,
            NewPricing,
            OldWithdrawnDate,
            NewWithdrawnDate
        FROM @MergeOutput
        ORDER BY ActionType, ProductID;
        
        COMMIT TRANSACTION;
        
    END TRY
    BEGIN CATCH
        IF @@TRANCOUNT > 0
            ROLLBACK TRANSACTION;
        
        -- Re-throw the error
        THROW;
    END CATCH
END;
GO