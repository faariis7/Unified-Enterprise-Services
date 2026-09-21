# Whole-system 50-action implementation backlog

## Objective

Move the unified enterprise services application from a strong in-memory demonstration into a controlled, production-ready service-management platform. The backlog covers requests, approvals, catalog, contracts, operations, governance, notifications, reporting, automation, and platform readiness.

## Legend

- **Now**: implementable with the current React application, generated in-memory entities, and existing Power Apps context.
- **Future — persistence**: requires Dataverse, SharePoint, or another durable supported data source.
- **Future — integration**: requires an external connector, service, or environment capability that is not currently available.
- **P0 / P1 / P2 / P3**: critical foundation / core workflow / operational maturity / optimization.

## Rollout phase 1 — Secure and testable foundation

### 1. Create a persona access matrix
- **Priority:** P0
- **Capability:** Now
- **Depends on:** None
- **Action:** Document every demo persona’s global roles, workspace memberships, service memberships, available modules, and permitted record actions in one testable matrix.
- **Acceptance criteria:** Every active demo persona has an expected workspace, role, service scope, navigation set, and explicit allowed/denied action list; duplicate or contradictory assignments are identified.

### 2. Add persona scenario verification
- **Priority:** P0
- **Capability:** Now
- **Depends on:** 1
- **Action:** Add repeatable persona test scenarios for requester, agent, approver, manager, workspace administrator, auditor, and global administrator paths.
- **Acceptance criteria:** Each persona can complete its expected scenarios and is blocked from at least one unauthorized direct route and record action; results are recorded by persona.

### 3. Harden direct-route authorization
- **Priority:** P0
- **Capability:** Now
- **Depends on:** 1
- **Action:** Audit every route and ensure the same authorization policy used by navigation is enforced on direct access.
- **Acceptance criteria:** Requests, approvals, reports, contracts, catalog administration, automation, readiness, and global/workspace settings reject unauthorized personas consistently without exposing record content.

### 4. Centralize action authorization
- **Priority:** P0
- **Capability:** Now
- **Depends on:** 1, 3
- **Action:** Ensure all buttons and mutations use centralized operation and record-scope authorization rather than page-specific role checks.
- **Acceptance criteria:** Create, update, assign, transition, resolve, reopen, approve, publish, export, and administer actions each map to a defined protected operation and fail closed.

### 5. Add workspace isolation regression checks
- **Priority:** P0
- **Capability:** Now
- **Depends on:** 3, 4
- **Action:** Verify workspace identity is applied before rendering or aggregating requests, approvals, targets, contracts, obligations, reports, and configuration.
- **Acceptance criteria:** Switching workspaces changes all scoped records; manually entering an ID from another workspace never displays or mutates that record.

### 6. Expand the readiness model
- **Priority:** P0
- **Capability:** Now
- **Depends on:** None
- **Action:** Replace the five broad readiness checks with domain checks for access, catalog, requests, approvals, targets, contracts, automation, notifications, files, audit, and deployment dependencies.
- **Acceptance criteria:** The readiness center displays domain scores, blocking versus advisory findings, owner, remediation action, and capability label for every check.

### 7. Add readiness evidence and status overrides
- **Priority:** P1
- **Capability:** Now
- **Depends on:** 6
- **Action:** Allow administrators to record evidence, owner, due date, and justified advisory overrides while preventing overrides of hard blockers.
- **Acceptance criteria:** Every manual status change records actor, timestamp, reason, and evidence; critical persistence and security blockers cannot be marked ready manually.

### 8. Create a configuration audit viewer
- **Priority:** P0
- **Capability:** Now
- **Depends on:** 4
- **Action:** Build a searchable view over existing configuration audit events with scope, actor, setting, old value, new value, and timestamp.
- **Acceptance criteria:** Workspace administrators see only their workspace events; global administrators can filter all scopes; every setting mutation appears in the viewer.

### 9. Validate governance settings
- **Priority:** P0
- **Capability:** Now
- **Depends on:** 6, 8
- **Action:** Add validation for workspace ownership, administrator coverage, active memberships, retention values, automation limits, and file-policy configuration.
- **Acceptance criteria:** Invalid or contradictory settings cannot be saved; readiness links directly to the setting causing each failure.

