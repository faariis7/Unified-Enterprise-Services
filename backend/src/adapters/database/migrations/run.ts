import { Kysely, sql } from 'kysely';
import { getDatabase } from '../PostgresDatabase.js';
import type { Database } from '../types.js';

/**
 * Migration runner for database schema management
 * Uses simple sequential migration execution
 */

interface Migration {
  name: string;
  up: (db: Kysely<Database>) => Promise<void>;
  down?: (db: Kysely<Database>) => Promise<void>;
}

const migrations: Migration[] = [
  {
    name: '001_create-workspaces-table',
    up: async (db) => {
      await db.schema
        .createTable('workspaces')
        .ifNotExists()
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
        .addColumn('name', 'varchar(255)', (col: any) => col.notNull())
        .addColumn('slug', 'varchar(100)', (col: any) => col.notNull().unique())
        .addColumn('description', 'text')
        .addColumn('logo_url', 'varchar(500)')
        .addColumn('settings', 'jsonb', (col: any) => col.defaultTo('{}'))
        .addColumn('active', 'boolean', (col: any) => col.defaultTo(true))
        .addColumn('created_at', 'timestamptz', (col: any) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
        .addColumn('updated_at', 'timestamptz', (col: any) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
        .execute();
    },
    down: async (db) => {
      await db.schema.dropTable('workspaces').ifExists().execute();
    }
  },
  {
    name: '002_create-users-table',
    up: async (db) => {
      await db.schema
        .createTable('users')
        .ifNotExists()
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
        .addColumn('email', 'varchar(255)', (col: any) => col.notNull().unique())
        .addColumn('name', 'varchar(255)', (col: any) => col.notNull())
        .addColumn('password_hash', 'varchar(255)')
        .addColumn('entra_id', 'varchar(255)')
        .addColumn('avatar_url', 'varchar(500)')
        .addColumn('active', 'boolean', (col: any) => col.defaultTo(true))
        .addColumn('last_login_at', 'timestamptz')
        .addColumn('created_at', 'timestamptz', (col: any) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
        .addColumn('updated_at', 'timestamptz', (col: any) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
        .execute();

      // Add unique constraint on entra_id separately
      await sql`ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS users_entra_id_key UNIQUE (entra_id)`.execute(db);
    },
    down: async (db) => {
      await db.schema.dropTable('users').ifExists().execute();
    }
  },
  {
    name: '003_create-requests-table',
    up: async (db) => {
      await db.schema
        .createTable('requests')
        .ifNotExists()
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
        .addColumn('workspace_id', 'uuid', (col: any) => col.notNull().references('workspaces.id').onDelete('cascade'))
        .addColumn('service_id', 'uuid', (col: any) => col.notNull())
        .addColumn('request_id', 'varchar(50)', (col: any) => col.notNull())
        .addColumn('title', 'varchar(500)', (col: any) => col.notNull())
        .addColumn('description', 'text', (col: any) => col.notNull())
        .addColumn('status', 'varchar(50)', (col: any) => col.notNull().defaultTo('SUBMITTED'))
        .addColumn('priority', 'varchar(20)', (col: any) => col.notNull().defaultTo('MEDIUM'))
        .addColumn('requester_id', 'uuid', (col: any) => col.notNull().references('users.id'))
        .addColumn('assignee_id', 'uuid', (col: any) => col.references('users.id'))
        .addColumn('category_id', 'uuid')
        .addColumn('form_values', 'jsonb', (col: any) => col.defaultTo('{}'))
        .addColumn('sla_due_date', 'timestamptz')
        .addColumn('created_at', 'timestamptz', (col: any) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
        .addColumn('updated_at', 'timestamptz', (col: any) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
        .addColumn('completed_at', 'timestamptz')
        .execute();

      // Create indexes
      await db.schema.createIndex('idx_requests_request_id').on('requests').column('request_id').ifNotExists().execute();
      await db.schema.createIndex('idx_requests_workspace_id').on('requests').column('workspace_id').ifNotExists().execute();
      await db.schema.createIndex('idx_requests_status').on('requests').column('status').ifNotExists().execute();
    },
    down: async (db) => {
      await db.schema.dropIndex('idx_requests_request_id').ifExists().execute();
      await db.schema.dropIndex('idx_requests_workspace_id').ifExists().execute();
      await db.schema.dropIndex('idx_requests_status').ifExists().execute();
      await db.schema.dropTable('requests').ifExists().execute();
    }
  },
  {
    name: '004_create-approvals-table',
    up: async (db) => {
      await db.schema
        .createTable('approvals')
        .ifNotExists()
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
        .addColumn('request_id', 'uuid', (col: any) => col.notNull().references('requests.id').onDelete('cascade'))
        .addColumn('approver_id', 'uuid', (col: any) => col.notNull().references('users.id'))
        .addColumn('level', 'integer', (col: any) => col.notNull().defaultTo(1))
        .addColumn('status', 'varchar(20)', (col: any) => col.notNull().defaultTo('PENDING'))
        .addColumn('comments', 'text')
        .addColumn('decided_at', 'timestamptz')
        .addColumn('created_at', 'timestamptz', (col: any) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
        .addColumn('updated_at', 'timestamptz', (col: any) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
        .execute();
    },
    down: async (db) => {
      await db.schema.dropTable('approvals').ifExists().execute();
    }
  },
  {
    name: '005_create-audit-logs-table',
    up: async (db) => {
      await db.schema
        .createTable('audit_logs')
        .ifNotExists()
        .addColumn('id', 'uuid', (col) => col.primaryKey().defaultTo(sql`uuid_generate_v4()`))
        .addColumn('entity_type', 'varchar(100)', (col: any) => col.notNull())
        .addColumn('entity_id', 'uuid', (col: any) => col.notNull())
        .addColumn('action', 'varchar(50)', (col: any) => col.notNull())
        .addColumn('user_id', 'uuid', (col: any) => col.references('users.id'))
        .addColumn('old_values', 'jsonb')
        .addColumn('new_values', 'jsonb')
        .addColumn('ip_address', 'text')
        .addColumn('user_agent', 'text')
        .addColumn('created_at', 'timestamptz', (col: any) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
        .execute();

      await db.schema.createIndex('idx_audit_logs_entity').on('audit_logs').columns(['entity_type', 'entity_id']).ifNotExists().execute();
      await db.schema.createIndex('idx_audit_logs_created_at').on('audit_logs').column('created_at').ifNotExists().execute();
    },
    down: async (db) => {
      await db.schema.dropIndex('idx_audit_logs_entity').ifExists().execute();
      await db.schema.dropIndex('idx_audit_logs_created_at').ifExists().execute();
      await db.schema.dropTable('audit_logs').ifExists().execute();
    }
  },
  {
    name: '006_create-migration-tracking-table',
    up: async (db) => {
      await db.schema
        .createTable('migrations')
        .ifNotExists()
        .addColumn('id', 'serial', (col: any) => col.primaryKey())
        .addColumn('name', 'varchar(255)', (col: any) => col.notNull().unique())
        .addColumn('executed_at', 'timestamptz', (col: any) => col.defaultTo(sql`CURRENT_TIMESTAMP`))
        .execute();
    },
    down: async (db) => {
      await db.schema.dropTable('migrations').ifExists().execute();
    }
  }
];

export async function runMigrations() {
  const database = getDatabase();
  const db = await database.connect();

  try {
    console.log('ðŸ”„ Running database migrations...');

    // Ensure uuid-ossp extension exists
    await sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`.execute(db);

    for (const migration of migrations) {
      const exists = await db
        .selectFrom('migrations')
        .select('name')
        .where('name', '=', migration.name)
        .executeTakeFirst();

      if (!exists) {
        console.log(`â³ Running migration: ${migration.name}`);
        
        await db.transaction().execute(async (transaction) => {
          await migration.up(transaction);
          await transaction
            .insertInto('migrations')
            .values({ name: migration.name })
            .execute();
        });
        
        console.log(`✅ Migration completed: ${migration.name}`);
      } else {
        console.log(`â­ï¸  Skipping migration (already run): ${migration.name}`);
      }
    }

    console.log('ðŸŽ‰ All migrations completed successfully!');
  } catch (error) {
    console.error('ðŸ’¥ Migration error:', error);
    throw error;
  } finally {
    await database.disconnect();
  }
}

export async function rollbackLastMigration() {
  const database = getDatabase();
  const db = await database.connect();

  try {
    const lastMigration = await db
      .selectFrom('migrations')
      .selectAll()
      .orderBy('id', 'desc')
      .executeTakeFirst();

    if (!lastMigration) {
      console.log('No migrations to rollback');
      return;
    }

    const migration = migrations.find(m => m.name === lastMigration.name);
    
    if (!migration || !migration.down) {
      console.log(`No rollback available for: ${lastMigration.name}`);
      return;
    }

    console.log(`ðŸ”™ Rolling back migration: ${migration.name}`);
    
    await db.transaction().execute(async (transaction) => {
      await migration.down(transaction);
      await transaction
        .deleteFrom('migrations')
        .where('name', '=', migration.name)
        .execute();
    });
    
    console.log(`✅ Rollback completed: ${migration.name}`);
  } catch (error) {
    console.error('❌ Rollback failed:', error);
    throw error;
  } finally {
    await database.disconnect();
  }
}

