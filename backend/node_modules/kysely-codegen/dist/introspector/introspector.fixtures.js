"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.migrate = exports.addExtraColumn = void 0;
const assert_1 = __importDefault(require("assert"));
const kysely_1 = require("kysely");
const dialect_1 = require("./dialect");
const mysql_dialect_1 = require("./dialects/mysql/mysql-dialect");
const postgres_dialect_1 = require("./dialects/postgres/postgres-dialect");
const down = async (db, dialect) => {
    (0, assert_1.default)(dialect instanceof dialect_1.IntrospectorDialect);
    await db.transaction().execute(async (trx) => {
        await trx.schema.dropTable('boolean').ifExists().execute();
        await trx.schema.dropTable('foo_bar').ifExists().execute();
        if (dialect instanceof postgres_dialect_1.PostgresIntrospectorDialect) {
            await trx.schema
                .withSchema('test')
                .dropType('status')
                .ifExists()
                .execute();
            await trx.schema
                .withSchema('test')
                .dropType('is_bool')
                .ifExists()
                .execute();
            await trx.schema.dropSchema('test').ifExists().execute();
            await trx.schema.dropType('status').ifExists().execute();
            await trx.schema.dropType('pos_int_child').ifExists().execute();
            await trx.schema.dropType('pos_int').ifExists().execute();
            await trx.schema.dropTable('partitioned_table').ifExists().execute();
        }
    });
};
const up = async (db, dialect) => {
    (0, assert_1.default)(dialect instanceof dialect_1.IntrospectorDialect);
    await db.transaction().execute(async (trx) => {
        if (dialect instanceof postgres_dialect_1.PostgresIntrospectorDialect) {
            await trx.schema.createSchema('test').ifNotExists().execute();
            await trx.schema
                .withSchema('test')
                .createType('status')
                .asEnum(['ABC_DEF', 'GHI_JKL'])
                .execute();
            await trx.schema
                .createType('status')
                .asEnum(['CONFIRMED', 'UNCONFIRMED'])
                .execute();
            await (0, kysely_1.sql) `CREATE domain pos_int AS Integer CONSTRAINT positive_number CHECK (value >= 0);`.execute(trx);
            // Edge case where a domain is a child of another domain:
            await (0, kysely_1.sql) `CREATE domain pos_int_child as pos_int;`.execute(trx);
            await (0, kysely_1.sql) `CREATE domain test.is_bool as boolean;`.execute(trx);
        }
        let builder = trx.schema
            .createTable('foo_bar')
            .addColumn('false', 'boolean', (col) => col.notNull())
            .addColumn('true', 'boolean', (col) => col.notNull())
            .addColumn('overridden', (0, kysely_1.sql) `text`);
        if (dialect instanceof mysql_dialect_1.MysqlIntrospectorDialect) {
            builder = builder
                .addColumn('id', 'serial')
                .addColumn('user_status', (0, kysely_1.sql) `enum('CONFIRMED','UNCONFIRMED')`);
        }
        else if (dialect instanceof postgres_dialect_1.PostgresIntrospectorDialect) {
            builder = builder
                .addColumn('id', 'serial')
                .addColumn('date', 'date')
                .addColumn('user_status', (0, kysely_1.sql) `status`)
                .addColumn('user_status_2', (0, kysely_1.sql) `test.status`)
                .addColumn('array', (0, kysely_1.sql) `text[]`)
                .addColumn('nullable_pos_int', (0, kysely_1.sql) `pos_int`)
                .addColumn('defaulted_nullable_pos_int', (0, kysely_1.sql) `pos_int`, (col) => col.defaultTo(0))
                .addColumn('defaulted_required_pos_int', (0, kysely_1.sql) `pos_int`, (col) => col.notNull().defaultTo(0))
                .addColumn('child_domain', (0, kysely_1.sql) `pos_int_child`)
                .addColumn('test_domain_is_bool', (0, kysely_1.sql) `test.is_bool`)
                .addColumn('timestamps', (0, kysely_1.sql) `timestamp with time zone[]`)
                .addColumn('interval1', (0, kysely_1.sql) `interval`)
                .addColumn('interval2', (0, kysely_1.sql) `interval`)
                .addColumn('json', (0, kysely_1.sql) `json`)
                .addColumn('json_typed', (0, kysely_1.sql) `json`)
                .addColumn('numeric1', (0, kysely_1.sql) `numeric`)
                .addColumn('numeric2', (0, kysely_1.sql) `numeric`);
        }
        else {
            builder = builder
                .addColumn('id', 'integer', (col) => col.autoIncrement().notNull().primaryKey())
                .addColumn('user_status', 'text');
        }
        await builder.execute();
        if (dialect instanceof postgres_dialect_1.PostgresIntrospectorDialect) {
            await trx.executeQuery((0, kysely_1.sql) `
          comment on column foo_bar.false is
          'This is a comment on a column.\r\n\r\nIt''s nice, isn''t it?';
        `.compile(trx));
            await trx.schema
                .createTable('partitioned_table')
                .addColumn('id', 'serial')
                .modifyEnd((0, kysely_1.sql) `partition by range (id)`)
                .execute();
            await trx.executeQuery((0, kysely_1.sql) `
          create table partition_1 partition of partitioned_table for values from (1) to (100);
        `.compile(trx));
        }
    });
};
const addExtraColumn = async (db) => {
    await db.transaction().execute(async (trx) => {
        const builder = trx.schema
            .alterTable('foo_bar')
            .addColumn('user_name', 'varchar(50)', (col) => col.defaultTo('test'));
        await builder.execute();
    });
};
exports.addExtraColumn = addExtraColumn;
const migrate = async (dialect, connectionString) => {
    const db = new kysely_1.Kysely({
        dialect: await dialect.createKyselyDialect({ connectionString }),
        plugins: [new kysely_1.CamelCasePlugin()],
    });
    await down(db, dialect);
    await up(db, dialect);
    return db;
};
exports.migrate = migrate;
//# sourceMappingURL=introspector.fixtures.js.map