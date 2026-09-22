# Quick Start Implementation Guide

## How to Start Building This System

This guide provides actionable steps to begin implementing the UESM platform following the development plan.

---

## Phase 0: Preparation (Day 1)

### 1. Verify Current State

```bash
# Check existing frontend setup
cd /workspace
bun install
bun run dev

# Verify the application runs
# Open http://localhost:5173 and confirm Services Marketplace loads
```

### 2. Review Existing Code Structure

Key files to understand:
- `/workspace/src/lib/authorization.ts` - Current authorization logic
- `/workspace/src/lib/request-orchestration.ts` - Request workflow logic
- `/workspace/src/lib/approval-engine.ts` - Approval processing
- `/workspace/src/lib/lifecycle-engine.ts` - Lifecycle state machine
- `/workspace/src/lib/workflow-application-service.ts` - Workflow automation
- `/workspace/data-model/full-data-model.json` - Complete data model
- `/workspace/docs/overview.md` - Functional overview
- `/workspace/docs/production-architecture-roadmap.md` - Architecture direction

### 3. Set Up Development Tools

```bash
# Install global development tools
npm install -g prisma
npm install -g @nestjs/cli  # Or choose your backend framework

# Install Docker for local infrastructure
# Download from https://docker.com
```

---

## Phase 1: Backend Foundation (Week 1-2)

### Step 1: Initialize Backend Project

**Option A: Node.js with Fastify (Recommended)**

```bash
cd /workspace
mkdir -p backend
cd backend

# Initialize project
bun init -y

# Install core dependencies
bun add fastify @fastify/cors @fastify/helmet @fastify/jwt
bun add zod date-fns uuid
bun add -d typescript @types/node @types/uuid tsx vitest

# Create tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "lib": ["ES2022"],
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
EOF

# Create initial folder structure
mkdir -p src/{domain,application,adapters,delivery,composition-root}
mkdir -p src/domain/{entities,value-objects,events,errors,policies}
mkdir -p src/application/{commands,queries,use-cases,ports,dto}
mkdir -p src/adapters/{persistence,identity,storage,messaging}
mkdir -p src/delivery/{api,worker,middleware}
mkdir -p tests/{unit,integration,e2e}
```

**Option B: .NET 8 with ASP.NET Core**

```bash
cd /workspace
mkdir backend
cd backend

# Create solution
dotnet new sln -n UESM
dotnet new webapi -n UESM.Api --use-controllers
dotnet new classlib -n UESM.Domain
dotnet new classlib -n UESM.Application

# Add projects to solution
dotnet sln add UESM.Api/UESM.Api.csproj
dotnet sln add UESM.Domain/UESM.Domain.csproj
dotnet sln add UESM.Application/UESM.Application.csproj

# Add references
cd UESM.Api
dotnet add reference ../UESM.Domain/UESM.Domain.csproj
dotnet add reference ../UESM.Application/UESM.Application.csproj
```

### Step 2: Define Domain Entities

Create `/workspace/backend/src/domain/entities/Request.ts`:

```typescript
import { RequestId } from '../value-objects/RequestId';
import { RequestNumber } from '../value-objects/RequestNumber';
import { WorkspaceId } from '../value-objects/WorkspaceId';
import { PersonId } from '../value-objects/PersonId';

export type RequestStatus = 'Draft' | 'Submitted' | 'InProgress' | 'Resolved' | 'Closed';
export type LifecycleState = string; // Configurable per service

export interface RequestData {
  requestId: RequestId;
  workspaceId: WorkspaceId;
  serviceId: string;
  catalogItemId?: string;
  requestNumber: RequestNumber;
  requesterId: PersonId;
  requestedForId?: PersonId;
  status: RequestStatus;
  lifecycleState: LifecycleState;
  title: string;
  description?: string;
  submittedAt?: Date;
  resolvedAt?: Date;
  closedAt?: Date;
  slaDueAt?: Date;
  slaBreached: boolean;
  rowVersion: number;
  createdAt: Date;
  updatedAt: Date;
  createdBy: PersonId;
  updatedBy: PersonId;
}

export class Request {
  constructor(private data: RequestData) {}

  get id(): RequestId { return this.data.requestId; }
  get workspaceId(): WorkspaceId { return this.data.workspaceId; }
  get requestNumber(): RequestNumber { return this.data.requestNumber; }
  get status(): RequestStatus { return this.data.status; }
  get lifecycleState(): LifecycleState { return this.data.lifecycleState; }
  get rowVersion(): number { return this.data.rowVersion; }
  
  isDraft(): boolean {
    return this.data.status === 'Draft';
  }

  canTransitionTo(newState: LifecycleState): boolean {
    // Lifecycle transition rules will be evaluated here
    return true;
  }

  submit(): void {
    if (this.data.status !== 'Draft') {
      throw new Error('Only draft requests can be submitted');
    }
    this.data.status = 'Submitted';
    this.data.submittedAt = new Date();
    this.data.updatedAt = new Date();
  }

  // Additional domain methods...
}
```

