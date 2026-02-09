import * as XLSX from 'xlsx';
import { LoanProduct } from '../types/product.types';
import { AppError } from '../utils/AppError';
import { logger } from '../config/logger.config';

interface ExcelRow {
  ProductID?: string;
  ProductName?: string;
  LoanStartDate?: any;
  WithdrawnDate?: any;
  Pricing?: any;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export class ExcelParserService {
  /**
   * Parse Excel file buffer and extract loan products
   */
  public parseExcelFile(fileBuffer: Buffer): LoanProduct[] {
    try {
      logger.info('Starting Excel file parsing');
      
      const workbook = XLSX.read(fileBuffer, { type: 'buffer', cellDates: true });
      const sheetName = workbook.SheetNames[0];
      
      if (!sheetName) {
        throw new AppError('Excel file contains no sheets', 400);
      }
      
      const worksheet = workbook.Sheets[sheetName];
      const rawData: ExcelRow[] = XLSX.utils.sheet_to_json(worksheet);
      
      if (!rawData || rawData.length === 0) {
        throw new AppError('Excel file is empty', 400);
      }
      
      logger.info(`Parsed ${rawData.length} rows from Excel`);
      
      const products = this.transformAndValidate(rawData);
      
      logger.info(`Successfully validated ${products.length} products`);
      return products;
      
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      logger.error('Excel parsing failed:', error);
      throw new AppError(`Excel parsing failed: ${(error as Error).message}`, 400);
    }
  }

  /**
   * Transform and validate raw Excel data
   */
  private transformAndValidate(rawData: ExcelRow[]): LoanProduct[] {
    const products: LoanProduct[] = [];
    const errors: ValidationError[] = [];

    rawData.forEach((row, index) => {
      const rowNumber = index + 2; // Excel row number (header is row 1)

      try {
        const product: LoanProduct = {
          ProductID: this.validateProductID(row.ProductID, rowNumber),
          ProductName: this.validateProductName(row.ProductName, rowNumber),
          LoanStartDate: this.validateDate(row.LoanStartDate, 'LoanStartDate', rowNumber, false) as string,
          WithdrawnDate: this.validateDate(row.WithdrawnDate, 'WithdrawnDate', rowNumber, true),
          Pricing: this.validatePricing(row.Pricing, rowNumber),
        };

        products.push(product);
      } catch (error) {
        errors.push({
          row: rowNumber,
          field: 'multiple',
          message: (error as Error).message,
        });
      }
    });

    if (errors.length > 0) {
      const errorMessage = errors
        .map((e) => `Row ${e.row}: ${e.message}`)
        .join('; ');
      throw new AppError(`Validation failed: ${errorMessage}`, 400);
    }

    return products;
  }

  /**
   * Validate ProductID
   */
  private validateProductID(value: any, row: number): string {
    if (!value || typeof value !== 'string') {
      throw new Error(`Row ${row}: ProductID is required and must be a string`);
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new Error(`Row ${row}: ProductID cannot be empty`);
    }

    if (trimmed.length > 50) {
      throw new Error(`Row ${row}: ProductID too long (max 50 characters)`);
    }

    return trimmed;
  }

  /**
   * Validate ProductName
   */
  private validateProductName(value: any, row: number): string {
    if (!value || typeof value !== 'string') {
      throw new Error(`Row ${row}: ProductName is required and must be a string`);
    }

    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new Error(`Row ${row}: ProductName cannot be empty`);
    }

    if (trimmed.length > 255) {
      throw new Error(`Row ${row}: ProductName too long (max 255 characters)`);
    }

    return trimmed;
  }

  /**
   * Validate and parse date
   */
  private validateDate(
    value: any,
    fieldName: string,
    row: number,
    optional: boolean = false
  ): string | null {
    if (!value || value === '' || value === null) {
      if (optional) {
        return null;
      }
      throw new Error(`Row ${row}: ${fieldName} is required`);
    }

    let date: Date;

    if (value instanceof Date) {
      date = value;
    } else if (typeof value === 'number') {
      // Excel serial date
      const excelEpoch = new Date(1899, 11, 30);
      date = new Date(excelEpoch.getTime() + value * 86400000);
    } else if (typeof value === 'string') {
      date = new Date(value);
    } else {
      throw new Error(`Row ${row}: ${fieldName} has invalid format`);
    }

    if (isNaN(date.getTime())) {
      throw new Error(`Row ${row}: ${fieldName} is not a valid date`);
    }

    // Return ISO date string (YYYY-MM-DD)
    return date.toISOString().split('T')[0];
  }

  /**
   * Validate pricing
   */
  private validatePricing(value: any, row: number): number {
    const pricing = parseFloat(value);

    if (isNaN(pricing)) {
      throw new Error(`Row ${row}: Pricing must be a valid number`);
    }

    if (pricing < 0 || pricing > 100) {
      throw new Error(`Row ${row}: Pricing must be between 0 and 100`);
    }

    // Round to 2 decimal places
    return Math.round(pricing * 100) / 100;
  }
}