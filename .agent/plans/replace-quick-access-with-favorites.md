# Replace Quick Access with Favorite Services

## Current behavior
- Quick Access currently reads service IDs saved in the browser under `esm.requester-favorite-services`.
- When favorites exist, it shows up to six published, requester-eligible favorite services.
- When favorites are empty, it silently falls back to up to six Popular services, ranked from the signed-in requester’s request history.
- Service stars in the discovery collections add or remove services from this browser-local list.

## Changes
- Rename the homepage section from **Quick Access** to **Favorite Services**.
- Populate the section only from the signed-in user’s valid favorite service IDs.
- Hide the entire Favorite Services heading and service collection when no valid favorites exist.
- Remove the Popular-services fallback so favorites and popularity remain distinct concepts.
- Keep the existing star controls in service discovery for adding and removing favorites.
- Update star accessibility labels from “quick access” terminology to “favorites.”
- Preserve the existing service preview, request flow, requester permissions, search, Action Center, and discovery tabs.

## Persistence
- Keep the current browser-local favorite storage for this UX-only change; no data-model or architecture changes.
- Continue filtering saved IDs against published, requester-eligible services so unavailable services never appear.

## Documentation and validation
- Update the project overview to describe Favorite Services and its hidden-empty behavior.
- Validate the `/` route in empty, populated, add-favorite, and remove-last-favorite states.
- Validate responsive layout, keyboard access, TypeScript, lint, build, and AppGen SDK usage.
