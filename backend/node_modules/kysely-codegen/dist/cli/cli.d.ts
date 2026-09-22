import type { DialectName } from '../generator/dialect-manager';
import { RuntimeEnumsStyle } from '../generator/generator/runtime-enums-style';
import { LogLevel } from '../generator/logger/log-level';
import type { Overrides } from '../generator/transformer/transform';
import { DateParser } from '../introspector/dialects/postgres/date-parser';
import { NumericParser } from '../introspector/dialects/postgres/numeric-parser';
export type CliOptions = {
    camelCase?: boolean;
    dateParser?: DateParser;
    dialectName?: DialectName;
    domains?: boolean;
    envFile?: string;
    excludePattern?: string;
    includePattern?: string;
    logLevel?: LogLevel;
    numericParser?: NumericParser;
    outFile?: string;
    overrides?: Overrides;
    partitions?: boolean;
    print?: boolean;
    runtimeEnums?: boolean;
    runtimeEnumsStyle?: RuntimeEnumsStyle;
    schemas?: string[];
    singular?: boolean;
    typeOnlyImports?: boolean;
    url: string;
    verify?: boolean;
};
/**
 * Creates a kysely-codegen command-line interface.
 */
export declare class Cli {
    #private;
    logLevel: LogLevel;
    generate(options: CliOptions): Promise<void>;
    parseOptions(args: string[], options?: {
        silent?: boolean;
    }): CliOptions;
    run(argv: string[]): Promise<void>;
}
