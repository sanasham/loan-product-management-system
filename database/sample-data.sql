-- =============================================
-- Sample Data for Testing
-- =============================================

USE LoanProductDB;
GO

-- Insert sample users
INSERT INTO dbo.Users (Username, Email, FullName) VALUES
('jsmith', 'john.smith@bank.com', 'John Smith'),
('mjones', 'mary.jones@bank.com', 'Mary Jones'),
('system', 'system@bank.com', 'System Administrator');
GO

-- Insert sample loan products
DECLARE @SampleProducts dbo.LoanProductTableType;

INSERT INTO @SampleProducts VALUES
('LP-001', 'Personal Loan - Standard', '2023-01-01', NULL, 8.50),
('LP-002', 'Home Loan - Fixed 30Y', '2023-01-01', NULL, 6.25),
('LP-003', 'Auto Loan - New Vehicle', '2023-01-01', NULL, 5.75),
('LP-004', 'Business Loan - SME', '2023-01-01', NULL, 9.00),
('LP-005', 'Education Loan', '2023-01-01', '2024-06-30', 7.50);

EXEC dbo.usp_MergeLoanProducts 
    @Products = @SampleProducts,
    @Username = 'system';
GO

-- View results
SELECT * FROM dbo.LoanProducts ORDER BY ProductID;
SELECT * FROM dbo.LoanProductHistory ORDER BY ChangeDate DESC;
GO




=============================
//monthly updata

-- =============================================
-- Simulate Month 2 Upload (with changes)
-- =============================================

USE LoanProductDB;
GO

DECLARE @Month2Products dbo.LoanProductTableType;

INSERT INTO @Month2Products VALUES
-- Unchanged product
('LP-001', 'Personal Loan - Standard', '2023-01-01', NULL, 8.50),

-- Pricing change
('LP-002', 'Home Loan - Fixed 30Y', '2023-01-01', NULL, 6.50),

-- Withdrawn date change
('LP-003', 'Auto Loan - New Vehicle', '2023-01-01', '2024-12-31', 5.75),

-- Both changed
('LP-004', 'Business Loan - SME', '2023-01-01', '2024-11-30', 9.25),

-- Unchanged (already withdrawn)
('LP-005', 'Education Loan', '2023-01-01', '2024-06-30', 7.50),

-- New product
('LP-006', 'Green Home Loan', '2024-02-01', NULL, 5.99);

EXEC dbo.usp_MergeLoanProducts 
    @Products = @Month2Products,
    @Username = 'mjones';
GO

-- Expected OUTPUT:
-- ActionType | ProductID | ProductName           | OldPricing | NewPricing
-- UPDATE     | LP-002    | Home Loan - Fixed 30Y | 6.25       | 6.50
-- UPDATE     | LP-003    | Auto Loan - New...    | 5.75       | 5.75
-- UPDATE     | LP-004    | Business Loan - SME   | 9.00       | 9.25
-- INSERT     | LP-006    | Green Home Loan       | NULL       | 5.99

-- Verify history
SELECT 
    ProductID,
    ChangeType,
    OldPricing,
    NewPricing,
    ChangeDate,
    ChangedBy
FROM dbo.LoanProductHistory
ORDER BY ChangeDate DESC;
GO
```

---

## 4. BACKEND IMPLEMENTATION

### 4.1 Project Structure
```
loan-product-api/
├── src/
│   ├── config/
│   │   ├── database.js
│   │   └── app.config.js
│   ├── controllers/
│   │   ├── productController.js
│   │   └── uploadController.js
│   ├── services/
│   │   ├── excelParserService.js
│   │   ├── productService.js
│   │   └── auditService.js
│   ├── middleware/
│   │   ├── auth.js
│   │   ├── errorHandler.js
│   │   └── validator.js
│   ├── models/
│   │   └── product.model.js
│   ├── routes/
│   │   ├── products.routes.js
│   │   └── upload.routes.js
│   ├── utils/
│   │   ├── logger.js
│   │   └── response.js
│   └── app.js
├── package.json
└── server.js