# Unified Enterprise Service Management - Strategic Build Plan

## Executive Summary

This document provides a **practical, phased implementation roadmap** for transforming the current Power Apps-based prototype into a production-ready, self-hostable enterprise service management platform. The plan prioritizes **clean architecture**, **maintainability**, **scalability**, and **ease of change**.

---

## Current State Assessment

### What We Have Today ✅

**Frontend Application (Complete)**
- React 19 + TypeScript 5.9 + Vite 7.x application
- Complete UI components using Radix UI and shadcn/ui
- Route structure for all modules (Requests, Approvals, Reports, Knowledge, Contracts)
- Service Builder with drag-and-drop form designer
- Dynamic form rendering engine
- Approval engine runtime
- Lifecycle engine
- Workflow automation engine
- Reporting and analytics
- Requester portal and marketplace
- Workspace administration interfaces

**Business Logic Layer (In-Memory)**
- Authorization engine with role-based access control
- Request orchestration services
- Approval processing logic
- Lifecycle state transitions
- SLA calculation engine
- Workflow execution engine
- Business rules validation
- Dependency mapping
- Service readiness assessment
- Migration assistant logic

**Data Model (Defined)**
- Complete entity schema in `data-model/full-data-model.json`
- 40+ entities including: Workspace, Person, Service, Request, Approval, Task, Activity, Attachment, Knowledge Article, Contract, Catalog Item, Form Definition, Field Definition, Workflow Definition, Automation Rule, SLA Target, Report Definition, etc.
- In-memory OData provider implementation

**Documentation**
- Comprehensive overview in `docs/overview.md`
- Development plan in `DEVELOPMENT_PLAN.md`
- Functional acceptance test cases
- Quality gate definitions

### Critical Gaps ❌

**Backend Infrastructure (Missing)**
- No persistent storage layer (currently in-memory only)
- No REST API or GraphQL endpoints
- No authentication/authorization server
- No background job processor
- No file storage service
- No email/notification service

**Production Readiness (Missing)**
- No database migrations
- No environment configuration management
- No CI/CD pipeline
- No monitoring and logging infrastructure
- No backup and recovery procedures
- No load testing or performance benchmarks

**Integration Points (Missing)**
- No Microsoft Graph/Entra ID integration
- No email intake processor
- No malware scanning for attachments
- no SMS/push notification providers
- No search engine integration

---

## Recommended Additions & Enhancements

### 1. Architecture Improvements

#### 1.1 Introduce Event Sourcing for Audit Trail
**Why:** Current audit trail stores snapshots. Event sourcing provides complete replay capability.

**Implementation:**
```typescript
// New domain event types
interface DomainEvent {
  eventId: string;
  aggregateType: 'Request' | 'Approval' | 'Workspace';
  aggregateId: string;
  eventType: string;
  payload: Record<string, unknown>;
  metadata: {
    userId: string;
    timestamp: Date;
    workspaceId: string;
    correlationId: string;
  };
}

// Event store interface
interface EventStore {
  append(events: DomainEvent[]): Promise<void>;
  getEvents(aggregateId: string, fromVersion?: number): Promise<DomainEvent[]>;
  getEventsByType(eventType: string, since: Date): Promise<DomainEvent[]>;
}
```

#### 1.2 Add CQRS Pattern for Reporting
**Why:** Separate read and write models for better reporting performance.

**Implementation:**
```typescript
// Command side (existing)
class SubmitRequestCommand { }
class UpdateRequestCommand { }

// Query side (new read models)
class RequestSummaryReadModel {
  requestId: string;
  requestNumber: string;
  status: string;
  createdDate: Date;
  dueDate: Date;
  assigneeName: string;
  // Denormalized for fast queries
}

// Materialized view updater
class RequestReadModelProjection {
  async on(event: RequestSubmittedEvent): Promise<void>;
  async on(event: RequestAssignedEvent): Promise<void>;
  async on(event: RequestResolvedEvent): Promise<void>;
}
```

#### 1.3 Implement Outbox Pattern for Reliability
**Why:** Ensure reliable event delivery without distributed transactions.

**Implementation:**
```typescript
// Outbox table
interface OutboxMessage {
  id: string;
  aggregateType: string;
  aggregateId: string;
  eventType: string;
  payload: string; // JSON
  createdAt: Date;
  processedAt?: Date;
  errorMessage?: string;
}

// Transactional outbox
class UnitOfWork {
  async commit(): Promise<void> {
    const transaction = await this.db.begin();
    try {
      // Persist domain changes
      await this.persistChanges(transaction);
      
      // Write events to outbox atomically
      await this.writeOutboxMessages(transaction);
      
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }
  }
}

// Background processor
class OutboxProcessor {
  async processPendingMessages(): Promise<void> {
    const messages = await this.outboxRepository.getUnprocessed(100);
    for (const message of messages) {
      try {
        await this.eventBus.publish(message);
        await this.outboxRepository.markProcessed(message.id);
      } catch (error) {
        await this.outboxRepository.markFailed(message.id, error);
      }
    }
  }
}
```