### 10. Establish deployment configuration separation
- **Priority:** P0
- **Capability:** Now
- **Depends on:** 6
- **Action:** Separate demo defaults, environment-specific settings, integration placeholders, and operational configuration in the administration experience.
- **Acceptance criteria:** Demo-only values are visibly labeled; placeholder URLs and credentials cannot be mistaken for production-ready configuration; environment dependencies appear in readiness.

## Rollout phase 2 — Request and fulfillment completion

### 11. Add request creation preflight
- **Priority:** P0
- **Capability:** Now
- **Depends on:** 4, 6
- **Action:** Validate workspace, service, catalog publication, audience, active default form, requester eligibility, and required approval plan immediately before request creation.
- **Acceptance criteria:** A request cannot be created from stale or incomplete catalog configuration; the user receives a specific remediation message.

### 12. Complete dynamic-field validation
- **Priority:** P0
- **Capability:** Now
- **Depends on:** 11
- **Action:** Enforce required, data type, option membership, multi-select cardinality, read-only, and conditional visibility rules on create and edit.
- **Acceptance criteria:** Invalid dynamic values are blocked before mutation; saved single- and multi-select values always correspond to configured options; hidden or read-only fields cannot be altered through the UI.

### 13. Add dependent dynamic-field rules
- **Priority:** P1
- **Capability:** Now
- **Depends on:** 12
- **Action:** Support conditional show, require, disable, and option-filter behavior based on other field values.
- **Acceptance criteria:** Rule outcomes update immediately without losing valid values; server-side mutation validation repeats the applicable rules.

### 14. Add request assignment controls
- **Priority:** P0
- **Capability:** Now
- **Depends on:** 4, 5
- **Action:** Provide inline assignment of group and assignee constrained to active service memberships.
- **Acceptance criteria:** Only authorized agents/managers can assign; invalid assignees are excluded; assignment changes create request history and update queue ownership.

### 15. Add lifecycle action controls
- **Priority:** P0
- **Capability:** Now
- **Depends on:** 4, 14
- **Action:** Present only valid lifecycle transitions with required reason, resolution, and completion checks.
- **Acceptance criteria:** Invalid transitions are unavailable and rejected if invoked indirectly; each successful transition records actor, source, prior state, new state, and reason.

### 16. Complete task and checklist management
- **Priority:** P1
- **Capability:** Now
- **Depends on:** 15
- **Action:** Allow authorized users to create, assign, reorder, complete, and reopen request tasks and checklist items.
- **Acceptance criteria:** Required incomplete work blocks resolution; task changes are audited; requester views expose only requester-safe task information.

### 17. Complete comments and worklog separation
- **Priority:** P0
- **Capability:** Now
- **Depends on:** 4, 5
- **Action:** Clearly separate public replies, internal notes, and worklogs with role-aware creation and visibility.
- **Acceptance criteria:** Requesters never receive internal content; agents can distinguish comment types before posting; all entries identify actor and timestamp.

### 18. Add attachment policy enforcement
- **Priority:** P1
- **Capability:** Now for metadata and policy UI; **Future — persistence/integration** for file content
- **Depends on:** 9, 17
- **Action:** Enforce allowed extensions, size limits, visibility, required metadata, and download authorization now; connect durable file storage later.
- **Acceptance criteria:** Current UI blocks prohibited metadata and unauthorized access; production readiness remains blocked until actual upload/download storage is configured and tested.

### 19. Complete resolution confirmation and reopen rules
- **Priority:** P1
- **Capability:** Now
- **Depends on:** 15, 16
- **Action:** Add requester confirmation, configurable reopen windows, mandatory reopen reason, and resolution feedback.
- **Acceptance criteria:** Eligible requesters can confirm or reopen only their own recently resolved requests; expired windows and closed requests are rejected.

### 20. Add request bulk operations
- **Priority:** P2
- **Capability:** Now
- **Depends on:** 4, 14, 15
- **Action:** Support permission-aware bulk assignment, priority change, and status transition for compatible selected requests.
- **Acceptance criteria:** Mixed or unauthorized selections disable incompatible actions; each record is validated independently and produces individual history.

## Rollout phase 3 — Approval and catalog maturity

