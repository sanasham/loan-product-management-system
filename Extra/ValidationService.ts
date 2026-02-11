import { database, sql } from '../config/database';
import { logger } from '../config/logger.config';
import { AppError } from '../utils/AppError';

export class ValidationService {
  /**
   * Validate all staging records for a batch
   */
  public async validateBatch(batchId: string): Promise<void> {
    const pool = await database.getPool();

    try {
      logger.info(`Starting validation for batch ${batchId}`);

      // Update batch status to VALIDATING
      await pool.request().input('BatchID', sql.UniqueIdentifier, batchId)
        .query(`
          UPDATE UploadBatches
          SET BatchStatus = 'VALIDATING'
          WHERE BatchID = @BatchID
        `);

      // Validate all staging records
      // Validation rules:
      // 1. ProductID must not be empty
      // 2. Rate1 should be between 0 and 100 (if provided)
      // 3. Min/Max Loan validation
      // 4. Min/Max LTV validation
      await pool.request().input('BatchID', sql.UniqueIdentifier, batchId)
        .query(`
          UPDATE s
          SET 
            ValidationStatus = CASE
              -- ProductID validation
              WHEN LEN(LTRIM(RTRIM(s.ProductID))) = 0 THEN 'INVALID'
              
              -- Rate1 validation (if provided)
              WHEN s.[Rate1] IS NOT NULL AND (s.[Rate1] < 0 OR s.[Rate1] > 100) THEN 'INVALID'
              
              -- Min/Max Loan validation
              WHEN s.[Min Loan] IS NOT NULL AND s.[Max Loan] IS NOT NULL 
                   AND s.[Min Loan] > s.[Max Loan] THEN 'INVALID'
              
              -- Min/Max LTV validation
              WHEN s.[Min LTV] IS NOT NULL AND s.[Max LTV] IS NOT NULL 
                   AND s.[Min LTV] > s.[Max LTV] THEN 'INVALID'
              
              -- LTV percentage validation
              WHEN s.[Min LTV] IS NOT NULL AND (s.[Min LTV] < 0 OR s.[Min LTV] > 100) THEN 'INVALID'
              WHEN s.[Max LTV] IS NOT NULL AND (s.[Max LTV] < 0 OR s.[Max LTV] > 100) THEN 'INVALID'
              
              -- Term validation (if provided, should be positive)
              WHEN s.[Term] IS NOT NULL AND s.[Term] <= 0 THEN 'INVALID'
              
              -- Product Fee validation (if provided, should not be negative)
              WHEN s.[Product Fee (£)] IS NOT NULL AND s.[Product Fee (£)] < 0 THEN 'INVALID'
              
              -- Repayment APR validation (if provided)
              WHEN s.[Repayment APR] IS NOT NULL AND (s.[Repayment APR] < 0 OR s.[Repayment APR] > 100) THEN 'INVALID'
              
              -- ERC Rate validations
              WHEN s.[ERC Rate1] IS NOT NULL AND (s.[ERC Rate1] < 0 OR s.[ERC Rate1] > 100) THEN 'INVALID'
              WHEN s.[ERC Rate2] IS NOT NULL AND (s.[ERC Rate2] < 0 OR s.[ERC Rate2] > 100) THEN 'INVALID'
              WHEN s.[ERC Rate3] IS NOT NULL AND (s.[ERC Rate3] < 0 OR s.[ERC Rate3] > 100) THEN 'INVALID'
              WHEN s.[ERC Rate4] IS NOT NULL AND (s.[ERC Rate4] < 0 OR s.[ERC Rate4] > 100) THEN 'INVALID'
              WHEN s.[ERC Rate5] IS NOT NULL AND (s.[ERC Rate5] < 0 OR s.[ERC Rate5] > 100) THEN 'INVALID'
              WHEN s.[ERC Rate6] IS NOT NULL AND (s.[ERC Rate6] < 0 OR s.[ERC Rate6] > 100) THEN 'INVALID'
              WHEN s.[ERC Rate7] IS NOT NULL AND (s.[ERC Rate7] < 0 OR s.[ERC Rate7] > 100) THEN 'INVALID'
              WHEN s.[ERC Rate8] IS NOT NULL AND (s.[ERC Rate8] < 0 OR s.[ERC Rate8] > 100) THEN 'INVALID'
              
              -- All other Rate validations
              WHEN s.[Rate2] IS NOT NULL AND (s.[Rate2] < 0 OR s.[Rate2] > 100) THEN 'INVALID'
              WHEN s.[Rate3] IS NOT NULL AND (s.[Rate3] < 0 OR s.[Rate3] > 100) THEN 'INVALID'
              WHEN s.[Rate4] IS NOT NULL AND (s.[Rate4] < 0 OR s.[Rate4] > 100) THEN 'INVALID'
              WHEN s.[Rate5] IS NOT NULL AND (s.[Rate5] < 0 OR s.[Rate5] > 100) THEN 'INVALID'
              WHEN s.[Rate6] IS NOT NULL AND (s.[Rate6] < 0 OR s.[Rate6] > 100) THEN 'INVALID'
              WHEN s.[Rate7] IS NOT NULL AND (s.[Rate7] < 0 OR s.[Rate7] > 100) THEN 'INVALID'
              WHEN s.[Rate8] IS NOT NULL AND (s.[Rate8] < 0 OR s.[Rate8] > 100) THEN 'INVALID'
              
              -- Cashback amount validations
              WHEN s.[Cashback Minimum Amount] IS NOT NULL AND s.[Cashback Maximum Amount] IS NOT NULL
                   AND s.[Cashback Minimum Amount] > s.[Cashback Maximum Amount] THEN 'INVALID'
              
              -- All validations passed
              ELSE 'VALID'
            END,
            
            ValidationErrors = CASE
              -- ProductID errors
              WHEN LEN(LTRIM(RTRIM(s.ProductID))) = 0 THEN 'Missing or empty ProductID'
              
              -- Rate1 errors
              WHEN s.[Rate1] IS NOT NULL AND s.[Rate1] < 0 THEN 'Rate1 cannot be negative'
              WHEN s.[Rate1] IS NOT NULL AND s.[Rate1] > 100 THEN 'Rate1 cannot exceed 100%'
              
              -- Loan amount errors
              WHEN s.[Min Loan] IS NOT NULL AND s.[Max Loan] IS NOT NULL 
                   AND s.[Min Loan] > s.[Max Loan] THEN 'Min Loan cannot be greater than Max Loan'
              
              -- LTV errors
              WHEN s.[Min LTV] IS NOT NULL AND s.[Max LTV] IS NOT NULL 
                   AND s.[Min LTV] > s.[Max LTV] THEN 'Min LTV cannot be greater than Max LTV'
              WHEN s.[Min LTV] IS NOT NULL AND s.[Min LTV] < 0 THEN 'Min LTV cannot be negative'
              WHEN s.[Min LTV] IS NOT NULL AND s.[Min LTV] > 100 THEN 'Min LTV cannot exceed 100%'
              WHEN s.[Max LTV] IS NOT NULL AND s.[Max LTV] < 0 THEN 'Max LTV cannot be negative'
              WHEN s.[Max LTV] IS NOT NULL AND s.[Max LTV] > 100 THEN 'Max LTV cannot exceed 100%'
              
              -- Term errors
              WHEN s.[Term] IS NOT NULL AND s.[Term] <= 0 THEN 'Term must be positive'
              
              -- Product Fee errors
              WHEN s.[Product Fee (£)] IS NOT NULL AND s.[Product Fee (£)] < 0 THEN 'Product Fee cannot be negative'
              
              -- Repayment APR errors
              WHEN s.[Repayment APR] IS NOT NULL AND s.[Repayment APR] < 0 THEN 'Repayment APR cannot be negative'
              WHEN s.[Repayment APR] IS NOT NULL AND s.[Repayment APR] > 100 THEN 'Repayment APR cannot exceed 100%'
              
              -- ERC Rate errors
              WHEN s.[ERC Rate1] IS NOT NULL AND (s.[ERC Rate1] < 0 OR s.[ERC Rate1] > 100) THEN 'ERC Rate1 must be between 0 and 100%'
              WHEN s.[ERC Rate2] IS NOT NULL AND (s.[ERC Rate2] < 0 OR s.[ERC Rate2] > 100) THEN 'ERC Rate2 must be between 0 and 100%'
              WHEN s.[ERC Rate3] IS NOT NULL AND (s.[ERC Rate3] < 0 OR s.[ERC Rate3] > 100) THEN 'ERC Rate3 must be between 0 and 100%'
              WHEN s.[ERC Rate4] IS NOT NULL AND (s.[ERC Rate4] < 0 OR s.[ERC Rate4] > 100) THEN 'ERC Rate4 must be between 0 and 100%'
              WHEN s.[ERC Rate5] IS NOT NULL AND (s.[ERC Rate5] < 0 OR s.[ERC Rate5] > 100) THEN 'ERC Rate5 must be between 0 and 100%'
              WHEN s.[ERC Rate6] IS NOT NULL AND (s.[ERC Rate6] < 0 OR s.[ERC Rate6] > 100) THEN 'ERC Rate6 must be between 0 and 100%'
              WHEN s.[ERC Rate7] IS NOT NULL AND (s.[ERC Rate7] < 0 OR s.[ERC Rate7] > 100) THEN 'ERC Rate7 must be between 0 and 100%'
              WHEN s.[ERC Rate8] IS NOT NULL AND (s.[ERC Rate8] < 0 OR s.[ERC Rate8] > 100) THEN 'ERC Rate8 must be between 0 and 100%'
              
              -- Other Rate errors
              WHEN s.[Rate2] IS NOT NULL AND (s.[Rate2] < 0 OR s.[Rate2] > 100) THEN 'Rate2 must be between 0 and 100%'
              WHEN s.[Rate3] IS NOT NULL AND (s.[Rate3] < 0 OR s.[Rate3] > 100) THEN 'Rate3 must be between 0 and 100%'
              WHEN s.[Rate4] IS NOT NULL AND (s.[Rate4] < 0 OR s.[Rate4] > 100) THEN 'Rate4 must be between 0 and 100%'
              WHEN s.[Rate5] IS NOT NULL AND (s.[Rate5] < 0 OR s.[Rate5] > 100) THEN 'Rate5 must be between 0 and 100%'
              WHEN s.[Rate6] IS NOT NULL AND (s.[Rate6] < 0 OR s.[Rate6] > 100) THEN 'Rate6 must be between 0 and 100%'
              WHEN s.[Rate7] IS NOT NULL AND (s.[Rate7] < 0 OR s.[Rate7] > 100) THEN 'Rate7 must be between 0 and 100%'
              WHEN s.[Rate8] IS NOT NULL AND (s.[Rate8] < 0 OR s.[Rate8] > 100) THEN 'Rate8 must be between 0 and 100%'
              
              -- Cashback errors
              WHEN s.[Cashback Minimum Amount] IS NOT NULL AND s.[Cashback Maximum Amount] IS NOT NULL
                   AND s.[Cashback Minimum Amount] > s.[Cashback Maximum Amount] 
                   THEN 'Cashback Minimum Amount cannot be greater than Maximum Amount'
              
              -- No errors
              ELSE NULL
            END
          FROM LoanProductsStaging s
          WHERE s.BatchID = @BatchID
        `);

      // Update batch with validation counts
      await pool.request().input('BatchID', sql.UniqueIdentifier, batchId)
        .query(`
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
          WHERE b.BatchID = @BatchID
        `);

      // Get validation summary
      const summaryResult = await pool
        .request()
        .input('BatchID', sql.UniqueIdentifier, batchId).query(`
          SELECT 
            BatchStatus,
            TotalRecords,
            ValidRecords,
            InvalidRecords
          FROM UploadBatches
          WHERE BatchID = @BatchID
        `);

      const summary = summaryResult.recordset[0];

      logger.info(`Validation completed for batch ${batchId}`, {
        total: summary.TotalRecords,
        valid: summary.ValidRecords,
        invalid: summary.InvalidRecords,
      });
    } catch (error) {
      logger.error(`Validation failed for batch ${batchId}:`, error);

      // Mark batch as failed
      await pool.request().input('BatchID', sql.UniqueIdentifier, batchId)
        .query(`
          UPDATE UploadBatches
          SET BatchStatus = 'FAILED'
          WHERE BatchID = @BatchID
        `);

      throw new AppError(`Validation failed: ${(error as Error).message}`, 500);
    }
  }

