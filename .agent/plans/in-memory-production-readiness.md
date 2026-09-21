# In-memory production-readiness pass

## Goal

Complete the app capabilities that can operate with the existing in-memory entities, while clearly isolating unavailable production databases, directories, file stores, and external integrations as deployment prerequisites.

## Scope decisions

- Retain in-memory storage and prominently identify persistence as an external prerequisite.
- Retain demo personas and provide an explicit testing persona switcher for requester, agent, approver, auditor, workspace administrator, and global administrator views.
- Build usable configuration screens only for core modules already backed by existing entities.
- Keep unsupported specialist modules hidden or marked unavailable rather than presenting generic placeholder workflows.
- Preserve the current requester marketplace, workspace routing, five-tab request detail contract, authorization boundaries, and existing Microsoft 365 behavior.
- Do not add or simulate unavailable databases, SharePoint lists, file storage, directory synchronization, email/SMS delivery, webhooks, or new external integrations.

## User-facing changes

- **Demo persona switcher:** Let testers select a seeded persona and clearly show its effective role, workspaces, services, and permissions.
- **Workspace settings home:** Replace capability-only cards with direct access to working configuration areas and visible readiness state.
- **Catalog configuration:** Manage existing services, categories, catalog items, audiences, default form assignments, approval plans, and publication readiness.
- **Forms configuration:** Manage existing form definitions, versions, sections, fields, options, dependencies, validation, visibility, and permissions.
- **Lifecycle configuration:** Manage existing definitions, stages, statuses, transitions, required fields, permissions, validations, and use the existing simulator.
- **Approval configuration:** Manage existing approval definitions, stages, rules, delegations, expiration, and escalation configuration.
- **Service-target configuration:** Manage existing policies, rules, business calendars, holidays, thresholds, pause behavior, and escalation settings.
- **Membership configuration:** Manage existing workspace and service memberships with role, active state, validity, and default-workspace visibility.
- **Module configuration:** Manage existing workspace-module enablement, labels, order, and configuration status; only modules with implemented routes may be enabled.
- **Notification settings:** Configure in-app notification preferences and template/rule readiness using existing entities; external delivery channels remain visibly unavailable until connected.
- **Governance settings:** Surface role assignments, permission coverage, audit events, workspace ownership, retention-related settings, and unresolved configuration risks.
- **Readiness checks:** Add an administrator checklist covering identity mapping, memberships, catalog publication, forms, approvals, targets, modules, notifications, sample-data cleanup, and external prerequisites.
- **Global administration:** Add platform-level links and summaries for governance, notification defaults, demo identity status, configuration audit, and readiness.
- **Empty and blocked states:** Explain why a service, module, action, or configuration area is unavailable and identify the exact missing internal configuration.

## Configuration rules

- A requester service is ready only when its workspace and service are active, the item is published and requester eligible, an eligible audience exists, and an active default form assignment exists.
- An operational module is ready only when its global definition is active, its workspace record is enabled and configured, required permission is granted, and a dedicated route exists.
- Demo personas must use seeded records and never imply connection to a real employee directory.
- Existing authorization checks and workspace scoping remain mandatory for reads, edits, routes, and destructive actions.
- Every supported configuration mutation continues to create a configuration audit event.
- External prerequisites are informational and cannot be marked complete from inside the app unless a corresponding connection exists.

## Existing entities used

- Workspace
- Person
- Workspace Membership
- Service Membership
- Role
- Permission
- Global Role Assignment
- Workspace Role Assignment
- Service Category
- Service
- Catalog Item
- Catalog Item Audience
- Catalog Item Form Assignment
- Catalog Item Approval Plan
- Form Definition
- Form Version
- Form Section
- Field Definition
- Field Option
- Field Dependency
- Field Validation Rule
- Field Visibility Rule
- Field Permission
- Lifecycle Definition
- Lifecycle Stage
- Lifecycle Status
- Status Transition
- Lifecycle Transition Required Field
- Transition Permission
- Transition Validation
- Approval Definition
- Approval Stage
- Approval Rule
- Approval Delegation
- Approval Rule Escalation
- Service Target Policy
- Service Target Rule
- Business Calendar
- Business Holiday
- Module
- Workspace Module
- Global Setting
- Workspace Setting Override
- Request Notification
- Configuration Audit Event

## Validation and acceptance

- Every new settings screen is reachable only through the correct global or workspace administration guard.
- Demo persona switching updates visible permissions, workspace access, service access, and navigation without claiming real identity synchronization.
- Core module editors read and mutate only existing in-memory entities and show success or failure feedback.
- Unsupported modules cannot be enabled into dead-end routes.
- The readiness view distinguishes internal configuration gaps from unavailable external prerequisites.
- Catalog readiness accurately explains hidden services and disabled request actions.
- Notification settings never claim email, SMS, or webhook delivery without an available integration.
- Existing requester, agent, approval, knowledge, reporting, contracts, and request-detail flows remain intact.
- The complete project passes TypeScript, lint, project-schema, and AppGen SDK validation.