### 21. Add approval definition administration
- **Priority:** P0
- **Capability:** Now
- **Depends on:** 4, 8
- **Action:** Build CRUD screens for reusable approval definitions, ordered stages, approver policies, and rules using existing entities.
- **Acceptance criteria:** Administrators can create draft definitions, configure sequential/parallel stages, validate approver resolution, and activate only complete definitions.

### 22. Complete approval-plan assignment
- **Priority:** P0
- **Capability:** Now
- **Depends on:** 21
- **Action:** Let catalog administrators attach, replace, deactivate, and inspect approval plans per catalog item.
- **Acceptance criteria:** An approval-required item cannot publish without one active valid plan; plan replacement preserves existing request approvals.

### 23. Add approval delegation management
- **Priority:** P1
- **Capability:** Now
- **Depends on:** 21
- **Action:** Provide delegation creation, date validation, acting-for visibility, and revocation.
- **Acceptance criteria:** Only active, non-expired delegation is considered; decisions store both decision maker and represented approver; delegation changes are audited.

### 24. Add approval expiry and escalation simulation
- **Priority:** P1
- **Capability:** Now for manual simulation; **Future — integration** for scheduled execution
- **Depends on:** 21, 23
- **Action:** Add a safe simulator that evaluates overdue approvals and previews expiry/escalation outcomes; connect scheduled processing later.
- **Acceptance criteria:** Simulation never mutates records without confirmation; confirmed in-memory actions create decisions/history; readiness marks unattended scheduling unavailable until a runtime scheduler exists.

### 25. Add approval queue ownership filters
- **Priority:** P1
- **Capability:** Now
- **Depends on:** 4, 23
- **Action:** Add My approvals, Delegated to me, Group approvals, Escalated, and Completed views.
- **Acceptance criteria:** Counts and records use the same authorization filter; a persona cannot expose another approver’s private assignment through filters.

### 26. Add catalog audience administration
- **Priority:** P0
- **Capability:** Now
- **Depends on:** 4, 8
- **Action:** Build item-level audience management for person, role, group, department, site, and workspace rules supported by existing entities.
- **Acceptance criteria:** Administrators can activate/deactivate audience rules; eligibility preview explains why a selected demo persona is included or excluded.

### 27. Add form assignment and version administration
- **Priority:** P0
- **Capability:** Now
- **Depends on:** 12, 26
- **Action:** Manage catalog-to-form assignments, active versions, effective dates, and the single default form.
- **Acceptance criteria:** Exactly one active default applies at a time; publishing is blocked for missing, retired, overlapping, or invalid assignments.

### 28. Add service readiness administration
- **Priority:** P0
- **Capability:** Now
- **Depends on:** 6, 26, 27
- **Action:** Expose service status, requester eligibility, memberships, targets, catalog dependencies, and readiness blockers in one service view.
- **Acceptance criteria:** Each service has an explainable readiness result and direct links to every incomplete dependency.

### 29. Add catalog item clone and retire safeguards
- **Priority:** P2
- **Capability:** Now
- **Depends on:** 22, 26, 27
- **Action:** Allow draft cloning and safe retirement with dependency impact preview.
- **Acceptance criteria:** Clones receive unique codes and remain draft; retirement does not alter existing requests and requires confirmation when active favorites or dependencies exist.

### 30. Add catalog publication history
- **Priority:** P1
- **Capability:** Now
- **Depends on:** 8, 22, 26, 27
- **Action:** Record and display catalog item creation, field edits, plan/form/audience changes, publication, retirement, and restoration.
- **Acceptance criteria:** Every catalog mutation appears chronologically with actor, changed values, and reason; history is workspace-scoped.

## Rollout phase 4 — Contracts and operational control

### 31. Add contract editing
- **Priority:** P0
- **Capability:** Now
- **Depends on:** 4, 5
- **Action:** Make contract metadata, dates, value, owner, vendor, agreement mode, lifecycle status, and renewal terms editable.
- **Acceptance criteria:** Date and lifecycle validation prevent invalid terms; edits are workspace-scoped and audited; existing obligations remain linked.

