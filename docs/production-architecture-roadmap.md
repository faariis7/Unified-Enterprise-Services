# Provider-neutral production architecture roadmap

## Architectural decision

The platform will remain self-hostable and database-agnostic. Production architecture must not require Dataverse, SharePoint, Azure Functions, Power Automate, Azure Storage, or any other paid platform service.

The default production target is a VM or container host running the React web application, a stateless application API, background workers, and a relational database. Microsoft Entra ID is the preferred enterprise identity provider, but authentication is isolated behind an identity-provider interface. Microsoft and third-party services are optional adapters.

The current in-memory data layer becomes the first supported storage provider rather than disposable prototype code. PostgreSQL is the recommended first durable provider. SQL Server and MySQL can be added without changing domain logic, API contracts, routes, or user experience.

No application behavior or `/` route behavior is changed by this roadmap. The root route remains the Services Marketplace.

## Clean architecture boundaries

Dependencies point inward:

1. **Domain** — entities, value objects, invariants, policies, domain events, and provider-neutral errors. It imports no UI, database, HTTP, identity SDK, queue, or storage package.
2. **Application** — commands, queries, use cases, authorization policies, validation, transactions, idempotency, workflow orchestration, reporting specifications, and ports. It depends only on the domain.
3. **Adapters** — in-memory, PostgreSQL, SQL Server, MySQL, Dataverse, SharePoint, REST, Entra ID, SMTP, Microsoft Graph, object storage, and webhook implementations of application ports.
4. **Delivery** — HTTP API, background worker, scheduled worker, and React client. Delivery invokes application use cases and never contains authoritative business rules.

UI hooks must consume stable API/application contracts, not generated persistence services directly. Provider selection occurs in the composition root through configuration and dependency injection.

## Required application ports

- `UnitOfWork`
- `TransactionManager`
- `Clock`
- `IdGenerator`
- `RequestNumberGenerator`
- `IdempotencyStore`
- `OutboxStore`
- `AuditWriter`
- `IdentityProvider`
- `DirectoryProvider`
- `AuthorizationPolicyEngine`
- `MetadataRepository`
- `ServiceRepository`
- `RequestRepository`
- `RequestAnswerRepository`
- `WorkflowRepository`
- `WorkflowRuntimeStore`
- `ApprovalRepository`
- `TaskRepository`
- `LifecycleRepository`
- `SlaRepository`
- `ReportingRepository`
- `SearchProvider`
- `FileStore`
- `MalwareScanner`
- `NotificationProvider`
- `EmailIntakeProvider`
- `WebhookProvider`
- `DistributedLock`

Repository interfaces should be aggregate-oriented. They must not expose ORM query builders, Dataverse types, SharePoint list semantics, or database-specific SQL to business logic.

## Provider strategy

| Capability | Default development provider | Recommended self-hosted production provider | Optional providers |
|---|---|---|---|
| Relational persistence | Existing in-memory provider | PostgreSQL | SQL Server, MySQL, Dataverse, SharePoint adapter for limited reference data, REST adapter |
| Authentication | Development identity provider | Entra ID via OpenID Connect | Any standards-compliant OIDC provider |
| Directory/profile data | Seeded in-memory directory | Entra/Graph adapter with local profile cache | LDAP, SCIM, HR REST API, static directory |
| Application API | In-process development adapter | Self-hosted ASP.NET Core or Node.js API | Azure Functions adapter |
| Background execution | Synchronous/in-memory scheduler | Self-hosted worker service with database outbox and job tables | Power Automate, Azure Functions, external queue workers |
| File storage | In-memory/local development file store | S3-compatible object storage or protected filesystem | Azure Blob Storage, SharePoint document library |
| Notifications | Capturing/test provider | SMTP plus optional Teams/webhook adapters | Microsoft Graph, Power Automate |
| Search | In-memory filtering | PostgreSQL full-text search initially | OpenSearch, Elasticsearch, SQL Server FTS, external REST search |
| Reporting | In-memory projection provider | Secured SQL read models/materialized views | Power BI, external BI tools, REST/OData adapters |
| Secrets | Environment/development secret provider | VM secret files or Vault-compatible service | Azure Key Vault |
| Observability | Console/test logger | OpenTelemetry with self-hosted collector and log/metric backend | Application Insights |

## Production replacement matrix

Complexity describes migration effort. Risk describes production impact if the current implementation remains authoritative.

### Storage and mock data

