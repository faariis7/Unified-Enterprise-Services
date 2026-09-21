# Phase 0 — Metadata architecture and gap review

## Scope and method

This review covers the existing Unified Enterprise Service Management application only. It maps the current React application, generated data layer, workspace and authorization boundaries, catalog and request flows, lifecycle engines, reporting, integrations, reusable UI, and known readiness constraints. No metadata-engine implementation or application behavior was changed in this phase.

## Executive assessment

The application already contains a substantial metadata foundation. Forms, fields, options, presentation hints, visibility and validation rules, request-detail views/sections/actions, lifecycles, statuses, transitions, approvals, service targets, automation, modules, permissions, settings overrides, catalog assignments, and request field values are represented as shared entities. The safest path is therefore not a new engine or parallel schema. It is incremental expansion of the existing constrained runtimes, followed by administration extensions and migration of remaining hardcoded presentation and orchestration decisions.

The primary gap is execution consistency and breadth: metadata exists broadly, but pages and services do not always resolve and execute it through shared runtimes. Request-detail composition is already metadata-backed for allowlisted sections and actions, but its scope is narrow and permission-bearing definitions currently fail closed to fallback behavior. Other application behavior still depends on hardcoded route lists, role grants, status names, request tabs, field rendering choices, assignment defaults, and page-specific logic. Persistent storage and scheduled connector processes are also unresolved production dependencies.

## Existing architecture and technology

- Single Vite React 19 and TypeScript application under `apps/enterprise-service-management`.
- React Router provides static route registration and workspace-scoped routes.
- TanStack Query is used by generated entity hooks and application context; Jotai is available for client state.
- The application initializes through `@microsoft/power-apps/app` and resolves the signed-in user from Power Apps context.
- Tailwind CSS 4, shadcn/Radix primitives, Lucide icons, Recharts, Motion, React Hook Form, and Zod 4 form the UI stack.
- The AppGen-generated layer contains typed models, validators, CRUD services, and React Query hooks for the complete data model.
- The current generated operational source is in-memory. AppGen contains adapters for local, Dataverse, SharePoint, and M365/WorkIQ, but no durable database reference is configured in `power.config.json`.
- One Microsoft MCP Servers connection is configured for runtime M365 access. Current custom hooks use calendar and due-task capabilities.
- `AppShell`, route guards, `WorkspaceProvider`, and administration context provide the shared application frame and access boundaries.

## Navigation and page architecture

The root route is the requester Services Marketplace. Workspace routes are mounted below `/w/:workspaceCode` and protected by workspace, module, reporting, and administration guards. Implemented operational modules are Home, Requests, Approvals, Reports, Contracts, and Knowledge. Portal, catalog, lifecycle simulation, automation, readiness, catalog administration, email intake administration, and workspace/global administration have dedicated pages.

Technician and requester request details currently reuse `requester-request-detail.tsx` through a `mode="technician"` prop. A separate legacy `request-detail.tsx` remains in the repository and represents an architectural duplication risk. Static imports and route registration are intentional and should remain; metadata should control availability and composition inside registered route families rather than dynamically importing arbitrary components.

## Existing entities and relationships

The shared model is already normalized around Workspace and Request. Major domains include:

- **Identity and scope:** Person, Workspace, WorkspaceMembership, ServiceMembership, Role, MembershipRole, GlobalRoleAssignment, WorkspaceRoleAssignment, Permission, RolePermission, FieldPermission, ServicePermission.
- **Navigation, views, and configuration:** Module, WorkspaceModule, ViewDefinition, ViewSectionDefinition, ViewActionDefinition, GlobalSetting, WorkspaceSettingOverride, ServiceSettingOverride, CatalogItemSettingOverride, ConfigurationAuditEvent.
- **Service catalog:** ServiceCategory, Service, CatalogItem, CatalogItemAudience, CatalogItemFormAssignment, CatalogItemApprovalPlan, CatalogItemTaskTemplate.
- **Forms and fields:** FormDefinition, FormVersion, FormSection, FieldDefinition, FieldOption, FieldDefinitionPresentation, FieldDependency, FieldVisibilityRule, FieldValidationRule.
- **Requests:** Request, RequestFieldValue, RequestActivity, RequestAttachment, RequestTask, RequestChecklist, RequestChecklistItem, RequestApproval, RequestResolution, RequestRelationship, RequestWatcher, RequestTag, RequestReminder, RequestWorklog, RequestStatusHistory, RequestAssignmentHistory, RequestAuditEvent, RequestHistory, RequestFeedback, RequestNotification.
- **Lifecycle:** LifecycleDefinition, LifecycleStage, LifecycleStatus, StatusDefinition, StatusTransition, LifecycleTransitionRequiredField, TransitionPermission, TransitionValidation, RequestTransitionExecution.
- **Approvals:** ApprovalDefinition, ApprovalStage, ApprovalRule, ApprovalDelegation, ApprovalRuleEscalation, RequestApprovalRuntimeState, ApprovalDecision, RequestApprovalSchedule.
- **Service targets:** BusinessCalendar, BusinessHoliday, ServiceTargetPolicy, ServiceTargetRule, RequestServiceTarget, RequestServiceTargetTiming.
- **Automation:** AutomationRule, AutomationTrigger, AutomationCondition, AutomationAction, AutomationExecution, AutomationActionExecution, AutomationLog, AssignmentRule.
- **Knowledge, contracts, vendors, and email intake:** normalized workspace-owned entities support these implemented modules.

Most request child records carry both Request and Workspace references, preserving tenant-like workspace isolation. Request links requester, requested-for, creator, assignee, form version, optional lifecycle definition, source information, stage, service/catalog identifiers, and immutable request number.

## Workspace, department, and business-unit structure

Workspace is the primary isolation and configuration boundary. It contains identity, code, owner, default site/calendar/time zone, request numbering, portal and agent-workspace flags, and visual metadata. Membership grants workspace access and a workspace role. ServiceMembership independently grants operational access to specific services.

Department and site are currently codes on Person, Request, and authorization scope. There is no normalized Department, BusinessUnit, Site hierarchy, organizational parent-child graph, or effective-dating model in the generated entity list. Initial business areas are represented primarily as workspaces. This is sufficient for current workspace isolation but not for a general metadata-driven organization hierarchy.

## Service and service-catalog implementation

Service, ServiceCategory, CatalogItem, audience, form assignment, approval-plan assignment, task-template assignment, and setting override entities already exist. Catalog administration supports Draft, Published, and Retired lifecycle and validates audience, default form, and requester-eligible service before publication. The marketplace and service pages enforce workspace, audience, item status, portal availability, and requester eligibility.

Portal submission uses `CatalogSubmissionService`: it validates the published catalog and form version, authorizes request creation, creates the shared Request, stores dynamic field values, records submission activity, and selects a service-target policy. Current defaults such as medium impact/urgency, unspecified department, unassigned group, submitted stage, internal confidentiality, and portal source are still coded in the service rather than fully resolved from metadata.

## Request creation, storage, and details

All channels use or are designed to use the shared Request entity. Portal submission is operational. Email intake has configuration, message, link, and processing-event entities plus an administration monitor, but the scheduled mailbox processor remains external work.

Requester and technician details share the enhanced tabbed page and expose mode-specific capabilities. `useRequestDetailViewRuntime` already selects the highest-version active Request view for the Requester or Agent surface, resolves ordered allowlisted sections and actions, and falls back to a safe built-in composition. The page consumes action availability, while most section rendering and tab structure remain concentrated in the page. The runtime currently excludes definitions carrying `requiredPermission` instead of evaluating them, has no workspace/service/catalog targeting, and supports only six renderer keys and four handlers. The large page therefore remains the highest-risk area for metadata expansion.

`AuthorizedRequestService`, authorization filters, route checks, and record scopes protect shared requests. Request orchestration evaluates configured status transitions and required transition fields and prevents cross-workspace orchestration.

## Roles, permissions, and authorization

Identity is matched from Power Apps context to an active Person through object ID or principal name. Demo personas are enabled only when the directory consists of `example.com` users.

Authorization combines active workspace membership, service membership, operation grants, record ownership/requested-for/assignee/watcher/group scope, workspace boundary, service permission, field permission, lifecycle state, and environment. Guards protect global administration, workspace administration, reporting, modules, workspace routes, and requester access.

