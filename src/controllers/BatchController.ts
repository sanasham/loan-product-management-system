import { Request, Response } from 'express';
import { database, sql } from '../config/database';
import { ValidationService } from '../services/ValidationService';
import { ApiResponseUtil } from '../utils/ApiResponse';
import { AppError } from '../utils/AppError';
import { logger } from '../config/logger.config';
import { 
  BatchStatusResponse, 
  ReconciliationResponse,
  PaginatedResponse 
} from '../types/api.types';
import { UploadBatch } from '../types/batch.types';

export class BatchController {
  private validationService: ValidationService;

  constructor() {
    this.validationService = new ValidationService();
  }

  /**
   * Get batch processing status
   */
  public async getBatchStatus(req: Request, res: Response): Promise<Response> {
    const { batchId } = req.params;

    try {
      const pool = await database.getPool();

      // Get batch details with processing statistics
      const result = await pool.request()
        .input('BatchID', sql.UniqueIdentifier, batchId)
        .query(`
          SELECT 
            b.*,
            (SELECT COUNT(*) FROM ProcessingLog WHERE BatchID = b.BatchID) as ChunksCompleted,
            (SELECT SUM(RecordsCreated) FROM ProcessingLog WHERE BatchID = b.BatchID) as TotalCreated,
            (SELECT SUM(RecordsUpdated) FROM ProcessingLog WHERE BatchID = b.BatchID) as TotalUpdated,
            (SELECT SUM(RecordsSkipped) FROM ProcessingLog WHERE BatchID = b.BatchID) as TotalSkipped
          FROM UploadBatches b
          WHERE b.BatchID = @BatchID
        `);

      if (result.recordset.length === 0) {
        throw new AppError('Batch not found', 404);
      }

      const batch = result.recordset[0];

      // Calculate total chunks
      const totalChunks = batch.ValidRecords > 0 
        ? Math.ceil(batch.ValidRecords / 500) 
        : 0;

      // Calculate progress percentage
      const progressPercentage = batch.ValidRecords > 0
        ? Math.round((batch.ProcessedRecords / batch.ValidRecords) * 100)
        : 0;

      const response: BatchStatusResponse = {
        batchId: batch.BatchID,
        status: batch.BatchStatus,
        fileName: batch.FileName,
        totalRecords: batch.TotalRecords,
        validRecords: batch.ValidRecords,
        invalidRecords: batch.InvalidRecords,
        processedRecords: batch.ProcessedRecords,
        progressPercentage,
        chunksCompleted: batch.ChunksCompleted || 0,
        totalChunks,
        statistics: {
          created: batch.TotalCreated || 0,
          updated: batch.TotalUpdated || 0,
          skipped: batch.TotalSkipped || 0,
        },
        uploadedDate: batch.UploadedDate,
        uploadedBy: batch.UploadedBy,
        processingStarted: batch.ProcessingStarted,
        processingCompleted: batch.ProcessingCompleted,
      };

      return ApiResponseUtil.success(res, response);
    } catch (error) {
      logger.error(`Failed to get batch status for ${batchId}:`, error);
      throw error;
    }
  }