### 2. New Features to Add

#### 2.1 Advanced Search & Discovery
```typescript
// Search index interface
interface SearchIndex {
  indexRequest(request: RequestDocument): Promise<void>;
  search(query: string, filters: SearchFilters): Promise<SearchResult[]>;
  deleteRequest(requestId: string): Promise<void>;
}

// Search features to implement:
// - Full-text search across request fields
// - Faceted filtering (by status, priority, workspace, date range)
// - Search suggestions and autocomplete
// - Saved searches
// - Search analytics (popular queries, zero-result queries)
```

#### 2.2 Template Library Enhancement
```typescript
// Pre-built service templates
const SERVICE_TEMPLATES = [
  'IT Incident Management',
  'IT Service Request',
  'HR Onboarding',
  'HR Offboarding',
  'Facilities Maintenance',
  'Procurement Request',
  'Travel Request',
  'Leave Request',
  'IT Access Request',
  'Budget Approval',
];

// Template includes:
// - Pre-configured form fields
// - Default workflow
// - Standard approval stages
// - SLA targets
// - Required notifications
// - Sample reports
```

#### 2.3 Mobile Responsiveness
```typescript
// Mobile-first components needed:
// - Mobile navigation drawer
// - Touch-optimized request queue
// - Swipe gestures for quick actions
// - Offline mode support (PWA)
// - Camera integration for attachment capture
// - Push notifications
```

#### 2.4 Bulk Operations
```typescript
// Bulk action capabilities:
// - Bulk assignment (select multiple requests → assign to agent)
// - Bulk status transition (select → resolve/close)
// - Bulk tag management
// - Bulk export to CSV/Excel
// - Bulk email notifications
// - Import requests from CSV
```

#### 2.5 Advanced Analytics
```typescript
// Analytics features:
// - Real-time dashboard with WebSocket updates
// - Predictive analytics (ML-based demand forecasting)
// - Agent performance scorecards
// - Customer satisfaction tracking (CSAT surveys)
// - First contact resolution rate
// - Average handle time
// - Cost per request calculation
```

### 3. Infrastructure Requirements

#### 3.1 Docker Compose Setup (Development)
```yaml
# docker-compose.dev.yml
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: uesm_dev
      POSTGRES_USER: dev_user
      POSTGRES_PASSWORD: dev_password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  mailhog:
    image: mailhog/mailhog:latest
    ports:
      - "1025:1025"
      - "8025:8025"

volumes:
  postgres_data:
  minio_data:
  redis_data:
```

#### 3.2 Production Docker Setup
```yaml
# docker-compose.prod.yml
services:
  api:
    build: ./backend
    environment:
      NODE_ENV: production
      DATABASE_URL: postgresql://prod_user:secure_password@postgres:5432/uesm_prod
      REDIS_URL: redis://redis:6379
      STORAGE_ENDPOINT: http://minio:9000
      JWT_SECRET: ${JWT_SECRET}
      ENTRA_ID_TENANT_ID: ${ENTRA_ID_TENANT_ID}
    depends_on:
      - postgres
      - redis
      - minio
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  worker:
    build: ./backend
    command: ["node", "dist/worker.js"]
    environment:
      # Same as API
    depends_on:
      - api
      - postgres
      - redis

  frontend:
    build: ./src
    environment:
      API_BASE_URL: https://api.yourdomain.com
    depends_on:
      - api

  nginx:
    image: nginx:alpine
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - frontend
      - api

volumes:
  postgres_data:
  minio_data:
  redis_data:
```

#### 3.3 Database Schema (PostgreSQL)
```sql
-- Core tables (partial example)
CREATE TABLE workspaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  description TEXT,
  icon VARCHAR(50),
  primary_color VARCHAR(50),
  request_number_prefix VARCHAR(10) NOT NULL,
  request_number_format VARCHAR(100) NOT NULL,
  owner_person_id UUID REFERENCES persons(id),
  default_timezone VARCHAR(50) DEFAULT 'Asia/Riyadh',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  row_version BIGINT DEFAULT 0
);

CREATE TABLE requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id),
  request_number VARCHAR(50) NOT NULL,
  service_id UUID NOT NULL REFERENCES services(id),
  catalog_item_id UUID REFERENCES catalog_items(id),
  requester_person_id UUID NOT NULL REFERENCES persons(id),
  requested_for_person_id UUID REFERENCES persons(id),
  status VARCHAR(50) NOT NULL,
  priority VARCHAR(20),
  title VARCHAR(500) NOT NULL,
  description TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE,
  due_at TIMESTAMP WITH TIME ZONE,
  resolved_at TIMESTAMP WITH TIME ZONE,
  closed_at TIMESTAMP WITH TIME ZONE,
  assigned_to_person_id UUID REFERENCES persons(id),
  current_lifecycle_state VARCHAR(50),
  row_version BIGINT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES persons(id),
  updated_by UUID REFERENCES persons(id),
  
  UNIQUE(workspace_id, request_number)
);

CREATE INDEX idx_requests_workspace_status ON requests(workspace_id, status);
CREATE INDEX idx_requests_requester ON requests(requester_person_id);
CREATE INDEX idx_requests_assigned_to ON requests(assigned_to_person_id);
CREATE INDEX idx_requests_submitted_at ON requests(submitted_at DESC);

-- Add more tables following the data model...
```

