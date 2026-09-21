# Publish clean GitHub snapshot

## Goal
- Publish the current Unified Enterprise Service Management project to `https://github.com/faariis7/Unified-Enterprise-Services` on `main` as a clean initial snapshot.

## Current state
- Use the clean local `main` working tree at commit `e51e00d` as the source snapshot.
- Add the target GitHub repository as the remote; no remote is currently configured.
- Treat GitHub authentication and repository write permission as prerequisites supplied by the environment or repository owner.

## Publication scope
- Review tracked content for credentials, generated artifacts, local environment files, and other files that should not be published.
- Add publication exclusions only where needed; preserve application source, project metadata, data model, and user-facing documentation.
- Create a new root commit containing the approved current project snapshot, without carrying over local commit history.
- Replace the remote `main` history with the clean snapshot, as explicitly authorized by the user.
- Configure local `main` to track the published remote `main`.

## Verification
- Confirm the remote URL and resulting `main` commit match the clean snapshot.
- Confirm the published tree contains the expected project structure and no identified secrets or local-only artifacts.
- Confirm the local working tree remains clean after publication.

## Safety boundary
- Do not modify application behavior or data configuration as part of publication.
- Stop without changing remote history if authentication, repository authorization, branch protection, or secret review prevents a safe push.
- The forced replacement of remote `main` is destructive to its prior history and will be performed only for this explicitly named repository and branch.
