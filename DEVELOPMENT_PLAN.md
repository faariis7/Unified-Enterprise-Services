# Unified Enterprise Service Management Platform
## Development Plan & Technical Requirements

---

## Executive Summary

This document outlines the complete development plan for building a **Unified Enterprise Service Management (UESM)** platform that consolidates multiple departmental service desks into a single governed system. The platform follows clean architecture principles, remains self-hostable and database-agnostic, and provides enterprise-grade features including workspace isolation, role-based access control, dynamic form rendering, approval engines, automation workflows, and comprehensive reporting.

### Vision Statement
A single enterprise service management platform that gives service teams one governed way to receive and manage requests while preserving each department as a configurable workspace.

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Principles](#architecture-principles)
3. [Core Requirements](#core-requirements)
4. [Technical Infrastructure](#technical-infrastructure)
5. [Development Phases](#development-phases)
6. [Clean Code Standards](#clean-code-standards)
7. [Quality Gates](#quality-gates)
8. [Risk Mitigation](#risk-mitigation)

---

## 1. System Overview

### 1.1 Business Problem
Organizations currently maintain separate service desk applications for different departments (IT, Facilities, HR, etc.), leading to:
- Fragmented user experience
- Duplicated infrastructure costs
- Inconsistent governance and compliance
- Limited cross-department visibility
- High maintenance overhead

### 1.2 Solution Architecture
The UESM platform provides:
- **Unified Request Entity**: Single shared request table across all departments
- **Workspace Isolation**: Each department operates in its own configured workspace
- **Role-Based Access Control**: Granular permissions at workspace, service, and record levels
- **Dynamic Configuration**: No-code/low-code service builder with AI-assisted design
- **Self-Hostable**: Runs on VMs or containers without vendor lock-in

### 1.3 Initial Workspaces
1. Information Technology (IT)
2. Corporate Communications (CORP-COMM)
3. Facility Management (FACILITY)
4. Support Services (SUPPORT)
5. Rawabi Travel & Tourism (RTT)
6. Government Affairs (GOV-AFFAIRS)
7. RVOS Support (RVOS)

### 1.4 User Roles
| Role | Responsibilities | Access Scope |
|------|-----------------|--------------|
| **Requester** | Submit and follow requests | Workspace-scoped owned requests |
| **Service Agent** | Fulfill, assign, transition requests | Explicit service membership |
| **Service Manager** | Manage service operations | Service-level administration |
| **Service Administrator** | Configure service settings | Service configuration |
| **Approver** | Review and approve requests | Assigned approval tasks |
| **Workspace Administrator** | Configure workspace modules, membership | Assigned workspaces only |
| **Platform Administrator** | Govern global definitions | Platform-wide |
| **Auditor** | Read-only compliance review | Assigned scopes |

---

## 2. Architecture Principles

### 2.1 Clean Architecture Layers

```
┌─────────────────────────────────────────────────────────┐
│                    Delivery Layer                        │
│  (HTTP API, Background Worker, React Client, Webhooks)   │
└─────────────────────────────────────────────────────────┘
                          ↓ depends on
┌─────────────────────────────────────────────────────────┐
│                   Application Layer                      │
│    (Commands, Queries, Use Cases, Validation, Ports)     │
└─────────────────────────────────────────────────────────┘
                          ↓ depends on
┌─────────────────────────────────────────────────────────┐
│                     Domain Layer                         │
│  (Entities, Value Objects, Policies, Domain Events)      │
└─────────────────────────────────────────────────────────┘
                          ↑ implements
┌─────────────────────────────────────────────────────────┐
│                    Adapters Layer                        │
│ (PostgreSQL, SQL Server, MySQL, Entra ID, S3, SMTP, etc.)│
└─────────────────────────────────────────────────────────┘
```

#### Layer Responsibilities

**Domain Layer** (Innermost)
- Entities: `Request`, `Workspace`, `Service`, `Person`, `Approval`, `Task`
- Value Objects: `RequestId`, `WorkspaceId`, `RequestNumber`, `SLADuration`
- Domain Events: `RequestSubmitted`, `ApprovalDecisionMade`, `TaskCompleted`
- Policies: `RequestCreationPolicy`, `ApprovalEscalationPolicy`
- **NO dependencies** on UI, database, HTTP, identity SDKs, or external services

**Application Layer**
- Commands: `SubmitRequestCommand`, `MakeApprovalDecisionCommand`
- Queries: `GetMarketplaceQuery`, `GetRequestQueueQuery`
- Use Cases: `RequestSubmissionUseCase`, `WorkflowOrchestrationUseCase`
- Authorization Policies: `WorkspaceAccessPolicy`, `ServiceMembershipPolicy`
- Ports (Interfaces): `RequestRepository`, `UnitOfWork`, `IdentityProvider`
- **Dependencies**: Domain layer only

**Adapters Layer**
- Storage Providers: In-Memory (dev), PostgreSQL (prod), SQL Server, MySQL
- Identity Providers: Entra ID (OIDC), Development Identity
- File Storage: Local Filesystem (dev), S3-compatible (prod)
- Notification: SMTP, Teams Webhook, Microsoft Graph
- Search: PostgreSQL FTS, OpenSearch
- **Dependencies**: Application ports only

**Delivery Layer**
- HTTP API Controllers
- Background Worker Processes
- React Components and Hooks
- Webhook Endpoints
- **Dependencies**: Application use cases and ports only

### 2.2 Provider Strategy

| Capability | Development | Production (Recommended) | Optional Alternatives |
|------------|-------------|-------------------------|----------------------|
| **Persistence** | In-Memory | PostgreSQL | SQL Server, MySQL, Dataverse |
| **Authentication** | Dev Identity | Entra ID (OIDC) | Any OIDC provider |
| **Directory** | Seeded Data | Microsoft Graph | LDAP, SCIM, REST API |
| **File Storage** | Local FS | S3-compatible | Azure Blob, SharePoint |
| **Notifications** | Console/Test | SMTP | Teams, Graph, Power Automate |
| **Search** | In-Memory Filter | PostgreSQL FTS | OpenSearch, Elasticsearch |
| **Background Jobs** | In-Process | Worker Service | RabbitMQ, Azure Functions |
| **Secrets** | Environment Vars | Vault/Secret Files | Azure Key Vault |

### 2.3 Key Architectural Decisions

1. **Database Agnosticism**: No direct ORM or database SDK imports in domain/application layers
2. **Provider Interfaces**: All external dependencies abstracted behind ports
3. **Eventual Consistency**: Outbox pattern for cross-aggregate communication
4. **Immutable Audit Trail**: All state changes logged with before/after snapshots
5. **Optimistic Concurrency**: Row version tokens for conflict detection
6. **Idempotency Keys**: All commands support idempotent execution
7. **Workspace Scoping**: Every query includes mandatory workspace predicates

---

## 3. Core Requirements

### 3.1 Functional Requirements

#### FR-1: Workspace Management
- [ ] Create, update, deactivate workspaces
- [ ] Configure workspace identity (name, code, icon, color)
- [ ] Set request numbering format per workspace
- [ ] Manage workspace membership and roles
- [ ] Enable/disable requester portal and agent workspace
- [ ] Configure default timezone, calendar, site

#### FR-2: Service Builder
- [ ] Drag-and-drop form designer with sections and fields
- [ ] Field types: Text, Number, Date, Choice, Multi-Choice, Lookup, Attachment, Boolean
- [ ] Field properties: Default value, help text, validation rules, custom errors
- [ ] Conditional visibility and required-state rules
- [ ] Field sensitivity classification (Public, Internal, Confidential, Restricted)
- [ ] Service versioning with draft/published/retired states
- [ ] Clone services and field configurations
- [ ] AI-assisted service design suggestions
- [ ] Guided service creation wizard

#### FR-3: Catalog Administration
- [ ] Create and edit catalog items
- [ ] Assign catalog items to services
- [ ] Define audience eligibility
- [ ] Publish/retire catalog items
- [ ] Validate publication prerequisites (audience, form, service active)

#### FR-4: Request Management
- [ ] Submit requests from catalog items
- [ ] Dynamic form rendering based on published form version
- [ ] Request numbering with workspace/year sequence
- [ ] Request detail view with 5 tabs: Activity, Details, Work, Resolution, History
- [ ] Public replies and internal notes
- [ ] Attachment upload with malware scanning
- [ ] Request tagging and linking
- [ ] Request assignment and reassignment
- [ ] Lifecycle transitions with guard validation
- [ ] Resolution capture and requester confirmation
- [ ] Request reopening within policy window

#### FR-5: Approval Engine
- [ ] Configurable approval definitions with stages and rules
- [ ] Sequential and parallel approval stages
- [ ] Approver resolution: Person, Manager, Role, Group
- [ ] Delegation and escalation policies
- [ ] Approval expiration and reminders
- [ ] Approval decisions: Approve, Reject, Request More Info
- [ ] Immutable approval decision history
- [ ] Approval queue for pending decisions

#### FR-6: Workflow Automation
- [ ] Trigger-based automation rules
- [ ] Conditions: Request field values, approval status, lifecycle state
- [ ] Actions: Update field, send notification, create task, call webhook
- [ ] Cooldown periods and maximum execution limits
- [ ] Chain depth protection against recursion
- [ ] Immutable execution logs with success/failure status
- [ ] Workspace-scoped rule management

#### FR-7: Lifecycle Engine
- [ ] Configurable lifecycle states (Draft, Submitted, In Progress, Resolved, Closed)
- [ ] State transition rules and guards
- [ ] Required approvals per transition
- [ ] Required tasks per transition
- [ ] Automatic transitions on conditions
- [ ] Lifecycle simulation and testing

#### FR-8: SLA Management
- [ ] Service targets with response and resolution durations
- [ ] Business calendar awareness (holidays, working hours)
- [ ] SLA pause/resume on conditions
- [ ] Warning and breach notifications
- [ ] SLA compliance reporting

#### FR-9: Knowledge Base
- [ ] Article creation with rich text editor
- [ ] Article versioning with draft/published states
- [ ] Category organization
- [ ] Audience targeting (Requester, Agent, All Members)
- [ ] Search and filtering
- [ ] Helpfulness feedback collection
- [ ] Article analytics (views, feedback scores)

#### FR-10: Requester Portal
- [ ] Services marketplace homepage
- [ ] Service search and discovery
- [ ] Favorite services management
- [ ] Request submission forms
- [ ] My Requests queue with filters
- [ ] Request detail view (requester-safe subset)
- [ ] My Approvals queue
- [ ] Knowledge base browsing
- [ ] Profile management
- [ ] Action Center with due tasks and approvals

#### FR-11: Agent Workspace
- [ ] Request queue with advanced filtering
- [ ] Request detail with full operational capabilities
- [ ] Bulk actions (assign, transition, tag)
- [ ] Approval queue
- [ ] Task management
- [ ] Knowledge base authoring
- [ ] Service-specific dashboards

#### FR-12: Reporting & Analytics
- [ ] Report Builder with drag-and-drop interface
- [ ] Field catalog with sensitivity and eligibility metadata
- [ ] Pre-built reports: Volume, Aging, SLA Compliance, Approval Performance
- [ ] Custom report creation and saving
- [ ] Dashboard visualization (charts, tables, KPIs)
- [ ] Request drill-through from reports
- [ ] Service health dashboard
- [ ] Export to CSV/PDF

#### FR-13: Administration
- [ ] Global Administration: Workspaces, People, Roles, Integrations, Audit
- [ ] Workspace Administration: Modules, Membership, Overrides
- [ ] Settings hierarchy: Global → Workspace → Service → Catalog Item → Request
- [ ] Configuration audit trail
- [ ] Reset-to-inherited behavior
- [ ] Module definition management

#### FR-14: Contracts Management (Optional Module)
- [ ] Supplier agreement register
- [ ] Contract commercial terms tracking
- [ ] Compliance obligations management
- [ ] Renewal alerts and notifications
- [ ] Contract document storage
- [ ] Linked obligation completion tracking

### 3.2 Non-Functional Requirements

#### NFR-1: Performance
- Page load time < 2 seconds for standard views
- API response time < 500ms for queries
- Support 1000+ concurrent users
- Handle 100,000+ requests per workspace

#### NFR-2: Security
- Authentication via OpenID Connect
- Role-based access control at multiple levels
- Field-level security for sensitive data
- Audit logging of all data access and modifications
- Malware scanning for attachments
- HTTPS/TLS encryption in transit
- Encryption at rest for sensitive fields

#### NFR-3: Availability
- 99.9% uptime target
- Graceful degradation when optional integrations fail
- Health check endpoints for monitoring
- Database connection pooling and retry logic

#### NFR-4: Scalability
- Horizontal scaling for API and worker processes
- Database read replicas for reporting queries
- Caching strategy for frequently accessed metadata
- Pagination for large datasets

#### NFR-5: Maintainability
- Comprehensive unit test coverage (>80%)
- Integration tests for critical workflows
- Automated deployment pipelines
- Infrastructure as Code (IaC)
- Documentation for all public APIs
- Code quality gates (linting, type checking)

#### NFR-6: Compliance
- GDPR-compliant data retention and deletion
- Right to erasure implementation
- Data export capabilities
- Consent management for notifications
- Audit trail immutability

---

## 4. Technical Infrastructure

### 4.1 Technology Stack

#### Frontend
```json
{
  "runtime": "React 19.1.1",
  "language": "TypeScript 5.9",
  "buildTool": "Vite 7.3.2",
  "styling": "Tailwind CSS 4.x",
  "uiComponents": "Radix UI + shadcn/ui",
  "stateManagement": "Jotai 2.x",
  "dataFetching": "TanStack React Query 5.x",
  "routing": "React Router DOM 7.x",
  "forms": "React Hook Form 7.x + Zod validation"
}
```

#### Backend (To Be Implemented)
```
Runtime Options:
  - Node.js 20+ with Express/Fastify
  - .NET 8+ with ASP.NET Core
  - Bun (alternative to Node.js)

Database:
  - PostgreSQL 15+ (recommended)
  - Alternative: SQL Server, MySQL

ORM Options:
  - Prisma (type-safe, recommended)
  - Drizzle ORM (lightweight)
  - TypeORM (traditional)

Background Jobs:
  - Bull/BullMQ (Redis-based)
  - pg-boss (PostgreSQL-based)
  - Custom worker with polling

File Storage:
  - Local filesystem (development)
  - MinIO/S3-compatible (production)

Search:
  - PostgreSQL Full-Text Search (initial)
  - Meilisearch/OpenSearch (scale-out)
```

### 4.2 Project Structure

```
/workspace
├── src/                          # Frontend React application
│   ├── components/               # Reusable UI components
│   │   ├── ui/                   # shadcn/ui primitives
│   │   ├── system/               # System-level components
│   │   └── [feature]/            # Feature-specific components
│   ├── contexts/                 # React contexts
│   ├── hooks/                    # Custom React hooks
│   ├── lib/                      # Business logic libraries
│   ├── pages/                    # Route page components
│   ├── config/                   # Static configurations
│   └── generated/                # Auto-generated code
├── app-gen-sdk/                  # SDK for app generation
├── data-model/                   # Data model definitions
├── docs/                         # Documentation
├── plugins/                      # Vite plugins
└── backend/                      # [TO BE CREATED] Backend API
    ├── src/
    │   ├── domain/               # Domain entities and policies
    │   ├── application/          # Use cases and ports
    │   ├── adapters/             # External implementations
    │   │   ├── persistence/      # Database providers
    │   │   ├── identity/         # Auth providers
    │   │   ├── storage/          # File storage providers
    │   │   └── messaging/        # Queue/notification providers
    │   ├── delivery/             # API controllers and workers
    │   └── composition-root/     # DI configuration
    ├── migrations/               # Database migrations
    ├── tests/                    # Backend tests
    └── config/                   # Configuration files
```

### 4.3 Required Application Ports (Interfaces)

```typescript
// Core Infrastructure Ports
interface UnitOfWork {
  beginTransaction(): Promise<void>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

interface TransactionManager {
  runInTransaction<T>(fn: () => Promise<T>): Promise<T>;
}

interface Clock {
  now(): Date;
  businessDaysFrom(date: Date, days: number): Date;
}

interface IdGenerator {
  generate(): string; // GUID
}

interface RequestNumberGenerator {
  generate(workspaceId: string, year: number): Promise<string>;
}

interface IdempotencyStore {
  isProcessed(key: string): Promise<boolean>;
  markProcessed(key: string, result: any): Promise<void>;
}

interface OutboxStore {
  publish(event: DomainEvent): Promise<void>;
  processPending(limit: number): Promise<void>;
}

interface AuditWriter {
  write(event: AuditEvent): Promise<void>;
}

// Identity & Authorization Ports
interface IdentityProvider {
  authenticate(token: string): Promise<AuthenticatedUser>;
  getPrincipal(userId: string): Promise<Person>;
}

interface DirectoryProvider {
  searchUsers(query: string, filters: DirectoryFilters): Promise<Person[]>;
  resolveManager(personId: string): Promise<string | null>;
  resolveGroups(personId: string): Promise<Group[]>;
}

interface AuthorizationPolicyEngine {
  authorize(actor: AuthenticatedUser, action: string, resource: any): Promise<boolean>;
  applyRowLevelFilters(actor: AuthenticatedUser, query: Query): Query;
}

// Repository Ports
interface MetadataRepository {
  getWorkspace(id: string): Promise<Workspace>;
  getService(id: string): Promise<Service>;
  getPublishedFormVersion(serviceId: string): Promise<FormVersion>;
  // ... more metadata methods
}

interface RequestRepository {
  findById(id: string, actor: AuthenticatedUser): Promise<Request | null>;
  findByQuery(query: RequestQuery): Promise<Request[]>;
  save(request: Request): Promise<void>;
  delete(id: string): Promise<void>;
}

interface ApprovalRepository {
  findPendingForApprover(approverId: string): Promise<RequestApproval[]>;
  makeDecision(decision: ApprovalDecision): Promise<void>;
}

interface WorkflowRuntimeStore {
  advanceWorkflow(requestId: string): Promise<WorkflowResult>;
  getDueSteps(): Promise<WorkflowStep[]>;
}

// External Service Ports
interface FileStore {
  upload(file: Buffer, metadata: FileMetadata): Promise<FileReference>;
  download(reference: FileReference): Promise<Buffer>;
  delete(reference: FileReference): Promise<void>;
}

interface MalwareScanner {
  scan(fileReference: FileReference): Promise<ScanResult>;
}

interface NotificationProvider {
  send(notification: Notification): Promise<void>;
}

interface SearchProvider {
  search(query: SearchQuery): Promise<SearchResults>;
  index(document: SearchDocument): Promise<void>;
}
```

### 4.4 Database Schema (Key Tables)

```sql
-- Core Entities
CREATE TABLE workspaces (
    workspace_id UUID PRIMARY KEY,
    workspace_name VARCHAR(255) NOT NULL,
    workspace_key VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL, -- Active, Inactive, Suspended
    description TEXT,
    icon VARCHAR(50),
    primary_color VARCHAR(20),
    owner_person_id UUID REFERENCES persons(person_id),
    request_number_prefix VARCHAR(20),
    request_number_format VARCHAR(100),
    requester_portal_enabled BOOLEAN DEFAULT true,
    agent_workspace_enabled BOOLEAN DEFAULT true,
    default_timezone VARCHAR(50),
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE persons (
    person_id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    given_name VARCHAR(100),
    surname VARCHAR(100),
    job_title VARCHAR(200),
    department VARCHAR(200),
    manager_id UUID REFERENCES persons(person_id),
    phone VARCHAR(50),
    identity_provider_id VARCHAR(255),
    identity_issuer VARCHAR(255),
    identity_subject VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE workspace_memberships (
    membership_id UUID PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(workspace_id),
    person_id UUID REFERENCES persons(person_id),
    role VARCHAR(50) NOT NULL, -- Owner, Administrator, Member
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL,
    UNIQUE(workspace_id, person_id)
);

CREATE TABLE services (
    service_id UUID PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(workspace_id),
    service_name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50),
    owner_person_id UUID REFERENCES persons(person_id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE TABLE service_memberships (
    membership_id UUID PRIMARY KEY,
    service_id UUID REFERENCES services(service_id),
    person_id UUID REFERENCES persons(person_id),
    role VARCHAR(50) NOT NULL, -- Agent, ServiceManager, ServiceAdministrator, Approver, Auditor
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL,
    UNIQUE(service_id, person_id, role)
);

-- Request Entity
CREATE TABLE requests (
    request_id UUID PRIMARY KEY,
    workspace_id UUID REFERENCES workspaces(workspace_id) NOT NULL,
    service_id UUID REFERENCES services(service_id) NOT NULL,
    catalog_item_id UUID REFERENCES catalog_items(catalog_item_id),
    request_number VARCHAR(50) UNIQUE NOT NULL,
    requester_id UUID REFERENCES persons(person_id) NOT NULL,
    requested_for_id UUID REFERENCES persons(person_id),
    status VARCHAR(50) NOT NULL,
    lifecycle_state VARCHAR(50) NOT NULL,
    title VARCHAR(500),
    description TEXT,
    submitted_at TIMESTAMP,
    resolved_at TIMESTAMP,
    closed_at TIMESTAMP,
    sla_due_at TIMESTAMP,
    sla_breached BOOLEAN DEFAULT false,
    row_version BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    created_by UUID REFERENCES persons(person_id),
    updated_by UUID REFERENCES persons(person_id)
);

CREATE INDEX idx_requests_workspace ON requests(workspace_id);
CREATE INDEX idx_requests_requester ON requests(requester_id);
CREATE INDEX idx_requests_status ON requests(status);
CREATE INDEX idx_requests_lifecycle ON requests(lifecycle_state);
CREATE UNIQUE INDEX idx_requests_number ON requests(request_number);

-- Typed Answer Storage
CREATE TABLE request_field_values (
    field_value_id UUID PRIMARY KEY,
    request_id UUID REFERENCES requests(request_id) NOT NULL,
    workspace_id UUID REFERENCES workspaces(workspace_id) NOT NULL,
    field_definition_id UUID REFERENCES field_definitions(field_definition_id) NOT NULL,
    field_schema_name VARCHAR(255) NOT NULL,
    text_value VARCHAR(MAX),
    number_value DECIMAL(18,4),
    date_value DATE,
    boolean_value BOOLEAN,
    choice_value VARCHAR(255),
    multi_choice_value JSONB, -- Array of selected choices
    lookup_value_id UUID,
    attachment_count INTEGER DEFAULT 0,
    row_version BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_rfv_request ON request_field_values(request_id);
CREATE INDEX idx_rfv_workspace ON request_field_values(workspace_id);
CREATE INDEX idx_rfv_field ON request_field_values(field_definition_id);

-- Approval Engine
CREATE TABLE approval_definitions (
    approval_def_id UUID PRIMARY KEY,
    service_id UUID REFERENCES services(service_id),
    catalog_item_id UUID REFERENCES catalog_items(catalog_item_id),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP NOT NULL
);

CREATE TABLE approval_stages (
    stage_id UUID PRIMARY KEY,
    approval_def_id UUID REFERENCES approval_definitions(approval_def_id) NOT NULL,
    stage_order INTEGER NOT NULL,
    stage_type VARCHAR(20) NOT NULL, -- Sequential, Parallel
    name VARCHAR(255) NOT NULL,
    UNIQUE(approval_def_id, stage_order)
);

CREATE TABLE approval_rules (
    rule_id UUID PRIMARY KEY,
    stage_id UUID REFERENCES approval_stages(stage_id) NOT NULL,
    approver_type VARCHAR(50) NOT NULL, -- Person, Manager, Role, Group
    approver_reference VARCHAR(255), -- PersonId, RoleName, etc.
    rule_order INTEGER NOT NULL,
    UNIQUE(stage_id, rule_order)
);

CREATE TABLE request_approvals (
    request_approval_id UUID PRIMARY KEY,
    request_id UUID REFERENCES requests(request_id) NOT NULL,
    approval_def_id UUID REFERENCES approval_definitions(approval_def_id),
    stage_id UUID REFERENCES approval_stages(stage_id),
    rule_id UUID REFERENCES approval_rules(rule_id),
    assigned_to_person_id UUID REFERENCES persons(person_id),
    status VARCHAR(50) NOT NULL, -- Pending, Approved, Rejected, Expired, Delegated
    delegated_to_person_id UUID REFERENCES persons(person_id),
    expires_at TIMESTAMP,
    decided_at TIMESTAMP,
    decision_outcome VARCHAR(20),
    decision_comments TEXT,
    row_version BIGINT NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_ra_request ON request_approvals(request_id);
CREATE INDEX idx_ra_assignee ON request_approvals(assigned_to_person_id);
CREATE INDEX idx_ra_status ON request_approvals(status);

-- Audit Trail
CREATE TABLE audit_log (
    audit_id UUID PRIMARY KEY,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    workspace_id UUID REFERENCES workspaces(workspace_id),
    action VARCHAR(50) NOT NULL, -- Created, Updated, Deleted, Transitioned
    actor_person_id UUID REFERENCES persons(person_id),
    actor_display_name VARCHAR(255),
    actor_email VARCHAR(255),
    source VARCHAR(100), -- API, UI, Automation, Email
    correlation_id UUID,
    field_name VARCHAR(255),
    old_value JSONB,
    new_value JSONB,
    reason_code VARCHAR(100),
    ip_address VARCHAR(50),
    user_agent TEXT,
    created_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_workspace ON audit_log(workspace_id);
CREATE INDEX idx_audit_actor ON audit_log(actor_person_id);
CREATE INDEX idx_audit_created ON audit_log(created_at);
```

### 4.5 API Design

#### RESTful API Structure

```
Base URL: /api/v1

Authentication: Bearer token (JWT from OIDC provider)

Endpoints:

# Marketplaces & Services
GET    /marketplace/services              # Get available services
GET    /marketplace/services/:id          # Get service details
POST   /marketplace/favorites             # Add favorite service
DELETE /marketplace/favorites/:serviceId  # Remove favorite

# Requests
GET    /workspaces/:workspaceCode/requests           # List requests (filtered by permissions)
POST   /workspaces/:workspaceCode/requests           # Create new request
GET    /workspaces/:workspaceCode/requests/:id       # Get request details
PATCH  /workspaces/:workspaceCode/requests/:id       # Update request
POST   /workspaces/:workspaceCode/requests/:id/submit # Submit request
POST   /workspaces/:workspaceCode/requests/:id/transition # Lifecycle transition
POST   /workspaces/:workspaceCode/requests/:id/assign # Assign request
POST   /workspaces/:workspaceCode/requests/:id/close  # Close request

# Approvals
GET    /workspaces/:workspaceCode/approvals           # Get approval queue
POST   /approvals/:id/decide                          # Make approval decision
POST   /approvals/:id/delegate                        # Delegate approval

# Workflow & Automation
GET    /workspaces/:workspaceCode/workflow/rules      # List automation rules
POST   /workspaces/:workspaceCode/workflow/rules      # Create rule
PUT    /workspaces/:workspaceCode/workflow/rules/:id  # Update rule
DELETE /workspaces/:workspaceCode/workflow/rules/:id  # Delete rule

# Knowledge Base
GET    /workspaces/:workspaceCode/knowledge/articles  # List articles
POST   /workspaces/:workspaceCode/knowledge/articles  # Create article
GET    /workspaces/:workspaceCode/knowledge/articles/:id # Get article
PUT    /workspaces/:workspaceCode/knowledge/articles/:id # Update article
POST   /workspaces/:workspaceCode/knowledge/articles/:id/publish # Publish article

# Reporting
GET    /workspaces/:workspaceCode/reports/fields      # Get available report fields
POST   /workspaces/:workspaceCode/reports             # Execute report
GET    /workspaces/:workspaceCode/reports/saved       # Get saved reports
POST   /workspaces/:workspaceCode/reports/saved       # Save report

# Administration
GET    /administration/workspaces                     # List all workspaces
POST   /administration/workspaces                     # Create workspace
PUT    /administration/workspaces/:id                 # Update workspace
GET    /workspaces/:workspaceCode/membership          # Get workspace members
POST   /workspaces/:workspaceCode/membership          # Add member
DELETE /workspaces/:workspaceCode/membership/:personId # Remove member

# Attachments
POST   /workspaces/:workspaceCode/attachments/upload  # Initiate upload
GET    /attachments/:id/download                      # Download attachment
DELETE /attachments/:id                               # Delete attachment
```

#### Request/Response Examples

```typescript
// Create Request
POST /api/v1/workspaces/IT/requests
Content-Type: application/json
Authorization: Bearer <token>
Idempotency-Key: <uuid>

{
  "catalogItemId": "uuid-here",
  "requestedForId": "uuid-here",
  "title": "New laptop request",
  "fieldValues": [
    {
      "fieldDefinitionId": "uuid-laptop-type",
      "choiceValue": "MacBook Pro 16"
    },
    {
      "fieldDefinitionId": "uuid-justification",
      "textValue": "Current laptop is 5 years old"
    }
  ]
}

Response: 201 Created
{
  "requestId": "uuid-here",
  "requestNumber": "IT-2026-000123",
  "status": "Draft",
  "createdAt": "2026-01-15T10:30:00Z"
}

// Make Approval Decision
POST /api/v1/approvals/:id/decide
Content-Type: application/json
Authorization: Bearer <token>

{
  "outcome": "Approved",
  "comments": "Budget approved for Q1",
  "expectedRowVersion": 1
}

Response: 200 OK
{
  "approvalId": "uuid-here",
  "status": "Approved",
  "decidedAt": "2026-01-15T11:00:00Z",
  "nextStep": "Fulfillment"
}
```

---

## 5. Development Phases

### Phase 1: Foundation (Weeks 1-4)

**Goal**: Establish clean architecture skeleton with in-memory persistence

#### Week 1-2: Project Setup & Domain Layer
- [ ] Initialize backend project structure
- [ ] Define domain entities (Request, Workspace, Service, Person, Approval)
- [ ] Implement value objects (RequestId, WorkspaceId, RequestNumber)
- [ ] Define domain events and policies
- [ ] Set up dependency injection container
- [ ] Configure logging and error handling

#### Week 3-4: Application Layer & In-Memory Adapters
- [ ] Implement core use cases (SubmitRequest, MakeApprovalDecision)
- [ ] Define repository ports and interfaces
- [ ] Implement in-memory repositories (reuse existing frontend data)
- [ ] Implement unit of work and transaction management (in-memory)
- [ ] Create authentication/authorization middleware
- [ ] Implement basic API endpoints

**Deliverables**:
- Working API with in-memory persistence
- Domain and application layers complete
- Basic CRUD operations for core entities

### Phase 2: Persistence & Authentication (Weeks 5-8)

**Goal**: PostgreSQL integration with production-ready authentication

#### Week 5-6: PostgreSQL Adapter
- [ ] Set up PostgreSQL database schema
- [ ] Implement database migrations
- [ ] Create PostgreSQL repositories implementing domain ports
- [ ] Implement connection pooling
- [ ] Add optimistic concurrency control
- [ ] Implement transaction management with database

#### Week 7-8: Authentication & Authorization
- [ ] Integrate Entra ID (or mock OIDC provider)
- [ ] Implement IdentityProvider port
- [ ] Build authorization policy engine
- [ ] Implement row-level security filters
- [ ] Add field-level security projections
- [ ] Create audit logging infrastructure

**Deliverables**:
- PostgreSQL-backed API
- OIDC authentication working
- Role-based authorization enforced
- Audit trail functional

### Phase 3: Core Features (Weeks 9-14)

**Goal**: Complete request management, approval engine, workflow automation

#### Week 9-10: Request Management
- [ ] Implement request submission use case
- [ ] Build request numbering service
- [ ] Create request query specifications
- [ ] Implement request lifecycle transitions
- [ ] Add attachment handling with file storage port
- [ ] Build activity timeline generation

#### Week 11-12: Approval Engine
- [ ] Implement approval definition management
- [ ] Build approval stage processor
- [ ] Create approver resolution logic
- [ ] Implement delegation and escalation
- [ ] Add approval expiration handling
- [ ] Build approval queue queries

#### Week 13-14: Workflow Automation
- [ ] Implement trigger evaluation engine
- [ ] Build condition evaluator
- [ ] Create action executor framework
- [ ] Implement cooldown and rate limiting
- [ ] Add workflow execution logging
- [ ] Build background worker for async execution

**Deliverables**:
- Complete request lifecycle management
- Fully functional approval engine
- Workflow automation operational
- Background worker processing jobs

### Phase 4: Advanced Features (Weeks 15-20)

**Goal**: SLA management, knowledge base, reporting, contracts

#### Week 15-16: SLA & Business Calendar
- [ ] Implement business calendar repository
- [ ] Build SLA calculator
- [ ] Create SLA warning and breach detection
- [ ] Implement SLA pause/resume logic
- [ ] Add SLA reporting queries

#### Week 17-18: Knowledge Base
- [ ] Implement article CRUD operations
- [ ] Build article versioning system
- [ ] Create category management
- [ ] Implement search functionality
- [ ] Add helpfulness feedback tracking
- [ ] Build audience filtering

#### Week 19-20: Reporting & Contracts
- [ ] Implement report field catalog
- [ ] Build report execution engine
- [ ] Create dashboard visualization data
- [ ] Implement contract management module
- [ ] Add renewal alert system
- [ ] Build export functionality

**Deliverables**:
- SLA tracking and reporting
- Knowledge base fully functional
- Reporting engine operational
- Contracts module complete

### Phase 5: Integration & Polish (Weeks 21-24)

**Goal**: External integrations, performance optimization, documentation

#### Week 21-22: External Integrations
- [ ] Implement email intake provider
- [ ] Build webhook sender
- [ ] Create notification providers (SMTP, Teams)
- [ ] Integrate malware scanner (ClamAV)
- [ ] Implement Microsoft Graph adapter (optional)
- [ ] Add search provider (OpenSearch optional)

#### Week 23-24: Performance & Documentation
- [ ] Implement caching strategy
- [ ] Optimize database queries with indexes
- [ ] Add database read replicas for reporting
- [ ] Conduct load testing
- [ ] Write API documentation
- [ ] Create deployment guides
- [ ] Document operational procedures

**Deliverables**:
- All integrations complete
- Performance benchmarks met
- Comprehensive documentation
- Production deployment ready

---

## 6. Clean Code Standards

### 6.1 TypeScript Guidelines

#### General Principles
```typescript
// ✅ DO: Use explicit types for function signatures
function calculateSlaDueDate(
  submittedAt: Date,
  targetHours: number,
  calendar: BusinessCalendar
): Date {
  // Implementation
}

// ❌ DON'T: Rely on implicit any types
function calculateSlaDueDate(submittedAt, targetHours, calendar) {
  // Bad practice
}
```

#### Error Handling
```typescript
// ✅ DO: Use custom error types with domain context
class RequestNotFoundError extends DomainError {
  constructor(requestId: string) {
    super(`Request not found: ${requestId}`, 'REQUEST_NOT_FOUND');
  }
}

// ✅ DO: Handle errors at application boundaries
try {
  await requestRepository.save(request);
} catch (error) {
  if (error instanceof ConcurrencyConflictError) {
    throw new ConflictException('Request was modified by another user');
  }
  throw error;
}

// ❌ DON'T: Swallow errors or use generic messages
try {
  await requestRepository.save(request);
} catch (error) {
  console.log('Error occurred'); // Bad practice
}
```

#### Dependency Injection
```typescript
// ✅ DO: Inject dependencies through constructor
export class RequestSubmissionUseCase {
  constructor(
    private readonly requestRepository: RequestRepository,
    private readonly unitOfWork: UnitOfWork,
    private readonly auditWriter: AuditWriter,
    private readonly clock: Clock
  ) {}

  async execute(command: SubmitRequestCommand): Promise<RequestSubmissionResult> {
    // Implementation uses injected dependencies
  }
}

// ❌ DON'T: Create dependencies inside use cases
export class RequestSubmissionUseCase {
  async execute(command: SubmitRequestCommand) {
    const repository = new SqlRequestRepository(); // Bad practice
    const auditWriter = new SqlAuditWriter(); // Bad practice
  }
}
```

### 6.2 Naming Conventions

```typescript
// Entities (nouns)
class Request { }
class Workspace { }
class ApprovalDefinition { }

// Value Objects (nouns with clear identity)
class RequestId { }
class RequestNumber { }
class SLADuration { }

// Commands (verb phrases)
class SubmitRequestCommand { }
class MakeApprovalDecisionCommand { }
class TransitionRequestCommand { }

// Queries (noun phrases or "Get" prefix)
class GetRequestByIdQuery { }
class GetApprovalQueueQuery { }
class GetMarketplaceServicesQuery { }

// Use Cases (noun phrases or verb phrases)
class RequestSubmissionUseCase { }
class ApprovalDecisionUseCase { }
class WorkflowOrchestrationUseCase { }

// Repositories (interface naming)
interface RequestRepository { }
interface ApprovalRepository { }

// DTOs (Data Transfer Objects)
class RequestDto { }
class ApprovalSummaryDto { }
class MarketplaceServiceDto { }
```

### 6.3 File Organization

```
src/
├── domain/
│   ├── entities/
│   │   ├── Request.ts
│   │   ├── Workspace.ts
│   │   └── Service.ts
│   ├── value-objects/
│   │   ├── RequestId.ts
│   │   └── RequestNumber.ts
│   ├── events/
│   │   ├── RequestSubmittedEvent.ts
│   │   └── ApprovalDecisionMadeEvent.ts
│   └── errors/
│       ├── DomainError.ts
│       └── RequestNotFoundError.ts
├── application/
│   ├── commands/
│   │   ├── SubmitRequestCommand.ts
│   │   └── SubmitRequestHandler.ts
│   ├── queries/
│   │   ├── GetRequestByIdQuery.ts
│   │   └── GetRequestByIdHandler.ts
│   ├── use-cases/
│   │   ├── RequestSubmissionUseCase.ts
│   │   └── ApprovalProcessingUseCase.ts
│   └── ports/
│       ├── RequestRepository.ts
│       ├── UnitOfWork.ts
│       └── IdentityProvider.ts
├── adapters/
│   ├── persistence/
│   │   ├── postgresql/
│   │   │   ├── PostgreSqlRequestRepository.ts
│   │   │   └── PostgreSqlUnitOfWork.ts
│   │   └── in-memory/
│   │       ├── InMemoryRequestRepository.ts
│   │       └── InMemoryUnitOfWork.ts
│   ├── identity/
│   │   ├── EntraIdentityProvider.ts
│   │   └── DevelopmentIdentityProvider.ts
│   └── storage/
│       ├── S3FileStore.ts
│       └── LocalFileStore.ts
└── delivery/
    ├── api/
    │   ├── controllers/
    │   │   ├── RequestsController.ts
    │   │   └── ApprovalsController.ts
    │   └── middleware/
    │       ├── AuthenticationMiddleware.ts
    │       └── AuthorizationMiddleware.ts
    └── worker/
        ├── WorkflowWorker.ts
        └── NotificationWorker.ts
```

### 6.4 Testing Standards

#### Unit Tests
```typescript
// ✅ DO: Test behavior, not implementation
describe('RequestSubmissionUseCase', () => {
  let useCase: RequestSubmissionUseCase;
  let mockRepository: MockRequestRepository;
  let mockClock: MockClock;

  beforeEach(() => {
    mockRepository = new MockRequestRepository();
    mockClock = new MockClock(new Date('2026-01-15T10:00:00Z'));
    useCase = new RequestSubmissionUseCase(mockRepository, mockClock);
  });

  it('should assign sequential request number within workspace and year', async () => {
    // Arrange
    const command = createTestSubmitCommand();
    mockRepository.nextRequestNumber = 'IT-2026-000001';

    // Act
    const result = await useCase.execute(command);

    // Assert
    expect(result.requestNumber).toBe('IT-2026-000001');
    expect(mockRepository.saveCalled).toBe(true);
  });

  it('should reject submission if required fields are missing', async () => {
    // Arrange
    const command = createTestSubmitCommand({ missingRequiredFields: true });

    // Act & Assert
    await expect(useCase.execute(command))
      .rejects
      .toThrow(ValidationError);
  });
});
```

#### Integration Tests
```typescript
// ✅ DO: Test full workflow with real database
describe('Request Submission Flow', () => {
  let app: Express;
  let database: TestDatabase;

  beforeAll(async () => {
    database = await TestDatabase.create();
    app = await createTestApp(database.connectionString);
  });

  afterAll(async () => {
    await database.drop();
  });

  it('should create request and trigger approval workflow', async () => {
    // Arrange
    const authToken = await getTestAuthToken('agent@company.com');
    const submitPayload = {
      catalogItemId: 'test-catalog-item',
      fieldValues: [{ fieldDefinitionId: 'test-field', textValue: 'Test' }]
    };

    // Act
    const response = await request(app)
      .post('/api/v1/workspaces/IT/requests')
      .set('Authorization', `Bearer ${authToken}`)
      .send(submitPayload);

    // Assert
    expect(response.status).toBe(201);
    expect(response.body.requestNumber).toMatch(/IT-2026-\d+/);

    // Verify approval was created
    const approvals = await database.query(
      'SELECT * FROM request_approvals WHERE request_id = $1',
      [response.body.requestId]
    );
    expect(approvals.rows.length).toBeGreaterThan(0);
  });
});
```

### 6.5 Code Review Checklist

- [ ] **Single Responsibility**: Does each class/function do one thing?
- [ ] **Dependency Injection**: Are external dependencies injected, not created?
- [ ] **Error Handling**: Are errors handled appropriately at boundaries?
- [ ] **Type Safety**: Are all types explicit and correct?
- [ ] **Test Coverage**: Are there unit tests for business logic?
- [ ] **Naming**: Do names clearly express intent?
- [ ] **Comments**: Are comments explaining "why", not "what"?
- [ ] **Validation**: Is input validated at system boundaries?
- [ ] **Security**: Are authorization checks in place?
- [ ] **Audit**: Are state changes logged?

---

## 7. Quality Gates

### 7.1 Automated Checks

```yaml
# CI/CD Pipeline Stages

stages:
  - lint
  - typecheck
  - test
  - build
  - deploy

lint:
  script:
    - bun run lint
    - bun run format:check
  rules:
    - no errors allowed
    - warnings < 10

typecheck:
  script:
    - bun run typecheck
  rules:
    - no type errors
    - strict mode enabled

test:
  script:
    - bun run test:unit --coverage
    - bun run test:integration
  rules:
    - unit test coverage >= 80%
    - all critical path tests pass
    - no flaky tests

build:
  script:
    - bun run build:frontend
    - bun run build:backend
  rules:
    - build succeeds
    - bundle size within budget
    - no critical vulnerabilities in dependencies

security:
  script:
    - npm audit --audit-level=high
    - snyk test
  rules:
    - no high/critical vulnerabilities
    - dependencies up to date

performance:
  script:
    - bun run test:load
  rules:
    - p95 response time < 500ms
    - throughput > 100 req/sec
    - error rate < 0.1%
```

### 7.2 Definition of Done

**For Features**:
- [ ] Code implemented following clean architecture
- [ ] Unit tests written and passing (>80% coverage)
- [ ] Integration tests for critical paths
- [ ] API documentation updated
- [ ] Security review completed
- [ ] Performance benchmarks met
- [ ] Code reviewed and approved
- [ ] Merged to main branch

**For Releases**:
- [ ] All automated tests passing
- [ ] Security scan clean
- [ ] Performance tests passed
- [ ] Documentation updated
- [ ] Deployment guide reviewed
- [ ] Rollback plan documented
- [ ] Stakeholder sign-off obtained

### 7.3 Monitoring & Observability

```typescript
// Metrics to Track
const metrics = {
  // Performance
  httpRequestDuration: 'Histogram of HTTP request duration',
  databaseQueryDuration: 'Histogram of database query duration',
  workflowExecutionTime: 'Time to execute workflow steps',

  // Business
  requestsSubmitted: 'Counter of requests submitted per workspace',
  approvalsPending: 'Gauge of pending approvals',
  slaBreaches: 'Counter of SLA breaches',

  // Errors
  httpErrors: 'Counter of HTTP errors by status code',
  domainErrors: 'Counter of domain errors by type',
  workflowFailures: 'Counter of failed workflow executions',

  // Usage
  activeUsers: 'Gauge of active users',
  apiCallsPerSecond: 'Rate of API calls',
  cacheHitRate: 'Ratio of cache hits to total requests'
};

// Health Checks
const healthChecks = {
  database: 'Can connect to database and run simple query',
  fileStorage: 'Can upload and retrieve test file',
  identityProvider: 'Can validate test token',
  messageQueue: 'Can publish and consume test message',
  externalApis: 'All required external APIs reachable'
};
```

---

## 8. Risk Mitigation

### 8.1 Technical Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| **Database performance degradation** | Medium | High | Implement proper indexing, query optimization, read replicas, and caching. Monitor slow queries. |
| **Authentication provider downtime** | Low | High | Implement circuit breaker pattern, local token caching, graceful degradation to read-only mode. |
| **Workflow recursion/infinite loops** | Medium | Medium | Enforce chain depth limits, cooldown periods, and maximum execution counts. Log all executions. |
| **Data inconsistency during failures** | Medium | High | Use transactions, outbox pattern, idempotency keys, and reconciliation jobs. |
| **Attachment malware infection** | Low | High | Mandatory malware scanning, quarantine uploads, restrict file types, regular security updates. |
| **Scalability bottlenecks** | Medium | Medium | Design for horizontal scaling from start, use stateless API servers, implement caching. |

### 8.2 Operational Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| **Insufficient monitoring** | Medium | High | Implement comprehensive logging, metrics, and alerting from day one. Use OpenTelemetry. |
| **Lack of documentation** | High | Medium | Enforce documentation as part of Definition of Done. Use automated API doc generation. |
| **Key person dependency** | Medium | High | Cross-train team members, document architectural decisions, pair programming. |
| **Scope creep** | High | Medium | Strict change control process, prioritize MVP features, regular stakeholder alignment. |
| **Integration complexity** | Medium | Medium | Start with minimal integrations, use adapter pattern, thoroughly test each integration. |

### 8.3 Security Risks

| Risk | Probability | Impact | Mitigation Strategy |
|------|-------------|--------|---------------------|
| **Unauthorized data access** | Medium | Critical | Implement row-level security, field-level masking, comprehensive authorization checks. |
| **Data leakage through APIs** | Medium | Critical | Validate all output against user permissions, implement API rate limiting. |
| **Injection attacks** | Low | Critical | Use parameterized queries, ORM with built-in protection, input validation. |
| **Session hijacking** | Low | Critical | Use short-lived JWT tokens, implement refresh token rotation, secure cookie flags. |
| **Audit log tampering** | Low | Critical | Append-only audit tables, cryptographic hashing, offsite log storage. |

---

## Appendix A: Glossary

| Term | Definition |
|------|------------|
| **Workspace** | A logical isolation boundary for a department's service operations |
| **Service** | A specific offering within a workspace (e.g., "IT Hardware Requests") |
| **Catalog Item** | A publishable item that requesters can select to initiate a request |
| **Request** | A unified entity representing a service request/ticket |
| **Lifecycle** | The state machine governing request progression |
| **Workflow** | Automated actions triggered by events or conditions |
| **Approval** | A formal decision point requiring authorized personnel |
| **SLA** | Service Level Agreement defining response/resolution targets |
| **Port** | An interface defining a capability without implementation |
| **Adapter** | A concrete implementation of a port |

---

## Appendix B: Quick Start Commands

```bash
# Development Setup
cd /workspace
bun install
bun run dev

# Type Checking
bun run typecheck
bun run typecheck:go  # Faster alternative

# Linting
bun run lint

# Building
bun run build

# Running Tests (when implemented)
bun run test:unit
bun run test:integration
bun run test:e2e

# Database Migration (when backend exists)
cd backend
bun run migrate:up
bun run migrate:rollback

# Docker Development (when available)
docker-compose up -d postgres
docker-compose up -d minio
docker-compose up -d redis
```

---

## Appendix C: Recommended Reading

1. **Clean Architecture** by Robert C. Martin
2. **Domain-Driven Design** by Eric Evans
3. **Building Microservices** by Sam Newman
4. **Designing Data-Intensive Applications** by Martin Kleppmann
5. **The Pragmatic Programmer** by Andrew Hunt and David Thomas

---

*Document Version: 1.0*  
*Last Updated: January 2026*  
*Author: Development Team*