| Component | Current implementation | Production implementation | Migration complexity | Risk level |
|---|---|---|---|---|
| Generated data services | In-memory tables and generated hooks/services | Repository ports with the existing in-memory adapter; add PostgreSQL repositories and migrations behind identical application contracts | Very high | Critical |
| Workspaces, services, catalog, metadata | Seeded in-memory relational records | Relational normalized tables with stable IDs, foreign keys, unique constraints, indexes, row versions, active state, soft deletion, and audited commands | High | Critical |
| Form versions | In-memory metadata and multi-record client writes | Transactional metadata repository; publish use case validates and writes an immutable snapshot in one transaction | High | Critical |
| Requests and typed answers | In-memory `Request` and `RequestFieldValue` writes from the SPA | Request aggregate and typed-answer repositories; submit use case validates, numbers, persists, audits, and emits an outbox event atomically | Very high | Critical |
| Request numbering | In-memory sequence | Database sequence or locked counter scoped by workspace/year, protected by transaction and unique request-number constraint | Medium | Critical |
| Workflow, approvals, tasks, lifecycle, SLA | In-memory runtime state and local execution | Durable runtime tables plus application use cases; worker claims due steps with leases, idempotency keys, retries, and dead-letter state | Very high | Critical |
| Reports and dashboards | In-memory definitions and browser aggregation | Report-definition repositories and secured read-model queries/materialized views | High | Critical |
| Roles and permissions | Seeded assignments evaluated in the browser | Relational policy records plus trusted application authorization; optional identity-group mappings | High | Critical |
| Audit | In-memory rows | Append-only domain audit table with actor, tenant, workspace, correlation, source, before/after metadata, and protected-access events | Medium | Critical |
| Favorites on `/` | Browser `localStorage` | User-preference repository keyed by authenticated subject; local storage remains an optional optimistic cache | Low | Medium |
| Seeded demo data | Full model includes demo configuration and operations | Separate schema migrations, reference seeds, demo fixtures, and test fixtures; production deploys approved configuration only | High | High |

### Identity and directory

| Component | Current implementation | Production implementation | Migration complexity | Risk level |
|---|---|---|---|---|
| Host identity | Power Apps SDK context | `IdentityProvider` validates OIDC access tokens and maps `(issuer, tenant, subject/object ID)` to a local person | High | Critical |
| Simulated persona | Client-selectable demo identity | Development-only `IdentityProvider`; impossible to enable in production configuration | Low | Critical |
| User profile | Seeded person records | Local person/profile repository synchronized or enriched through `DirectoryProvider`; Entra ID and Graph are the preferred adapter, not a domain dependency | High | High |
| Manager and group resolution | Local relationships | Directory port resolves manager and transitive groups; resolved approvers are snapshotted into workflow runtime state | Medium | High |
| People picker | Local records | Authorized directory-search use case returning constrained principal DTOs; Graph, LDAP, SCIM, or REST adapters may implement it | Medium | High |
| M365 widgets on `/` | Experimental Microsoft connector requests | Optional Graph adapter loaded independently; connector failure never blocks marketplace or request operations | Medium | Medium |

### Authorization and validation

| Component | Current implementation | Production implementation | Migration complexity | Risk level |
|---|---|---|---|---|
| Route and button guards | React capability checks | Retain for UX; API returns authoritative projections and capability flags | Low | Medium |
| Authorization engine | TypeScript policy evaluation in the browser | Move policy vocabulary into the application layer; every query and command receives authenticated actor and scope and applies row/field/action policy before repository access | Very high | Critical |
| Workspace/service/request scope | Client filtering | Query specifications include mandatory tenant/workspace/service/record predicates; direct reads repeat authorization | Very high | Critical |
| Sensitive fields | Client masking | Application projection service omits or masks protected values before serialization; protected reads are audited | Very high | Critical |
| Dynamic validation | Client service and page validation | Shared domain/application validators reload immutable metadata and evaluate trusted requester context and typed answers | High | Critical |
| Visibility rules | Browser evaluation | Client evaluates for responsiveness; application use case independently evaluates visibility, required state, disabled state, and value-retention policy | Very high | Critical |
| Publication | Multiple local writes | Transactional publish command validates stable keys, references, cycles, conflicts, workflow paths, permissions, and immutable snapshot creation | Very high | Critical |
| Concurrency | No durable row-version boundary | Provider-neutral optimistic concurrency token in contracts; relational adapters map it to row version/version columns | High | High |

### Local execution and integrations

