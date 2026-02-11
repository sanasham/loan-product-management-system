import { database, sql } from '../config/database';
import { logger } from '../config/logger.config';
import {
  LoanProduct,
  LoanProductHistory,
  ProductFilters,
  PaginatedResponse,
} from '../types/product.types';

export class ProductService {
  /**
   * Get paginated list of products with optional filters
   */
  public async getProducts(
    pageNumber: number = 1,
    pageSize: number = 50,
    filters?: ProductFilters,
  ): Promise<PaginatedResponse<LoanProduct>> {
    const pool = await database.getPool();

    try {
      const request = pool.request();
      request.input('PageNumber', sql.Int, pageNumber);
      request.input('PageSize', sql.Int, pageSize);
      request.input('SearchTerm', sql.NVarChar(255), filters?.searchTerm || null);
      request.input('ActiveOnly', sql.Bit, filters?.activeOnly ?? null);

      const result = await request.execute('usp_GetProducts');

      const products = result.recordsets[0] as LoanProduct[];
      const totalRecords = result.recordsets[1][0]?.TotalRecords || 0;
      const totalPages = Math.ceil(totalRecords / pageSize);

      return {
        data: products,
        pagination: {
          currentPage: pageNumber,
          pageSize,
          totalRecords,
          totalPages,
        },
      };
    } catch (error) {
      logger.error('Error fetching products:', error);
      throw error;
    }
  }

