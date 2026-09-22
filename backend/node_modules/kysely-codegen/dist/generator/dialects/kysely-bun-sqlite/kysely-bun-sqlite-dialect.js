"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KyselyBunSqliteDialect = void 0;
const sqlite_dialect_1 = require("../../../introspector/dialects/sqlite/sqlite-dialect");
const sqlite_adapter_1 = require("../sqlite/sqlite-adapter");
class KyselyBunSqliteDialect extends sqlite_dialect_1.SqliteIntrospectorDialect {
    constructor() {
        super(...arguments);
        this.adapter = new sqlite_adapter_1.SqliteAdapter();
    }
}
exports.KyselyBunSqliteDialect = KyselyBunSqliteDialect;
//# sourceMappingURL=kysely-bun-sqlite-dialect.js.map