| Component | Current implementation | Production implementation | Migration complexity | Risk level |
|---|---|---|---|---|
| Request creation and drafts | SPA invokes generated mutations | Self-hosted API command handlers with authentication, idempotency, transactions, metadata validation, and audit | Very high | Critical |
| Lifecycle transitions | Local lifecycle/orchestration modules | Application transition use case validates current version/state, permissions, guards, tasks, approvals, resolution, and concurrency | Very high | Critical |
| Workflow advancement | Page-triggered local execution | Deterministic workflow application service plus durable worker; state transitions and outbox writes are transactional | Very high | Critical |
| Approval decisions | Local mutation | Authorized decision command validates actor/delegate, expiry, active step, outcome, row version, and idempotency | High | Critical |
| SLA | Local date arithmetic | Application SLA calculator using a `BusinessCalendarRepository`; worker schedules warnings, pauses, resumes, and breaches | High | Critical |
| Notifications | Local records/placeholders | Outbox-driven `NotificationProvider`; SMTP is default, Graph/Teams/Power Automate are optional adapters | Medium | High |
| Email intake | Configuration without durable processor | `EmailIntakeProvider` plus worker-managed message ledger, deduplication, correlation, retry, and dead-letter handling | High | Critical |
| Webhooks | Placeholder | Outbox-driven webhook adapter with allowlists, signatures, redaction, timeout, retry, and dead-letter state | High | Critical |
| Search and pagination | Browser filtering of loaded datasets | Secured query services and `SearchProvider`; relational search first, external index only when scale requires it | High | Critical |
| Reporting | Browser aggregation | Application reporting queries over secured read models; aggregation happens after row- and field-policy predicates | Very high | Critical |

### Files and exports

| Component | Current implementation | Production implementation | Migration complexity | Risk level |
|---|---|---|---|---|
| Attachments | Metadata/UI state without durable binaries | `FileStore` port; recommended S3-compatible object storage or protected filesystem outside the web root; relational metadata remains authoritative | High | Critical |
| Upload | Browser selection and checks | API authorizes upload and issues an opaque upload session; content enters quarantine | High | Critical |
| Scanning | Scan state without scanner | `MalwareScanner` port implemented by ClamAV or another scanner; only clean content is promoted | Medium | Critical |
| Download | No production secure delivery | API reauthorizes each download and streams content or returns a short-lived provider URL | High | Critical |
| Retention | Local metadata behavior | Application retention policy plus worker and file-store lifecycle operations; every deletion is audited | High | High |
| Exports | Local/incomplete | Secured reporting export job writes to `FileStore`; worker produces expiring artifacts and audits creation/download | Medium | Critical |

## `/` Services Marketplace target architecture

Keep the current route and visual experience. Replace its direct data access with application queries:

- `GetMarketplaceQuery` returns only published and audience-authorized service summaries.
- `SearchMarketplaceQuery` applies authorization before search and pagination.
- `GetRequesterActionCenterQuery` returns permitted request, approval, and task summaries.
- `GetMarketplaceRecommendationsQuery` uses deterministic, explainable metadata rules.
- `SetFavoriteServiceCommand` persists preferences through `UserPreferenceRepository`.
- Optional calendar and task widgets call connector ports independently and cannot block core data.
- `GetAccessContextQuery` returns server-evaluated capabilities such as access to Operations.

These contracts remain stable for in-memory, PostgreSQL, SQL Server, MySQL, Dataverse, or REST-backed providers.

## API and worker topology

### Self-hosted API

Expose versioned HTTP endpoints for queries and commands. The API is stateless and may run in the same VM initially, behind a reverse proxy with TLS. It owns authentication, authorization, validation, serialization, idempotency, transaction boundaries, and correlation IDs.

Commands include draft save, publication, request submission, comments, attachments, assignment, approval, task completion, transitions, closure, workflow repair, and export generation. Every state-changing command accepts an idempotency key and expected concurrency version.

### Self-hosted worker

A separate worker process polls or subscribes to durable job and outbox tables. It executes workflow continuations, timers, SLA events, reminders, notifications, email intake, webhooks, report exports, retention, and retries. Jobs use leases, attempts, next-attempt timestamps, deterministic idempotency keys, terminal failure state, and administrator replay.

A database outbox is the initial queue to minimize infrastructure. RabbitMQ, NATS, Kafka, Azure Service Bus, or another broker can later implement the same messaging ports.

## Relational model guidance

- Preserve current stable GUIDs and immutable historical version bindings.
- Use explicit foreign keys and provider-neutral migrations.
- Use JSON only for genuinely extensible structured values; keep queryable answer types in dedicated typed columns.
- Normalize multi-choice answers into an analysis table or read model while preserving the submitted structured snapshot.
- Add tenant/workspace predicates and indexes to every operational aggregate.
- Use unique constraints for stable field keys, published version numbers, request numbers, idempotency keys, and external message IDs.
- Use application-managed version columns for portable optimistic concurrency.
- Keep published metadata append-only; retirement changes routing, not historical records.
- Keep audit and workflow execution logs append-only.

## Migration roadmap

### Stage 0 — Architecture enforcement

