# Complete Facility operations and administration

## Goal

Finish the existing `/w/facility` operations experience without changing the shared multi-workspace architecture, duplicating entities, or replacing current engines.

## Scope

- Replace registered placeholder destinations with permission-protected operational or administration experiences backed by existing shared entities.
- Turn Operations Home into a live workspace summary derived from authorized Facility records.
- Complete Automation Engine authoring for triggers, ordered conditions, ordered actions, safety limits, activation, and execution review.
- Add validated structured editing for JSON-valued global defaults and workspace overrides.
- Preserve the requester marketplace, shared Request engine, existing routes, workspace selector behavior, permissions, and current data model.
- Keep durable production storage out of this phase and retain it as an explicit deployment prerequisite.

## Operations Home

- Show live Facility request demand, status distribution, aging, pending approvals, service-target warnings or breaches, workload, and recent operational activity.
- Derive every value from records the signed-in user is authorized to read in the active workspace and services.
- Provide links and drill-downs into existing Requests, Approvals, Reports, Knowledge, and administration routes.
- Render useful empty, loading, and denied states without seeded counters or placeholder operational records.

## Enabled module completion

- Route each configured module code to an existing full page where one already exists instead of the foundation placeholder.
- Requests: retain the service-authorized queue and five-tab request detail experience.
- Catalog: provide workspace-administrator management of services, categories, catalog items, audiences, form assignments, task templates, approval plans, and setting overrides using existing entities.
- Knowledge: retain article/category/version/feedback workflows and add complete category and publication administration where currently missing.
- Approvals: retain the runtime queue and add administration for definitions, stages, rules, escalation, and delegation using the existing Approval Engine entities.
- Reports: retain live permission-scoped reporting and drill-down behavior.
- Settings: expose comprehensive workspace configuration sections rather than static section labels.
- Lifecycle administration: manage definitions, stages, statuses, transitions, permissions, required fields, and simulation using existing lifecycle entities.
- Service targets: manage policies and matching rules using existing calendars and target entities.
- Membership and assignment: manage workspace members, service memberships, assignment rules, service owners/managers/agents, and authorized assignment choices.
- Forms: manage definitions, versions, sections, fields, options, dependencies, visibility, validation, presentation, and field permissions using existing dynamic-form entities.
- Workspace modules: manage enabled state, labels, ordering, and configuration status while preserving permission-driven navigation.
- Notifications and operational configuration areas: provide editable administration only where corresponding existing entities and settings already exist; do not invent duplicate models.
- Any enabled module without a dedicated engine page will use a reusable entity administration pattern with workspace scoping, search, filtering, create/edit validation, safe deletion or deactivation, and audit feedback.

## Automation Engine

- Create a rule and its initial trigger in one completed workflow rather than instructing users to configure records elsewhere.
- Support trigger creation and editing for all existing trigger types.
- Support ordered AND/OR condition groups with field, operator, comparison value, activation, reordering, editing, and removal.
- Support ordered actions for assignment, field update, status change, task creation, approval start, notification, comment, webhook, target, and escalation, showing only fields relevant to the chosen action.
- Allow rule scope, run-as identity, order, stop-processing, cooldown, maximum executions, and chain depth to be configured.
- Validate incomplete or incompatible rules before activation.
- Preserve loop prevention, idempotency, workspace isolation, execution limits, immutable logs, and existing orchestration behavior.
- Expand policy scenarios for condition evaluation, action ordering, skipped rules, duplicate action prevention, depth limits, execution limits, and cross-workspace rejection.

## Structured settings

- Add a structured JSON editor component selected by setting key/schema rather than a raw unrestricted text area.
- Provide typed controls for known JSON structures, a formatted preview, parse/schema validation, reset, and clear error messages.
- Enable audited saves for authorized global defaults and workspace overrides.
- Preserve inheritance, effective-source display, and reset-to-global behavior.
- Keep unknown JSON setting schemas read-only with an explicit unsupported-schema message rather than allowing arbitrary payloads.

## Security and validation

- Enforce active workspace, module, administration, and entity permissions on navigation, direct routes, reads, writes, and destructive actions.
- Scope every workspace-owned query and mutation to Facility while `/w/facility` is active; preserve service-level request visibility and assignment constraints.
- Ensure global-only records remain behind Global Administration and cannot be changed from Workspace Administration.
- Validate required fields, lookups, enum values, uniqueness where applicable, lifecycle consistency, approval ordering, target-rule completeness, and automation activation readiness.
- Record configuration changes through existing audit entities where supported.
- Verify responsive tables/forms/dialogs and keyboard, label, focus, contrast, loading, empty, and error accessibility.
- Run TypeScript, lint, production build, project validation, and AppGen SDK validation; fix all reported errors.

## Documentation and deployment gap

- Update the project overview to describe completed operational and administration capabilities.
- Update the production-readiness report with security, route, engine, accessibility, responsive, and validation outcomes.
- Continue to identify in-memory persistence as the remaining production deployment gap; do not introduce a new storage architecture in this phase.

## Expected changed areas

- Workspace module routing and route guards.
- Operations Home and reusable live summary/drill-down components.
- Workspace administration and module-specific administration pages/components.
- Automation Engine UI, orchestration condition evaluation, and policy scenarios.
- Global/workspace setting controls and structured JSON editors.
- Existing authorization/scoping helpers where stricter administration checks are required.
- Project overview and production-readiness report.

## Data model impact

- No new entities are planned.
- Reuse existing workspace, module, request, catalog, form, lifecycle, approval, service-target, automation, knowledge, membership, assignment, setting, notification, calendar, and audit entities.
- If implementation reveals a missing field required for an existing entity workflow, preserve entity IDs and evolve only that entity through the supported data-model workflow; do not create duplicates.