The data model contains Role, Permission, RolePermission, workspace/global role assignments, field permissions, service permissions, and transition permissions. However, `WorkspaceProvider` still contains a hardcoded workspace-role-to-operation grant map and hardcoded role labels. The richer role entities are not yet the sole runtime authority. This is a controlled-change area because replacing the fallback map without parity testing could remove access.

## Workflow, approval, tasks, lifecycle, SLA, and notifications

- Lifecycle metadata supports versioned definitions, stages, statuses, transitions, transition permissions, validations, and required fields.
- Request orchestration consumes active transitions and required fields, checks authorization, and blocks cross-workspace execution.
- Approval metadata supports reusable definitions, sequential or parallel stages, approver rules, delegation, escalation, runtime state, schedules, and immutable decisions.
- Catalog items can reference approval plans and task templates.
- Tasks, checklists, resolutions, worklogs, status/assignment history, and transition executions are normalized request children.
- Service targets support policies, matching rules, calendars, holidays, warning thresholds, pause timing, and request target snapshots.
- Automation supports metadata triggers, ordered conditions/actions, cooldowns, execution limits, chain-depth limits, idempotency, and logs.
- RequestNotification and RequestReminder entities exist, but durable outbound delivery and scheduled processing remain external dependencies.

Execution is partly implemented through separate libraries (`lifecycle-engine`, `approval-engine`, `service-target-engine`, `request-orchestration`) and page handlers. A future metadata runtime should coordinate these libraries rather than replace their entities.

## Reporting and dashboards

Workspace reporting derives volume, open/closed demand, aging, approval performance, target performance, and workload from permission-scoped operational records. Date and workspace filtering occur before aggregation; widgets drill into contributing records. Reporting totals are not persisted or hardcoded.

There is no general report-definition, metric-definition, dimension, dataset, dashboard-layout, widget, or saved-filter metadata domain. Current report keys and aggregation functions are TypeScript code. A metadata-driven reporting designer is therefore missing, while the secure data-scoping and calculation utilities are reusable foundations.

## Existing reusable UI and patterns

Reusable patterns include:

- AppShell, workspace selector, demo persona selector, route guards, administration access context, and workspace context.
- shadcn/Radix controls for cards, forms, tables, tabs, dialogs, popovers, calendars, selects, progress, charts, sidebars, sheets, empty states, and notifications.
- Setting value and structured setting fields for configuration inheritance and editing.
- Service target indicator and reporting chart/table patterns.
- Generated hooks, services, Zod validators, and model lookup-label maps.
- Catalog form rendering and request detail field/value display patterns that can be extracted into shared metadata renderers.
- The constrained request-detail view runtime, including allowlisted section/action keys, active-version selection, ordering, and safe fallback composition.

There is no platform-wide component registry for field, page, report, and workflow presentation. The existing request-detail registry is a reusable starting point, but page composition, section rendering, action authorization, labels, and most field presentation remain partly coded per page.

## APIs, integrations, and external dependencies

- AppGen services provide CRUD abstraction over the configured source and generated query hooks.
- Power Apps context supplies identity and hosting initialization.
- Microsoft MCP Servers is the only active connection reference. Existing hooks access M365 calendar and due tasks.
- Email intake persists configuration and processing contracts but requires a scheduled mailbox connector/processor.
- Durable attachment content, malware scanning, preview storage, bulk download, and durable contract documents remain external storage/security dependencies.
- Outbound email/Teams notification delivery and scheduled reminders/escalations require production workers or Power Automate/cloud flows.
- No custom server API, background worker, secret store, or durable database is configured in this repository.

## Mock data, hardcoded logic, and technical limitations