Create similar entities for: `Workspace`, `Service`, `Person`, `ApprovalDefinition`, `RequestApproval`

### Step 3: Define Application Ports

Create `/workspace/backend/src/application/ports/RequestRepository.ts`:

```typescript
import { Request } from '../../domain/entities/Request';
import { RequestId } from '../../domain/value-objects/RequestId';
import { AuthenticatedUser } from '../dto/AuthenticatedUser';

export interface RequestQuery {
  workspaceId?: string;
  requesterId?: string;
  status?: string;
  lifecycleState?: string;
  assignedToId?: string;
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDirection?: 'ASC' | 'DESC';
}

export interface RequestRepository {
  findById(id: RequestId, actor: AuthenticatedUser): Promise<Request | null>;
  findByQuery(query: RequestQuery, actor: AuthenticatedUser): Promise<Request[]>;
  save(request: Request): Promise<void>;
  delete(id: RequestId): Promise<void>;
  countByQuery(query: RequestQuery): Promise<number>;
}
```

Create additional ports: `UnitOfWork`, `IdentityProvider`, `ApprovalRepository`, etc.

### Step 4: Implement In-Memory Adapters

Create `/workspace/backend/src/adapters/persistence/in-memory/InMemoryRequestRepository.ts`:

```typescript
import { Request } from '../../../domain/entities/Request';
import { RequestRepository, RequestQuery } from '../../../application/ports/RequestRepository';
import { RequestId } from '../../../domain/value-objects/RequestId';
import { AuthenticatedUser } from '../../../application/dto/AuthenticatedUser';

export class InMemoryRequestRepository implements RequestRepository {
  private store: Map<string, Request> = new Map();

  async findById(id: RequestId, actor: AuthenticatedUser): Promise<Request | null> {
    // Apply authorization check before returning
    const request = this.store.get(id.toString());
    if (!request) return null;
    
    // TODO: Apply row-level security based on actor permissions
    return request;
  }

  async findByQuery(query: RequestQuery, actor: AuthenticatedUser): Promise<Request[]> {
    let results = Array.from(this.store.values());

    // Apply filters
    if (query.workspaceId) {
      results = results.filter(r => r.workspaceId.toString() === query.workspaceId);
    }
    if (query.status) {
      results = results.filter(r => r.status === query.status);
    }

    // TODO: Apply authorization filtering
    
    // Apply pagination
    const offset = query.offset || 0;
    const limit = query.limit || 50;
    return results.slice(offset, offset + limit);
  }

  async save(request: Request): Promise<void> {
    this.store.set(request.id.toString(), request);
  }

  async delete(id: RequestId): Promise<void> {
    this.store.delete(id.toString());
  }

  async countByQuery(query: RequestQuery): Promise<number> {
    const results = await this.findByQuery(query, {} as AuthenticatedUser);
    return results.length;
  }
}
```

### Step 5: Create First Use Case

Create `/workspace/backend/src/application/use-cases/SubmitRequestUseCase.ts`:

```typescript
import { Request } from '../../domain/entities/Request';
import { RequestRepository } from '../ports/RequestRepository';
import { UnitOfWork } from '../ports/UnitOfWork';
import { AuditWriter } from '../ports/AuditWriter';
import { Clock } from '../ports/Clock';
import { RequestNumberGenerator } from '../ports/RequestNumberGenerator';
import { AuthenticatedUser } from '../dto/AuthenticatedUser';

export interface SubmitRequestCommand {
  workspaceId: string;
  serviceId: string;
  catalogItemId?: string;
  title: string;
  description?: string;
  requestedForId?: string;
  fieldValues: Array<{
    fieldDefinitionId: string;
    value: any;
  }>;
  idempotencyKey: string;
}

export class SubmitRequestUseCase {
  constructor(
    private readonly requestRepository: RequestRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly auditWriter: AuditWriter,
    private readonly clock: Clock,
    private readonly requestNumberGenerator: RequestNumberGenerator
  ) {}

  async execute(command: SubmitRequestCommand, actor: AuthenticatedUser): Promise<Request> {
    // Check idempotency
    // Validate input
    // Generate request number
    // Create request aggregate
    // Save with transaction
    // Write audit event
    
    const now = this.clock.now();
    
    await this.unitOfWork.beginTransaction();
    
    try {
      // Generate request number
      const year = now.getFullYear();
      const requestNumber = await this.requestNumberGenerator.generate(
        command.workspaceId,
        year
      );

      // Create request entity
      const request = Request.create({
        workspaceId: command.workspaceId,
        serviceId: command.serviceId,
        catalogItemId: command.catalogItemId,
        requestNumber,
        requesterId: actor.personId,
        requestedForId: command.requestedForId,
        title: command.title,
        description: command.description,
        status: 'Submitted',
        lifecycleState: 'Submitted',
        submittedAt: now,
        createdBy: actor.personId,
        updatedBy: actor.personId
      });

      // Save request
      await this.requestRepository.save(request);

      // Write audit event
      await this.auditWriter.write({
        entityType: 'Request',
        entityId: request.id.toString(),
        action: 'Created',
        actor: actor,
        source: 'API',
        createdAt: now
      });

      await this.unitOfWork.commit();
      
      return request;
    } catch (error) {
      await this.unitOfWork.rollback();
      throw error;
    }
  }
}
```