  /**
   * Get invalid products for a batch
   */
  public async getInvalidProducts(batchId: string): Promise<any[]> {
    const pool = await database.getPool();

    const result = await pool
      .request()
      .input('BatchID', sql.UniqueIdentifier, batchId).query(`
        SELECT 
          RowNumber,
          ProductID,
          [MSP-LBG Product Code] as ProductCode,
          ValidationErrors
        FROM LoanProductsStaging
        WHERE BatchID = @BatchID AND ValidationStatus = 'INVALID'
        ORDER BY RowNumber
      `);

    return result.recordset.map((record) => ({
      rowNumber: record.RowNumber,
      productId: record.ProductID,
      productCode: record.ProductCode,
      errors: record.ValidationErrors
        ? record.ValidationErrors.split(';').map((e: string) => e.trim())
        : [],
    }));
  }

  /**
   * Get validation summary for a batch
   */
  public async getValidationSummary(batchId: string): Promise<any> {
    const pool = await database.getPool();

    const result = await pool
      .request()
      .input('BatchID', sql.UniqueIdentifier, batchId).query(`
        SELECT 
          b.BatchID,
          b.FileName,
          b.TotalRecords,
          b.ValidRecords,
          b.InvalidRecords,
          b.BatchStatus,
          b.UploadedDate,
          b.UploadedBy,
          (
            SELECT TOP 5
              RowNumber,
              ProductID,
              ValidationErrors
            FROM LoanProductsStaging
            WHERE BatchID = b.BatchID AND ValidationStatus = 'INVALID'
            ORDER BY RowNumber
            FOR JSON PATH
          ) AS InvalidProductsSample
        FROM UploadBatches b
        WHERE b.BatchID = @BatchID
      `);

    if (result.recordset.length === 0) {
      throw new AppError('Batch not found', 404);
    }

    const batch = result.recordset[0];

    return {
      batchId: batch.BatchID,
      fileName: batch.FileName,
      totalRecords: batch.TotalRecords,
      validRecords: batch.ValidRecords,
      invalidRecords: batch.InvalidRecords,
      status: batch.BatchStatus,
      uploadedDate: batch.UploadedDate,
      uploadedBy: batch.UploadedBy,
      invalidProductsSample: batch.InvalidProductsSample
        ? JSON.parse(batch.InvalidProductsSample)
        : [],
    };
  }

