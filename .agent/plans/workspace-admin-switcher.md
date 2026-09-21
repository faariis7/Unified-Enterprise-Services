# Workspace administration switcher

## Goal
- Keep one operations interface while making workspace selection adaptive to the signed-in user’s administration scope.
- Avoid showing a workspace picker when there is nothing meaningful to switch.

## Recommended behavior
- Derive an **administered workspaces** collection from active `WorkspaceMembership` records with role `Owner` or `Administrator`.
- If the user administers exactly one workspace, show the active workspace name as a static context label and hide all switching controls.
- If the user administers more than one workspace, show the workspace switcher and list only workspaces they administer.
- If the user administers no workspaces but has service-level operations access, keep their authorized operations destination and do not expose an administration workspace list.
- Keep Global Administration separate; a global role must not automatically populate the workspace-admin switcher unless existing workspace authorization explicitly grants access.

## Operations experience
- On `/w/facility`, retain the existing operations shell, modules, permissions, and route structure.
- Replace the current all-authorized-workspaces selector with an administration-aware selector in administration contexts.
- Preserve the selected workspace in the URL and existing active-workspace state when switching.
- On mobile, apply the same one-versus-many behavior so a single workspace does not consume header space with a disabled picker.

## Authorization and routing
- Never infer workspace administration from general workspace membership, Agent status, or service membership.
- Keep direct `/w/:workspaceCode` authorization in the existing workspace route guard.
- Keep `/w/:workspaceCode/settings` protected by `workspace.administer` for the requested workspace.
- If a user tries to open administration for a workspace they do not administer, redirect to their single administered workspace, their first authorized administered workspace, or the existing no-access page when none exists.
- Continue filtering modules and operational records with the active workspace and existing service permissions; this UX change does not broaden data access.

## Planned changes
- `src/contexts/workspace-context.tsx` — expose administered workspaces and an administration-aware active workspace derived from active Owner/Administrator memberships.
- `src/components/workspace-selector.tsx` — support a constrained workspace collection and render a static workspace identity when only one choice is available.
- `src/components/app-shell.tsx` — use the adaptive administration workspace control on desktop and mobile without adding navigation.
- `src/components/workspace-route-guard.tsx` — preserve authorized URL switching and ensure foreign workspace routes cannot become active.
- `src/components/administration-guard.tsx` — keep workspace administration checks scoped to the workspace in the route.
- `docs/overview.md` — document the adaptive single/multi-workspace administration experience.

## Validation
- A Facility administrator with only Facility administration sees “Facility” as context and no workspace list.
- An administrator of Facility and IT sees a switcher containing only Facility and IT.
- A requester or agent membership in another workspace does not add that workspace to the admin switcher.
- Switching updates the `/w/:workspaceCode` route and reloads only that workspace’s configured modules and data.
- Direct URLs to non-administered workspace settings are denied or redirected safely.
- Global administration remains separate from workspace administration.
- Desktop and mobile follow identical one-versus-many behavior.
- TypeScript, lint, build, route protection, workspace isolation, and SDK validation pass.