---

## Step-by-Step Implementation Plan

### Phase 0: Foundation Setup (Week 1-2)

#### Week 1: Project Initialization
**Goal:** Establish backend project structure and development environment

**Tasks:**
1. **Initialize Backend Repository**
   ```bash
   mkdir -p backend/src/{domain,application,adapters,delivery}
   cd backend
   npm init -y
   npm install fastify @fastify/cors @fastify/helmet zod uuid date-fns
   npm install -D typescript @types/node tsx vitest
   ```

2. **Set Up Docker Development Environment**
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   # Verify all services are running
   docker-compose ps
   ```

3. **Create Database Migration System**
   ```bash
   npm install kysely pg
   npm install -D @types/pg
   ```
   
   Implement migration runner:
   ```typescript
   // backend/src/adapters/persistence/migrations/runner.ts
   import { Kysely, PostgresDialect } from 'kysely';
   import { Pool } from 'pg';
   
   export class MigrationRunner {
     private db: Kysely<any>;
     
     constructor(connectionString: string) {
       this.db = new Kysely({
         dialect: new PostgresDialect({
           pool: new Pool({ connectionString })
         })
       });
     }
     
     async run(): Promise<void> {
       // Execute pending migrations
     }
   }
   ```

4. **Define Domain Entities**
   - Create all entity classes in `backend/src/domain/entities/`
   - Define value objects in `backend/src/domain/value-objects/`
   - Create domain events in `backend/src/domain/events/`

**Deliverables:**
- [ ] Backend project initialized with TypeScript
- [ ] Docker Compose running PostgreSQL, MinIO, Redis, MailHog
- [ ] Migration system functional
- [ ] All domain entities defined with proper typing
- [ ] Unit tests passing for domain layer

#### Week 2: Repository Pattern & First Provider
**Goal:** Implement data access layer with repository pattern

**Tasks:**
1. **Define Repository Interfaces**
   ```typescript
   // backend/src/application/ports/request-repository.ts
   export interface RequestRepository {
     findById(id: string): Promise<Request | null>;
     findByNumber(workspaceId: string, number: string): Promise<Request | null>;
     findAll(filters: RequestFilters): Promise<Request[]>;
     save(request: Request): Promise<void>;
     delete(id: string): Promise<void>;
     nextRequestNumber(workspaceId: string, year: number): Promise<string>;
   }
   ```

2. **Implement In-Memory Repositories** (for testing)
   ```typescript
   // backend/src/adapters/persistence/in-memory/request-repository.ts
   export class InMemoryRequestRepository implements RequestRepository {
     private requests: Map<string, Request> = new Map();
     
     async findById(id: string): Promise<Request | null> {
       return this.requests.get(id) || null;
     }
     
     async save(request: Request): Promise<void> {
       this.requests.set(request.id, request);
     }
   }
   ```

3. **Implement PostgreSQL Repositories**
   ```typescript
   // backend/src/adapters/persistence/postgresql/postgres-request-repository.ts
   export class PostgresRequestRepository implements RequestRepository {
     constructor(private db: Kysely<Database>) {}
     
     async findById(id: string): Promise<Request | null> {
       const result = await this.db
         .selectFrom('requests')
         .selectAll()
         .where('id', '=', id)
         .executeTakeFirst();
       
       return result ? this.mapToEntity(result) : null;
     }
   }
   ```

4. **Implement Unit of Work Pattern**
   ```typescript
   // backend/src/application/ports/unit-of-work.ts
   export interface UnitOfWork {
     begin(): Promise<Transaction>;
   }
   
   export interface Transaction {
     commit(): Promise<void>;
     rollback(): Promise<void>;
   }
   ```

**Deliverables:**
- [ ] All repository interfaces defined
- [ ] In-memory implementations for all repositories
- [ ] PostgreSQL implementations for core repositories
- [ ] Unit of Work pattern implemented
- [ ] Integration tests for repositories

---

### Phase 1: Core Backend Services (Week 3-8)

#### Week 3-4: Authentication & Authorization
**Goal:** Secure the API with proper authentication and authorization

**Tasks:**
1. **Implement JWT Authentication**
   ```typescript
   // backend/src/adapters/identity/jwt-auth-provider.ts
   export class JwtAuthProvider implements IdentityProvider {
     async authenticate(token: string): Promise<AuthenticatedUser>;
     async generateToken(user: Person): Promise<string>;
     async refreshToken(refreshToken: string): Promise<string>;
   }
   ```

2. **Integrate Entra ID (OIDC)**
   ```typescript
   // backend/src/adapters/identity/entra-id-provider.ts
   export class EntraIdProvider implements IdentityProvider {
     async authenticate(token: string): Promise<AuthenticatedUser>;
     async getUserProfile(userId: string): Promise<Person>;
   }
   ```

3. **Implement Authorization Middleware**
   ```typescript
   // backend/src/delivery/api/middleware/authorization-middleware.ts
   export function requirePermission(permission: Permission) {
     return async (req: FastifyRequest, reply: FastifyReply) => {
       const user = req.user as AuthenticatedUser;
       const hasPermission = await this.authorizationService.check(user, permission);
       if (!hasPermission) {
         reply.code(403).send({ error: 'Forbidden' });
       }
     };
   }
   ```

**Deliverables:**
- [ ] JWT authentication working
- [ ] Entra ID integration (optional for dev)
- [ ] Role-based authorization middleware
- [ ] Permission checks at API endpoint level
- [ ] Security tests passing

#### Week 5-6: Request Management API
**Goal:** Build complete CRUD operations for requests

**Tasks:**
1. **Implement Use Cases**
   ```typescript
   // backend/src/application/use-cases/submit-request-use-case.ts
   export class SubmitRequestUseCase {
     async execute(command: SubmitRequestCommand): Promise<RequestSubmissionResult> {
       // Validate command
       // Check permissions
       // Generate request number
       // Create request entity
       // Persist with unit of work
       // Publish domain events
       // Return result
     }
   }
   ```

2. **Build API Controllers**
   ```typescript
   // backend/src/delivery/api/controllers/requests-controller.ts
   export class RequestsController {
     async submit(req: FastifyRequest, reply: FastifyReply);
     async getById(req: FastifyRequest, reply: FastifyReply);
     async update(req: FastifyRequest, reply: FastifyReply);
     async transition(req: FastifyRequest, reply: FastifyReply);
     async assign(req: FastifyRequest, reply: FastifyReply);
   }
   ```

3. **Add Validation**
   ```typescript
   // Using Zod schemas
   const SubmitRequestSchema = z.object({
     workspaceId: z.string().uuid(),
     serviceId: z.string().uuid(),
     catalogItemId: z.string().uuid().optional(),
     fieldValues: z.record(z.string(), z.unknown()),
     requestedForPersonId: z.string().uuid().optional(),
   });
   ```

**Deliverables:**
- [ ] Submit request API endpoint
- [ ] Get request by ID endpoint
- [ ] Update request endpoint
- [ ] Transition lifecycle state endpoint
- [ ] Assign request endpoint
- [ ] Request list with filtering and pagination
- [ ] All endpoints secured with authorization
- [ ] API documentation with OpenAPI/Swagger

#### Week 7-8: Approval & Workflow Engines
**Goal:** Implement approval processing and workflow automation

**Tasks:**
1. **Approval Engine**
   ```typescript
   // backend/src/application/use-cases/process-approval-use-case.ts
   export class ProcessApprovalUseCase {
     async execute(command: MakeApprovalDecisionCommand): Promise<ApprovalResult> {
       // Load approval definition
       // Validate decision maker is authorized approver
       // Record decision
       // Check if all approvals complete
       // Trigger next stage or complete approval process
       // Publish events
     }
   }
   ```

2. **Workflow Automation**
   ```typescript
   // backend/src/application/use-cases/execute-workflow-use-case.ts
   export class ExecuteWorkflowUseCase {
     async execute(workflowId: string, triggerEvent: DomainEvent): Promise<void> {
       // Load workflow definition
       // Evaluate trigger conditions
       // Execute actions in sequence
       // Handle errors and retries
       // Log execution results
     }
   }
   ```

3. **Background Job Processor**
   ```typescript
   // backend/src/delivery/worker/workflow-worker.ts
   export class WorkflowWorker {
     async start(): Promise<void> {
       while (true) {
         const jobs = await this.jobQueue.poll(10);
         for (const job of jobs) {
           await this.processJob(job);
         }
       }
     }
   }
   ```

**Deliverables:**
- [ ] Approval submission API
- [ ] Approval decision API (approve/reject/request info)
- [ ] Approval delegation API
- [ ] Workflow trigger API
- [ ] Background worker processing workflows
- [ ] Execution logs for audits
- [ ] Integration tests for approval workflows

---

### Phase 2: Frontend Integration (Week 9-14)

#### Week 9-10: API Client & State Management
**Goal:** Connect frontend to backend API

**Tasks:**
1. **Create API Client SDK**
   ```typescript
   // src/generated/api-client.ts
   export class ApiClient {
     constructor(private baseUrl: string, private authToken: string) {}
     
     async requests: {
       submit(command: SubmitRequestCommand): Promise<RequestSubmissionResult>;
       getById(id: string): Promise<Request>;
       // ... other methods
     };
     
     async approvals: {
       submitDecision(command: MakeApprovalDecisionCommand): Promise<ApprovalResult>;
       // ... other methods
     };
   }
   ```

2. **Integrate TanStack Query**
   ```typescript
   // src/lib/query-client.ts
   export const queryClient = new QueryClient({
     defaultOptions: {
       queries: {
         staleTime: 5 * 60 * 1000, // 5 minutes
         retry: 1,
       },
     },
   });
   
   // Custom hooks
   export function useRequest(id: string) {
     return useQuery(['request', id], () => apiClient.requests.getById(id));
   }
   
   export function useSubmitRequest() {
     return useMutation(apiClient.requests.submit);
   }
   ```

3. **Update Existing Services**
   - Replace in-memory data calls with API client calls
   - Add error handling for network failures
   - Implement optimistic updates where appropriate
   - Add loading states

**Deliverables:**
- [ ] API client SDK generated or handwritten
- [ ] All existing queries converted to use API
- [ ] All mutations converted to use API
- [ ] Error boundaries for network errors
- [ ] Loading states throughout UI

#### Week 11-12: Authentication Flow
**Goal:** Implement login/logout and session management

**Tasks:**
1. **Login Page**
   ```tsx
   // src/pages/auth/login-page.tsx
   export function LoginPage() {
     const loginMutation = useLogin();
     
     const handleSubmit = (credentials: Credentials) => {
       loginMutation.mutate(credentials, {
         onSuccess: (tokens) => {
           localStorage.setItem('authToken', tokens.accessToken);
           navigate('/');
         }
       });
     };
   }
   ```

2. **Auth Context**
   ```tsx
   // src/contexts/auth-context.tsx
   export const AuthContext = createContext<AuthContextType>(null!);
   
   export function AuthProvider({ children }: { children: React.ReactNode }) {
     const [user, setUser] = useState<User | null>(null);
     
     const login = async (credentials: Credentials) => { /* ... */ };
     const logout = async () => { /* ... */ };
     
     return (
       <AuthContext.Provider value={{ user, login, logout }}>
         {children}
       </AuthContext.Provider>
     );
   }
   ```

3. **Protected Routes**
   ```tsx
   // src/components/protected-route.tsx
   export function ProtectedRoute({ 
     children, 
     requiredPermissions 
   }: ProtectedRouteProps) {
     const { user } = useAuth();
     
     if (!user) {
       return <Navigate to="/login" />;
     }
     
     if (!hasPermissions(user, requiredPermissions)) {
       return <Navigate to="/unauthorized" />;
     }
     
     return children;
   }
   ```

**Deliverables:**
- [ ] Login page with Entra ID SSO option
- [ ] Logout functionality
- [ ] Session token refresh
- [ ] Protected route guards
- [ ] Permission-based UI rendering

#### Week 13-14: File Upload & Attachments
**Goal:** Implement secure file upload with virus scanning

**Tasks:**
1. **File Upload API**
   ```typescript
   // backend/src/delivery/api/controllers/files-controller.ts
   async uploadFile(req: FastifyRequest, reply: FastifyReply) {
     const file = await req.file();
     
     // Scan for malware
     const scanResult = await this.virusScanner.scan(file.file);
     if (!scanResult.clean) {
       throw new MalwareDetectedError();
     }
     
     // Store in MinIO/S3
     const storedFile = await this.fileStorage.save(file);
     
     // Create attachment record
     const attachment = await this.attachmentRepository.save({
       fileId: storedFile.id,
       requestId: req.params.requestId,
       uploadedBy: req.user.id,
     });
     
     return attachment;
   }
   ```

2. **Frontend Upload Component**
   ```tsx
   // src/components/file-upload.tsx
   export function FileUpload({ requestId, onUploadComplete }) {
     const uploadMutation = useUploadFile();
     
     const handleDrop = async (files: File[]) => {
       for (const file of files) {
         await uploadMutation.mutateAsync({ requestId, file });
       }
       onUploadComplete();
     };
   }
   ```

**Deliverables:**
- [ ] File upload API endpoint
- [ ] Virus scanning integration (ClamAV or similar)
- [ ] File storage in MinIO/S3
- [ ] Attachment list component
- [ ] File download with authorization check
- [ ] File deletion with confirmation

---

### Phase 3: Advanced Features (Week 15-20)

#### Week 15-16: Reporting Engine
**Goal:** Build dynamic reporting capabilities

**Tasks:**
1. **Report Definition Storage**
   ```typescript
   interface ReportDefinition {
     id: string;
     name: string;
     workspaceId: string;
     dataSource: 'requests' | 'approvals' | 'tasks';
     fields: ReportField[];
     filters: ReportFilter[];
     groupBy: string[];
     aggregations: Aggregation[];
     createdBy: string;
     createdAt: Date;
   }
   ```

2. **Query Builder**
   ```typescript
   // backend/src/application/use-cases/execute-report-use-case.ts
   export class ExecuteReportUseCase {
     async execute(reportId: string, params: ReportParams): Promise<ReportResult> {
       const definition = await this.reportRepository.findById(reportId);
       
       // Build SQL query dynamically
       const query = this.queryBuilder.build(definition, params);
       
       // Execute with permission checks
       const results = await this.db.executeQuery(query);
       
       return this.formatResults(results, definition);
     }
   }
   ```

3. **Frontend Report Builder**
   - Drag-and-drop field selection
   - Filter configuration UI
   - Preview mode
   - Save and share reports

**Deliverables:**
- [ ] Report definition CRUD API
- [ ] Dynamic query execution engine
- [ ] Pre-built report templates
- [ ] Report builder UI
- [ ] Chart visualizations
- [ ] Export to CSV/PDF

#### Week 17-18: Email & Notifications
**Goal:** Implement multi-channel notifications

**Tasks:**
1. **Email Provider**
   ```typescript
   // backend/src/adapters/notifications/smtp-email-provider.ts
   export class SmtpEmailProvider implements EmailProvider {
     async send(email: EmailMessage): Promise<void> {
       await this.transporter.sendMail({
         from: email.from,
         to: email.to,
         subject: email.subject,
         html: email.htmlBody,
         text: email.textBody,
       });
     }
   }
   ```

2. **Notification Templates**
   ```typescript
   // backend/src/application/templates/notification-templates.ts
   export const TEMPLATES = {
     REQUEST_ASSIGNED: {
       subject: 'Request Assigned: {{requestNumber}}',
       body: `You have been assigned request {{requestNumber}}: {{title}}`,
     },
     APPROVAL_REQUIRED: {
       subject: 'Approval Required: {{requestNumber}}',
       body: `Your approval is needed for request {{requestNumber}}`,
     },
   };
   ```

3. **Scheduled Notifications**
   ```typescript
   // backend/src/delivery/worker/notification-worker.ts
   export class NotificationWorker {
     async processDueNotifications(): Promise<void> {
       const dueApprovals = await this.approvalRepository.findDueForReminder();
       for (const approval of dueApprovals) {
         await this.notificationService.sendReminder(approval);
       }
     }
   }
   ```

**Deliverables:**
- [ ] Email sending via SMTP
- [ ] Notification template system
- [ ] Scheduled reminder processor
- [ ] Email digest option
- [ ] Notification preferences per user
- [ ] Email delivery logging

#### Week 19-20: Search & Performance Optimization
**Goal:** Implement fast search and optimize performance

**Tasks:**
1. **PostgreSQL Full-Text Search**
   ```sql
   -- Add search vector column
   ALTER TABLE requests ADD COLUMN search_vector tsvector;
   
   -- Create trigger to update vector
   CREATE TRIGGER requests_search_vector_update
   BEFORE INSERT OR UPDATE ON requests
   FOR EACH ROW EXECUTE FUNCTION
   tsvector_update_trigger(
     search_vector,
     'pg_catalog.english',
     title,
     description,
     request_number
   );
   
   -- Create index
   CREATE INDEX idx_requests_search_vector ON requests USING GIN(search_vector);
   ```

2. **Search API**
   ```typescript
   // backend/src/delivery/api/controllers/search-controller.ts
   async search(req: FastifyRequest, reply: FastifyReply) {
     const { q, filters } = req.query as SearchQuery;
     
     const results = await this.db
       .selectFrom('requests')
       .selectAll()
       .where('search_vector', '@@', sql`plainto_tsquery(${q})`)
       .orderBy(sql`ts_rank(search_vector, plainto_tsquery(${q}))`, 'desc')
       .limit(50)
       .execute();
     
     return results;
   }
   ```

3. **Caching Strategy**
   ```typescript
   // backend/src/adapters/cache/redis-cache.ts
   export class RedisCache implements CacheProvider {
     async get<T>(key: string): Promise<T | null>;
     async set<T>(key: string, value: T, ttlSeconds: number): Promise<void>;
     async invalidate(pattern: string): Promise<void>;
   }
   
   // Cache frequently accessed data
   const cachedServices = await cache.getOrSet('services:all', async () => {
     return await serviceRepository.findAll();
   }, 300); // 5 minute TTL
   ```

**Deliverables:**
- [ ] Full-text search implementation
- [ ] Search API with filters and facets
- [ ] Redis caching layer
- [ ] Database query optimization
- [ ] API response time < 200ms for standard queries
- [ ] Load testing results

---

### Phase 4: Testing & Quality (Week 21-24)

#### Week 21-22: Comprehensive Testing
**Goal:** Achieve 80%+ test coverage

**Tasks:**
1. **Unit Tests**
   ```bash
   npm run test:unit
   # Run all unit tests with coverage
   ```

2. **Integration Tests**
   ```bash
   npm run test:integration
   # Run tests against test database
   ```

3. **End-to-End Tests**
   ```bash
   npm run test:e2e
   # Run Playwright/Cypress tests
   ```

4. **Performance Tests**
   ```bash
   npm run test:perf
   # Run k6 load tests
   ```

**Deliverables:**
- [ ] 80%+ unit test coverage
- [ ] All critical paths covered by integration tests
- [ ] E2E tests for main user journeys
- [ ] Performance benchmarks documented
- [ ] Security penetration test completed

#### Week 23-24: Documentation & Deployment
**Goal:** Prepare for production deployment

**Tasks:**
1. **API Documentation**
   - Generate OpenAPI/Swagger docs
   - Document all endpoints
   - Provide example requests/responses

2. **Deployment Guides**
   - Docker deployment guide
   - Kubernetes deployment guide (optional)
   - VM deployment guide
   - Backup and recovery procedures

3. **Monitoring Setup**
   ```typescript
   // backend/src/delivery/api/middleware/metrics-middleware.ts
   export function metricsMiddleware(req: FastifyRequest, reply: FastifyReply) {
     const start = Date.now();
     
     reply.hook('onSend', () => {
       const duration = Date.now() - start;
       metrics.httpRequestDuration.observe({
         method: req.method,
         route: req.routeOptions.url,
         status: reply.statusCode,
       }, duration);
     });
   }
   ```

4. **Logging Configuration**
   ```typescript
   // backend/src/delivery/api/logger.ts
   import pino from 'pino';
   
   export const logger = pino({
     level: process.env.LOG_LEVEL || 'info',
     transport: {
       target: 'pino-pretty',
       options: { destination: 1 },
     },
   });
   ```

**Deliverables:**
- [ ] Complete API documentation
- [ ] Deployment runbooks
- [ ] Monitoring dashboards (Grafana)
- [ ] Alerting rules configured
- [ ] Disaster recovery plan documented
- [ ] Production deployment completed

---

## Clean Code Principles

### 1. SOLID Principles

**Single Responsibility Principle**
```typescript
// ❌ BAD: Multiple responsibilities
class RequestService {
  async submitRequest(data: any) {
    // Validation
    // Authorization check
    // Business logic
    // Database save
    // Email notification
    // Logging
  }
}