- The generated data source is in-memory; records do not provide production durability.
- Demo personas and sample records are intentionally supported.
- Workspace role grants, role labels, implemented/retired module code lists, route mappings, request-detail fallback tabs, report keys, terminal statuses, status-to-UI mappings, and several request defaults are hardcoded.
- Catalog submission computes target due time using elapsed minutes and does not yet fully apply business-calendar schedules in that service.
- Several engines evaluate metadata, but there is no single transactional command pipeline coordinating request creation, transition, approval, target, automation, audit, and notification side effects.
- Multi-record writes use client-side sequences and `Promise.all`; rollback and transactional guarantees depend on a future durable backend.
- The large requester/technician request-detail component concentrates many concerns and contains demo-oriented presentation fallbacks; direct replacement would be high risk.
- Request-detail view metadata exists, but is global by entity/surface rather than workspace-aware; permission-bearing definitions are ignored rather than authorized; configured sections do not yet independently own all page rendering.
- Both `request-detail.tsx` and the shared requester/technician detail page remain, creating duplicate implementation risk.
- Organization structure is code-based rather than normalized.
- Scheduled email intake, notifications, escalations, reminders, and target reevaluation are not hosted in the SPA.
- Metadata records do not define arbitrary page routes or executable code, which is a desirable security constraint and should remain.

## Metadata-driven requirement classification

| Requirement | Classification | Existing structures to reuse or extend | Gap / controlled action |
|---|---|---|---|
| Workspace-scoped metadata ownership | Already exists and can be reused | Workspace and WorkspaceId relationships | Enforce consistently in every resolver and cache key. |
| Metadata-driven module navigation | Exists but requires extension | Module, WorkspaceModule, module guards, AppShell | Remove hardcoded implemented-module allowlist only after route-capability parity; retain a safe registered route map. |
| Dynamic service catalog | Already exists and can be reused | Service, category, catalog item, audience and assignments | Consolidate effective configuration resolution and eliminate coded submission defaults. |
| Versioned dynamic forms | Exists but requires extension | FormDefinition, FormVersion, FormSection, FieldDefinition, options, presentation | Build one shared read/edit renderer and immutable published-version resolver; migrate page-specific rendering incrementally. |
| Field visibility and dependencies | Exists but requires extension | FieldVisibilityRule, FieldDependency | Centralize evaluation semantics, precedence, cycle detection, and test coverage. |
| Field validation | Exists but requires extension | FieldValidationRule and generated Zod validators | Compose metadata rules with entity validators; define server-side enforcement for production. |
| Field-level permissions | Exists but requires extension | FieldPermission and authorization library | Load effective role IDs/rules into runtime context; default behavior and deny precedence must be formalized. |
| Metadata-driven request page/section layout | Exists but requires extension | ViewDefinition, ViewSectionDefinition, ViewActionDefinition, `request-detail-view-runtime`, existing UI primitives | Preserve the allowlisted registry and safe fallback; add permission evaluation, workspace/context targeting, publication governance, and incremental ownership of section rendering. Do not permit arbitrary JSX, CSS, routes, or scripts. |
| Metadata-driven layout beyond request details | Missing and must be created | Existing request-detail runtime, FormSection, FieldDefinitionPresentation | Generalize the constrained registry pattern only for confirmed surfaces; avoid a universal arbitrary page builder. |
| Shared request entity and dynamic values | Already exists and can be reused | Request and RequestFieldValue | Preserve immutable workspace, number, form-version snapshot, and channel lineage. |
| Portal request creation | Already exists and can be reused | CatalogSubmissionService and catalog metadata | Refactor defaults into effective metadata only after regression tests. |
| Email request creation | Exists but requires extension | Email intake configuration/message/link/events and shared Request | Add scheduled processor, secure mailbox connection, parsing, sender matching, attachment storage, retries, and monitoring. |
| Request details composition | Exists but requires extension | Shared requester/technician page, view-definition entities, request-detail runtime, request child entities | Expand the existing registry one section/action at a time; evaluate permissions rather than ignoring configured requirements; do not rewrite the page. |
| Lifecycle/status/transition metadata | Already exists and can be reused | Lifecycle and transition entities, orchestration libraries | Consolidate execution and ensure all status changes use the same command path. |
| Approval orchestration | Already exists and can be reused | Approval definitions/stages/rules/runtime/decisions | Complete scheduled delegation, expiration, and escalation worker integration. |
| Fulfillment task templates | Exists but requires extension | CatalogItemTaskTemplate, RequestTask, checklists | Standardize instantiation, dependency/order semantics, and requester visibility metadata. |
| SLA/service targets | Exists but requires extension | Policies, rules, calendars, timing and request targets | Centralize business-time calculation and add scheduled reevaluation/delivery. |
| Automation rules | Exists but requires extension | Automation entities and planning utilities | Add a durable event dispatcher/worker and transactional idempotency. |
| Notifications and reminders | Exists but requires extension | RequestNotification and RequestReminder | Add template/channel metadata if absent and production delivery workers. |
| Role and operation permission metadata | Exists but requires extension | Role, Permission, RolePermission, assignments | Controlled migration from hardcoded `roleGrants`; retain fallback until parity and deny tests pass. |
| Department/business-unit hierarchy | Missing and must be created | Person/Request department and site codes | Add normalized, effective-dated organizational units only if cross-workspace hierarchy is a confirmed requirement; migrate codes safely. |
| Settings inheritance | Already exists and can be reused | Global/workspace/service/catalog overrides and audit events | Extract a shared effective-setting resolver for every consumer. |
| Metadata administration | Exists but requires extension | Catalog, workspace, lifecycle, automation pages and generated services | Add focused editors for forms, fields, views, permissions, and publication governance; avoid a monolithic designer. |
| Metadata publication/versioning | Exists but requires extension | Draft/Published/Retired states and form versions | Generalize draft, validation, publish, immutable version, rollback, and dependency checks to other definitions. |
| Configuration audit | Already exists and can be reused | ConfigurationAuditEvent and RequestHistory | Ensure every metadata mutation and publish action writes immutable before/after audit. |
| Metadata-driven reports/dashboards | Missing and must be created | Secure reporting filters, pure aggregators, chart/table UI | Add constrained report/metric/widget definitions after operational runtime is stable. |
| Runtime APIs | Exists but requires extension | Generated services/hooks and authorized request service | Add an application command/query facade; do not expose raw CRUD as the only business API. |
| Transactional persistence | Conflicts with current architecture and requires a controlled change | Generated AppGen data abstraction | Move from in-memory to durable Dataverse or another supported store, regenerate layer, and validate relational/transaction behavior. |
| Scheduled/background execution | Conflicts with current SPA architecture and requires a controlled change | Email, automation, target, reminder metadata | Host workers in Power Automate, cloud flows, or supported backend services; keep SPA as administration/operations client. |
| Durable file management | Conflicts with current architecture and requires a controlled change | RequestAttachment and ContractDocument metadata | Introduce approved object/document storage, malware scanning, authorization, retention, and signed access. |
| Arbitrary metadata-defined code/routes | Conflicts with security architecture and should not be introduced | Static route registry, component library, guards | Use allowlisted component/action/route keys only; never execute stored scripts or import arbitrary modules. |

