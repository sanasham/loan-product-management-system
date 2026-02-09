import { Request, Response } from 'express';
import { logger } from '../config/logger.config';
import { BatchProcessingService } from '../services/BatchProcessingService';
import { ExcelParserService } from '../services/ExcelParserService';
import { UploadService } from '../services/UploadService';
import { ValidationService } from '../services/ValidationService';
import { UploadResponse } from '../types/api.types';
import { ApiResponseUtil } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';

export class UploadController {
  private excelParserService: ExcelParserService;
  private uploadService: UploadService;
  private validationService: ValidationService;
  private batchProcessingService: BatchProcessingService;

  constructor() {
    this.excelParserService = new ExcelParserService();
    this.uploadService = new UploadService();
    this.validationService = new ValidationService();
    this.batchProcessingService = new BatchProcessingService();
  }

  /**
   * Handle monthly Excel file upload
   */
  public async uploadFile(req: Request, res: Response): Promise<Response> {
    const startTime = Date.now();

    // Check if file exists
    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    // Get username from authenticated user
    const username = (req as any).user?.username || 'system';
    const fileName = req.file.originalname;

    logger.info(`Processing upload from user: ${username}, file: ${fileName}`);

    try {
      // Step 1: Parse Excel file
      const products = this.excelParserService.parseExcelFile(req.file.buffer);
      logger.info(`Parsed ${products.length} products from Excel`);

      // Step 2: Insert to staging table
      const batchId = await this.uploadService.insertToStaging(
        products,
        fileName,
        username,
      );
      logger.info(`Inserted to staging with batchId: ${batchId}`);

      // Step 3: Validate and process batch (async - don't wait)
      this.validateAndProcess(batchId, username);

      // Step 4: Return immediate response
      const response: UploadResponse = {
        batchId,
        totalRecords: products.length,
        status: 'VALIDATING',
        message: 'Upload received. Validation in progress...',
        statusUrl: `/api/v1/batches/${batchId}/status`,
      };

      const processingTime = Date.now() - startTime;
      logger.info(`Upload processed in ${processingTime}ms`);

      return ApiResponseUtil.success(
        res,
        response,
        'File uploaded successfully',
      );
    } catch (error) {
      logger.error('Upload failed:', error);
      throw error;
    }
  }

  /**
   * Validate and process batch in background
   */
  private async validateAndProcess(
    batchId: string,
    username: string,
  ): Promise<void> {
    try {
      // Validate batch
      await this.validationService.validateBatch(batchId);
      logger.info(`Validation completed for batch ${batchId}`);

      // Start batch processing (fire and forget)
      await this.batchProcessingService.processBatchAsync(batchId, username);
    } catch (error) {
      logger.error(
        `Background validation/processing failed for batch ${batchId}:`,
        error,
      );
    }
  }

  /**
   * Get upload statistics (optional utility method)
   */
  public async getUploadStats(req: Request, res: Response): Promise<Response> {
    try {
      const username = (req as any).user?.username;
      const pool = await (
        await import('../config/database')
      ).database.getPool();
      const sql = (await import('../config/database')).sql;

      const result = await pool
        .request()
        .input('Username', sql.NVarChar(100), username).query(`
          SELECT 
            COUNT(*) as TotalUploads,
            SUM(TotalRecords) as TotalRecordsProcessed,
            SUM(ValidRecords) as TotalValidRecords,
            SUM(InvalidRecords) as TotalInvalidRecords,
            SUM(CASE WHEN BatchStatus = 'COMPLETED' THEN 1 ELSE 0 END) as CompletedBatches,
            SUM(CASE WHEN BatchStatus = 'FAILED' THEN 1 ELSE 0 END) as FailedBatches,
            MIN(UploadedDate) as FirstUpload,
            MAX(UploadedDate) as LastUpload
          FROM UploadBatches
          WHERE UploadedBy = @Username
        `);

      const stats = result.recordset[0];

      return ApiResponseUtil.success(res, stats, 'Upload statistics retrieved');
    } catch (error) {
      logger.error('Failed to get upload stats:', error);
      throw error;
    }
  }

  /**
   * Retry failed batch
   */
  public async retryBatch(req: Request, res: Response): Promise<Response> {
    const { batchId } = req.params;
    const username = (req as any).user?.username || 'system';

    try {
      logger.info(`Retry requested for batch ${batchId} by ${username}`);

      // Get batch details
      const batch = await this.uploadService.getBatchById(batchId);

      // Check if batch is in a retryable state
      if (batch.BatchStatus !== 'FAILED') {
        throw new AppError(
          `Batch cannot be retried. Current status: ${batch.BatchStatus}`,
          400,
        );
      }

      // Reset batch status
      const pool = await (
        await import('../config/database')
      ).database.getPool();
      const sql = (await import('../config/database')).sql;

      await pool.request().input('BatchID', sql.UniqueIdentifier, batchId)
        .query(`
          UPDATE UploadBatches
          SET 
            BatchStatus = 'VALIDATED',
            ProcessedRecords = 0,
            ProcessingStarted = NULL,
            ProcessingCompleted = NULL
          WHERE BatchID = @BatchID;

          UPDATE LoanProductsStaging
          SET 
            ValidationStatus = 'VALID',
            ProcessedDate = NULL
          WHERE BatchID = @BatchID AND ValidationStatus = 'PROCESSED';
        `);

      // Start processing again
      await this.batchProcessingService.processBatchAsync(batchId, username);

      logger.info(`Batch retry initiated successfully for ${batchId}`);

      return ApiResponseUtil.success(
        res,
        { batchId, status: 'PROCESSING' },
        'Batch retry initiated successfully',
      );
    } catch (error) {
      logger.error(`Failed to retry batch ${batchId}:`, error);
      throw error;
    }
  }

  /**
   * Cancel ongoing batch processing
   */
  public async cancelBatch(req: Request, res: Response): Promise<Response> {
    const { batchId } = req.params;
    const username = (req as any).user?.username || 'system';

    try {
      logger.info(`Cancel requested for batch ${batchId} by ${username}`);

      const batch = await this.uploadService.getBatchById(batchId);

      // Check if batch can be cancelled
      if (
        !['VALIDATING', 'VALIDATED', 'PROCESSING'].includes(batch.BatchStatus)
      ) {
        throw new AppError(
          `Batch cannot be cancelled. Current status: ${batch.BatchStatus}`,
          400,
        );
      }

      const pool = await (
        await import('../config/database')
      ).database.getPool();
      const sql = (await import('../config/database')).sql;

      await pool.request().input('BatchID', sql.UniqueIdentifier, batchId)
        .query(`
          UPDATE UploadBatches
          SET BatchStatus = 'FAILED'
          WHERE BatchID = @BatchID
        `);

      logger.info(`Batch cancelled successfully: ${batchId}`);

      return ApiResponseUtil.success(
        res,
        { batchId, status: 'FAILED' },
        'Batch cancelled successfully',
      );
    } catch (error) {
      logger.error(`Failed to cancel batch ${batchId}:`, error);
      throw error;
    }
  }
}
