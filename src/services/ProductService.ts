import { database, sql } from '../config/database';
import { PaginatedResponse } from '../types/api.types';
import { LoanProductDB, LoanProductHistory } from '../types/product.types';
import { AppError } from '../utils/AppError';

export class ProductService {
  /**
   * Get all products with pagination
   */
  public async getProducts(
    page: number = 1,
    pageSize: number = 50,
    searchTerm?: string,
    activeOnly?: boolean,
  ): Promise<PaginatedResponse<LoanProductDB>> {
    const pool = await database.getPool();
    const offset = (page - 1) * pageSize;

    const request = pool.request();
    request.input('PageSize', sql.Int, pageSize);
    request.input('Offset', sql.Int, offset);
    request.input('SearchTerm', sql.NVarChar(255), searchTerm || null);
    request.input(
      'ActiveOnly',
      sql.Bit,
      activeOnly !== undefined ? activeOnly : null,
    );

    const result = await request.query(`
      SELECT 
        ProductID,
        ProductName,
        LoanStartDate,
        WithdrawnDate,
        Pricing,
        IsActive,
        CreatedDate,
        CreatedBy,
        UpdatedDate,
        UpdatedBy
      FROM LoanProducts
      WHERE 
        (@SearchTerm IS NULL OR ProductName LIKE '%' + @SearchTerm + '%' OR ProductID LIKE '%' + @SearchTerm + '%')
        AND (@ActiveOnly IS NULL OR IsActive = @ActiveOnly)
      ORDER BY ProductName
      OFFSET @Offset ROWS
      FETCH NEXT @PageSize ROWS ONLY;

      SELECT COUNT(*) as TotalRecords
      FROM LoanProducts
      WHERE 
        (@SearchTerm IS NULL OR ProductName LIKE '%' + @SearchTerm + '%' OR ProductID LIKE '%' + @SearchTerm + '%')
        AND (@ActiveOnly IS NULL OR IsActive = @ActiveOnly);
    `);

    const products = (result.recordsets as any[][])[0];
    const totalRecords = (result.recordsets as any[][])[1][0].TotalRecords;
    const totalPages = Math.ceil(totalRecords / pageSize);

    return {
      data: products,
      pagination: {
        page,
        pageSize,
        totalRecords,
        totalPages,
      },
    };
  }

  /**
   * Get product by ID
   */
  public async getProductById(productId: string): Promise<LoanProductDB> {
    const pool = await database.getPool();

    const result = await pool
      .request()
      .input('ProductID', sql.NVarChar(50), productId).query(`
        SELECT 
          ProductID,
          ProductName,
          LoanStartDate,
          WithdrawnDate,
          Pricing,
          IsActive,
          CreatedDate,
          CreatedBy,
          UpdatedDate,
          UpdatedBy
        FROM LoanProducts
        WHERE ProductID = @ProductID
      `);

    if (result.recordset.length === 0) {
      throw new AppError('Product not found', 404);
    }

    return result.recordset[0];
  }

  /**
   * Get product pricing history
   */
  public async getProductHistory(
    productId: string,
    monthsBack: number = 12,
  ): Promise<LoanProductHistory[]> {
    const pool = await database.getPool();

    const result = await pool
      .request()
      .input('ProductID', sql.NVarChar(50), productId)
      .input('MonthsBack', sql.Int, monthsBack).query(`
        SELECT 
          HistoryID,
          ProductID,
          ProductName,
          OldPricing,
          NewPricing,
          OldWithdrawnDate,
          NewWithdrawnDate,
          ChangeType,
          ChangeDate,
          ChangedBy
        FROM LoanProductHistory
        WHERE ProductID = @ProductID
          AND ChangeDate >= DATEADD(MONTH, -@MonthsBack, GETDATE())
        ORDER BY ChangeDate DESC
      `);

    return result.recordset;
  }
}
