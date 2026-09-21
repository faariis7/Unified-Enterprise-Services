# Requester home discovery tabs

## Goal
Transform the requester homepage into a more compact service-discovery experience while preserving the large search-led hero and existing architecture.

## Changes
- Keep the Rawabi hero and large search box as the dominant top-of-page experience.
- Keep Quick Access directly below search for the fastest one-click requests.
- Consolidate Popular, Recently Used, Recommended, and organizational browsing into one tabbed discovery section instead of separate vertical sections.
- Name the organizational tab **Business areas** rather than Departments, because it can represent IT, HR, Travel, Facilities, Communications, and Government Affairs without exposing workspace ownership.
- Within Business areas, show a second row of chips for All, IT, HR, Travel, Facilities, Communications, and Government Affairs.
- Preserve horizontal service rails inside each tab, with lightweight service tiles, fulfillment time, favorites, and Request/Re-request actions.
- Keep search results in the same discovery area and automatically surface a clear Results view after search submission.
- Keep My Requests compact and below service discovery.
- Preserve the existing requester navigation, permissions, marketplace data sources, request routes, and operations-access button.

## Tabs
- **Popular** — Most requested services from live request records.
- **Recently used** — Services previously requested by the signed-in employee, with re-request actions.
- **Recommended** — Eligible services personalized from current profile and request history where data is available.
- **Business areas** — All eligible services filtered by simple business-area chips.

## Mobile behavior
- Keep search visible within the first screen as much as practical.
- Render discovery tabs and business-area chips as horizontally scrollable controls.
- Show one service tile at a time with a partial next tile to communicate horizontal browsing.
- Keep Quick Access compact and ahead of discovery tabs.
- Avoid adding another navigation pattern or duplicating the Services page.

## Validation
- Verify every tab derives from live eligible catalog and request records.
- Verify search and business-area filtering preserve requester authorization boundaries.
- Verify empty states for employees without recent services or recommendations.
- Verify keyboard navigation, tab semantics, focus states, touch targets, and screen-reader labels.
- Verify mobile, tablet, and desktop layouts.
- Run full project and AppGen SDK validation.
