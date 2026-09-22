# Agent Context - Unified ESM

**Version:** 1.0  
**Last Updated:** Phase 2 Bootstrap  
**Audience:** AI Agents, Human Developers

---

## Project Vision

Build a self-hostable, enterprise-grade service management platform that consolidates multiple departmental service desks (IT, HR, Facilities, Finance, Legal, Operations, Compliance) into a single governed system while preserving workspace isolation and departmental autonomy.

### Key Differentiators

1. **No Vendor Lock-in**: Replaceable providers for database, storage, identity, email
2. **Clean Architecture**: Strict layer separation, domain-centric design
3. **Workspace Isolation**: Each department operates independently with shared infrastructure
4. **Immutable Audit Trail**: Every state change recorded for compliance
5. **Low-Code Configuration**: Service Builder, Workflow Designer, Report Builder

---

## Business Goals

| Goal | Metric | Target |
|------|--------|--------|
| **Consolidation** | Reduce service desk tools | 7 workspaces → 1 platform |
| **Governance** | Standardize processes | 100% requests follow defined workflows |
| **Efficiency** | Reduce resolution time | 30% improvement via automation |
| **Compliance** | Audit readiness | Immutable audit trail for all actions |
| **Flexibility** | Department autonomy | Workspace-specific configurations |
| **Cost Reduction** | License consolidation | Eliminate redundant SaaS subscriptions |

---

## Architecture Overview

### Clean Architecture Layers

```
┌─────────────────────────────────────────┐
│         DELIVERY LAYER                   │
│  - Fastify API Server                    │
│  - React Frontend                        │
│  - Middleware (CORS, JWT, Rate Limit)   │
│  - Swagger Documentation                 │
├─────────────────────────────────────────┤
│         ADAPTERS LAYER                   │
│  - PostgreSQL Repository                 │
│  - Redis Cache                           │
│  - MinIO/S3 Storage                      │
│  - SMTP Email                            │
│  - Entra ID Auth                         │
├─────────────────────────────────────────┤
│       APPLICATION LAYER                  │
│  - Use Cases                             │
│  - Commands & Queries                    │
│  - DTOs                                  │
│  - Application Services                  │
├─────────────────────────────────────────┤
│          DOMAIN LAYER                    │
│  - Entities (Request, User, Workspace)   │
│  - Value Objects (Status, Priority)      │
│  - Domain Events                         │
│  - Repository Interfaces                 │
│  - Domain Services                       │
└─────────────────────────────────────────┘
```

### Data Flow Example: Create Request

```
Frontend → API Route → CreateRequestUseCase → 
Request Entity → IRepository → PostgreSQL
                                    ↓
                              Domain Event Published
                                    ↓
                          Email Notification (Async)
```

---

## Current Implementation Status

### ✅ Completed

- [x] Frontend application (all modules)
- [x] In-memory business logic layer
- [x] Backend foundation (Clean Architecture)
- [x] Database schema and migrations
- [x] Docker development environment
- [x] Repository pattern implementation
- [x] Basic use case (CreateRequest)

### 🟡 In Progress

- [ ] Full API coverage (CRUD operations)
- [ ] Authentication flow
- [ ] File upload service
- [ ] Email notification system
- [ ] Background job processor

### ❌ Not Started

- [ ] Entra ID SSO integration
- [ ] Search engine implementation
- [ ] Caching layer integration
- [ ] Production deployment guides
- [ ] Performance optimization

---

## Known Limitations

### Current Blockers

1. **No Persistent Storage**
   - Frontend uses in-memory data services
   - All data lost on refresh
   - Backend APIs not fully implemented

2. **No Authentication**
   - Hardcoded user context in frontend
   - No login/logout functionality
   - JWT infrastructure ready but unused

3. **No File Upload**
   - Attachment feature non-functional
   - MinIO configured but no upload API
   - Virus scanning integration pending

4. **No Background Jobs**
   - SLA monitoring not automated
   - Automation rules not executed
   - Email notifications not sent

5. **No Integration Tests**
   - Unit test framework ready
   - No actual tests written
   - Coverage at 0%

