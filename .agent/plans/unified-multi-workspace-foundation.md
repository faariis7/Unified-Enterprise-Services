# Unified Multi-Workspace ESM Foundation

## Current assessment

- **Repository state:** No application source exists. The checkout contains Git metadata, empty `apps/` and `docs/`, this assessment plan, and `project.json`; the latter two are planning metadata, not an implemented application.
- **Source provenance:** The local `main` branch has an empty initial commit followed by planning metadata only; no remotes, tags, submodules, alternate worktrees, other refs, or recoverable application objects were found.
- **Assessment scope:** Every “none found” statement below means none found in this checkout; it does not prove that a missing historical application had none.
- **Current routes:** None; no router, pages, entry point, route manifest, redirects, API routes, or framework configuration exist.
- **Current entities and relationships:** No implemented application data model, schema, migrations, generated clients, API contracts, or relationships exist.
- **Current data access:** None; no query hooks, services, repositories, connectors, API clients, exports, background jobs, or caches exist.
- **Reusable or duplicated components:** None; no UI components, duplicated shells, or duplicated navigation exist.
- **Hardcoded sample data:** None outside architectural workspace names in this plan.
- **Hardcoded IT-specific behavior:** None implemented; Information Technology appears only as one configured target workspace.
- **Duplicate Ticket and Request entities:** None; neither entity is implemented.
- **Existing permissions:** None; no authentication, roles, policies, guards, record checks, or operation-level enforcement exist.
- **Browser persistence:** None; no local storage, session storage, IndexedDB, cookies, URL-state persistence, persisted query cache, or service worker exists.
- **Existing visual system:** The blue-teal design is not present and cannot yet be compared or preserved directly.
- **Request tabs:** No request view exists against which to verify the required five-tab contract.

## Architectural target

- Build one application serving all workspaces.
- Use one canonical shared Request entity rather than department-specific request or ticket tables.
- Establish these initial workspaces: Information Technology, Corporate Communications, Facility Management, Support Services, Rawabi Travel & Tourism, Government Affairs, and RVOS Support.
- Require WorkspaceId on every workspace-owned operational record.
- Maintain one shared people directory across all workspaces.
- Support global settings with workspace-specific overrides.
- Drive navigation from workspace and module configuration.
- Enforce permissions in every protected read, create, update, delete, transition, assignment, and administrative operation.
- Treat hidden or disabled controls as presentation only, never as authorization.
- Keep operational records and sample data out of page components.
- Preserve exactly five request tabs in this order: Activity, Details, Work, Resolution, History.
- Make Problems, Changes, Assets, and other specialist modules optional per workspace.
- Preserve the current blue-teal direction once the actual source or design tokens are available.
- Do not add new feature screens during the foundation phase.

## Migration mapping

- **Request/Ticket models:** Consolidate any restored Ticket and Request variants into one shared Request entity; retain compatibility mappings for existing IDs, statuses, links, and persisted references.
- **Department applications:** Convert any restored department-specific applications or shells into workspace configuration within the single application.
- **Department tables:** Map department-specific operational records to shared entities with WorkspaceId rather than retaining parallel schemas.
- **Navigation:** Replace duplicated or hardcoded navigation with one configuration-driven shell filtered by workspace, enabled modules, and permissions.
- **People:** Replace copied departmental user lists with one shared people directory and workspace membership/role assignments.
- **Settings:** Split restored settings into global defaults and workspace overrides with explicit precedence.
- **Permissions:** Replace UI-only gating with policy checks at both interaction and data-operation boundaries.
- **Sample data:** Move restored operational fixtures out of pages into the approved data source or dedicated seed layer.
- **Persistence:** Version and migrate restored browser keys rather than silently discarding saved workspace, filters, or drafts.
- **Request detail:** Refactor any restored request detail layouts to the exact five-tab contract without adding specialist tabs.
- **Specialist modules:** Convert Problems, Changes, Assets, and similar areas into workspace-enabled capabilities rather than universal features.

## Component disposition

- **Reuse:** No components are currently available; reassess after the missing source is restored.
- **Refactor:** Expected candidates include the application shell, navigation, request detail, permission-aware actions, workspace selector, and settings resolution.
- **Move:** Expected candidates include page-level fixtures, navigation definitions, permission rules, and operational constants into shared configuration/domain layers.
- **Replace:** Expected candidates include duplicated department shells, department-specific request models, and UI-only permission checks.
- **Remove:** Expected candidates include duplicate Ticket/Request definitions, duplicate navigation, and department-specific application boundaries after compatibility migration.
- **Preserve:** Working routes, behavior, blue-teal semantic tokens, and the exact request-tab experience must be preserved once their source is available.

## Affected files

No existing application files can be named because the checkout is empty. The foundation is expected to affect or introduce:

- Project and single-app metadata.
- Application routing and the single shared shell.
- Semantic blue-teal theme tokens.
- Workspace, Request, people-directory, settings, module-configuration, membership, role, and permission domain definitions.
- Shared data-access services and query hooks.
- Workspace context and configuration-driven navigation.
- Permission policy and protected-operation utilities.
- Request detail tab configuration.
- Browser-persistence versioning and migration utilities, if persistence is restored.
- Foundation tests for isolation, authorization, settings precedence, navigation, and compatibility.

## Foundation checklist

