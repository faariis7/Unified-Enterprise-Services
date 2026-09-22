"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generate = void 0;
const fs_1 = require("fs");
const path_1 = require("path");
const perf_hooks_1 = require("perf_hooks");
const transform_1 = require("../transformer/transform");
const diff_checker_1 = require("./diff-checker");
const serializer_1 = require("./serializer");
/**
 * Generates codegen output using specified options.
 */
const generate = async (options) => {
    const startTime = perf_hooks_1.performance.now();
    options.logger?.info('Introspecting database...');
    const metadata = await options.dialect.introspector.introspect({
        db: options.db,
        excludePattern: options.excludePattern,
        includePattern: options.includePattern,
        partitions: !!options.partitions,
    });
    options.logger?.debug();
    options.logger?.debug(`Found ${metadata.tables.length} public tables:`);
    for (const table of metadata.tables) {
        options.logger?.debug(` - ${table.name}`);
    }
    options.logger?.debug();
    const nodes = (0, transform_1.transform)({
        camelCase: !!options.camelCase,
        defaultSchemas: options.schemas,
        dialect: options.dialect,
        metadata,
        overrides: options.overrides,
        runtimeEnums: !!options.runtimeEnums,
        runtimeEnumsStyle: options.runtimeEnumsStyle,
    });
    const serializer = options.serializer ??
        new serializer_1.Serializer({
            camelCase: options.camelCase,
            runtimeEnumsStyle: options.runtimeEnumsStyle,
            singular: options.singular,
            typeOnlyImports: options.typeOnlyImports,
        });
    const data = serializer.serializeFile(nodes);
    const relativeOutDir = options.outFile
        ? `.${path_1.sep}${(0, path_1.relative)(process.cwd(), options.outFile)}`
        : null;
    if (options.print) {
        console.info();
        console.info(data);
    }
    else if (relativeOutDir) {
        if (options.verify) {
            let existingTypes;
            try {
                existingTypes = await fs_1.promises.readFile(relativeOutDir, 'utf8');
            }
            catch (error) {
                options.logger?.error(error);
                throw new Error('Failed to load existing types');
            }
            const diffChecker = new diff_checker_1.DiffChecker();
            const diff = diffChecker.diff(data, existingTypes);
            if (diff) {
                options.logger?.error(diff);
                throw new Error("Generated types are not up-to-date! Use '--log-level=error' option to view the diff.");
            }
            const endTime = perf_hooks_1.performance.now();
            const duration = Math.round(endTime - startTime);
            options.logger?.success(`Generated types are up-to-date! (${duration}ms)`);
        }
        else {
            const outDir = (0, path_1.parse)(relativeOutDir).dir;
            await fs_1.promises.mkdir(outDir, { recursive: true });
            await fs_1.promises.writeFile(relativeOutDir, data);
            const endTime = perf_hooks_1.performance.now();
            const duration = Math.round(endTime - startTime);
            const tableCount = metadata.tables.length;
            const s = tableCount === 1 ? '' : 's';
            options.logger?.success(`Introspected ${tableCount} table${s} and generated ${relativeOutDir} in ${duration}ms.\n`);
        }
    }
    return data;
};
exports.generate = generate;
//# sourceMappingURL=generate.js.map