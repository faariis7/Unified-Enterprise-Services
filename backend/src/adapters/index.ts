// Adapters Layer Exports
// Contains implementations of domain interfaces (repositories, external services)

// Database
export { PostgresDatabase, getDatabase } from './database/PostgresDatabase.js';
export type { DatabaseConfig } from './database/PostgresDatabase.js';
export type { Database } from './database/types.js';

// Repositories
export { PostgresRequestRepository } from './repositories/PostgresRequestRepository.js';

// External Services (to be implemented)
// - EmailService
// - FileStorageService
// - VirusScannerService
// - SearchService
