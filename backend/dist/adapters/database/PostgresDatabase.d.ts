import { Kysely, PostgresDialect as KyselyPostgresDialect } from 'kysely';
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
export declare class PostgresDatabase {
    private readonly config;
    private db;
    private pool;
    constructor(config: DatabaseConfig);
    connect(): Promise<Kysely<Database>>;
    disconnect(): Promise<void>;
    getDb(): Kysely<Database>;
}
export declare function getDatabase(config?: DatabaseConfig): PostgresDatabase;
//# sourceMappingURL=PostgresDatabase.d.ts.map