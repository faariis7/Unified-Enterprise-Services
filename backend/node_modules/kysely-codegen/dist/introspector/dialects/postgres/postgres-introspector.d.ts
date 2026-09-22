import type { IntrospectOptions } from '../../introspector';
import { Introspector } from '../../introspector';
import { DatabaseMetadata } from '../../metadata/database-metadata';
import type { PostgresDB } from './postgres-db';
type PostgresIntrospectorOptions = {
    defaultSchemas?: string[];
    domains?: boolean;
    partitions?: boolean;
};
export declare class PostgresIntrospector extends Introspector<PostgresDB> {
    #private;
    protected readonly options: PostgresIntrospectorOptions;
    constructor(options?: PostgresIntrospectorOptions);
    introspect(options: IntrospectOptions<PostgresDB>): Promise<DatabaseMetadata>;
}
export {};
