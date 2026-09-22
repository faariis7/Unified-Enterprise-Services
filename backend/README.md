# Unified ESM Backend

Enterprise Service Management backend built with Fastify, TypeScript, and PostgreSQL following Clean Architecture principles.

## Quick Start

### Prerequisites
- Node.js 20+
- Docker & Docker Compose
- pnpm or npm

### 1. Start Infrastructure Services
```bash
cd infrastructure/docker
docker-compose -f docker-compose.dev.yml up -d
```

This starts:
- PostgreSQL (port 5432)
- Redis (port 6379)
- MinIO (port 9000, console: 9001)
- MailHog (port 1025 SMTP, 8025 UI)
- ClamAV (port 3310)

### 2. Install Dependencies
```bash
cd backend
pnpm install
```

### 3. Configure Environment
```bash
cp .env.example .env
# Edit .env with your settings
```

### 4. Run Database Migrations
```bash
pnpm db:migrate
```

### 5. Start Development Server
```bash
pnpm dev
```

Server runs at http://localhost:3000
API docs at http://localhost:3000/docs

## Project Structure

```
backend/
├── src/
│   ├── domain/           # Business logic (entities, value objects, repository interfaces)
│   ├── application/      # Use cases, commands, queries
│   ├── adapters/         # External implementations (repositories, services)
│   └── delivery/         # API controllers, middleware
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
└── package.json
```

## Architecture

### Clean Architecture Layers

1. **Domain Layer**: Core business entities and rules
   - No external dependencies
   - Defines repository interfaces
   - Contains domain events

2. **Application Layer**: Use cases and business workflows
   - Depends only on domain layer
   - Orchestrates domain objects
   - Handles transactions

3. **Adapters Layer**: External service implementations
   - Repository implementations (PostgreSQL, etc.)
   - External API clients (email, storage, etc.)
   - Implements domain interfaces

4. **Delivery Layer**: Entry points
   - REST API controllers
   - WebSocket handlers
   - Background job processors

## Testing

```bash
# Unit tests
pnpm test

# Integration tests (requires Docker)
pnpm test:integration

# E2E tests
pnpm test:e2e

# With coverage
pnpm test:coverage
```

## API Documentation

Once running, visit http://localhost:3000/docs for interactive Swagger UI.

## Key Features

- ✅ JWT Authentication
- ✅ Role-Based Access Control
- ✅ Request Management
- ✅ Approval Workflows
- ✅ File Upload with Virus Scanning
- ✅ Audit Logging
- ✅ SLA Tracking
- ✅ Multi-Workspace Support

## Environment Variables

See `.env.example` for all configuration options.

## Next Steps

1. Implement remaining use cases
2. Add authentication routes
3. Build request management endpoints
4. Integrate email notifications
5. Add full-text search
6. Implement background jobs
