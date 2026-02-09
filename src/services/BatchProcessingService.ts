import { appConfig } from '../config/app.config';
import { database, sql } from '../config/database';
import { logger } from '../config/logger.config';
import { ChunkResult } from '../types/batch.types';

export class BatchProcessingService {
  private chunkSize: number;

  constructor() {
    this.chunkSize = appConfig.batch.chunkSize;
  }

  /**
   * Process batch asynchronously (fire and forget)
   */
  public async processBatchAsync(
    batchId: string,
    username: string,
  ): Promise<void> {
    // Don't await - let it run in background
    this.processBatch(batchId, username).catch((error) => {
      logger.error(`Background batch processing failed for ${batchId}:`, error);
    });
  }

  /**
   * Process entire batch in chunks
   */
  private async processBatch(batchId: string, username: string): Promise<void> {
    const pool = await database.getPool();

    try {
      logger.info(`Starting batch processing for ${batchId}`);

      // Update batch status to PROCESSING
      await pool.request().input('BatchID', sql.UniqueIdentifier, batchId)
        .query(`
          UPDATE UploadBatches
          SET BatchStatus = 'PROCESSING', ProcessingStarted = SYSDATETIME()
          WHERE BatchID = @BatchID
        `);

      // Get total valid records count
      const countResult = await pool
        .request()
        .input('BatchID', sql.UniqueIdentifier, batchId).query(`
          SELECT COUNT(*) as Total
          FROM LoanProductsStaging
          WHERE BatchID = @BatchID AND ValidationStatus = 'VALID'
        `);

      const totalRecords = countResult.recordset[0].Total;
      const totalChunks = Math.ceil(totalRecords / this.chunkSize);

      logger.info(
        `Processing ${totalRecords} records in ${totalChunks} chunks for batch ${batchId}`,
      );

      // Process each chunk
      for (let chunkNumber = 0; chunkNumber < totalChunks; chunkNumber++) {
        await this.processChunk(batchId, chunkNumber, username);

        // Update processed records count
        await this.updateProcessedCount(batchId);
      }

      // Mark batch as completed
      await pool.request().input('BatchID', sql.UniqueIdentifier, batchId)
        .query(`
          UPDATE UploadBatches
          SET BatchStatus = 'COMPLETED', ProcessingCompleted = SYSDATETIME()
          WHERE BatchID = @BatchID
        `);

      logger.info(`Batch processing completed for ${batchId}`);
    } catch (error) {
      logger.error(`Batch processing failed for ${batchId}:`, error);

      // Mark batch as failed
      await pool.request().input('BatchID', sql.UniqueIdentifier, batchId)
        .query(`
          UPDATE UploadBatches
          SET BatchStatus = 'FAILED'
          WHERE BatchID = @BatchID
        `);

      throw error;
    }
  }