### 32. Add contract lifecycle actions
- **Priority:** P0
- **Capability:** Now
- **Depends on:** 31
- **Action:** Provide draft activation, expiring review, renewal, termination, expiration, and archive actions.
- **Acceptance criteria:** Only valid actions appear for each state; renewal creates or updates the appropriate term without destroying prior activity; reasons are mandatory for termination and archive.

### 33. Add contract obligation management
- **Priority:** P0
- **Capability:** Now
- **Depends on:** 31
- **Action:** Allow creation, assignment, due-date editing, completion, waiver, and reopening of obligations.
- **Acceptance criteria:** Obligation status and overdue state derive consistently; waiver requires a reason; all changes create contract activity.

### 34. Add vendor management
- **Priority:** P1
- **Capability:** Now
- **Depends on:** 5, 31
- **Action:** Build workspace-scoped vendor create/edit/status controls using the existing Vendor entity.
- **Acceptance criteria:** Contracts can select only active eligible vendors; deactivation warns about active contracts and does not orphan existing records.

### 35. Add contract document register
- **Priority:** P1
- **Capability:** Now for metadata; **Future — persistence/integration** for file content
- **Depends on:** 18, 31
- **Action:** Manage document metadata, type, version, visibility, and required-document checks; connect file storage later.
- **Acceptance criteria:** Metadata and authorization work in-memory; production readiness remains blocked until files can be uploaded, scanned, retained, and retrieved from durable storage.

### 36. Add renewal and obligation alerts
- **Priority:** P1
- **Capability:** Now for in-app calculations; **Future — integration** for outbound delivery/scheduling
- **Depends on:** 32, 33
- **Action:** Calculate upcoming renewals and due/overdue obligations and surface them on contracts and operations home.
- **Acceptance criteria:** Configurable warning windows produce deterministic in-app alerts; external delivery remains disabled until scheduling and notification integrations are configured.

### 37. Add contract approval linkage
- **Priority:** P1
- **Capability:** Now
- **Depends on:** 21, 32
- **Action:** Start and display generic approvals for activation, renewal, value change, or termination when policy requires.
- **Acceptance criteria:** Configured lifecycle actions pause until approvals complete; rejected approvals prevent the pending contract action and are retained in history.

### 38. Add contract activity timeline
- **Priority:** P1
- **Capability:** Now
- **Depends on:** 31, 32, 33, 35, 37
- **Action:** Display an immutable timeline for contract changes, lifecycle actions, obligations, documents, and approvals.
- **Acceptance criteria:** Timeline is chronological, filterable by activity type, and contains actor, source, timestamp, and relevant before/after details.

### 39. Add operations exception center
- **Priority:** P1
- **Capability:** Now
- **Depends on:** 14, 24, 28, 33, 36
- **Action:** Combine unassigned requests, breached targets, overdue approvals, unpublished catalog blockers, expiring contracts, and overdue obligations into one authorized view.
- **Acceptance criteria:** Every exception links to an actionable record; counts are derived from scoped entities; users see only exceptions they are permitted to address.

### 40. Add service-target policy administration
- **Priority:** P0
- **Capability:** Now
- **Depends on:** 8, 28
- **Action:** Manage target type, duration, warning threshold, pause rules, calendar, escalation behavior, and applicability.
- **Acceptance criteria:** Invalid policies cannot activate; request target calculations identify their source policy; policy edits do not silently rewrite completed historical measurements.

## Rollout phase 5 — Automation, notifications, reporting, and production dependencies

### 41. Add automation validation and activation gate
- **Priority:** P0
- **Capability:** Now
- **Depends on:** 8, 40
- **Action:** Validate trigger, condition fields/operators, action payloads, permissions, recursion limits, and dependencies before a rule can activate.
- **Acceptance criteria:** Incomplete or unsafe rules remain inactive with specific errors; every activation/deactivation is audited.

### 42. Add automation dry run and execution replay
- **Priority:** P1
- **Capability:** Now
- **Depends on:** 41
- **Action:** Preview matching records and ordered outcomes without mutation, then allow authorized replay of failed safe actions.
- **Acceptance criteria:** Dry runs are side-effect free; replay is blocked for non-idempotent or externally unavailable actions; execution logs preserve original and replay attempts.