  /**
   * Re-validate a specific product in staging
   */
  public async revalidateProduct(
    batchId: string,
    rowNumber: number,
  ): Promise<void> {
    const pool = await database.getPool();

    await pool
      .request()
      .input('BatchID', sql.UniqueIdentifier, batchId)
      .input('RowNumber', sql.Int, rowNumber).query(`
        UPDATE s
        SET 
          ValidationStatus = CASE
            WHEN LEN(LTRIM(RTRIM(s.ProductID))) = 0 THEN 'INVALID'
            WHEN s.[Rate1] IS NOT NULL AND (s.[Rate1] < 0 OR s.[Rate1] > 100) THEN 'INVALID'
            ELSE 'VALID'
          END,
          ValidationErrors = CASE
            WHEN LEN(LTRIM(RTRIM(s.ProductID))) = 0 THEN 'Missing or empty ProductID'
            WHEN s.[Rate1] IS NOT NULL AND (s.[Rate1] < 0 OR s.[Rate1] > 100) THEN 'Invalid Rate1: must be between 0 and 100'
            ELSE NULL
          END
        FROM LoanProductsStaging s
        WHERE s.BatchID = @BatchID AND s.RowNumber = @RowNumber
      `);

    logger.info(`Re-validated product at row ${rowNumber} in batch ${batchId}`);
  }