// ✅ GOOD: Separated concerns
class RequestSubmissionUseCase {
  constructor(
    private validator: RequestValidator,
    private authorizationService: AuthorizationService,
    private requestRepository: RequestRepository,
    private notificationService: NotificationService,
    private logger: Logger
  ) {}
  
  async execute(command: SubmitRequestCommand): Promise<Result> {
    await this.validator.validate(command);
    await this.authorizationService.check(command.user, 'SUBMIT_REQUEST');
    const request = Request.create(command);
    await this.requestRepository.save(request);
    await this.notificationService.sendConfirmation(request);
    this.logger.info('Request submitted', { requestId: request.id });
    return Result.success(request);
  }
}
```

**Open/Closed Principle**
```typescript
// ✅ EXTENSIBLE: Add new notification channels without modifying existing code
interface NotificationProvider {
  send(notification: Notification): Promise<void>;
}

class EmailNotificationProvider implements NotificationProvider { }
class SmsNotificationProvider implements NotificationProvider { }
class TeamsNotificationProvider implements NotificationProvider { }

class NotificationService {
  constructor(private providers: Map<string, NotificationProvider>) {}
  
  async send(notification: Notification): Promise<void> {
    const provider = this.providers.get(notification.channel);
    await provider?.send(notification);
  }
}
```

**Dependency Inversion Principle**
```typescript
// ✅ DEPEND ON ABSTRACTIONS
interface RequestRepository {
  save(request: Request): Promise<void>;
}

