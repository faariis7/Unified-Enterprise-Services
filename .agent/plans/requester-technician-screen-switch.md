# Requester and technician screen switch

## Goal
- Keep `/` as the requester Service Marketplace for every signed-in employee.
- Give operational users a permission-aware way to enter the existing workspace operations experience without creating another portal or duplicating navigation.

## Experience changes
- Add a compact **Open Operations** action to the requester header on `/` only when the signed-in user has an active operational service membership or administration grant.
- Keep the action hidden for requester-only users so their homepage and navigation remain unchanged.
- Send eligible users to their active/default authorized workspace route, where the existing operations shell, workspace selector, modules, queues, reports, approvals, catalog, and settings remain intact.
- Preserve a clear route back to the Service Marketplace from the operations shell.
- Use loading-safe behavior so the action does not briefly appear before identity and memberships are resolved.

## Authorization
- Treat active service roles `Agent`, `ServiceManager`, and `ServiceAdministrator` as technician/operations access.
- Include existing Workspace Admin and Global Admin grants in operations access without broadening their current permissions.
- Do not infer technician access from requester membership or workspace membership alone.
- Keep all existing route guards and module permissions authoritative after navigation; the button is discoverability, not a security boundary.
- Choose the destination only from workspaces the current user is authorized to access, preferring the active/default workspace.

## Existing operations screen
- Restore the original operations landing experience by continuing to use the existing workspace home page at `/w/:workspaceCode` and its current sidebar shell.
- Do not recreate the original page, duplicate routes, add a separate admin application, or change the data model.

## Planned file changes
- `src/contexts/workspace-context.tsx` — expose a derived operations-access state and an authorized operations destination from existing memberships and grants.
- `src/components/app-shell.tsx` — conditionally show the requester-to-operations action and add the operations-to-marketplace return action while retaining the two existing shell modes.
- `src/pages/services-marketplace.tsx` — preserve the marketplace content and `/` route behavior; only accommodate the authorized screen-switch entry if placement belongs in the page header.
- `src/app.tsx` — retain current routes and verify `/w/:workspaceCode` continues to resolve to the original operations landing page.
- `docs/overview.md` — clarify the unified requester landing page and permission-driven operations switch.

## Validation
- Requester-only user remains on `/` and never sees the operations action.
- Service Agent sees the action and enters only an authorized workspace.
- Service Approver without technician/admin privileges does not receive broad operations access from the switch.
- Workspace Admin and Global Admin retain their existing administration paths and can reach the appropriate operations experience.
- Direct workspace and administration URLs remain protected by existing guards.
- Switching between marketplace and operations works on desktop and mobile.
- Existing requester navigation, operations sidebar, workspace isolation, service authorization, and data model remain unchanged.
- Run full project validation, including TypeScript, lint, build, route checks, and SDK validation.
