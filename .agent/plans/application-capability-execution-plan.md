# Application capability execution plan

## Scope and constraints

This plan covers user-facing application capabilities only. It excludes persistence providers, hosting, deployment, infrastructure, Dataverse, SharePoint, Azure Functions, Power Automate, Graph integration, and file-storage architecture. Existing metadata entities, routes, authorization patterns, visual design, and request behavior remain intact.

The current `/` route is the requester-facing Services Marketplace. Administrators reach operational configuration through the permission-aware **Open Operations** action, then workspace settings. No administrator controls should be added directly to the requester homepage.

## Priority method

Each capability is scored from 1–5:

- **Business value:** contribution to launching and governing real services.
- **Technical dependency:** how strongly later capabilities depend on it; 5 means foundational.
- **User impact:** improvement visible to administrators, service owners, requesters, or fulfilment teams.

The recommended order favors capabilities that complete the service-authoring-to-request-submission path before advanced orchestration, analytics, or legacy conversion.

## Prioritized roadmap

| Rank | Capability | Business value | Technical dependency | User impact | Why now |
|---|---|---:|---:|---:|---|
| 1 | Shared Dynamic Form Renderer and rule runtime | 5 | 5 | 5 | Removes duplicated rendering, makes builder preview match requester behavior, and establishes one authoritative form experience for creation, drafts, review, historical display, and future migration previews. |
| 2 | Production-capable Service Builder authoring experience | 5 | 5 | 5 | Gives administrators the no-code controls needed to create usable services, but should be built on the shared renderer and rule runtime rather than another preview implementation. |
| 3 | Workflow Builder and version-bound workflow execution | 5 | 4 | 5 | Converts submitted requests into actionable work. It depends on stable field references, rules, lifecycle metadata, and publication validation completed in priorities 1–2. |
| 4 | Metadata-aware Reporting Engine and Field Catalog | 4 | 3 | 4 | Makes configured reportable fields useful without deployments. It depends on stable field metadata, typed answers, permissions, and published-version semantics. |
| 5 | Legacy Migration Assistant | 4 | 2 | 3 | Reduces adoption effort, but it becomes substantially safer and more useful after the target builder, renderer, workflow, and reporting capabilities are complete. |

## Recommended next capability

Complete the **Shared Dynamic Form Renderer and rule runtime** next.

This is the highest-leverage gap because the current requester form is embedded in `src/pages/service-catalog.tsx`, while `src/pages/service-builder.tsx` has a separate simplified preview. Completing a reusable renderer first creates one tested interpretation of fields, options, defaults, layouts, validation, conditional rules, read-only state, and historical metadata. It immediately improves requester reliability and prevents the Service Builder, workflow conditions, reporting field selection, and Migration Assistant preview from implementing competing metadata semantics.

## Execution sequence

### 1. Shared Dynamic Form Renderer and rule runtime

**Outcome:** One renderer and one metadata evaluation layer serve all application contexts.

- Extract form rendering from `src/pages/service-catalog.tsx` into reusable lower-case components and application services.
- Define explicit modes: requester create, requester draft edit, builder preview, approval review, read-only historical view, and print.
- Support all modeled field types with accessible controls and responsive one/two-column section layouts.
- Centralize typed value conversion, display formatting, defaults, inline errors, and validation summaries.
- Implement nested AND/OR rule evaluation and actions for visibility, required state, enabled state, values, option filtering, and messages.
- Add deterministic detection for broken references, conflicts, and circular dependencies.
- Define hidden-value behavior explicitly: clear by default unless metadata permits retention; excluded hidden values remain subject to application validation.
- Add draft state, save-and-continue, submit confirmation, and unsaved-change protection through existing request services.
- Reuse the renderer in the Service Builder preview and universal request details instead of maintaining page-specific field rendering.
- Keep existing routes and submission behavior backward-compatible throughout extraction.

**Completion gate:** The same published version produces materially identical labels, layout, options, rules, and validation in builder preview and requester creation; an old request still renders from its bound historical version.

### 2. Service Builder completion

**Outcome:** Administrators and service owners can configure a complete service without editing code.

- Evolve the existing `/w/:workspaceCode/settings/service-builder` route rather than creating another builder.
- Implement the requested three-panel workspace:
  - Left: sections and searchable field library.
  - Center: shared live renderer canvas.
  - Right: selected section/field properties, validation, and rules.
