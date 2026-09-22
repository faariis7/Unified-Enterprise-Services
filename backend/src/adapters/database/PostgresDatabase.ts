import { Kysely, PostgresDialect as KyselyPostgresDialect } from 'kysely';
import { Pool } from 'pg';
import type { Database } from './types.js';

export { KyselyPostgresDialect as PostgresDialect };

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  user: string;
  password: string;
  maxConnections?: number;
}

export class PostgresDatabase {
  private db: Kysely<Database> | null = null;
  private pool: Pool | null = null;

  constructor(private readonly config: DatabaseConfig) {}

  async connect(): Promise<Kysely<Database>> {
    if (this.db) {
      return this.db;
    }

    this.pool = new Pool({
      host: this.config.host,
      port: this.config.port,
      database: this.config.database,
      user: this.config.user,
      password: this.config.password,
      max: this.config.maxConnections || 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    });

    this.db = new Kysely<Database>({
      dialect: new PostgresDialect({ pool: this.pool }),
    });

    // Test connection
    await this.db.executeQuery('SELECT 1');

    return this.db;
  }

  async disconnect(): Promise<void> {
    if (this.db) {
      await this.db.destroy();
      this.db = null;
    }
    if (this.pool) {
      await this.pool.end();
      this.pool = null;
    }
  }

  getDb(): Kysely<Database> {
    if (!this.db) {
      throw new Error('Database not connected. Call connect() first.');
    }
    return this.db;
  }
}

// Singleton instance for application-wide use
let databaseInstance: PostgresDatabase | null = null;

export function getDatabase(config?: DatabaseConfig): PostgresDatabase {
  if (!databaseInstance) {
    if (!config) {
      config = {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'unified_esm',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '20'),
      };
    }
    databaseInstance = new PostgresDatabase(config);
  }
  return databaseInstance;
}