## Safest incremental implementation approach

### 1. Establish contracts without changing behavior

Define a documented effective-metadata contract for workspace, service, catalog item, form version, role, lifecycle, and settings precedence. Add read-only resolver functions around current entities. Existing pages continue to work unchanged while resolver outputs are compared with current behavior.

### 2. Extend the existing constrained runtime registry

Reuse `request-detail-view-runtime.ts` and its allowlisted key model rather than creating a parallel registry. Add explicit authorization evaluation for `requiredPermission`, workspace/context targeting where justified, diagnostics for invalid or shadowed definitions, and publication checks. Generalize the same static-import pattern to fields, validators, and additional approved surfaces only when a concrete page adopts it. Unknown keys must continue to fail closed; metadata must never execute arbitrary content.

### 3. Consolidate dynamic form execution

Extract current catalog form behavior into shared metadata evaluators and renderer components. Reuse FormDefinition, FormVersion, FormSection, FieldDefinition, options, dependencies, visibility, validation, presentation, and permissions. Begin with portal create, then technician edit/read, then requester read-only views. Preserve stored RequestFieldValue and form-version snapshots.

### 4. Introduce a request command facade

Wrap existing AuthorizedRequestService, catalog submission, lifecycle, approvals, targets, automation, history, and notifications behind explicit commands such as create, transition, assign, reply, note, resolve, cancel, and reopen. Initially delegate to current implementations. This provides one enforcement and side-effect boundary without replacing proven engines.

### 5. Expand request-page composition incrementally

Do not rewrite the shared detail page. Use the existing ViewDefinition, ViewSectionDefinition, ViewActionDefinition, and `useRequestDetailViewRuntime` path, then migrate one low-risk section at a time so configured sections own their rendering rather than only influencing tabs/actions. Keep mode-specific authorization and requester-safe visibility checks in code. Actions must require both metadata visibility and authorization permission.

