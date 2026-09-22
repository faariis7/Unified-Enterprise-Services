import type { Kysely } from 'kysely';
import type { GeneratorDialect } from '../dialect';
import type { Logger } from '../logger/logger';
import { type Overrides } from '../transformer/transform';
import type { RuntimeEnumsStyle } from './runtime-enums-style';
import { Serializer } from './serializer';
export type GenerateOptions = {
    camelCase?: boolean;
    db: Kysely<any>;
    dialect: GeneratorDialect;
    excludePattern?: string;
    includePattern?: string;
    logger?: Logger;
    outFile?: string;
    overrides?: Overrides;
    partitions?: boolean;
    print?: boolean;
    runtimeEnums?: boolean;
    runtimeEnumsStyle?: RuntimeEnumsStyle;
    schemas?: string[];
    serializer?: Serializer;
    singular?: boolean;
    typeOnlyImports?: boolean;
    verify?: boolean;
};
/**
 * Generates codegen output using specified options.
 */
export declare const generate: (options: GenerateOptions) => Promise<string>;
