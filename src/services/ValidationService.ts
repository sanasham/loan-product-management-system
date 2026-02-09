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
      await pool.request().input('BatchID', sql.UniqueIdentifier, batchId)
        .query(`
          UPDATE s
          SET 
            ValidationStatus = CASE
              WHEN s.Pricing < 0 OR s.Pricing > 100 THEN 'INVALID'
              WHEN LEN(LTRIM(RTRIM(s.ProductID))) = 0 THEN 'INVALID'
              WHEN LEN(LTRIM(RTRIM(s.ProductName))) = 0 THEN 'INVALID'
              WHEN s.LoanStartDate IS NULL THEN 'INVALID'
              ELSE 'VALID'
            END,
            ValidationErrors = CASE
              WHEN s.Pricing < 0 OR s.Pricing > 100 THEN 'Invalid pricing: must be between 0 and 100'
              WHEN LEN(LTRIM(RTRIM(s.ProductID))) = 0 THEN 'Missing ProductID'
              WHEN LEN(LTRIM(RTRIM(s.ProductName))) = 0 THEN 'Missing ProductName'
              WHEN s.LoanStartDate IS NULL THEN 'Missing LoanStartDate'
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

      logger.info(`Validation completed for batch ${batchId}`);
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
          ValidationErrors
        FROM LoanProductsStaging
        WHERE BatchID = @BatchID AND ValidationStatus = 'INVALID'
        ORDER BY RowNumber
      `);

    return result.recordset.map((record) => ({
      rowNumber: record.RowNumber,
      productId: record.ProductID,
      errors: record.ValidationErrors ? record.ValidationErrors.split(';') : [],
    }));
  }
}
