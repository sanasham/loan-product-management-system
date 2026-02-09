import { Request, Response } from 'express';
import { logger } from '../config/logger.config';
import { ProductService } from '../services/ProductService';
import { ApiResponseUtil } from '../utils/ApiResponse';

export class ProductController {
  private productService: ProductService;

  constructor() {
    this.productService = new ProductService();
  }

  /**
   * Get all products with pagination and filters
   */
  public async getProducts(req: Request, res: Response): Promise<Response> {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 50;
    const search = req.query.search as string | undefined;
    const activeOnly = req.query.activeOnly === 'true' ? true : undefined;

    try {
      const result = await this.productService.getProducts(
        page,
        pageSize,
        search,
        activeOnly,
      );

      return ApiResponseUtil.success(res, result);
    } catch (error) {
      logger.error('Failed to get products:', error);
      throw error;
    }
  }

  /**
   * Get product by ID
   */
  public async getProductById(req: Request, res: Response): Promise<Response> {
    const { id } = req.params;

    try {
      const product = await this.productService.getProductById(id);
      return ApiResponseUtil.success(res, product);
    } catch (error) {
      logger.error(`Failed to get product ${id}:`, error);
      throw error;
    }
  }

  /**
   * Get product pricing history
   */
  public async getProductHistory(
    req: Request,
    res: Response,
  ): Promise<Response> {
    const { id } = req.params;
    const months = parseInt(req.query.months as string) || 12;

    try {
      const history = await this.productService.getProductHistory(id, months);
      return ApiResponseUtil.success(res, history);
    } catch (error) {
      logger.error(`Failed to get history for product ${id}:`, error);
      throw error;
    }
  }
}
