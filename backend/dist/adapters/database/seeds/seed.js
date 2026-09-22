import { Kysely } from 'kysely';
import { CamelCasePlugin } from 'kysely';
import { PostgresDialect } from '../database/PostgresDatabase.js';
import bcrypt from 'bcryptjs';
/**
 * Seed database with initial test data
 * Hardcoded users and roles for development until Entra ID integration
 */
export async function seedDatabase() {
    const db = new Kysely({
        dialect: new PostgresDialect(),
        plugins: [new CamelCasePlugin()],
    });
    try {
        console.log('🌱 Seeding database...');
        // Create default workspaces
        const workspaces = [
            { name: 'IT Services', slug: 'it-services', description: 'Information Technology support and services' },
            { name: 'HR Services', slug: 'hr-services', description: 'Human Resources employee services' },
            { name: 'Facilities', slug: 'facilities', description: 'Office facilities and maintenance' },
            { name: 'Finance', slug: 'finance', description: 'Financial services and approvals' },
            { name: 'Legal', slug: 'legal', description: 'Legal department services' },
            { name: 'Operations', slug: 'operations', description: 'Business operations support' },
            { name: 'Compliance', slug: 'compliance', description: 'Compliance and audit services' },
        ];
        for (const ws of workspaces) {
            const exists = await db
                .selectFrom('workspaces')
                .select('id')
                .where('slug', '=', ws.slug)
                .executeTakeFirst();
            if (!exists) {
                await db
                    .insertInto('workspaces')
                    .values({
                    name: ws.name,
                    slug: ws.slug,
                    description: ws.description,
                    settings: {},
                    active: true,
                })
                    .execute();
                console.log(`✅ Created workspace: ${ws.name}`);
            }
        }
        // Create hardcoded test users with different roles
        const passwordHash = await bcrypt.hash('Password123!', 10);
        const users = [
            {
                email: 'admin@unified-esm.local',
                name: 'System Administrator',
                role: 'ADMIN',
                workspace: 'all',
            },
            {
                email: 'john.doe@unified-esm.local',
                name: 'John Doe',
                role: 'END_USER',
                workspace: 'it-services',
            },
            {
                email: 'jane.smith@unified-esm.local',
                name: 'Jane Smith',
                role: 'MANAGER',
                workspace: 'it-services',
            },
            {
                email: 'bob.approver@unified-esm.local',
                name: 'Bob Approver',
                role: 'APPROVER',
                workspace: 'it-services',
            },
            {
                email: 'alice.analyst@unified-esm.local',
                name: 'Alice Analyst',
                role: 'ANALYST',
                workspace: 'all',
            },
            {
                email: 'service.provider@unified-esm.local',
                name: 'Service Provider',
                role: 'SERVICE_PROVIDER',
                workspace: 'it-services',
            },
        ];
        for (const user of users) {
            const exists = await db
                .selectFrom('users')
                .select('id')
                .where('email', '=', user.email)
                .executeTakeFirst();
            if (!exists) {
                await db
                    .insertInto('users')
                    .values({
                    email: user.email,
                    name: user.name,
                    password_hash: passwordHash,
                    active: true,
                })
                    .execute();
                console.log(`✅ Created user: ${user.name} (${user.role})`);
            }
        }
        console.log('🎉 Database seeding completed!');
        console.log('\n📋 Test Credentials:');
        console.log('   Email: admin@unified-esm.local');
        console.log('   Password: Password123!');
        console.log('\n   All users use the same password for testing.');
    }
    catch (error) {
        console.error('💥 Seeding error:', error);
        throw error;
    }
    finally {
        await db.destroy();
    }
}
//# sourceMappingURL=seed.js.map