"use strict";
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _Cli_instances, _Cli_parseBoolean, _Cli_parseDateParser, _Cli_parseLogLevel, _Cli_parseNumericParser, _Cli_parseRuntimeEnumsStyle, _Cli_parseString, _Cli_parseStringArray, _Cli_showHelp;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cli = void 0;
const minimist_1 = __importDefault(require("minimist"));
const connection_string_parser_1 = require("../generator/connection-string-parser");
const dialect_manager_1 = require("../generator/dialect-manager");
const generate_1 = require("../generator/generator/generate");
const runtime_enums_style_1 = require("../generator/generator/runtime-enums-style");
const log_level_1 = require("../generator/logger/log-level");
const logger_1 = require("../generator/logger/logger");
const date_parser_1 = require("../introspector/dialects/postgres/date-parser");
const numeric_parser_1 = require("../introspector/dialects/postgres/numeric-parser");
const constants_1 = require("./constants");
const flags_1 = require("./flags");
/**
 * Creates a kysely-codegen command-line interface.
 */
class Cli {
    constructor() {
        _Cli_instances.add(this);
        this.logLevel = constants_1.DEFAULT_LOG_LEVEL;
    }
    async generate(options) {
        const camelCase = !!options.camelCase;
        const excludePattern = options.excludePattern;
        const includePattern = options.includePattern;
        const outFile = options.outFile;
        const overrides = options.overrides;
        const partitions = !!options.partitions;
        const print = !!options.print;
        const runtimeEnums = options.runtimeEnums;
        const runtimeEnumsStyle = options.runtimeEnumsStyle;
        const schemas = options.schemas;
        const singular = !!options.singular;
        const typeOnlyImports = options.typeOnlyImports;
        const verify = options.verify;
        const logger = new logger_1.Logger(options.logLevel);
        const connectionStringParser = new connection_string_parser_1.ConnectionStringParser();
        const { connectionString, inferredDialectName } = connectionStringParser.parse({
            connectionString: options.url ?? constants_1.DEFAULT_URL,
            dialectName: options.dialectName,
            envFile: options.envFile,
            logger,
        });
        if (options.dialectName) {
            logger.info(`Using dialect '${options.dialectName}'.`);
        }
        else {
            logger.info(`No dialect specified. Assuming '${inferredDialectName}'.`);
        }
        const dialectManager = new dialect_manager_1.DialectManager({
            dateParser: options.dateParser ?? date_parser_1.DEFAULT_DATE_PARSER,
            domains: !!options.domains,
            numericParser: options.numericParser ?? numeric_parser_1.DEFAULT_NUMERIC_PARSER,
            partitions: !!options.partitions,
        });
        const dialect = dialectManager.getDialect(options.dialectName ?? inferredDialectName);
        const db = await dialect.introspector.connect({
            connectionString,
            dialect,
        });
        await (0, generate_1.generate)({
            camelCase,
            db,
            dialect,
            excludePattern,
            includePattern,
            logger,
            outFile,
            overrides,
            partitions,
            print,
            runtimeEnums,
            runtimeEnumsStyle,
            schemas,
            singular,
            typeOnlyImports,
            verify,
        });
        await db.destroy();
    }
    parseOptions(args, options) {
        const argv = (0, minimist_1.default)(args);
        const logLevel = (this.logLevel = __classPrivateFieldGet(this, _Cli_instances, "m", _Cli_parseLogLevel).call(this, argv['log-level']));
        const _ = argv._;
        const camelCase = __classPrivateFieldGet(this, _Cli_instances, "m", _Cli_parseBoolean).call(this, argv['camel-case']);
        const dateParser = __classPrivateFieldGet(this, _Cli_instances, "m", _Cli_parseDateParser).call(this, argv['date-parser']);
        const dialectName = __classPrivateFieldGet(this, _Cli_instances, "m", _Cli_parseString).call(this, argv.dialect);
        const domains = __classPrivateFieldGet(this, _Cli_instances, "m", _Cli_parseBoolean).call(this, argv.domains);
        const envFile = __classPrivateFieldGet(this, _Cli_instances, "m", _Cli_parseString).call(this, argv['env-file']);
        const excludePattern = __classPrivateFieldGet(this, _Cli_instances, "m", _Cli_parseString).call(this, argv['exclude-pattern']);
        const help = !!argv.h || !!argv.help || _.includes('-h') || _.includes('--help');
        const includePattern = __classPrivateFieldGet(this, _Cli_instances, "m", _Cli_parseString).call(this, argv['include-pattern']);
        const numericParser = __classPrivateFieldGet(this, _Cli_instances, "m", _Cli_parseNumericParser).call(this, argv['numeric-parser']);
        const outFile = __classPrivateFieldGet(this, _Cli_instances, "m", _Cli_parseString).call(this, argv['out-file']) ??
            (argv.print ? undefined : constants_1.DEFAULT_OUT_FILE);
        const overrides = argv.overrides ? JSON.parse(argv.overrides) : undefined;
        const partitions = __classPrivateFieldGet(this, _Cli_instances, "m", _Cli_parseBoolean).call(this, argv.partitions);
        const print = __classPrivateFieldGet(this, _Cli_instances, "m", _Cli_parseBoolean).call(this, argv.print);
        const runtimeEnums = __classPrivateFieldGet(this, _Cli_instances, "m", _Cli_parseBoolean).call(this, argv['runtime-enums']);
        const runtimeEnumsStyle = __classPrivateFieldGet(this, _Cli_instances, "m", _Cli_parseRuntimeEnumsStyle).call(this, argv['runtime-enums-style']);
        const schemas = __classPrivateFieldGet(this, _Cli_instances, "m", _Cli_parseStringArray).call(this, argv.schema);
        const singular = __classPrivateFieldGet(this, _Cli_instances, "m", _Cli_parseBoolean).call(this, argv.singular);
        const typeOnlyImports = __classPrivateFieldGet(this, _Cli_instances, "m", _Cli_parseBoolean).call(this, argv['type-only-imports'] ?? true);
        const url = __classPrivateFieldGet(this, _Cli_instances, "m", _Cli_parseString).call(this, argv.url) ?? constants_1.DEFAULT_URL;
        const verify = __classPrivateFieldGet(this, _Cli_instances, "m", _Cli_parseBoolean).call(this, argv.verify);
        for (const key in argv) {
            if (key !== '_' &&
                !flags_1.FLAGS.some((flag) => {
                    return [
                        flag.shortName,
                        flag.longName,
                        ...(flag.longName.startsWith('no-')
                            ? [flag.longName.slice(3)]
                            : []),
                    ].includes(key);
                })) {
                throw new RangeError(`Invalid flag: "${key}"`);
            }
        }
        if (help && !options?.silent) {
            __classPrivateFieldGet(this, _Cli_instances, "m", _Cli_showHelp).call(this);
        }
        if (dialectName && !constants_1.VALID_DIALECTS.includes(dialectName)) {
            const dialectValues = constants_1.VALID_DIALECTS.join(', ');
            throw new RangeError(`Parameter '--dialect' must have one of the following values: ${dialectValues}`);
        }
        if (!url) {
            throw new TypeError("Parameter '--url' must be a valid connection string. Examples:\n\n" +
                '  --url=postgres://username:password@mydomain.com/database\n' +
                '  --url=env(DATABASE_URL)');
        }
        return {
            camelCase,
            dateParser,
            dialectName,
            domains,
            envFile,
            excludePattern,
            includePattern,
            logLevel,
            numericParser,
            outFile,
            overrides,
            partitions,
            print,
            runtimeEnums,
            runtimeEnumsStyle,
            schemas,
            singular,
            typeOnlyImports,
            url,
            verify,
        };
    }
    async run(argv) {
        try {
            const options = this.parseOptions(argv);
            await this.generate(options);
        }
        catch (error) {
            if (this.logLevel > log_level_1.LogLevel.SILENT) {
                if (error instanceof Error) {
                    if (this.logLevel >= log_level_1.LogLevel.DEBUG) {
                        console.error();
                        throw error;
                    }
                    else {
                        console.error(new logger_1.Logger().serializeError(error.message));
                        process.exit(0);
                    }
                }
                else {
                    throw error;
                }
            }
        }
    }
}
exports.Cli = Cli;
_Cli_instances = new WeakSet(), _Cli_parseBoolean = function _Cli_parseBoolean(input) {
    return !!input && input !== 'false';
}, _Cli_parseDateParser = function _Cli_parseDateParser(input) {
    switch (input) {
        case 'string':
            return date_parser_1.DateParser.STRING;
        case 'timestamp':
            return date_parser_1.DateParser.TIMESTAMP;
        default:
            return date_parser_1.DEFAULT_DATE_PARSER;
    }
}, _Cli_parseLogLevel = function _Cli_parseLogLevel(input) {
    switch (input) {
        case 'silent':
            return log_level_1.LogLevel.SILENT;
        case 'info':
            return log_level_1.LogLevel.INFO;
        case 'error':
            return log_level_1.LogLevel.ERROR;
        case 'debug':
            return log_level_1.LogLevel.DEBUG;
        case 'warn':
            return log_level_1.LogLevel.WARN;
        default:
            return constants_1.DEFAULT_LOG_LEVEL;
    }
}, _Cli_parseNumericParser = function _Cli_parseNumericParser(input) {
    switch (input) {
        case 'number':
            return numeric_parser_1.NumericParser.NUMBER;
        case 'number-or-string':
            return numeric_parser_1.NumericParser.NUMBER_OR_STRING;
        case 'string':
            return numeric_parser_1.NumericParser.STRING;
        default:
            return numeric_parser_1.DEFAULT_NUMERIC_PARSER;
    }
}, _Cli_parseRuntimeEnumsStyle = function _Cli_parseRuntimeEnumsStyle(input) {
    switch (input) {
        case 'pascal-case':
            return runtime_enums_style_1.RuntimeEnumsStyle.PASCAL_CASE;
        case 'screaming-snake-case':
            return runtime_enums_style_1.RuntimeEnumsStyle.SCREAMING_SNAKE_CASE;
    }
}, _Cli_parseString = function _Cli_parseString(input) {
    return input === undefined ? undefined : String(input);
}, _Cli_parseStringArray = function _Cli_parseStringArray(input) {
    if (input === undefined)
        return [];
    if (!Array.isArray(input))
        return [String(input)];
    return input.map(String);
}, _Cli_showHelp = function _Cli_showHelp() {
    console.info(['', 'kysely-codegen [options]', '', (0, flags_1.serializeFlags)(flags_1.FLAGS), ''].join('\n'));
    process.exit(0);
};
//# sourceMappingURL=cli.js.map