### 43. Enable in-app notification delivery
- **Priority:** P1
- **Capability:** Now
- **Depends on:** 4, 9
- **Action:** Implement notification records, recipient scoping, read/unread state, deep links, preferences, and in-app delivery for request, approval, target, catalog, and contract events.
- **Acceptance criteria:** Users receive only authorized notifications; preferences are respected; read state and links function across demo personas.

### 44. Add notification template administration
- **Priority:** P1
- **Capability:** Now
- **Depends on:** 43
- **Action:** Manage templates by event and channel with required variables, preview, activation, and fallback text.
- **Acceptance criteria:** Invalid variables block activation; preview renders against sample records; template changes are audited and versioned logically.

### 45. Connect outbound notification channels
- **Priority:** P1
- **Capability:** **Future — integration**
- **Depends on:** 43, 44
- **Action:** Configure authorized email/Teams/SMS providers, sender identities, consent, retry policy, failure queue, and monitoring.
- **Acceptance criteria:** Each enabled channel passes a test delivery, records provider response and retry state, respects preferences, and exposes no secret in client code; readiness stays blocked until configured.

### 46. Enable scheduled background processing
- **Priority:** P0
- **Capability:** **Future — integration**
- **Depends on:** 24, 36, 41, 45
- **Action:** Add a trusted scheduler for approval expiry, escalations, service-target warnings, contract renewal alerts, obligation reminders, and scheduled automation rules.
- **Acceptance criteria:** Jobs are idempotent, workspace-aware, monitored, retryable, and auditable; missed runs can be recovered without duplicate actions.

### 47. Replace in-memory operational storage
- **Priority:** P0
- **Capability:** **Future — persistence**
- **Depends on:** 5, 8, 9
- **Action:** Map app-specific entities to durable Dataverse or supported SharePoint storage and regenerate the data layer without changing authorization semantics.
- **Acceptance criteria:** Data survives reloads and deployments; relationships, validation, concurrency, auditing, workspace filters, and all core CRUD flows pass migration testing; demo data is isolated from production.

### 48. Connect enterprise identity and directory
- **Priority:** P0
- **Capability:** **Future — integration**
- **Depends on:** 1, 4, 47
- **Action:** Replace demo-only identity resolution with Entra-backed people, groups, managers, and active employment status while retaining a controlled non-production demo mode.
- **Acceptance criteria:** Object IDs resolve uniquely; inactive users lose access; manager/group approval resolution works; persona switching is disabled in production and remains explicit in test environments.

### 49. Add operational dashboards and scheduled exports
- **Priority:** P2
- **Capability:** Now for dashboards/manual export; **Future — integration/persistence** for scheduled delivery and durable snapshots
- **Depends on:** 5, 39, 40, 47
- **Action:** Extend reports with catalog conversion, approval aging, assignment workload, contract exposure, automation outcomes, and readiness trends.
- **Acceptance criteria:** All metrics derive from authorized source records with drill-down; exports honor the same scope; scheduled delivery is enabled only after durable storage and outbound channels exist.

### 50. Execute production launch certification
- **Priority:** P0
- **Capability:** Now for checklist design; completion requires all applicable future dependencies
- **Depends on:** 2–49
- **Action:** Run a formal launch gate covering persona authorization, cross-workspace isolation, core workflows, data retention, files, jobs, notifications, recovery, monitoring, accessibility, and owner sign-off.
- **Acceptance criteria:** All P0/P1 hard blockers are complete; no critical readiness check is overridden; evidence is attached; rollback and support owners are named; production launch is approved by governance and service owners.

## Recommended sequencing

1. Complete actions **1–10** before expanding workflows; they create the authorization, audit, readiness, and configuration baseline.
2. Deliver **11–20** as the request-management release.
3. Deliver **21–30** as the approval and catalog-administration release.
4. Deliver **31–40** as the contracts and operations-control release, beginning with the currently viewed Contracts module.
5. Deliver **41–46** to make automation and notifications dependable.
6. Treat **47–48** as mandatory production blockers, then complete **49–50** for launch certification.

## Suggested first implementation slice

Start with **31, 32, 33, and 38** because the user is currently working in Contracts and these actions turn the existing contract register into a complete in-memory operational workflow. In parallel, schedule **1, 3, 4, 6, and 8** as cross-system safeguards that every later feature depends on.