### Workarounds in Place

- **Hardcoded Users**: 6 test users seeded in database
- **Mock Auth**: JWT token generation without validation
- **In-Memory Data**: Frontend works for demos, not production

---

## Development Rules

### Mandatory Rules

1. **Never Modify Domain Entities Directly**
   - Always use repositories for persistence
   - Domain entities must remain POCOs
   - No external dependencies in domain layer

2. **Always Use Provider Interfaces**
   - Code against `IStorageProvider`, not `MinioProvider`
   - Enable easy swapping of implementations
   - Dependency injection required

3. **Preserve Immutability**
   - RequestHistory is append-only
   - ApprovalDecision cannot be modified
   - Use domain events for state changes

4. **Validate at Boundaries**
   - Validate input at API layer
   - Validate business rules in use cases
   - Validate constraints in domain entities

5. **Log Everything**
   - Log all errors with stack traces
   - Log all state changes for audit
   - Log performance metrics

### Forbidden Patterns

❌ No anemic domain models  
❌ No direct database access from delivery layer  
❌ No business logic in controllers  
❌ No magic strings (use constants/enums)  
❌ No console.log (use Pino logger)  
❌ No any type (strict TypeScript)  

---

## Coding Standards

### TypeScript Configuration

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler"
  }
}
```

### Naming Conventions

| Type | Convention | Example |
|------|------------|---------|
| **Entities** | PascalCase | `Request`, `User` |
| **Value Objects** | PascalCase + VO suffix | `RequestStatusVO` |
| **Repositories** | I-prefixed interface | `IRequestRepository` |
| **Use Cases** | PascalCase + UseCase suffix | `CreateRequestUseCase` |
| **DTOs** | PascalCase + DTO suffix | `CreateRequestDTO` |
| **Events** | PascalCase + Event suffix | `RequestCreatedEvent` |
| **Constants** | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |

### File Structure

```
src/
├── domain/
│   ├── entities/
│   ├── value-objects/
│   ├── repositories/
│   ├── events/
│   └── services/
├── application/
│   ├── use-cases/
│   ├── commands/
│   ├── queries/
│   └── dto/
├── adapters/
│   ├── database/
│   ├── repositories/
│   └── external-services/
└── delivery/
    ├── api/
    └── middleware/