### Step 6: Set Up API Controller

Create `/workspace/backend/src/delivery/api/controllers/RequestsController.ts`:

```typescript
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { SubmitRequestUseCase, SubmitRequestCommand } from '../../../application/use-cases/SubmitRequestUseCase';
import { AuthenticatedUser } from '../../../application/dto/AuthenticatedUser';

interface CreateRequestBody {
  catalogItemId?: string;
  title: string;
  description?: string;
  requestedForId?: string;
  fieldValues: Array<{
    fieldDefinitionId: string;
    value: any;
  }>;
}

export class RequestsController {
  constructor(
    private readonly submitRequestUseCase: SubmitRequestUseCase
  ) {}

  async create(
    request: FastifyRequest<{
      Params: { workspaceCode: string };
      Body: CreateRequestBody;
    }>,
    reply: FastifyReply
  ) {
    const actor = request.user as AuthenticatedUser;
    
    const command: SubmitRequestCommand = {
      workspaceId: request.params.workspaceCode,
      serviceId: 'TODO: Get from catalog item',
      catalogItemId: request.body.catalogItemId,
      title: request.body.title,
      description: request.body.description,
      requestedForId: request.body.requestedForId,
      fieldValues: request.body.fieldValues,
      idempotencyKey: request.headers['idempotency-key'] || crypto.randomUUID()
    };

    const result = await this.submitRequestUseCase.execute(command, actor);

    return reply.code(201).send({
      requestId: result.id.toString(),
      requestNumber: result.requestNumber.toString(),
      status: result.status,
      createdAt: result.createdAt
    });
  }
}
```

### Step 7: Wire Up Composition Root

Create `/workspace/backend/src/composition-root/index.ts`:

```typescript
import { InMemoryRequestRepository } from '../adapters/persistence/in-memory/InMemoryRequestRepository';
import { InMemoryUnitOfWork } from '../adapters/persistence/in-memory/InMemoryUnitOfWork';
import { ConsoleAuditWriter } from '../adapters/messaging/ConsoleAuditWriter';
import { SystemClock } from '../adapters/SystemClock';
import { InMemoryRequestNumberGenerator } from '../adapters/persistence/in-memory/InMemoryRequestNumberGenerator';
import { SubmitRequestUseCase } from '../application/use-cases/SubmitRequestUseCase';
import { RequestsController } from '../delivery/api/controllers/RequestsController';

// Infrastructure
const unitOfWork = new InMemoryUnitOfWork();
const clock = new SystemClock();
const auditWriter = new ConsoleAuditWriter();
const requestNumberGenerator = new InMemoryRequestNumberGenerator();

// Repositories
const requestRepository = new InMemoryRequestRepository();

// Use Cases
const submitRequestUseCase = new SubmitRequestUseCase(
  requestRepository,
  unitOfWork,
  auditWriter,
  clock,
  requestNumberGenerator
);

// Controllers
const requestsController = new RequestsController(submitRequestUseCase);

export {
  requestsController,
  // Export other controllers
};
```

---

## Phase 2: Database Integration (Week 3-4)

### Step 1: Set Up PostgreSQL

```bash
# Using Docker Compose
cd /workspace
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: uesm_dev
      POSTGRES_USER: uesm_user
      POSTGRES_PASSWORD: uesm_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backend/migrations:/docker-entrypoint-initdb.d

  minio:
    image: minio/minio
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    command: server /data --console-address ":9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  minio_data:
EOF

docker-compose up -d postgres minio
```

### Step 2: Create Database Migrations

Using Prisma:

```bash
cd /workspace/backend
bun add prisma @prisma/client
bun add -d @types/prisma

npx prisma init

# Edit prisma/schema.prisma with your models
# Then run:
npx prisma migrate dev --name init
npx prisma generate
```

### Step 3: Implement PostgreSQL Repositories

Create `/workspace/backend/src/adapters/persistence/postgresql/PostgreSqlRequestRepository.ts`:

