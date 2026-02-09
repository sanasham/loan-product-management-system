export type BatchStatus =
  | 'UPLOADED'
  | 'VALIDATING'
  | 'VALIDATED'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED';

export type ValidationStatus = 'PENDING' | 'VALID' | 'INVALID' | 'PROCESSED';

export interface UploadBatch {
  BatchID: string;
  FileName: string;
  TotalRecords: number;
  ValidRecords: number;
  InvalidRecords: number;
  ProcessedRecords: number;
  BatchStatus: BatchStatus;
  UploadedDate: Date;
  UploadedBy: string;
  ProcessingStarted: Date | null;
  ProcessingCompleted: Date | null;
}

export interface StagingProduct {
  StagingID: number;
  BatchID: string;
  RowNumber: number;
  ProductID: string;
  ProductName: string;
  LoanStartDate: Date | string;
  WithdrawnDate: Date | string | null;
  Pricing: number;
  ValidationStatus: ValidationStatus;
  ValidationErrors: string | null;
  ProcessedDate: Date | null;
  UploadedDate: Date;
  UploadedBy: string;
}

export interface ProcessingLog {
  LogID: number;
  BatchID: string;
  ChunkNumber: number;
  RecordsProcessed: number;
  RecordsCreated: number;
  RecordsUpdated: number;
  RecordsSkipped: number;
  ProcessingTime: number;
  LogDate: Date;
}

export interface ChunkResult {
  created: number;
  updated: number;
  skipped: number;
  processingTime: number;
}

export interface InvalidProduct {
  rowNumber: number;
  productId: string;
  errors: string[];
}
