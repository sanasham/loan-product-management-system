import * as XLSX from 'xlsx';
import { logger } from '../config/logger.config';
import { ExcelProductRow, LoanProduct } from '../types/product.types';
import { AppError } from '../utils/AppError';

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

      const workbook = XLSX.read(fileBuffer, {
        type: 'buffer',
        cellDates: false,
      });
      const sheetName = workbook.SheetNames[0];

      if (!sheetName) {
        throw new AppError('Excel file contains no sheets', 400);
      }

      const worksheet = workbook.Sheets[sheetName];
      const rawData: ExcelProductRow[] = XLSX.utils.sheet_to_json(worksheet, {
        raw: false,
      });

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
      throw new AppError(
        `Excel parsing failed: ${(error as Error).message}`,
        400,
      );
    }
  }

  /**
   * Transform and validate raw Excel data
   */
  private transformAndValidate(rawData: ExcelProductRow[]): LoanProduct[] {
    const products: LoanProduct[] = [];
    const errors: ValidationError[] = [];

    rawData.forEach((row, index) => {
      const rowNumber = index + 2; // Excel row number (header is row 1)

      try {
        // Use MSP-LBG Product Code as ProductID, or generate one if missing
        const productId = this.validateProductID(
          row['MSP-LBG Product Code'],
          rowNumber,
        );

        const product: LoanProduct = {
          ProductID: productId,

          // Product Basic Info
          'Launch Date': this.cleanString(row['Launch Date']),
          Brand: this.cleanString(row['Brand']),
          'Withdraw Date': this.cleanString(row['Withdraw Date']),
          'Withdraw Code': this.cleanString(row['Withdraw Code']),
          'MSP-LBG Product Code': this.cleanString(row['MSP-LBG Product Code']),
          'Channel Type': this.cleanString(row['Channel Type']),
          'Customer Type': this.cleanString(row['Customer Type']),

          // Term and Type
          Term: this.parseDecimal(row['Term']),
          Type: this.cleanString(row['Type']),

          // BOE and Rate Tiers (8 tiers)
          'BOE1+/-': this.parseDecimal(row['BOE1+/-']),
          Rate1: this.parseDecimal(row['Rate1']),
          Until1: this.cleanString(row['Until1']),

          'BOE2+/-': this.parseDecimal(row['BOE2+/-']),
          Rate2: this.parseDecimal(row['Rate2']),
          Until2: this.cleanString(row['Until2']),

          'BOE3+/-': this.parseDecimal(row['BOE3+/-']),
          Rate3: this.parseDecimal(row['Rate3']),
          Until3: this.cleanString(row['Until3']),

          'BOE4+/-': this.parseDecimal(row['BOE4+/-']),
          Rate4: this.parseDecimal(row['Rate4']),
          Until4: this.cleanString(row['Until4']),

          'BOE5+/-': this.parseDecimal(row['BOE5+/-']),
          Rate5: this.parseDecimal(row['Rate5']),
          Until5: this.cleanString(row['Until5']),

          'BOE6+/-': this.parseDecimal(row['BOE6+/-']),
          Rate6: this.parseDecimal(row['Rate6']),
          Until6: this.cleanString(row['Until6']),

          'BOE7+/-': this.parseDecimal(row['BOE7+/-']),
          Rate7: this.parseDecimal(row['Rate7']),
          Until7: this.cleanString(row['Until7']),

          'BOE8+/-': this.parseDecimal(row['BOE8+/-']),
          Rate8: this.parseDecimal(row['Rate8']),
          Until8: this.cleanString(row['Until8']),

          // Fees
          'Product Fee (£)': this.parseInteger(row['Product Fee (£)']),
          'Product Fee (%)': this.parseInteger(row['Product Fee (%)']),

          // Loan Limits
          'Min Loan': this.parseInteger(row['Min Loan']),
          'Max Loan': this.parseInteger(row['Max Loan']),
          'Min LTV': this.parseInteger(row['Min LTV']),
          'Max LTV': this.parseInteger(row['Max LTV']),

          // Additional Information
          'Additional info': this.cleanString(row['Additional info']),
          'Must Complete By': this.cleanString(row['Must Complete By']),
          'Product Fee Acknum': this.cleanString(row['Product Fee Acknum']),
          'Repayment APR': this.parseDecimal(row['Repayment APR']),
          'Scheme Type': this.cleanString(row['Scheme Type']),
          'Portable Product': this.cleanString(row['Portable Product']),
          'Panel Number': this.parseInteger(row['Panel Number']),
          'Payee Number': this.cleanString(row['Payee Number']),
          'Interest Calculation': this.cleanString(row['Interest Calculation']),
          'Link to HVR / HHVR': this.cleanString(row['Link to HVR / HHVR']),
          'Refund of Val': this.cleanString(row['Refund of Val']),
          'Val Refund Acknum': this.cleanString(row['Val Refund Acknum']),
          'Free Val': this.cleanString(row['Free Val']),
          'Free Conveyancing': this.cleanString(row['Free Conveyancing']),
          'DAF to be waived': this.cleanString(row['DAF to be waived']),
          'HLC Free': this.cleanString(row['HLC Free']),

          // Cashback
          'Cashback (£)': this.parseInteger(row['Cashback (£)']),
          'Cashback (%)': this.cleanString(row['Cashback (%)']),
          'Cashback Acknum': this.cleanString(row['Cashback Acknum']),
          'Proc Fee Code': this.cleanString(row['Proc Fee Code']),
          'Proc Fee Narrative': this.cleanString(row['Proc Fee Narrative']),

          // Tied Text Fields
          'Tied Insurance Free Format Text': this.cleanString(
            row['Tied Insurance Free Format Text'],
          ),
          'Tied Non Insurance Free Format Text': this.cleanString(
            row['Tied Non Insurance Free Format Text'],
          ),
          'Tied Incentivised Free Format Text': this.cleanString(
            row['Tied Incentivised Free Format Text'],
          ),
          Narrative: this.cleanString(row['Narrative']),

          // Credit and Scoring
          'Best Credit Score Applicable': this.cleanString(
            row['Best Credit Score Applicable'],
          ),
          'Worst Credit Score Applicable': this.cleanString(
            row['Worst Credit Score Applicable'],
          ),
          'CarbonOffset (%)': this.cleanString(row['CarbonOffset (%)']),
          Calculator: this.cleanString(row['Calculator']),
          Extras: this.parseInteger(row['Extras']),
          'BERR (Government Reporting)': this.cleanString(
            row['BERR (Government Reporting)'],
          ),

          // ERC (Early Repayment Charge) Rates (8 tiers)
          'ERC Rate1': this.parseDecimal(row['ERC Rate1']),
          'ERC Until1': this.cleanString(row['ERC Until1']),
          'ERC Rate2': this.parseDecimal(row['ERC Rate2']),
          'ERC Until2': this.cleanString(row['ERC Until2']),
          'ERC Rate3': this.parseDecimal(row['ERC Rate3']),
          'ERC Until3': this.cleanString(row['ERC Until3']),
          'ERC Rate4': this.parseDecimal(row['ERC Rate4']),
          'ERC Until4': this.cleanString(row['ERC Until4']),
          'ERC Rate5': this.parseDecimal(row['ERC Rate5']),
          'ERC Until5': this.cleanString(row['ERC Until5']),
          'ERC Rate6': this.parseDecimal(row['ERC Rate6']),
          'ERC Until6': this.cleanString(row['ERC Until6']),
          'ERC Rate7': this.parseDecimal(row['ERC Rate7']),
          'ERC Until7': this.cleanString(row['ERC Until7']),
          'ERC Rate8': this.parseDecimal(row['ERC Rate8']),
          'ERC Until8': this.cleanString(row['ERC Until8']),

          // Cashback Limits
          'Cashback Minimum Amount': this.parseInteger(
            row['Cashback Minimum Amount'],
          ),
          'Cashback Maximum Amount': this.parseInteger(
            row['Cashback Maximum Amount'],
          ),
          'Cashback Type': this.cleanString(row['Cashback Type']),
          'Repayment Fees': this.cleanString(row['Repayment Fees']),

          // Portable Tied Text
          'Portable Tied Non Insurance Free Format Text': this.cleanString(
            row['Portable Tied Non Insurance Free Format Text'],
          ),
          'Portable Tied Incentivised Free Format Text': this.cleanString(
            row['Portable Tied Incentivised Free Format Text'],
          ),

          // UFSS Product Codes
          'UFSS Interest Only Product Code (CGM)': this.cleanString(
            row['UFSS Interest Only Product Code (CGM)'],
          ),
          'UFSS Repayment Product Code (CGM)': this.cleanString(
            row['UFSS Repayment Product Code (CGM)'],
          ),
          'UFSS Interest Only Product Code (MOR)': this.cleanString(
            row['UFSS Interest Only Product Code (MOR)'],
          ),
          'UFSS Repayment Product Code (MOR)': this.cleanString(
            row['UFSS Repayment Product Code (MOR)'],
          ),
          'UFSS Interest Only Product Code (LBM)': this.cleanString(
            row['UFSS Interest Only Product Code (LBM)'],
          ),
          'UFSS Repayment Product Code (LBM)': this.cleanString(
            row['UFSS Repayment Product Code (LBM)'],
          ),
          'UFSS Interest Only Product Code (BMG)': this.cleanString(
            row['UFSS Interest Only Product Code (BMG)'],
          ),
          'UFSS Repayment Product Code (BMG)': this.cleanString(
            row['UFSS Repayment Product Code (BMG)'],
          ),

          // Account and Product Details
          'Account Type': this.cleanString(row['Account Type']),
          'Current Product Cessation Type': this.cleanString(
            row['Current Product Cessation Type'],
          ),
          'Risk Type': this.parseInteger(row['Risk Type']),
          'Product String': this.cleanString(row['Product String']),
          'Withdrawn SOLAR code': this.cleanString(row['Withdrawn SOLAR code']),
          'SOLAR CODE': this.cleanString(row['SOLAR CODE']),
          'CHAPS Fee': this.parseInteger(row['CHAPS Fee']),
          'Channel Type / Category': this.cleanString(
            row['Channel Type / Category'],
          ),
          'Core / Exclusive': this.cleanString(row['Core / Exclusive']),
          'Offset Available': this.cleanString(row['Offset Available']),
          CI: this.cleanString(row['CI']),
          IO: this.cleanString(row['IO']),
          'ERC Term (Yrs)': this.parseInteger(row['ERC Term (Yrs)']),
          'Individual LOP': this.cleanString(row['Individual LOP']),
          'ERC Code': this.cleanString(row['ERC Code']),
          'Complete By': this.cleanString(row['Complete By']),
          'MPET Valuation': this.cleanString(row['MPET Valuation']),
          'MPET Legal': this.cleanString(row['MPET Legal']),
          Core: this.cleanString(row['Core']),
          IRLID: this.cleanString(row['IRLID']),
          'Interest Rate Code': this.cleanString(row['Interest Rate Code']),
          'Mortgage Type': this.parseInteger(row['Mortgage Type']),
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
        .slice(0, 10) // Show first 10 errors
        .map((e) => `Row ${e.row}: ${e.message}`)
        .join('; ');
      const moreErrors =
        errors.length > 10 ? ` ... and ${errors.length - 10} more errors` : '';
      throw new AppError(
        `Validation failed: ${errorMessage}${moreErrors}`,
        400,
      );
    }

    return products;
  }

  /**
   * Validate ProductID (MSP-LBG Product Code)
   */
  private validateProductID(value: any, row: number): string {
    const cleaned = this.cleanString(value);

    if (!cleaned) {
      // Generate a unique ID if missing
      return `PROD_${row}_${Date.now()}`;
    }

    if (cleaned.length > 50) {
      throw new Error(`Row ${row}: ProductID too long (max 50 characters)`);
    }

    return cleaned;
  }

  /**
   * Clean and trim string values
   */
  private cleanString(value: any): string | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    const str = String(value).trim();
    return str.length > 0 ? str : null;
  }

  /**
   * Parse integer values
   */
  private parseInteger(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    // Remove commas and whitespace
    const cleaned = String(value).replace(/,/g, '').trim();
    const num = parseInt(cleaned, 10);

    if (isNaN(num)) {
      return null;
    }

    return num;
  }

  /**
   * Parse decimal values (with 2 decimal places)
   */
  private parseDecimal(value: any): number | null {
    if (value === null || value === undefined || value === '') {
      return null;
    }

    // Remove commas and whitespace
    const cleaned = String(value).replace(/,/g, '').trim();
    const num = parseFloat(cleaned);

    if (isNaN(num)) {
      return null;
    }

    // Round to 2 decimal places
    return Math.round(num * 100) / 100;
  }
}