```typescript
import { PrismaClient } from '@prisma/client';
import { Request } from '../../../domain/entities/Request';
import { RequestRepository, RequestQuery } from '../../../application/ports/RequestRepository';
import { RequestId } from '../../../domain/value-objects/RequestId';
import { AuthenticatedUser } from '../../../application/dto/AuthenticatedUser';

export class PostgreSqlRequestRepository implements RequestRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: RequestId, actor: AuthenticatedUser): Promise<Request | null> {
    const record = await this.prisma.request.findUnique({
      where: { requestId: id.toString() },
      include: {
        fieldValues: true,
        approvals: true
      }
    });

    if (!record) return null;

    // TODO: Apply authorization check
    // TODO: Map database record to domain entity
    return this.mapToEntity(record);
  }

  async findByQuery(query: RequestQuery, actor: AuthenticatedUser): Promise<Request[]> {
    const where: any = {};

    if (query.workspaceId) {
      where.workspaceId = query.workspaceId;
    }
    if (query.status) {
      where.status = query.status;
    }

    // Apply authorization filters
    // ...

    const records = await this.prisma.request.findMany({
      where,
      include: {
        fieldValues: true
      },
      skip: query.offset || 0,
      take: query.limit || 50,
      orderBy: query.orderBy ? { [query.orderBy]: query.orderDirection || 'ASC' } : undefined
    });

    return records.map(r => this.mapToEntity(r));
  }

  async save(request: Request): Promise<void> {
    // Convert domain entity to Prisma input
    // Handle upsert logic
    // ...
  }

  private mapToEntity(record: any): Request {
    // Map database record to domain entity
    // ...
    return new Request({ /* mapped data */ });
  }
}
```

---

## Phase 3: Testing Strategy

### Unit Tests Example

Create `/workspace/backend/tests/unit/SubmitRequestUseCase.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SubmitRequestUseCase } from '../../src/application/use-cases/SubmitRequestUseCase';
import { MockRequestRepository } from '../mocks/MockRequestRepository';
import { MockUnitOfWork } from '../mocks/MockUnitOfWork';
import { MockAuditWriter } from '../mocks/MockAuditWriter';
import { MockClock } from '../mocks/MockClock';
import { MockRequestNumberGenerator } from '../mocks/MockRequestNumberGenerator';

describe('SubmitRequestUseCase', () => {
  let useCase: SubmitRequestUseCase;
  let mockRepository: MockRequestRepository;
  let mockUnitOfWork: MockUnitOfWork;
  let mockClock: MockClock;
  let mockNumberGenerator: MockRequestNumberGenerator;

  beforeEach(() => {
    mockRepository = new MockRequestRepository();
    mockUnitOfWork = new MockUnitOfWork();
    mockClock = new MockClock(new Date('2026-01-15T10:00:00Z'));
    mockNumberGenerator = new MockRequestNumberGenerator('IT-2026-000001');
    
    useCase = new SubmitRequestUseCase(
      mockRepository,
      mockUnitOfWork,
      mockAuditWriter,
      mockClock,
      mockNumberGenerator
    );
  });

  it('should create request with correct number', async () => {
    const command = {
      workspaceId: 'IT',
      serviceId: 'service-1',
      title: 'Test Request',
      fieldValues: [],
      idempotencyKey: 'test-key'
    };

    const actor = { personId: 'user-1', email: 'test@example.com' };

    const result = await useCase.execute(command, actor);

    expect(result.requestNumber.toString()).toBe('IT-2026-000001');
    expect(mockRepository.saveCalled).toBe(true);
    expect(mockUnitOfWork.committed).toBe(true);
  });
});
```

Run tests:

```bash
cd /workspace/backend
bun test
```

---

## Next Steps

1. **Complete all domain entities** (Workspace, Service, Person, Approval, etc.)
2. **Implement remaining use cases** (MakeApprovalDecision, TransitionRequest, etc.)
3. **Add authentication middleware** (JWT validation, user context extraction)
4. **Build authorization engine** (Policy evaluation, row-level security)
5. **Create API routes** for all endpoints defined in DEVELOPMENT_PLAN.md
6. **Set up background worker** for workflow processing
7. **Connect frontend** to backend API instead of in-memory data

---

## Key Principles to Follow

✅ **DO**:
- Keep domain layer free of external dependencies
- Inject all dependencies through constructors
- Use transactions for business operations
- Log all state changes to audit trail
- Validate input at API boundaries
- Apply authorization in both API and repository layers

❌ **DON'T**:
- Import database clients directly in domain/application code
- Create dependencies inside use cases
- Skip transaction management for write operations
- Trust client-side authorization alone
- Store secrets in code (use environment variables)
- Mix concerns between layers

---

*This is a living document. Update it as you learn and adapt the implementation.*
