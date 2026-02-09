import { BatchStatus, InvalidProduct } from './batch.types';
import { ProductWithChanges } from './product.types';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

export interface UploadResponse {
  batchId: string;
  totalRecords: number;
  status: BatchStatus;
  message: string;
  statusUrl: string;
}

export interface BatchStatusResponse {
  batchId: string;
  status: BatchStatus;
  fileName: string;
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  processedRecords: number;
  progressPercentage: number;
  chunksCompleted: number;
  totalChunks: number;
  statistics: {
    created: number;
    updated: number;
    skipped: number;
  };
  uploadedDate: Date;
  uploadedBy: string;
  processingStarted: Date | null;
  processingCompleted: Date | null;
}

export interface ReconciliationResponse {
  batchId: string;
  status: BatchStatus;
  summary: {
    totalRecords: number;
    created: number;
    updated: number;
    unchanged: number;
    invalid: number;
  };
  createdProducts: Array<{
    productId: string;
    productName: string;
    pricing: number;
  }>;
  updatedProducts: ProductWithChanges[];
  invalidProducts: InvalidProduct[];
  processingTime: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    totalRecords: number;
    totalPages: number;
  };
}
