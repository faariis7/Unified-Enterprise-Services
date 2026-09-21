# Unify request page scrolling

## Current behavior
- The page uses one browser scrollbar.
- The left content follows normal page flow.
- The right request-information column is sticky on wide screens, so it remains near the viewport while the left column continues moving.
- This makes the two columns appear to scroll differently even though there is no separate right-side scrollbar.

## Change
- Remove sticky positioning from the right-side column on the requester request-detail page.
- Keep both columns in the same normal document flow so they move together at exactly the same rate with the single page scrollbar.
- Preserve the existing two-column desktop layout and responsive stacked layout on smaller screens.
- Keep all requester information, request actions, request details, and SLA content unchanged.

## Verification
- Confirm the referenced Support portal request route uses one browser scrollbar.
- Confirm the left and right columns move together while scrolling.
- Confirm the right column has no independent overflow or sticky behavior.
- Validate the full project after the layout change.
