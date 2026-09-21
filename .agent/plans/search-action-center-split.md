# Search and Action Center split

## Goal
Place the requester Action Center beside the search experience above the fold without weakening service discovery or changing the existing architecture.

## Homepage changes
- Reshape the hero into a responsive two-column composition on large screens: search and marketplace messaging on the left, Action Center on the right.
- Keep search as the dominant element with more horizontal space than the Action Center.
- Stack search first and Action Center immediately below it on tablet and mobile.
- Remove the separate Action Center block below the hero so the same information appears only once.

## Action Center
- Prioritize items requiring action: awaiting user reply and pending approvals.
- Keep open requests available as secondary context.
- Keep recently completed activity compact and visually de-emphasized.
- Show a concise all-caught-up state when no action is required.
- Preserve existing requester-safe links and live record-derived counts.

## Visual direction
- Use the existing Rawabi typography, spacing, navy/teal hierarchy, and restrained orange action treatment.
- Keep the panel quiet and lightweight so it complements rather than competes with search.
- Maintain accessible contrast, keyboard focus, readable touch targets, and clear responsive hierarchy.

## Unchanged
- Request engine, data model, permissions, routing, requester navigation, search indexing, service discovery, and service popup behavior.

## Validation
- Verify desktop side-by-side layout and stacked mobile/tablet layout.
- Verify search results are not obscured or clipped by the adjacent Action Center.
- Verify action counts and links remain derived from authorized requester records.
- Run TypeScript, lint, build, route, and AppGen SDK validation.