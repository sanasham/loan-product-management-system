import { v4 as uuidv4 } from 'uuid';
import { database, sql } from '../config/database';
import { logger } from '../config/logger.config';
import { LoanProduct } from '../types/product.types';
import { AppError } from '../utils/AppError';

export class UploadService {
  /**
   * Insert products into staging table
   */
  public async insertToStaging(
    products: LoanProduct[],
    fileName: string,
    username: string,
  ): Promise<string> {
    const pool = await database.getPool();
    const transaction = new sql.Transaction(pool);
    const batchId = uuidv4();

    try {
      await transaction.begin();
      logger.info(`Starting staging insert for batch ${batchId}`);

      // Insert batch record
      const batchRequest = new sql.Request(transaction);
      await batchRequest
        .input('BatchID', sql.UniqueIdentifier, batchId)
        .input('FileName', sql.NVarChar(500), fileName)
        .input('TotalRecords', sql.Int, products.length)
        .input('UploadedBy', sql.NVarChar(100), username).query(`
          INSERT INTO UploadBatches (BatchID, FileName, TotalRecords, UploadedBy)
          VALUES (@BatchID, @FileName, @TotalRecords, @UploadedBy)
        `);

      // Bulk insert to staging
      const table = new sql.Table('LoanProductsStaging');
      table.columns.add('BatchID', sql.UniqueIdentifier, { nullable: false });
      table.columns.add('RowNumber', sql.Int, { nullable: false });
      table.columns.add('ProductID', sql.NVarChar(50), { nullable: false });
      table.columns.add('ProductName', sql.NVarChar(255), { nullable: false });
      table.columns.add('LoanStartDate', sql.Date, { nullable: false });
      table.columns.add('WithdrawnDate', sql.Date, { nullable: true });
      table.columns.add('Pricing', sql.Decimal(5, 2), { nullable: false });
      table.columns.add('UploadedBy', sql.NVarChar(100), { nullable: false });

      products.forEach((product, index) => {
        table.rows.add(
          batchId,
          index + 1,
          product.ProductID,
          product.ProductName,
          product.LoanStartDate,
          product.WithdrawnDate || null,
          product.Pricing,
          username,
        );
      });

      const bulkRequest = new sql.Request(transaction);
      await bulkRequest.bulk(table);

      await transaction.commit();
      logger.info(
        `Successfully inserted ${products.length} records to staging for batch ${batchId}`,
      );

      return batchId;
    } catch (error) {
      await transaction.rollback();
      logger.error(`Staging insert failed for batch ${batchId}:`, error);
      throw new AppError(
        `Failed to insert to staging: ${(error as Error).message}`,
        500,
      );
    }
  }

  /**
   * Get batch by ID
   */
  public async getBatchById(batchId: string): Promise<any> {
    const pool = await database.getPool();
    const request = new sql.Request(pool);

    const result = await request.input('BatchID', sql.UniqueIdentifier, batchId)
      .query(`
        SELECT * FROM UploadBatches
        WHERE BatchID = @BatchID
      `);

    if (result.recordset.length === 0) {
      throw new AppError('Batch not found', 404);
    }

    return result.recordset[0];
  }
}
