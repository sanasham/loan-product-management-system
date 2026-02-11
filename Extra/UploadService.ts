import { v4 as uuidv4 } from 'uuid';
import { database, sql } from '../config/database';
import { logger } from '../config/logger.config';
import { LoanProduct } from '../types/product.types';
import { AppError } from '../utils/AppError';

export class UploadService {
  /**
   * Insert products into staging table with ALL columns
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

      // Bulk insert to staging with ALL columns
      const table = new sql.Table('LoanProductsStaging');

      // Add metadata columns
      table.columns.add('BatchID', sql.UniqueIdentifier, { nullable: false });
      table.columns.add('RowNumber', sql.Int, { nullable: false });
      table.columns.add('ProductID', sql.NVarChar(50), { nullable: false });
      table.columns.add('UploadedBy', sql.NVarChar(100), { nullable: false });

      // Add all product columns
      table.columns.add('Launch Date', sql.NVarChar(sql.MAX), {
        nullable: true,
      });
      table.columns.add('Brand', sql.NVarChar(100), { nullable: true });
      table.columns.add('Withdraw Date', sql.NVarChar(sql.MAX), {
        nullable: true,
      });
      table.columns.add('Withdraw Code', sql.NVarChar(sql.MAX), {
        nullable: true,
      });
      table.columns.add('MSP-LBG Product Code', sql.NVarChar(sql.MAX), {
        nullable: true,
      });
      table.columns.add('Channel Type', sql.NVarChar(sql.MAX), {
        nullable: true,
      });
      table.columns.add('Customer Type', sql.NVarChar(sql.MAX), {
        nullable: true,
      });
      table.columns.add('Term', sql.Decimal(5, 2), { nullable: true });
      table.columns.add('Type', sql.NVarChar(50), { nullable: true });

      // BOE and Rate columns (8 tiers)
      for (let i = 1; i <= 8; i++) {
        table.columns.add(`BOE${i}+/-`, sql.Decimal(5, 2), { nullable: true });
        table.columns.add(`Rate${i}`, sql.Decimal(5, 2), { nullable: true });
        table.columns.add(`Until${i}`, sql.NVarChar(sql.MAX), {
          nullable: true,
        });
      }

      // Fee columns
      table.columns.add('Product Fee (£)', sql.Int, { nullable: true });
      table.columns.add('Product Fee (%)', sql.Int, { nullable: true });

      // Loan limit columns
      table.columns.add('Min Loan', sql.Int, { nullable: true });
      table.columns.add('Max Loan', sql.Int, { nullable: true });
      table.columns.add('Min LTV', sql.Int, { nullable: true });
      table.columns.add('Max LTV', sql.Int, { nullable: true });

      // Additional info columns
      table.columns.add('Additional info', sql.NVarChar(sql.MAX), {
        nullable: true,
      });
      table.columns.add('Must Complete By', sql.NVarChar(sql.MAX), {
        nullable: true,
      });
      table.columns.add('Product Fee Acknum', sql.NVarChar(50), {
        nullable: true,
      });
      table.columns.add('Repayment APR', sql.Decimal(5, 2), { nullable: true });
      table.columns.add('Scheme Type', sql.NVarChar(sql.MAX), {
        nullable: true,
      });
      table.columns.add('Portable Product', sql.NVarChar(50), {
        nullable: true,
      });
      table.columns.add('Panel Number', sql.Int, { nullable: true });
      table.columns.add('Payee Number', sql.NVarChar(50), { nullable: true });
      table.columns.add('Interest Calculation', sql.NVarChar(50), {
        nullable: true,
      });
      table.columns.add('Link to HVR / HHVR', sql.NVarChar(50), {
        nullable: true,
      });
      table.columns.add('Refund of Val', sql.NVarChar(50), { nullable: true });
      table.columns.add('Val Refund Acknum', sql.NVarChar(50), {
        nullable: true,
      });
      table.columns.add('Free Val', sql.NVarChar(50), { nullable: true });
      table.columns.add('Free Conveyancing', sql.NVarChar(50), {
        nullable: true,
      });
      table.columns.add('DAF to be waived', sql.NVarChar(50), {
        nullable: true,
      });
      table.columns.add('HLC Free', sql.NVarChar(50), { nullable: true });

      // Cashback columns
      table.columns.add('Cashback (£)', sql.Int, { nullable: true });
      table.columns.add('Cashback (%)', sql.NVarChar(50), { nullable: true });
      table.columns.add('Cashback Acknum', sql.NVarChar(50), {
        nullable: true,
      });
      table.columns.add('Proc Fee Code', sql.NVarChar(50), { nullable: true });
      table.columns.add('Proc Fee Narrative', sql.NVarChar(50), {
        nullable: true,
      });

      // Tied text columns
      table.columns.add(
        'Tied Insurance Free Format Text',
        sql.NVarChar(sql.MAX),
        { nullable: true },
      );
      table.columns.add(
        'Tied Non Insurance Free Format Text',
        sql.NVarChar(sql.MAX),
        { nullable: true },
      );
      table.columns.add(
        'Tied Incentivised Free Format Text',
        sql.NVarChar(sql.MAX),
        { nullable: true },
      );
      table.columns.add('Narrative', sql.NVarChar(sql.MAX), { nullable: true });

      // Credit scoring columns
      table.columns.add('Best Credit Score Applicable', sql.NVarChar(50), {
        nullable: true,
      });
      table.columns.add('Worst Credit Score Applicable', sql.NVarChar(50), {
        nullable: true,
      });
      table.columns.add('CarbonOffset (%)', sql.NVarChar(50), {
        nullable: true,
      });
      table.columns.add('Calculator', sql.NVarChar(50), { nullable: true });
      table.columns.add('Extras', sql.Int, { nullable: true });
      table.columns.add('BERR (Government Reporting)', sql.NVarChar(50), {
        nullable: true,
      });

      // ERC columns (8 tiers)
      for (let i = 1; i <= 8; i++) {
        table.columns.add(`ERC Rate${i}`, sql.Decimal(5, 2), {
          nullable: true,
        });
        table.columns.add(`ERC Until${i}`, sql.NVarChar(sql.MAX), {
          nullable: true,
        });
      }

      // Cashback limit columns
      table.columns.add('Cashback Minimum Amount', sql.Int, { nullable: true });
      table.columns.add('Cashback Maximum Amount', sql.Int, { nullable: true });
      table.columns.add('Cashback Type', sql.NVarChar(50), { nullable: true });
      table.columns.add('Repayment Fees', sql.NVarChar(sql.MAX), {
        nullable: true,
      });

      // Portable tied text columns
      table.columns.add(
        'Portable Tied Non Insurance Free Format Text',
        sql.NVarChar(sql.MAX),
        { nullable: true },
      );
      table.columns.add(
        'Portable Tied Incentivised Free Format Text',
        sql.NVarChar(sql.MAX),
        { nullable: true },
      );

      // UFSS columns
      table.columns.add(
        'UFSS Interest Only Product Code (CGM)',
        sql.NVarChar(50),
        { nullable: true },
      );
      table.columns.add('UFSS Repayment Product Code (CGM)', sql.NVarChar(50), {
        nullable: true,
      });
      table.columns.add(
        'UFSS Interest Only Product Code (MOR)',
        sql.NVarChar(50),
        { nullable: true },
      );
      table.columns.add('UFSS Repayment Product Code (MOR)', sql.NVarChar(50), {
        nullable: true,
      });
      table.columns.add(
        'UFSS Interest Only Product Code (LBM)',
        sql.NVarChar(50),
        { nullable: true },
      );
      table.columns.add('UFSS Repayment Product Code (LBM)', sql.NVarChar(50), {
        nullable: true,
      });
      table.columns.add(
        'UFSS Interest Only Product Code (BMG)',
        sql.NVarChar(50),
        { nullable: true },
      );
      table.columns.add('UFSS Repayment Product Code (BMG)', sql.NVarChar(50), {
        nullable: true,
      });

      // Account and product detail columns
      table.columns.add('Account Type', sql.NVarChar(50), { nullable: true });
      table.columns.add('Current Product Cessation Type', sql.NVarChar(50), {
        nullable: true,
      });
      table.columns.add('Risk Type', sql.Int, { nullable: true });
      table.columns.add('Product String', sql.NVarChar(sql.MAX), {
        nullable: true,
      });
      table.columns.add('Withdrawn SOLAR code', sql.NVarChar(50), {
        nullable: true,
      });
      table.columns.add('SOLAR CODE', sql.NVarChar(50), { nullable: true });
      table.columns.add('CHAPS Fee', sql.Int, { nullable: true });
      table.columns.add('Channel Type / Category', sql.NVarChar(sql.MAX), {
        nullable: true,
      });
      table.columns.add('Core / Exclusive', sql.NVarChar(50), {
        nullable: true,
      });
      table.columns.add('Offset Available', sql.NVarChar(50), {
        nullable: true,
      });
      table.columns.add('CI', sql.NVarChar(50), { nullable: true });
      table.columns.add('IO', sql.NVarChar(50), { nullable: true });
      table.columns.add('ERC Term (Yrs)', sql.Int, { nullable: true });
      table.columns.add('Individual LOP', sql.NVarChar(sql.MAX), {
        nullable: true,
      });
      table.columns.add('ERC Code', sql.NVarChar(50), { nullable: true });
      table.columns.add('Complete By', sql.NVarChar(50), { nullable: true });
      table.columns.add('MPET Valuation', sql.NVarChar(50), { nullable: true });
      table.columns.add('MPET Legal', sql.NVarChar(50), { nullable: true });
      table.columns.add('Core', sql.NVarChar(50), { nullable: true });
      table.columns.add('IRLID', sql.NVarChar(50), { nullable: true });
      table.columns.add('Interest Rate Code', sql.NVarChar(50), {
        nullable: true,
      });
      table.columns.add('Mortgage Type', sql.Int, { nullable: true });

      // Add rows with ALL column values
      products.forEach((p, index) => {
        const rowData: any[] = [
          batchId,
          index + 1,
          p.ProductID,
          username,
          p['Launch Date'],
          p['Brand'],
          p['Withdraw Date'],
          p['Withdraw Code'],
          p['MSP-LBG Product Code'],
          p['Channel Type'],
          p['Customer Type'],
          p['Term'],
          p['Type'],
        ];

        // Add BOE and Rate columns (8 tiers)
        for (let i = 1; i <= 8; i++) {
          rowData.push(p[`BOE${i}+/-` as keyof LoanProduct]);
          rowData.push(p[`Rate${i}` as keyof LoanProduct]);
          rowData.push(p[`Until${i}` as keyof LoanProduct]);
        }

        // Add remaining columns
        rowData.push(
          p['Product Fee (£)'],
          p['Product Fee (%)'],
          p['Min Loan'],
          p['Max Loan'],
          p['Min LTV'],
          p['Max LTV'],
          p['Additional info'],
          p['Must Complete By'],
          p['Product Fee Acknum'],
          p['Repayment APR'],
          p['Scheme Type'],
          p['Portable Product'],
          p['Panel Number'],
          p['Payee Number'],
          p['Interest Calculation'],
          p['Link to HVR / HHVR'],
          p['Refund of Val'],
          p['Val Refund Acknum'],
          p['Free Val'],
          p['Free Conveyancing'],
          p['DAF to be waived'],
          p['HLC Free'],
          p['Cashback (£)'],
          p['Cashback (%)'],
          p['Cashback Acknum'],
          p['Proc Fee Code'],
          p['Proc Fee Narrative'],
          p['Tied Insurance Free Format Text'],
          p['Tied Non Insurance Free Format Text'],
          p['Tied Incentivised Free Format Text'],
          p['Narrative'],
          p['Best Credit Score Applicable'],
          p['Worst Credit Score Applicable'],
          p['CarbonOffset (%)'],
          p['Calculator'],
          p['Extras'],
          p['BERR (Government Reporting)'],
        );

        // Add ERC columns (8 tiers)
        for (let i = 1; i <= 8; i++) {
          rowData.push(p[`ERC Rate${i}` as keyof LoanProduct]);
          rowData.push(p[`ERC Until${i}` as keyof LoanProduct]);
        }

        // Add final columns
        rowData.push(
          p['Cashback Minimum Amount'],
          p['Cashback Maximum Amount'],
          p['Cashback Type'],
          p['Repayment Fees'],
          p['Portable Tied Non Insurance Free Format Text'],
          p['Portable Tied Incentivised Free Format Text'],
          p['UFSS Interest Only Product Code (CGM)'],
          p['UFSS Repayment Product Code (CGM)'],
          p['UFSS Interest Only Product Code (MOR)'],
          p['UFSS Repayment Product Code (MOR)'],
          p['UFSS Interest Only Product Code (LBM)'],
          p['UFSS Repayment Product Code (LBM)'],
          p['UFSS Interest Only Product Code (BMG)'],
          p['UFSS Repayment Product Code (BMG)'],
          p['Account Type'],
          p['Current Product Cessation Type'],
          p['Risk Type'],
          p['Product String'],
          p['Withdrawn SOLAR code'],
          p['SOLAR CODE'],
          p['CHAPS Fee'],
          p['Channel Type / Category'],
          p['Core / Exclusive'],
          p['Offset Available'],
          p['CI'],
          p['IO'],
          p['ERC Term (Yrs)'],
          p['Individual LOP'],
          p['ERC Code'],
          p['Complete By'],
          p['MPET Valuation'],
          p['MPET Legal'],
          p['Core'],
          p['IRLID'],
          p['Interest Rate Code'],
          p['Mortgage Type'],
        );

        table.rows.add(...rowData);
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