- [ ] Verify the intended source repository, branch, archive, or deployment artifact; do not treat the empty initial commit as the historical application.
- [ ] Record source provenance: repository URL, branch, commit SHA, restoration date, and artifact origin.
- [ ] Restore or locate the current application source before implementation so this remains a migration rather than an accidental replacement.
- [ ] Repeat the full route, entity, fixture, component-duplication, persistence, and authorization audit after restoration.
- [ ] Capture the existing build, lint, test, route, visual, and behavioral baseline.
- [ ] Inventory page and API routes, deep links, redirects, embedded links, callback URLs, and compatibility requirements.
- [ ] Inventory schemas, migrations, clients, API contracts, attachments, comments, activity, history, indexes, exports, automations, and background jobs.
- [ ] Inventory all restored Ticket and Request schemas, IDs, statuses, and relationships.
- [ ] Define one canonical Request entity and migration mapping.
- [ ] Define Workspace and seed the seven initial workspaces.
- [ ] Classify every entity as global, workspace-owned, or explicitly cross-workspace.
- [ ] Require WorkspaceId on every workspace-owned entity and relationship.
- [ ] Derive workspace scope from trusted identity and data context; never trust client-supplied WorkspaceId without authorization.
- [ ] Define one shared people directory plus workspace memberships and roles without granting directory users implicit operational access.
- [ ] Define global settings and workspace override precedence.
- [ ] Separate global-administrator and workspace-administrator boundaries.
- [ ] Define workspace module enablement for optional specialist capabilities.
- [ ] Define one configuration-driven navigation model.
- [ ] Default protected operations to deny and require explicit permission grants.
- [ ] Define distinct permissions for create, read, update, delete, assign, transition, resolve, reopen, export, administer, and cross-workspace access.
- [ ] Enforce workspace scope and permissions on direct reads, lists, searches, counts, exports, attachments, comments, history, bulk actions, automations, and background jobs.
- [ ] Prevent IDOR by checking workspace membership and record-level access after every identifier lookup.
- [ ] Guard optional modules at navigation, route, query, and mutation boundaries.
- [ ] Ensure UI visibility mirrors, but never replaces, operation authorization.
- [ ] Define immutable audit coverage for permission, membership, assignment, transition, settings, and cross-workspace events.
- [ ] Externalize operational fixtures and ensure production bundles contain no operational seed data.
- [ ] Preserve exactly Activity, Details, Work, Resolution, and History on request detail.
- [ ] Preserve or reconstruct the blue-teal semantic theme with accessible contrast.
- [ ] Inventory and migrate local storage, session storage, IndexedDB, cookies, URL state, query caches, and service-worker state after restoration.
- [ ] Test workspace isolation, cross-workspace denial, and crafted foreign WorkspaceId, record ID, relationship ID, and module ID requests.
- [ ] Test that counts, search, exports, notifications, activity, and history leak no cross-workspace existence or metadata.
- [ ] Test global-setting/workspace-override precedence and global/workspace administrator boundaries.
- [ ] Test optional-module navigation, route, query, and mutation guards.
- [ ] Test permission denial for every protected operation category.
- [ ] Do not mark preservation complete until original routes, behavior, blue-teal tokens, and request tabs are available for comparison.
- [ ] Avoid new feature screens until the shared foundation is complete.

## Risks

- **Missing historical source:** Building before source restoration could replace undocumented contracts and behavior rather than migrate them.
- **Unknown route and data contracts:** Bookmarks, integrations, IDs, statuses, relationships, and historical records may not map cleanly.
- **Client-controlled workspace scope:** Trusting WorkspaceId from routes or request bodies can enable cross-workspace access.
- **Indirect leakage:** Counts, search suggestions, exports, attachments, activity, history, and notifications may reveal protected records.
- **IDOR:** Identifier lookup without workspace membership and record-level authorization can bypass isolation.
- **Privilege confusion:** Global roles, workspace roles, assignment, and people-directory visibility may be conflated.
- **UI-only or optional-module security:** Hidden controls and disabled navigation do not prevent direct route, query, or mutation access.
- **Global-setting escalation:** Workspace administrators may alter global defaults unless mutation scope is enforced.
- **Bulk/background bypass:** Imports, exports, automations, scheduled jobs, and bulk updates may omit interactive permission checks.
- **Audit gaps:** Unauthorized membership, permission, settings, or cross-workspace actions may be undetectable without immutable history.
- **Persistence loss:** Restored browser state may reference retired routes, entities, workspaces, or modules.
- **Visual and behavioral regression:** The blue-teal design and five-tab request experience cannot be verified until the source is restored.
- **No regression baseline:** There is no build, test suite, or working functionality available for comparison.

## Foundation completion criteria

- A single application and shell serve all configured workspaces.
- Exactly one Request entity exists.
- Every workspace-owned operational entity requires WorkspaceId.
- Shared people, settings resolution, module configuration, and navigation contracts are established.
- Protected operations deny unauthorized access independently of UI visibility.
- The seven initial workspaces are represented through configuration.
- Specialist modules can be enabled or disabled per workspace without changing the shared Request model.
- Request detail retains exactly the five required tabs.
- No operational data is embedded in page components.
- Existing functionality and blue-teal design have documented preservation evidence after source restoration.
- No new feature screens are introduced as part of this foundation work.