  /**
   * Get a single product by ID
   */
  public async getProductById(productId: string): Promise<LoanProduct | null> {
    const pool = await database.getPool();

    try {
      const request = pool.request();
      request.input('ProductID', sql.NVarChar(50), productId);

      const result = await request.execute('usp_GetProductById');

      if (result.recordset.length === 0) {
        return null;
      }

      return result.recordset[0] as LoanProduct;
    } catch (error) {
      logger.error(`Error fetching product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Get product change history
   */
  public async getProductHistory(
    productId: string,
    monthsBack: number = 12,
  ): Promise<LoanProductHistory[]> {
    const pool = await database.getPool();

    try {
      const request = pool.request();
      request.input('ProductID', sql.NVarChar(50), productId);
      request.input('MonthsBack', sql.Int, monthsBack);

      const result = await request.execute('usp_GetProductHistory');

      return result.recordset as LoanProductHistory[];
    } catch (error) {
      logger.error(`Error fetching product history for ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Search products by multiple criteria
   */
  public async searchProducts(
    searchCriteria: {
      productId?: string;
      brand?: string;
      type?: string;
      minRate?: number;
      maxRate?: number;
      channelType?: string;
      customerType?: string;
      minLTV?: number;
      maxLTV?: number;
      activeOnly?: boolean;
    },
    pageNumber: number = 1,
    pageSize: number = 50,
  ): Promise<PaginatedResponse<LoanProduct>> {
    const pool = await database.getPool();

    try {
      const request = pool.request();
      request.input('ProductID', sql.NVarChar(50), searchCriteria.productId || null);
      request.input('Brand', sql.NVarChar(255), searchCriteria.brand || null);
      request.input('Type', sql.NVarChar(255), searchCriteria.type || null);
      request.input('MinRate', sql.Decimal(5, 2), searchCriteria.minRate ?? null);
      request.input('MaxRate', sql.Decimal(5, 2), searchCriteria.maxRate ?? null);
      request.input('ChannelType', sql.NVarChar(255), searchCriteria.channelType || null);
      request.input('CustomerType', sql.NVarChar(255), searchCriteria.customerType || null);
      request.input('MinLTV', sql.Decimal(5, 2), searchCriteria.minLTV ?? null);
      request.input('MaxLTV', sql.Decimal(5, 2), searchCriteria.maxLTV ?? null);
      request.input('ActiveOnly', sql.Bit, searchCriteria.activeOnly ?? null);
      request.input('PageNumber', sql.Int, pageNumber);
      request.input('PageSize', sql.Int, pageSize);

      const result = await request.execute('usp_SearchProducts');

      const products = result.recordsets[0] as LoanProduct[];
      const totalRecords = result.recordsets[1][0]?.TotalRecords || 0;
      const totalPages = Math.ceil(totalRecords / pageSize);

      return {
        data: products,
        pagination: {
          currentPage: pageNumber,
          pageSize,
          totalRecords,
          totalPages,
        },
      };
    } catch (error) {
      logger.error('Error searching products:', error);
      throw error;
    }
  }

  /**
   * Get products by brand
   */
  public async getProductsByBrand(
    brand: string,
    activeOnly: boolean = true,
  ): Promise<LoanProduct[]> {
    const pool = await database.getPool();

    try {
      const request = pool.request();
      request.input('Brand', sql.NVarChar(255), brand);
      request.input('ActiveOnly', sql.Bit, activeOnly);

      const result = await request.execute('usp_GetProductsByBrand');
      return result.recordset as LoanProduct[];
    } catch (error) {
      logger.error(`Error fetching products for brand ${brand}:`, error);
      throw error;
    }
  }

  /**
   * Get products by type (e.g., Fixed, Variable, Tracker)
   */
  public async getProductsByType(
    type: string,
    activeOnly: boolean = true,
  ): Promise<LoanProduct[]> {
    const pool = await database.getPool();

    try {
      const request = pool.request();
      request.input('Type', sql.NVarChar(255), type);
      request.input('ActiveOnly', sql.Bit, activeOnly);

      const result = await request.execute('usp_GetProductsByType');
      return result.recordset as LoanProduct[];
    } catch (error) {
      logger.error(`Error fetching products for type ${type}:`, error);
      throw error;
    }
  }

  /**
   * Get recently updated products
   */
  public async getRecentlyUpdatedProducts(
    days: number = 7,
    limit: number = 50,
  ): Promise<LoanProduct[]> {
    const pool = await database.getPool();

    try {
      const request = pool.request();
      request.input('Days', sql.Int, days);
      request.input('Limit', sql.Int, limit);

      const result = await request.execute('usp_GetRecentlyUpdatedProducts');
      return result.recordset as LoanProduct[];
    } catch (error) {
      logger.error('Error fetching recently updated products:', error);
      throw error;
    }
  }

  /**
   * Get products with rate changes in a specific period
   */
  public async getProductsWithRateChanges(
    startDate: Date,
    endDate?: Date,
  ): Promise<LoanProductHistory[]> {
    const pool = await database.getPool();

    try {
      const request = pool.request();
      request.input('StartDate', sql.DateTime2, startDate);
      request.input('EndDate', sql.DateTime2, endDate || new Date());

      const result = await request.execute('usp_GetProductsWithRateChanges');
      return result.recordset as LoanProductHistory[];
    } catch (error) {
      logger.error('Error fetching products with rate changes:', error);
      throw error;
    }
  }

  /**
   * Get products by rate range
   */
  public async getProductsByRateRange(
    minRate: number,
    maxRate: number,
    activeOnly: boolean = true,
  ): Promise<LoanProduct[]> {
    const pool = await database.getPool();

    try {
      const request = pool.request();
      request.input('MinRate', sql.Decimal(5, 2), minRate);
      request.input('MaxRate', sql.Decimal(5, 2), maxRate);
      request.input('ActiveOnly', sql.Bit, activeOnly);

      const result = await request.execute('usp_GetProductsByRateRange');
      return result.recordset as LoanProduct[];
    } catch (error) {
      logger.error('Error fetching products by rate range:', error);
      throw error;
    }
  }

  /**
   * Get products by LTV range
   */
  public async getProductsByLTVRange(
    ltv: number,
    activeOnly: boolean = true,
  ): Promise<LoanProduct[]> {
    const pool = await database.getPool();

    try {
      const request = pool.request();
      request.input('LTV', sql.Decimal(5, 2), ltv);
      request.input('ActiveOnly', sql.Bit, activeOnly);

      const result = await request.execute('usp_GetProductsByLTV');
      return result.recordset as LoanProduct[];
    } catch (error) {
      logger.error('Error fetching products by LTV:', error);
      throw error;
    }
  }

  /**
   * Get withdrawn products
   */
  public async getWithdrawnProducts(
    sinceDate?: Date,
    limit: number = 100,
  ): Promise<LoanProduct[]> {
    const pool = await database.getPool();

    try {
      const request = pool.request();
      request.input('SinceDate', sql.NVarChar(50), sinceDate ? sinceDate.toISOString().split('T')[0] : null);
      request.input('Limit', sql.Int, limit);

      const result = await request.execute('usp_GetWithdrawnProducts');
      return result.recordset as LoanProduct[];
    } catch (error) {
      logger.error('Error fetching withdrawn products:', error);
      throw error;
    }
  }

  /**
   * Get product statistics
   */
  public async getProductStatistics(): Promise<{
    totalProducts: number;
    activeProducts: number;
    withdrawnProducts: number;
    averageRate: number;
    brandCount: number;
    typeCount: number;
  }> {
    const pool = await database.getPool();

    try {
      const result = await pool.request().execute('usp_GetProductStatistics');
      const stats = result.recordset[0];

      return {
        totalProducts: stats.TotalProducts,
        activeProducts: stats.ActiveProducts,
        withdrawnProducts: stats.WithdrawnProducts,
        averageRate: parseFloat(stats.AverageRate?.toFixed(2) || '0'),
        brandCount: stats.BrandCount,
        typeCount: stats.TypeCount,
      };
    } catch (error) {
      logger.error('Error fetching product statistics:', error);
      throw error;
    }
  }

  /**
   * Get distinct brands
   */
  public async getBrands(): Promise<string[]> {
    const pool = await database.getPool();

    try {
      const result = await pool.request().execute('usp_GetBrands');
      return result.recordset.map((row) => row.Brand);
    } catch (error) {
      logger.error('Error fetching brands:', error);
      throw error;
    }
  }

  /**
   * Get distinct product types
   */
  public async getProductTypes(): Promise<string[]> {
    const pool = await database.getPool();

    try {
      const result = await pool.request().execute('usp_GetProductTypes');
      return result.recordset.map((row) => row.Type);
    } catch (error) {
      logger.error('Error fetching product types:', error);
      throw error;
    }
  }

  /**
   * Get distinct channel types
   */
  public async getChannelTypes(): Promise<string[]> {
    const pool = await database.getPool();

    try {
      const result = await pool.request().execute('usp_GetChannelTypes');
      return result.recordset.map((row) => row['Channel Type']);
    } catch (error) {
      logger.error('Error fetching channel types:', error);
      throw error;
    }
  }

  /**
   * Compare products side by side
   */
  public async compareProducts(productIds: string[]): Promise<LoanProduct[]> {
    const pool = await database.getPool();

    try {
      const request = pool.request();
      request.input('ProductIDs', sql.NVarChar(sql.MAX), productIds.join(','));

      const result = await request.execute('usp_CompareProducts');
      return result.recordset as LoanProduct[];
    } catch (error) {
      logger.error('Error comparing products:', error);
      throw error;
    }
  }

  /**
   * Get products expiring soon (based on Must Complete By date)
   */
  public async getProductsExpiringSoon(
    daysAhead: number = 30,
  ): Promise<LoanProduct[]> {
    const pool = await database.getPool();

    try {
      const request = pool.request();
      request.input('DaysAhead', sql.Int, daysAhead);

      const result = await request.execute('usp_GetProductsExpiringSoon');
      return result.recordset as LoanProduct[];
    } catch (error) {
      logger.error('Error fetching expiring products:', error);
      throw error;
    }
  }

  /**
   * Update product active status
   */
  public async updateProductActiveStatus(
    productId: string,
    isActive: boolean,
    updatedBy: string,
  ): Promise<void> {
    const pool = await database.getPool();

    try {
      const request = pool.request();
      request.input('ProductID', sql.NVarChar(50), productId);
      request.input('IsActive', sql.Bit, isActive);
      request.input('UpdatedBy', sql.NVarChar(100), updatedBy);

      await request.execute('usp_UpdateProductActiveStatus');

      logger.info(
        `Product ${productId} active status updated to ${isActive} by ${updatedBy}`,
      );
    } catch (error) {
      logger.error(`Error updating product active status for ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Soft delete a product (set IsActive = false and add withdraw date)
   */
  public async softDeleteProduct(
    productId: string,
    withdrawDate: string,
    withdrawCode: string,
    updatedBy: string,
  ): Promise<void> {
    const pool = await database.getPool();

    try {
      const request = pool.request();
      request.input('ProductID', sql.NVarChar(50), productId);
      request.input('WithdrawDate', sql.NVarChar(50), withdrawDate);
      request.input('WithdrawCode', sql.NVarChar(50), withdrawCode);
      request.input('UpdatedBy', sql.NVarChar(100), updatedBy);

      await request.execute('usp_SoftDeleteProduct');

      logger.info(`Product ${productId} soft deleted by ${updatedBy}`);
    } catch (error) {
      logger.error(`Error soft deleting product ${productId}:`, error);
      throw error;
    }
  }

  /**
   * Get products by customer type
   */
  public async getProductsByCustomerType(
    customerType: string,
    activeOnly: boolean = true,
  ): Promise<LoanProduct[]> {
    const pool = await database.getPool();

    try {
      const request = pool.request();
      request.input('CustomerType', sql.NVarChar(255), customerType);
      request.input('ActiveOnly', sql.Bit, activeOnly);

      const result = await request.execute('usp_GetProductsByCustomerType');
      return result.recordset as LoanProduct[];
    } catch (error) {
      logger.error(`Error fetching products for customer type ${customerType}:`, error);
      throw error;
    }
  }

  /**
   * Get products by channel type
   */
  public async getProductsByChannelType(
    channelType: string,
    activeOnly: boolean = true,
  ): Promise<LoanProduct[]> {
    const pool = await database.getPool();

    try {
      const request = pool.request();
      request.input('ChannelType', sql.NVarChar(255), channelType);
      request.input('ActiveOnly', sql.Bit, activeOnly);

      const result = await request.execute('usp_GetProductsByChannelType');
      return result.recordset as LoanProduct[];
    } catch (error) {
      logger.error(`Error fetching products for channel type ${channelType}:`, error);
      throw error;
    }
  }

  /**
   * Get products with cashback
   */
  public async getProductsWithCashback(
    activeOnly: boolean = true,
  ): Promise<LoanProduct[]> {
    const pool = await database.getPool();

    try {
      const request = pool.request();
      request.input('ActiveOnly', sql.Bit, activeOnly);

      const result = await request.execute('usp_GetProductsWithCashback');
      return result.recordset as LoanProduct[];
    } catch (error) {
      logger.error('Error fetching products with cashback:', error);
      throw error;
    }
  }

  /**
   * Get products with no fee
   */
  public async getProductsWithNoFee(
    activeOnly: boolean = true,
  ): Promise<LoanProduct[]> {
    const pool = await database.getPool();

    try {
      const request = pool.request();
      request.input('ActiveOnly', sql.Bit, activeOnly);

      const result = await request.execute('usp_GetProductsWithNoFee');
      return result.recordset as LoanProduct[];
    } catch (error) {
      logger.error('Error fetching products with no fee:', error);
      throw error;
    }
  }

  /**
   * Get top products by criteria
   */
  public async getTopProducts(
    limit: number = 10,
    orderBy: 'Rate' | 'Fee' | 'LTV' | 'Launch' = 'Rate',
    orderDirection: 'ASC' | 'DESC' = 'ASC',
    activeOnly: boolean = true,
  ): Promise<LoanProduct[]> {
    const pool = await database.getPool();

    try {
      const request = pool.request();
      request.input('Limit', sql.Int, limit);
      request.input('OrderBy', sql.NVarChar(50), orderBy);
      request.input('OrderDirection', sql.NVarChar(4), orderDirection);
      request.input('ActiveOnly', sql.Bit, activeOnly);

      const result = await request.execute('usp_GetTopProducts');
      return result.recordset as LoanProduct[];
    } catch (error) {
      logger.error('Error fetching top products:', error);
      throw error;
    }
  }
}
