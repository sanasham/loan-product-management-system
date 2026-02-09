import sql from 'mssql';
import { logger } from './logger.config';

interface DatabaseConfig {
  user: string;
  password: string;
  server: string;
  database: string;
  port: number;
  options: {
    encrypt: boolean;
    trustServerCertificate: boolean;
    enableArithAbort: boolean;
    connectionTimeout: number;
    requestTimeout: number;
  };
  pool: {
    max: number;
    min: number;
    idleTimeoutMillis: number;
  };
}

class Database {
  private static instance: Database;
  private pool: sql.ConnectionPool | null = null;
  private config: DatabaseConfig;

  private constructor() {
    this.config = {
      user: process.env.DB_USER || 'sa',
      password: process.env.DB_PASSWORD || '',
      server: process.env.DB_SERVER || 'localhost',
      database: process.env.DB_NAME || 'LoanProductDB',
      port: parseInt(process.env.DB_PORT || '1433'),
      options: {
        encrypt: process.env.DB_ENCRYPT === 'true',
        trustServerCertificate:
          process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
        enableArithAbort: true,
        connectionTimeout: parseInt(
          process.env.DB_CONNECTION_TIMEOUT || '30000',
        ),
        requestTimeout: parseInt(process.env.DB_REQUEST_TIMEOUT || '30000'),
      },
      pool: {
        max: parseInt(process.env.DB_POOL_MAX || '10'),
        min: parseInt(process.env.DB_POOL_MIN || '2'),
        idleTimeoutMillis: 30000,
      },
    };
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  public async getPool(): Promise<sql.ConnectionPool> {
    if (!this.pool) {
      try {
        this.pool = await sql.connect(this.config);
        logger.info('Database connection pool established');

        this.pool.on('error', (err: Error) => {
          logger.error('Database pool error:', err);
        });
      } catch (error) {
        logger.error('Failed to create database connection pool:', error);
        throw error;
      }
    }
    return this.pool;
  }

  public async closePool(): Promise<void> {
    if (this.pool) {
      try {
        await this.pool.close();
        this.pool = null;
        logger.info('Database connection pool closed');
      } catch (error) {
        logger.error('Error closing database pool:', error);
        throw error;
      }
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      const pool = await this.getPool();
      const result = await pool.request().query('SELECT 1 AS test');
      return result.recordset[0].test === 1;
    } catch (error) {
      logger.error('Database connection test failed:', error);
      return false;
    }
  }
}

export const database = Database.getInstance();
export { sql };