class PostgresRequestRepository implements RequestRepository { }
class InMemoryRequestRepository implements RequestRepository { }

// Use case depends on interface, not concrete implementation
class SubmitRequestUseCase {
  constructor(private repository: RequestRepository) {} // Interface injection
}
```

### 2. Error Handling Best Practices

```typescript
// Custom error hierarchy
class DomainError extends Error {
  constructor(message: string, public readonly code: string) {
    super(message);
    this.name = 'DomainError';
  }
}

class RequestNotFoundError extends DomainError {
  constructor(requestId: string) {
    super(`Request not found: ${requestId}`, 'REQUEST_NOT_FOUND');
  }
}

class UnauthorizedError extends DomainError {
  constructor(permission: string) {
    super(`Missing permission: ${permission}`, 'UNAUTHORIZED');
  }
}

// Error handling in use cases
async execute(command: SubmitRequestCommand): Promise<Result> {
  try {
    // Business logic
  } catch (error) {
    if (error instanceof DomainError) {
      throw error; // Re-throw domain errors
    }
    
    // Log unexpected errors
    this.logger.error('Unexpected error', { error, command });
    
    // Wrap in generic error
    throw new InternalServerError('An unexpected error occurred');
  }
}
```

### 3. Testing Standards

```typescript
// Test naming convention
describe('SubmitRequestUseCase', () => {
  describe('when command is valid', () => {
    it('should create request with sequential number', async () => { });
    it('should publish RequestSubmittedEvent', async () => { });
    it('should send confirmation email', async () => { });
  });
  
  describe('when user lacks permission', () => {
    it('should throw UnauthorizedError', async () => { });
  });
  
  describe('when service is inactive', () => {
    it('should throw ServiceInactiveError', async () => { });
  });
});