  /**
   * Get batch reconciliation report
   */
  public async getReconciliation(req: Request, res: Response): Promise<Response> {
    const { batchId } = req.params;

    try {
      const pool = await database.getPool();

      // Get batch details
      const batchResult = await pool.request()
        .input('BatchID', sql.UniqueIdentifier, batchId)
        .query(`
          SELECT * FROM UploadBatches WHERE BatchID = @BatchID
        `);

      if (batchResult.recordset.length === 0) {
        throw new AppError('Batch not found', 404);
      }

      const batch = batchResult.recordset[0];

      if (batch.BatchStatus !== 'COMPLETED') {
        throw new AppError('Batch processing not completed yet', 400);
      }

      // Get created products
      const createdResult = await pool.request()
        .input('BatchID', sql.UniqueIdentifier, batchId)
        .query(`
          SELECT DISTINCT
            h.ProductID,
            h.ProductName,
            h.NewPricing as Pricing
          FROM LoanProductHistory h
          INNER JOIN LoanProductsStaging s ON h.ProductID = s.ProductID
          WHERE s.BatchID = @BatchID 
            AND h.ChangeType = 'INSERT'
            AND h.ChangeDate >= (SELECT UploadedDate FROM UploadBatches WHERE BatchID = @BatchID)
          ORDER BY h.ProductID
        `);

      // Get updated products
      const updatedResult = await pool.request()
        .input('BatchID', sql.UniqueIdentifier, batchId)
        .query(`
          SELECT DISTINCT
            h.ProductID,
            h.ProductName,
            h.OldPricing,
            h.NewPricing,
            h.OldWithdrawnDate,
            h.NewWithdrawnDate
          FROM LoanProductHistory h
          INNER JOIN LoanProductsStaging s ON h.ProductID = s.ProductID
          WHERE s.BatchID = @BatchID 
            AND h.ChangeType = 'UPDATE'
            AND h.ChangeDate >= (SELECT UploadedDate FROM UploadBatches WHERE BatchID = @BatchID)
          ORDER BY h.ProductID
        `);

      // Get invalid products
      const invalidProducts = await this.validationService.getInvalidProducts(batchId);

      // Get processing time
      const processingTimeResult = await pool.request()
        .input('BatchID', sql.UniqueIdentifier, batchId)
        .query(`
          SELECT SUM(ProcessingTime) as TotalTime
          FROM ProcessingLog
          WHERE BatchID = @BatchID
        `);

      const processingTime = processingTimeResult.recordset[0]?.TotalTime || 0;

      // Calculate unchanged
      const unchanged = batch.TotalRecords - 
        createdResult.recordset.length - 
        updatedResult.recordset.length - 
        batch.InvalidRecords;

      const response: ReconciliationResponse = {
        batchId: batch.BatchID,
        status: batch.BatchStatus,
        summary: {
          totalRecords: batch.TotalRecords,
          created: createdResult.recordset.length,
          updated: updatedResult.recordset.length,
          unchanged,
          invalid: batch.InvalidRecords,
        },
        createdProducts: createdResult.recordset.map((r: any) => ({
          productId: r.ProductID,
          productName: r.ProductName,
          pricing: r.Pricing,
        })),
        updatedProducts: updatedResult.recordset.map((r: any) => {
          const changes: any = {};
          
          if (r.OldPricing !== r.NewPricing) {
            changes.pricing = {
              from: r.OldPricing,
              to: r.NewPricing,
            };
          }
          
          if (r.OldWithdrawnDate !== r.NewWithdrawnDate) {
            changes.withdrawnDate = {
              from: r.OldWithdrawnDate,
              to: r.NewWithdrawnDate,
            };
          }
          
          return {
            productId: r.ProductID,
            productName: r.ProductName,
            changes,
          };
        }),
        invalidProducts,
        processingTime,
      };

      return ApiResponseUtil.success(res, response);
    } catch (error) {
      logger.error(`Failed to get reconciliation for ${batchId}:`, error);
      throw error;
    }
  }

  /**
   * Get all batches with pagination
   */
  public async getAllBatches(req: Request, res: Response): Promise<Response> {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const offset = (page - 1) * pageSize;

    try {
      const pool = await database.getPool();

      // Get batches with pagination
      const result = await pool.request()
        .input('PageSize', sql.Int, pageSize)
        .input('Offset', sql.Int, offset)
        .query(`
          SELECT * FROM UploadBatches
          ORDER BY UploadedDate DESC
          OFFSET @Offset ROWS
          FETCH NEXT @PageSize ROWS ONLY;

          SELECT COUNT(*) as TotalRecords FROM UploadBatches;
        `);

      const batches = (result.recordsets as any[])[0];
      const totalRecords = (result.recordsets as any[])[1][0].TotalRecords;
      const totalPages = Math.ceil(totalRecords / pageSize);

      const response: PaginatedResponse<UploadBatch> = {
        data: batches,
        pagination: {
          page,
          pageSize,
          totalRecords,
          totalPages,
        },
      };

      return ApiResponseUtil.success(res, response);
    } catch (error) {
      logger.error('Failed to get batches:', error);
      throw error;
    }
  }
}