Create solution boundaries and dependency rules. Domain and application projects must compile without importing React, generated hooks, database clients, Microsoft SDKs, or connector packages. Add architecture tests.

**Complexity:** Medium. **Risk if skipped:** Critical.

### Stage 1 — Stabilize application contracts

Define aggregate repositories, unit of work, identity, directory, file, notification, search, reporting, clock, ID, idempotency, outbox, and lock ports. Wrap current generated in-memory services with adapters. Preserve UI behavior.

**Complexity:** High. **Risk:** Critical.

### Stage 2 — Trusted self-hosted API

Move authorization, validation, publication, request submission, and transition use cases behind the API. Keep React checks for UX only. Start with `/` marketplace queries and request reads, then commands.

**Complexity:** Very high. **Risk:** Critical.

### Stage 3 — PostgreSQL provider

Implement schema migrations, repositories, transactions, indexes, optimistic concurrency, sequences, and audit/outbox persistence. Run contract tests against both in-memory and PostgreSQL providers.

**Complexity:** Very high. **Risk:** Critical.

### Stage 4 — Entra ID and directory adapters

Use standards-based OIDC authentication. Add Entra/Graph adapters for profile, manager, groups, and people search. Keep identity claims and directory data behind ports. Disable demo identity in production.

**Complexity:** High. **Risk:** Critical.

### Stage 5 — Durable request and metadata engines

Move drafts, immutable publication, typed submission, numbering, lifecycle, approvals, tasks, and audit into transactional application commands.

**Complexity:** Very high. **Risk:** Critical.

### Stage 6 — Durable workflow and SLA worker

Persist instances and steps. Add leases, retries, timers, dead-letter state, business calendars, notifications, and audited repair tools.

**Complexity:** Very high. **Risk:** Critical.

### Stage 7 — Secure files

Implement file-store and malware-scanner ports, quarantine, promotion, authorized download, retention, and exports. Use MinIO/S3-compatible storage or protected filesystem for the first self-hosted deployment.

**Complexity:** High. **Risk:** Critical.

### Stage 8 — Governed reporting and search

Create secured relational read models for request-level and typed-answer analysis. Apply authorization before aggregation, filtering, drill-through, caching, and export. Add dynamic reportable-field discovery.

**Complexity:** Very high. **Risk:** Critical.

### Stage 9 — Optional integration adapters

Add Microsoft Graph, SMTP, Teams, webhooks, REST, Dataverse, SharePoint, Power Automate, or Azure Functions only as replaceable adapters. No workflow or domain rule may exist only inside an external automation.

**Complexity:** Medium to high. **Risk:** High.

### Stage 10 — Controlled data migration

Classify seeds, preserve IDs, import configuration and approved history in dependency order, reconcile counts and checksums, shadow-read providers, cut over by workspace, and retain rollback. Do not rewrite historical answers or version bindings.

**Complexity:** Very high. **Risk:** Critical.

### Stage 11 — Production certification

Run provider contract tests, browser journeys, role and workspace isolation tests, field-security tests, concurrency and idempotency tests, workflow retry tests, attachment security tests, accessibility, load, backup/restore, disaster recovery, penetration testing, and observability validation.

**Complexity:** High. **Risk:** Critical.

## Release blockers

Production remains blocked until:

1. Protected reads and writes execute through a trusted self-hosted API.
2. A durable relational provider passes the same contract suite as the in-memory provider.
3. Demo identity cannot run in production.
4. OIDC token validation and local identity mapping are authoritative.
5. Authorization and field projection occur before data leaves the API.
6. Request numbering, submission, publication, and transitions are transactional, concurrent-safe, and idempotent.
7. Published metadata is immutable at the application and persistence boundaries.
8. Workflow, timers, SLA, notifications, email intake, and retries have a durable worker.
9. Attachments use protected storage, malware scanning, reauthorized download, and retention controls.
10. Reporting, search, caching, drill-through, and exports enforce row- and field-level policy.
11. Backup, restore, monitoring, security, accessibility, and end-to-end tests pass.

## Non-negotiable principles

- Business logic depends only on domain and application interfaces.
- The in-memory provider remains a fully tested first-class provider.
- Database and vendor SDK types never cross adapter boundaries.
- Switching providers does not change routes, use cases, permissions, or user experience.
- No browser decision is a security boundary.
- No external workflow product owns authoritative domain state.
- Historical requests and published versions are never rewritten to fit a new provider.
- Typed answers are never flattened into undifferentiated text.
- Optional Microsoft integrations remain adapters, not prerequisites.
- Production deployment must be possible on a VM with a relational database, protected file storage, an API, a worker, and OIDC authentication.