```

### Code Quality Requirements

- **Test Coverage**: Minimum 80%
- **Cyclomatic Complexity**: Maximum 10 per function
- **Function Length**: Maximum 25 lines
- **File Length**: Maximum 300 lines
- **Dependency Depth**: Maximum 3 levels

---

## Folder Structure

```
/workspace
├── src/                          # Frontend React app
│   ├── pages/                    # Route pages
│   ├── components/               # Reusable UI components
│   ├── hooks/                    # Custom React hooks
│   ├── contexts/                 # React contexts
│   ├── lib/                      # Business logic (in-memory)
│   └── config/                   # Configuration files
├── backend/                      # Backend Node.js app
│   ├── src/
│   │   ├── domain/               # Domain layer
│   │   ├── application/          # Application layer
│   │   ├── adapters/             # Adapters layer
│   │   └── delivery/             # Delivery layer
│   ├── tests/                    # Test files
│   └── migrations/               # Database migrations
├── infrastructure/
│   └── docker/                   # Docker Compose configs
├── docs/                         # Documentation
├── data-model/                   # Entity definitions
├── scripts/                      # Automation scripts
└── .agent/                       # Agent plans and context
```

---

## Database Approach

### Primary Database: PostgreSQL 16

**Rationale:**
- Open source, no vendor lock-in
- Advanced features (JSONB, full-text search, indexing)
- Strong typing and constraints
- Excellent Kysely ORM support

### Schema Design Principles

1. **Workspace Isolation**: Every table has `workspace_id`
2. **Soft Deletes**: `deleted_at` column for audit trail
3. **Timestamps**: `created_at`, `updated_at` on all tables
4. **UUIDs**: Primary keys are UUIDs (not integers)
5. **Foreign Keys**: Explicit constraints with cascading rules
6. **Indexes**: Strategic indexes on query patterns

### Migration Strategy

- **Tool**: Kysely with custom migration runner
- **Naming**: `YYYYMMDD_HHMMSS_description.sql`
- **Rollback**: Every migration must be reversible
- **Seeding**: Separate seed scripts for dev/test data

### Connection Pooling

```typescript
const pool = new Pool({
  max: 20,              // Maximum connections
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

---

## Authentication Approach

### Current State: Hardcoded JWT

**Implementation:**
- JWT tokens generated without validation
- 6 hardcoded test users in seed data
- No password hashing (bcrypt ready)
- No session management

### Future State: Entra ID SSO

**Planned Implementation:**
- OAuth 2.0 OpenID Connect flow
- Microsoft Graph API for user attributes
- Role mapping from Azure AD groups
- Fallback to local JWT for development

### Token Structure

```json
{
  "sub": "user-uuid",
  "email": "user@company.com",
  "name": "Full Name",
  "roles": ["global_admin", "workspace_owner"],
  "workspaces": ["it-services", "hr-services"],
  "iat": 1234567890,
  "exp": 1234568890
}
```

### Authorization Flow

```
1. User logs in (local or Entra ID)
2. Server validates credentials
3. Server generates JWT with roles/workspaces
4. Client stores JWT in memory (not localStorage)
5. Client sends JWT in Authorization header
6. Server validates JWT and extracts claims
7. Server checks permissions for requested action
8. Server allows or denies request
```

---

## Deployment Targets

### Development (Local)

**Environment:** Developer workstation  
**Infrastructure:** Docker Desktop  
**Database:** PostgreSQL container  
**Storage:** MinIO container  
**Email:** MailHog container  
**Access:** localhost:5173 (frontend), localhost:3000 (API)

### Staging (Pre-Production)

**Environment:** Azure VM or AWS EC2  
**Infrastructure:** Docker Compose or Kubernetes  
**Database:** Managed PostgreSQL (Azure Database/AWS RDS)  
**Storage:** Azure Blob/AWS S3  
**Email:** SendGrid/SES  
**Access:** staging.unified-esm.company.com

### Production

**Environment:** Azure AKS or AWS EKS  
**Infrastructure:** Kubernetes cluster  
**Database:** Managed PostgreSQL with read replicas  
**Storage:** Azure Blob/AWS S3 with CDN  
**Email:** Enterprise SMTP relay  
**Access:** unified-esm.company.com  
**Monitoring:** Azure Monitor/AWS CloudWatch  
**Logging:** ELK Stack or Datadog

### Deployment Constraints

1. **Zero Downtime**: Rolling updates required
2. **Database Migrations**: Run before new version starts
3. **Secrets Management**: Azure Key Vault/AWS Secrets Manager
4. **SSL/TLS**: HTTPS everywhere, valid certificates
5. **Backup Strategy**: Daily backups, 30-day retention

---

## Integration Points

### Planned Integrations

| System | Purpose | Priority | Status |
|--------|---------|----------|--------|
| **Entra ID** | Authentication, user directory | P1 | Interface ready |
| **Microsoft Graph** | Outlook calendar, Planner tasks | P2 | Not started |
| **ClamAV** | Virus scanning for uploads | P2 | Container ready |
| **SendGrid** | Email delivery | P2 | Interface ready |
| **Elasticsearch** | Full-text search | P3 | Not started |
| **Power Automate** | External workflow triggers | P4 | Not started |
| **Dataverse** | Alternative persistence | P4 | Interface concept |
| **SharePoint** | Document storage | P4 | Not started |

### Provider Pattern

All integrations follow the provider pattern:

```typescript
// Interface defined in domain layer
interface IStorageProvider {
  upload(file: File, metadata: Metadata): Promise<string>;
  download(url: string): Promise<File>;
  delete(url: string): Promise<void>;
}

// Implementation in adapters layer
class MinioStorageProvider implements IStorageProvider {
  // MinIO-specific implementation
}

class AzureBlobStorageProvider implements IStorageProvider {
  // Azure-specific implementation
}

// Usage in application layer (depends only on interface)
class FileUploadUseCase {
  constructor(private storageProvider: IStorageProvider) {}
}
```

---

## Testing Strategy

### Test Pyramid

```
        /\
       /  \      E2E Tests (10%)
      /----\     Cypress, Playwright
     /      \    
    /--------\   Integration Tests (20%)
   /          \  API tests, database tests
  /------------\ 
 /              \ Unit Tests (70%)
/________________\ Use cases, entities, value objects
```

### Unit Testing

**Framework:** Vitest  
**Coverage Target:** 80% minimum  
**Focus:** Domain entities, use cases, value objects

```typescript
describe('CreateRequestUseCase', () => {
  it('should create a request with valid data', async () => {
    const useCase = new CreateRequestUseCase(mockRepository);
    const result = await useCase.execute(validRequestData);
    expect(result.isSuccess).toBe(true);
  });
});
```

### Integration Testing

**Framework:** Vitest + Testcontainers  
**Focus:** API endpoints, database queries, external services

```typescript
describe('POST /api/requests', () => {
  it('should create a request and return 201', async () => {
    const response = await request(app)
      .post('/api/requests')
      .send(validRequestData);
    expect(response.status).toBe(201);
  });
});
```

### E2E Testing

**Framework:** Playwright  
**Focus:** Critical user journeys

```typescript
test('user can create and track a request', async ({ page }) => {
  await page.goto('/');
  await page.fill('[data-testid="search"]', 'IT Support');
  await page.click('[data-testid="service-tile"]');
  await page.fill('[data-testid="form-field"]', 'Issue description');
  await page.click('[data-testid="submit"]');
  await expect(page.locator('[data-testid="request-number"]')).toBeVisible();
});
```

---

## Environment Variables

### Required Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `NODE_ENV` | Environment name | `development` | Yes |
| `PORT` | API port | `3000` | Yes |
| `DB_HOST` | PostgreSQL host | `localhost` | Yes |
| `DB_PORT` | PostgreSQL port | `5432` | Yes |
| `DB_NAME` | Database name | `unified_esm` | Yes |
| `DB_USER` | Database user | `postgres` | Yes |
| `DB_PASSWORD` | Database password | `postgres` | Yes |
| `JWT_SECRET` | JWT signing key | - | Yes |
| `REDIS_HOST` | Redis host | `localhost` | No |
| `MINIO_ENDPOINT` | MinIO host | `localhost` | No |

See `.env.example` for complete list.

---

## Git Workflow

### Branch Strategy

```
main
  ├── develop
  │     ├── feature/authentication
  │     ├── feature/request-api
  │     └── fix/login-bug
  └── release/v1.0.0
```

### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`

**Example:**
```
feat(auth): implement JWT login endpoint

Added POST /api/auth/login endpoint with bcrypt password validation.
Returns JWT token on success, 401 on failure.

Closes #123
```

### Pull Request Requirements

- [ ] All tests passing
- [ ] Coverage above 80%
- [ ] No ESLint errors
- [ ] Documentation updated
- [ ] At least 1 reviewer approval
- [ ] Squash commits before merge

---

## Monitoring and Observability

### Logging

**Library:** Pino  
**Format:** JSON  
**Levels:** error, warn, info, debug, trace

```typescript
logger.info({ requestId: '123', userId: '456' }, 'Request created');
logger.error({ error: err, stack: err.stack }, 'Database connection failed');
```

### Metrics (Future)

- API response times (p50, p95, p99)
- Database query performance
- Error rates by endpoint
- Active user sessions
- Request volume by workspace

### Health Checks

- `/health` - Basic availability
- `/health/ready` - Ready to accept traffic
- `/health/live` - Still alive (liveness probe)

---

## Security Considerations

### Current Security Measures

- ✅ CORS configuration
- ✅ Helmet headers
- ✅ Rate limiting scaffolding
- ✅ Input validation with Zod
- ✅ SQL injection prevention (parameterized queries)

### Pending Security Measures

- [ ] Password hashing (bcrypt ready)
- [ ] CSRF protection
- [ ] XSS prevention
- [ ] Rate limiting implementation
- [ ] Audit logging
- [ ] Secret rotation
- [ ] Security headers tuning

### OWASP Top 10 Mitigation

| Vulnerability | Status | Mitigation |
|---------------|--------|------------|
| **Injection** | ✅ Protected | Parameterized queries, Zod validation |
| **Broken Auth** | 🟡 Partial | JWT ready, password hashing pending |
| **Sensitive Data** | 🟡 Partial | HTTPS required in prod, encryption pending |
| **XXE** | ✅ Protected | JSON-only, no XML parsing |
| **Broken Access Control** | 🟡 Partial | RBAC designed, implementation pending |
| **Security Misconfiguration** | 🟡 Partial | Defaults secure, hardening needed |
| **XSS** | 🟡 Partial | React escapes by default, CSP pending |
| **Insecure Deserialization** | ✅ Protected | No serialization used |
| **Vulnerable Components** | 🟡 Partial | Dependencies monitored, updates needed |
| **Insufficient Logging** | ❌ Missing | Logger ready, audit trails pending |

---

## Performance Goals

### Response Time Targets

| Endpoint Type | Target | Maximum |
|---------------|--------|---------|
| **Simple GET** | < 50ms | 100ms |
| **Complex Query** | < 200ms | 500ms |
| **POST/PUT** | < 100ms | 200ms |
| **File Upload** | < 1s | 5s |
| **Report Generation** | < 2s | 10s |

### Scalability Targets

- **Concurrent Users**: 1,000+
- **Requests per Second**: 500+
- **Database Connections**: 100+
- **File Storage**: Unlimited (S3)

### Caching Strategy (Future)

- **Redis**: Session data, frequently accessed records
- **HTTP Cache**: Static assets, API responses
- **Database Cache**: Query result caching
- **CDN**: Frontend static files

---

## Support and Maintenance

### Backup Strategy

- **Database**: Daily automated backups, 30-day retention
- **Files**: S3 versioning enabled
- **Configuration**: Git versioned
- **Secrets**: Key Vault managed

### Disaster Recovery

- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 24 hours
- **Failover**: Manual failover to secondary region

### Update Strategy

- **Frequency**: Bi-weekly releases
- **Method**: Rolling updates (zero downtime)
- **Rollback**: Automated on health check failure
- **Communication**: Release notes, changelog

---

## Contact and Escalation

### Project Roles

| Role | Responsibility | Contact |
|------|----------------|---------|
| **Product Owner** | Business requirements, priorities | TBD |
| **Tech Lead** | Architecture, technical decisions | TBD |
| **Dev Team** | Implementation, testing | TBD |
| **DevOps** | Infrastructure, deployment | TBD |
| **Support** | User support, incident response | TBD |

### Escalation Path

1. **Level 1**: Support team (known issues, user errors)
2. **Level 2**: Dev team (bugs, feature requests)
3. **Level 3**: Tech Lead (architecture, critical bugs)
4. **Level 4**: Product Owner (business decisions)

---

## Quick Reference

### Start Development Environment

```bash
# Terminal 1: Infrastructure
cd infrastructure/docker
docker-compose -f docker-compose.dev.yml up -d

# Terminal 2: Backend
cd backend
npm install
npm run db:migrate
npm run db:seed
npm run dev

# Terminal 3: Frontend
cd /workspace
npm install
npm run dev
```

### Access Points

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3000
- **API Docs**: http://localhost:3000/docs
- **MailHog**: http://localhost:8025
- **MinIO Console**: http://localhost:9001

### Test Credentials

| Email | Password | Role |
|-------|----------|------|
| admin@unified-esm.local | Password123! | Global Admin |
| manager@unified-esm.local | Password123! | Workspace Owner |
| agent@unified-esm.local | Password123! | Service Agent |
| requester@unified-esm.local | Password123! | Requester |

---

**This document is maintained by the development team. Update when architecture or processes change.**