### 6. Migrate authorization carefully

Load RolePermission, assignments, FieldPermission, ServicePermission, and TransitionPermission into the authorization context. Run existing authorization test cases plus a generated parity matrix against hardcoded role grants. Keep the current role map as a temporary fallback until all active roles have explicit metadata and deny cases pass. Then remove fallback through a separate controlled release.

### 7. Generalize publication and governance

Reuse catalog/form draft and publication patterns for lifecycle, view, rule, and permission metadata. Publication should validate references, cycles, required defaults, unsupported component keys, permission coverage, and active workspace ownership. Published versions become immutable; new changes create a version. Audit every change and publish/rollback operation.

### 8. Add missing metadata only when justified

Do not create replacement view/section/action definitions: they already exist. Extend them only where the current entity/surface model cannot safely express required workspace or context targeting. Add normalized organizational units only after confirming that department and business-unit hierarchy must drive access or routing. Add report and dashboard metadata after operational metadata execution is stable. Avoid parallel request, service, role, workflow, field, or view entities.

### 9. Resolve infrastructure blockers before production migration

Configure durable storage and regenerate the data layer; validate lookup behavior, concurrency, and transactional command semantics. Implement durable attachment/document storage. Host scheduled email intake, notification, escalation, reminder, target, and automation processors outside the SPA with idempotency and monitoring.

### 10. Release by vertical slices

Recommended order:

1. Read-only effective-metadata and request-view diagnostics.
2. Harden the existing request-detail runtime with permission evaluation and configuration diagnostics.
3. Shared form renderer on one catalog item.
4. Metadata-backed create validation and field permissions.
5. One lifecycle transition through the command facade.
6. One approval/task plan instantiation path.
7. One request-detail section fully owned by the existing composition runtime.
8. Role-permission parity migration.
9. Durable storage and worker integrations.
10. Broader administration editors and report metadata.

Each slice should retain a rollback path, compare old/new outputs, preserve identifiers, and pass workspace-isolation, requester-data-leakage, lifecycle, and authorization regression tests.

## Structures to reuse, extend, or migrate

### Reuse unchanged

- Workspace and WorkspaceId isolation pattern.
- Shared Request and request child entities.
- Service, catalog, form, lifecycle, approval, service-target, automation, permission, settings, and request-view entities.
- Generated models, validators, services, and hooks.
- AppShell, route guards, workspace context, authorized request filtering, and existing UI primitives.
- The request-detail view runtime's static allowlist, version selection, ordering, and safe fallback behavior.
- RequestHistory and ConfigurationAuditEvent as immutable audit records.

### Extend in place

- Form and field runtime evaluation.
- Catalog effective configuration and submission defaults.
- Authorization context loading from role/permission entities.
- Lifecycle/approval/target/automation command coordination.
- Existing administration pages with focused metadata editors.
- Email intake with its scheduled processor.
- Existing request-detail view definitions and runtime with permission evaluation, context targeting, diagnostics, and incremental section rendering.

### Create only where no suitable structure exists

- A shared effective-metadata resolver and diagnostics output.
- An application command/query facade over generated CRUD services.
- Constrained metadata for additional page surfaces only when the existing request-view model cannot be safely extended.
- Optional normalized organization hierarchy, only if confirmed.
- Report/dashboard metadata, only after core runtime stabilization.

### Controlled migrations

- In-memory storage to durable production storage.
- Hardcoded role grants to metadata-derived grants.
- Page-specific form logic to shared renderers and remaining request-detail rendering to the existing view runtime.
- Browser-only/synchronous side effects to durable background workers.
- Metadata-only file records to secure durable content storage.

## Phase 0 conclusion

The platform should evolve by activating and unifying metadata it already owns, not by introducing a competing platform layer. The existing entities are broad enough to support most of the desired capability, including a first constrained request-detail composition runtime. The next phase should begin with read-only effective-metadata diagnostics and hardening that runtime's permission and targeting behavior, followed by a shared form-rendering vertical slice and a command facade. No metadata engine, schema migration, route redesign, or application behavior change was performed during this review.