- Add drag-and-drop ordering with keyboard-accessible move alternatives.
- Add autosaved draft changes, undo/redo, duplicate field, clone service/version, archive, and version history.
- Complete field properties: defaults, searchable/reportable flags, sensitivity, custom errors, lookup configuration, and file restrictions metadata.
- Add tabs for Form, Rules, Audience, Lifecycle, Workflow, SLA, Permissions, Reporting, and Versions, reusing existing entities and pages within the builder shell.
- Add publication validation and an impact review showing added, removed, changed, and renamed stable fields plus references from rules, workflow, lifecycle, and reporting.
- Preserve immutable published versions; edits always fork a draft.

**Completion gate:** An authorized administrator can create, preview, validate, and publish a multi-section service with conditional fields without direct data manipulation or code changes.

### 3. Workflow Builder and execution completion

**Outcome:** Service owners can configure fulfilment behavior visually and requests execute the version bound at submission.

- Extend existing lifecycle, approval, task, automation, transition, and SLA structures; do not create a competing workflow engine.
- Introduce a version-bound workflow definition aggregate over existing specialized records.
- Build a visual canvas with nodes, connections, pan, zoom, drag/drop, configuration panels, and a synchronized accessible list representation.
- Support start, approval, task, condition, notification, status transition, field update, integration placeholder, parallel branch, join, wait/timer, and end.
- Reuse the shared rule expression model for workflow conditions.
- Validate unreachable/disconnected nodes, missing outcomes and assignees, invalid field references, uncontrolled loops, and paths without an end.
- Add preview and safe test mode using non-production request inputs.
- Ensure runtime actions shown in universal request details derive only from the active workflow step, lifecycle transition rules, and current user permissions.
- Preserve idempotency, safe retries, audit history, and historical workflow-version binding.

**Completion gate:** A published service can submit a request, create an approval and task, follow conditional outcomes, transition lifecycle status, and reach an end state using only versioned configuration.

### 4. Reporting Engine completion

**Outcome:** Reportable custom fields become governed analytics dimensions or measures without code deployment.

- Extend the existing `/reports`, `/reports/builder`, and `/reports/dashboards` routes rather than adding a separate reporting product.
- Build provider-neutral request-level and typed-answer reporting projections from existing application interfaces.
- Normalize multiple-choice answers for analysis while preserving distinct request counts.
- Add a Field Catalog with service, version, label, stable key, type, reportability, sensitivity, usage, and change impact.
- Populate Report Builder dimensions and valid operations dynamically from field metadata.
- Add service/date scope, filters, grouping, sorting, saved definitions, sharing, widget layout, and authorized drill-through.
- Enforce existing workspace, service, requester, fulfilment, and field-level policies before values enter tables, filters, aggregates, exports, or drill-through.
- Preserve old labels, options, and data types through version-aware reporting metadata.

**Completion gate:** Publishing a new reportable numeric or choice field makes it available to an authorized report author with type-valid aggregations and no source-code change.

### 5. Migration Assistant

**Outcome:** Administrators can safely assess and stage legacy services without changing production requests automatically.

- Add implementation mode only if no equivalent indicator exists after final inspection: Legacy, Metadata, or Migrated.
- Add one guarded Migration Assistant under workspace settings; do not expose technical mode labels to requesters.
- Inventory legacy service identity, forms, fields, rules, statuses, workflow, approvals, assignments, SLAs, permissions, audience, reporting, and integrations.
- Propose mappings to existing metadata structures and stable keys.
- Show confidence, unsupported logic, warnings, data risks, reporting impact, and dependencies.
- Create metadata drafts only after explicit administrator action; never rewrite historical requests.
- Reuse the shared renderer for preview and the workflow test mode for non-production validation.
- Support cutover for new submissions only, migration records, responsible administrator, publish date, and controlled rollback routing.

**Completion gate:** An administrator can analyze a legacy service, review mappings and risks, create and test a metadata draft, publish it for new submissions, and roll back routing without modifying old requests.

## Cross-capability safeguards

- Continue using stable field keys and immutable published versions.
- Keep authorization and validation in application services behind interfaces; UI checks are convenience only.
- Reuse existing entities, routes, audit records, and permission vocabulary.
- Do not add service-specific forms, request-detail pages, workflows, or report implementations.
- Keep `/` requester-focused; administrator entry remains permission-aware through Open Operations.
- Add deterministic tests with each capability for metadata evaluation, version preservation, permissions, and backward compatibility.
- Remove duplicated page-level rendering only after the shared replacement is proven equivalent.

## Suggested delivery increments

1. Renderer contracts, typed values, and read-only rendering.
2. Interactive controls, validation, and rule evaluator.
3. Draft editing, confirmation, and historical rendering adoption.
4. Three-panel Service Builder using the shared renderer.
5. Publication impact analysis and complete builder tabs.
6. Visual workflow authoring and version-bound execution.
7. Dynamic field reporting and Field Catalog.
8. Legacy analysis, mapping, test, cutover, and rollback.