  /**
   * Process a single chunk
   */
  private async processChunk(
    batchId: string,
    chunkNumber: number,
    username: string,
  ): Promise<ChunkResult> {
    const pool = await database.getPool();
    const transaction = new sql.Transaction(pool);
    const startTime = Date.now();

    try {
      await transaction.begin();

      const request = new sql.Request(transaction);
      request.input('BatchID', sql.UniqueIdentifier, batchId);
      request.input('ChunkSize', sql.Int, this.chunkSize);
      request.input('Offset', sql.Int, chunkNumber * this.chunkSize);
      request.input('Username', sql.NVarChar(100), username);

      // Process chunk using separate UPDATE and INSERT
      const result = await request.query(`
        DECLARE @Results TABLE (
          Action NVARCHAR(10),
          ProductID NVARCHAR(50),
          ProductName NVARCHAR(255),
          OldPricing DECIMAL(5,2),
          NewPricing DECIMAL(5,2),
          OldWithdrawnDate DATE,
          NewWithdrawnDate DATE
        );

        DECLARE @ChunkData TABLE (
          ProductID NVARCHAR(50),
          ProductName NVARCHAR(255),
          LoanStartDate DATE,
          WithdrawnDate DATE,
          Pricing DECIMAL(5,2),
          UploadedBy NVARCHAR(100)
        );

        -- Get chunk data
        INSERT INTO @ChunkData
        SELECT ProductID, ProductName, LoanStartDate, WithdrawnDate, Pricing, UploadedBy
        FROM LoanProductsStaging
        WHERE BatchID = @BatchID 
          AND ValidationStatus = 'VALID'
        ORDER BY StagingID
        OFFSET @Offset ROWS FETCH NEXT @ChunkSize ROWS ONLY;

        -- UPDATE existing products that have changes
        UPDATE p
        SET 
          ProductName = c.ProductName,
          LoanStartDate = c.LoanStartDate,
          WithdrawnDate = c.WithdrawnDate,
          Pricing = c.Pricing,
          UpdatedDate = SYSDATETIME(),
          UpdatedBy = @Username
        OUTPUT 
          'UPDATE',
          inserted.ProductID,
          inserted.ProductName,
          deleted.Pricing,
          inserted.Pricing,
          deleted.WithdrawnDate,
          inserted.WithdrawnDate
        INTO @Results
        FROM LoanProducts p
        INNER JOIN @ChunkData c ON p.ProductID = c.ProductID
        WHERE 
          p.Pricing != c.Pricing 
          OR ISNULL(p.WithdrawnDate, '9999-12-31') != ISNULL(c.WithdrawnDate, '9999-12-31')
          OR p.ProductName != c.ProductName
          OR p.LoanStartDate != c.LoanStartDate;

        -- INSERT new products
        INSERT INTO LoanProducts (
          ProductID, 
          ProductName, 
          LoanStartDate, 
          WithdrawnDate, 
          Pricing, 
          CreatedBy
        )
        OUTPUT 
          'INSERT',
          inserted.ProductID,
          inserted.ProductName,
          NULL,
          inserted.Pricing,
          NULL,
          inserted.WithdrawnDate
        INTO @Results
        SELECT 
          c.ProductID, 
          c.ProductName, 
          c.LoanStartDate, 
          c.WithdrawnDate, 
          c.Pricing, 
          c.UploadedBy
        FROM @ChunkData c
        WHERE NOT EXISTS (
          SELECT 1 FROM LoanProducts p WHERE p.ProductID = c.ProductID
        );

        -- Insert audit records
        INSERT INTO LoanProductHistory (
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
          Action,
          @Username
        FROM @Results;

        -- Mark staging records as processed
        UPDATE LoanProductsStaging
        SET ValidationStatus = 'PROCESSED', ProcessedDate = SYSDATETIME()
        WHERE StagingID IN (
          SELECT TOP (@ChunkSize) StagingID 
          FROM LoanProductsStaging
          WHERE BatchID = @BatchID AND ValidationStatus = 'VALID'
          ORDER BY StagingID
          OFFSET @Offset ROWS
        );

        -- Return statistics
        SELECT 
          Action,
          COUNT(*) as Count
        FROM @Results
        GROUP BY Action;
      `);

      await transaction.commit();

      const processingTime = Date.now() - startTime;
      const created =
        result.recordset.find((r) => r.Action === 'INSERT')?.Count || 0;
      const updated =
        result.recordset.find((r) => r.Action === 'UPDATE')?.Count || 0;
      const skipped = this.chunkSize - created - updated;

      // Log chunk processing
      await this.logChunkProcessing(
        batchId,
        chunkNumber,
        this.chunkSize,
        created,
        updated,
        skipped,
        processingTime,
      );

      logger.info(
        `Chunk ${chunkNumber} processed: ${created} created, ${updated} updated, ${skipped} skipped`,
      );

      return { created, updated, skipped, processingTime };
    } catch (error) {
      await transaction.rollback();
      logger.error(`Chunk ${chunkNumber} processing failed:`, error);
      throw error;
    }
  }

  /**
   * Log chunk processing details
   */
  private async logChunkProcessing(
    batchId: string,
    chunkNumber: number,
    recordsProcessed: number,
    created: number,
    updated: number,
    skipped: number,
    processingTime: number,
  ): Promise<void> {
    const pool = await database.getPool();

    await pool
      .request()
      .input('BatchID', sql.UniqueIdentifier, batchId)
      .input('ChunkNumber', sql.Int, chunkNumber)
      .input('RecordsProcessed', sql.Int, recordsProcessed)
      .input('RecordsCreated', sql.Int, created)
      .input('RecordsUpdated', sql.Int, updated)
      .input('RecordsSkipped', sql.Int, skipped)
      .input('ProcessingTime', sql.Int, processingTime).query(`
        INSERT INTO ProcessingLog (
          BatchID, 
          ChunkNumber, 
          RecordsProcessed, 
          RecordsCreated, 
          RecordsUpdated, 
          RecordsSkipped, 
          ProcessingTime
        )
        VALUES (
          @BatchID, 
          @ChunkNumber, 
          @RecordsProcessed, 
          @RecordsCreated, 
          @RecordsUpdated, 
          @RecordsSkipped, 
          @ProcessingTime
        )
      `);
  }

  /**
   * Update processed records count in batch
   */
  private async updateProcessedCount(batchId: string): Promise<void> {
    const pool = await database.getPool();

    await pool.request().input('BatchID', sql.UniqueIdentifier, batchId).query(`
        UPDATE b
        SET ProcessedRecords = (
          SELECT COUNT(*) 
          FROM LoanProductsStaging 
          WHERE BatchID = @BatchID AND ValidationStatus = 'PROCESSED'
        )
        FROM UploadBatches b
        WHERE b.BatchID = @BatchID
      `);
  }
}
