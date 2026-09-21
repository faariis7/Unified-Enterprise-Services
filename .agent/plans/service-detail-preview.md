# Requester service detail preview

## Goal
Keep service discovery and request initiation entirely within the requester experience, while giving employees clear, requester-safe information before they begin a request.

## Experience changes
- Add a requester-facing service detail route under the existing marketplace navigation, without entering workspace operations or administration.
- Open every service selection from Quick Access, discovery collections, category results, and live search in the same service detail experience.
- Present the detail as a lightweight, responsive service overview with a clear return to the marketplace and a primary **Proceed to request** action.
- Keep the existing request form and submission engine; the detail view becomes the informational step before the form.

## Service detail content
- Service and catalog item name, icon, short and full descriptions.
- Business area/category and service owner organization shown in requester-friendly language, without exposing operational workspace concepts.
- Expected fulfillment time and applicable requester-facing service commitments.
- Eligibility and scope derived from active catalog audiences, expressed as understandable conditions such as available to everyone, department, site, role, or named-user access.
- Approval expectations derived from active catalog approval configuration, summarized without exposing internal approver identities or workflow internals.
- Required preparation derived from requester-visible form requirements, active validation/help text, and required task information where appropriate.
- Availability state, including a clear message when the service is unpublished, inactive, ineligible, or has no usable request form.

## Authorization and routing
- Validate the signed-in person against active service, catalog item, workspace, and audience eligibility before showing details or allowing progression.
- Protect direct detail URLs with the same requester eligibility rules used for catalog submission.
- Keep operational-only fields hidden, including assignment groups, technician details, internal conditions, escalation configuration, and administration links.
- Preserve the requester shell and minimal requester navigation throughout service preview and request entry.

## Request flow
- **Proceed to request** opens the existing dynamic requester form for the selected service.
- Back and cancel actions return to the marketplace without switching workspace context or entering the operations UI.
- After submission, route to the requester-safe request detail rather than the operational request detail.

## Existing architecture retained
- Reuse CatalogItem, Service, CatalogItemAudience, CatalogItemFormAssignment, form metadata, approval configuration, and service-target configuration.
- Do not add or duplicate entities, portals, request engines, forms, permissions, or navigation systems.
- Keep the current marketplace layout, search index, favorites, recommendations, and request submission behavior aside from the new preview step and requester-safe redirects.

## Validation
- Verify every marketplace entry point opens the requester service detail view.
- Verify eligible users can review details and proceed to the request form.
- Verify ineligible, inactive, unpublished, and malformed direct URLs fail safely without leaking configuration.
- Verify requester routes never render the operations sidebar or administration interface.
- Verify requester-facing descriptions, eligibility, approval, target, and form requirement summaries are derived from live records rather than hardcoded service facts.
- Verify successful submission opens the requester-owned request view.
- Validate responsive layouts, keyboard navigation, focus behavior, contrast, TypeScript, lint, build, and SDK usage.
