"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VALID_DIALECTS = exports.LOG_LEVEL_NAMES = exports.DEFAULT_URL = exports.DEFAULT_RUNTIME_ENUMS_STYLE = exports.DEFAULT_LOG_LEVEL = exports.DEFAULT_OUT_FILE = void 0;
const path_1 = require("path");
const runtime_enums_style_1 = require("../generator/generator/runtime-enums-style");
const log_level_1 = require("../generator/logger/log-level");
exports.DEFAULT_OUT_FILE = (0, path_1.join)(process.cwd(), 'node_modules', 'kysely-codegen', 'dist', 'db.d.ts');
exports.DEFAULT_LOG_LEVEL = log_level_1.LogLevel.WARN;
exports.DEFAULT_RUNTIME_ENUMS_STYLE = runtime_enums_style_1.RuntimeEnumsStyle.PASCAL_CASE;
exports.DEFAULT_URL = 'env(DATABASE_URL)';
exports.LOG_LEVEL_NAMES = [
    'debug',
    'info',
    'warn',
    'error',
    'silent',
];
exports.VALID_DIALECTS = [
    'postgres',
    'mysql',
    'sqlite',
    'mssql',
    'libsql',
    'bun-sqlite',
    'kysely-bun-sqlite',
    'worker-bun-sqlite',
];
//# sourceMappingURL=constants.js.map