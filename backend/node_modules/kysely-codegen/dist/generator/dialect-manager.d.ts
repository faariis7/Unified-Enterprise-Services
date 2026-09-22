import type { DateParser } from '../introspector/dialects/postgres/date-parser';
import type { NumericParser } from '../introspector/dialects/postgres/numeric-parser';
import type { GeneratorDialect } from './dialect';
export type DialectName = 'bun-sqlite' | 'kysely-bun-sqlite' | 'libsql' | 'mssql' | 'mysql' | 'postgres' | 'sqlite' | 'worker-bun-sqlite';
type DialectManagerOptions = {
    dateParser?: DateParser;
    domains?: boolean;
    numericParser?: NumericParser;
    partitions?: boolean;
};
/**
 * Returns a dialect instance for a pre-defined dialect name.
 */
export declare class DialectManager {
    #private;
    constructor(options: DialectManagerOptions);
    getDialect(name: DialectName): GeneratorDialect;
}
export {};