// Test structure (AAA pattern)
it('should create request with sequential number', async () => {
  // Arrange
  const command = createTestSubmitCommand();
  mockRepository.nextNumber = 'IT-2026-000042';
  
  // Act
  const result = await useCase.execute(command);
  
  // Assert
  expect(result.request.requestNumber).toBe('IT-2026-000042');
  expect(mockRepository.save).toHaveBeenCalledWith(
    expect.objectContaining({ requestNumber: 'IT-2026-000042' })
  );
});
```

---

## Risk Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Database performance degradation | Medium | High | Implement indexing strategy, query optimization, read replicas |
| Authentication integration delays | Medium | High | Start with JWT auth, add Entra ID in parallel |
| File upload security vulnerabilities | Low | High | Implement virus scanning, file type validation, size limits |
| Background job failures | Medium | Medium | Implement retry logic, dead letter queue, monitoring alerts |
| Data migration complexity | High | Medium | Start early, use dual-write strategy, extensive testing |

### Mitigation Strategies

1. **Incremental Rollout**
   - Deploy to single workspace first
   - Gradual user onboarding
   - Feature flags for risky features

2. **Monitoring & Observability**
   - Application Performance Monitoring (APM)
   - Structured logging
   - Distributed tracing
   - Real-time dashboards

3. **Backup & Recovery**
   - Daily automated backups
   - Point-in-time recovery capability
   - Disaster recovery drills quarterly

4. **Security Hardening**
   - Regular dependency updates
   - Security scanning in CI/CD
   - Penetration testing before production
   - Security incident response plan

---

## Success Metrics

### Technical KPIs
- API response time: < 200ms (p95)
- Database query time: < 50ms (p95)
- Test coverage: > 80%
- Build time: < 5 minutes
- Deployment frequency: Multiple times per day

### Business KPIs
- User adoption rate: > 70% within 3 months
- Request resolution time: Reduced by 30%
- User satisfaction score: > 4.0/5.0
- System uptime: > 99.9%

---

## Next Steps

### Immediate Actions (This Week)
1. Review and approve this strategic plan
2. Set up backend repository structure
3. Initialize Docker development environment
4. Create first domain entities
5. Write first unit tests

### Short-term Goals (Month 1)
1. Complete Phase 0 and Phase 1
2. Have working API with authentication
3. Implement request submission flow
4. Connect frontend to backend
5. Deploy to staging environment

### Long-term Vision (6 Months)
1. Full production deployment
2. All 7 workspaces migrated
3. 1000+ active users
4. Continuous improvement cycle established
5. Platform extension capabilities demonstrated

---

## Appendix A: Technology Decisions Rationale

### Why Fastify over Express?
- 2x faster performance benchmarks
- Built-in schema validation
- Better TypeScript support
- Lower memory footprint
- Active maintenance

### Why Kysely over Prisma?
- Type-safe query builder
- No ORM overhead
- Full SQL control when needed
- Better for complex reporting queries
- Smaller bundle size

### Why PostgreSQL over MySQL?
- Better JSON support
- Advanced full-text search
- Superior concurrency handling
- Rich extension ecosystem
- Better for analytical queries

### Why Redis for Caching?
- In-memory performance
- Rich data structures
- Pub/sub capabilities
- Persistence options
- Widely adopted and supported

---

## Appendix B: Team Roles & Responsibilities

| Role | Count | Responsibilities |
|------|-------|------------------|
| Tech Lead | 1 | Architecture decisions, code reviews, mentoring |
| Backend Developer | 2-3 | API development, database design, integrations |
| Frontend Developer | 2-3 | UI components, state management, UX |
| DevOps Engineer | 1 | CI/CD, infrastructure, monitoring |
| QA Engineer | 1 | Test planning, automation, quality assurance |
| Product Owner | 1 | Requirements, prioritization, stakeholder management |

---

*Document Version: 1.0*  
*Last Updated: 2026-01-XX*  
*Author: AI Development Assistant*