  /**
   * Get detailed validation rules
   */
  public getValidationRules(): any {
    return {
      required: ['ProductID'],
      ranges: {
        Rate1: { min: 0, max: 100 },
        Rate2: { min: 0, max: 100 },
        Rate3: { min: 0, max: 100 },
        Rate4: { min: 0, max: 100 },
        Rate5: { min: 0, max: 100 },
        Rate6: { min: 0, max: 100 },
        Rate7: { min: 0, max: 100 },
        Rate8: { min: 0, max: 100 },
        'ERC Rate1': { min: 0, max: 100 },
        'ERC Rate2': { min: 0, max: 100 },
        'ERC Rate3': { min: 0, max: 100 },
        'ERC Rate4': { min: 0, max: 100 },
        'ERC Rate5': { min: 0, max: 100 },
        'ERC Rate6': { min: 0, max: 100 },
        'ERC Rate7': { min: 0, max: 100 },
        'ERC Rate8': { min: 0, max: 100 },
        'Repayment APR': { min: 0, max: 100 },
        'Min LTV': { min: 0, max: 100 },
        'Max LTV': { min: 0, max: 100 },
        Term: { min: 0.01, max: 999 },
      },
      comparisons: {
        'Min Loan vs Max Loan': 'Min Loan must be <= Max Loan',
        'Min LTV vs Max LTV': 'Min LTV must be <= Max LTV',
        'Cashback Min vs Max':
          'Cashback Minimum Amount must be <= Cashback Maximum Amount',
      },
      positiveValues: [
        'Product Fee (£)',
        'Min Loan',
        'Max Loan',
        'CHAPS Fee',
        'Cashback (£)',
        'Panel Number',
      ],
    };
  }
}
