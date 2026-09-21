# Functional acceptance report

## Scope and result

This acceptance exercise uses the existing in-memory providers and deterministic TypeScript test-case pattern. It does not claim production readiness, durable persistence, server-side enforcement, background execution, durable file storage, or browser automation.

The tested vertical slice is **Employee Equipment Request** with Employee, Department, Business Unit, Equipment Type, Laptop Model, Accessories, Cost, Required Date, and Business Justification fields. Department, Equipment Type, Cost, and common Status are reportable. The workflow uses a cost condition, manager approval, rejection transition, IT fulfilment task, completion transition, and end node.

Overall status: **Partial**. The configured Service Builder → Request Submission data contract → Workflow Execution → Request Details data contract → Reporting path is connected and deterministic at the application-service level. Full acceptance is withheld because request-submission idempotency and browser-level request-details assertions remain unproven.

## Acceptance tests

| Test name | Status | Evidence |
|---|---|---|
| 1. Create draft | Pass | Test constructs an isolated Employee Equipment Request v1 configuration using existing `FormVersion` metadata. |
| 2. Build form | Pass | Nine required fields use existing field types and stable keys. |
| 3. Add validations and rules | Pass | Currency range validation and nested cost-threshold rule execute through `dynamic-form-runtime.ts`. |
| 4. Preview form | Pass | Values are normalized and evaluated through the same shared runtime used by `DynamicFormRenderer`. |
| 5. Publish | Pass | Published immutable v1 metadata is used by request and workflow snapshots; publication gate tests remain active. |
| 6. Submit request | Pass | Acceptance data uses the same version-bound `Request` and typed `RequestFieldValue` contracts produced by catalog submission. |
| 7. Restore draft | Pass | Typed currency, references, arrays, dates, and text survive runtime restoration. |
| 8. Bind request to form/workflow version | Pass | Request and workflow snapshot both retain `equipment-v1`. |
| 9. Execute approval | Pass | Workflow creates one real in-memory `RequestApproval` and pauses. |
| 10. Execute IT task | Pass | Approved decision resumes exactly once and creates one `RequestTask`. |
| 11. Complete lifecycle | Pass | Completing the task resumes workflow and transitions request status to Closed. |
| 12. Verify request details page | Partial | Version-bound request/answer contracts used by the universal details route are verified; no browser DOM runner exists in the current test framework. |
| 13. Create report | Pass | Existing execution service runs a Cost summary definition. |
| 14. Filters, grouping, sorting, aggregations | Pass | Department filtering/grouping/sorting and typed Cost sum are asserted. |
| 15. Drill-through | Pass | Report rows retain authorized request IDs. |
| 16. Publish Version 2 | Pass | Independent v2 metadata is created without modifying v1. |
| 17. Rename field | Pass | Business Justification becomes Reason for request in v2 only. |
| 18. Add field | Pass | Delivery Location exists only in v2. |
| 19. Preserve old request | Pass | EER-0001 remains bound to v1 and historical answer label Cost. |
| 20. New request uses new version | Pass | EER-0002 binds v2 and sees Delivery Location. |

## Negative tests

| Test name | Status | Evidence |
|---|---|---|
| Missing required field | Pass | Missing Cost produces an inline validation issue. |
| Invalid values | Pass | Negative Cost uses the configured custom message. |
| Broken references | Pass | Rule diagnostics return `broken-reference`. |
| Circular rules | Pass | Rule diagnostics return `circular-dependency`. |
| Workflow without end node | Pass | Workflow validation rejects the definition. |
| Unauthorized publication | Pass | Maker/checker publication remains blocked without approval. |
| Maker approving own publication | Partial | Publication requires an approved checker decision, but this suite does not create a complete persona-backed approval transaction. |
| Duplicate submission | Partial | Workflow resume is idempotent; catalog request submission has no explicit idempotency key. |
| Duplicate workflow execution | Pass | Repeated resume after completion creates no additional steps. |
| Sensitive field in reporting | Pass | Sensitive metadata is excluded before report dimension execution. |
| Historical request using wrong metadata | Pass | v1 request and answers remain associated with v1 after v2 creation. |

## Files changed

- `apps/enterprise-service-management/src/lib/functional-acceptance-test-cases.ts` — added deterministic vertical-slice and negative acceptance assertions.
- `docs/functional-acceptance-report.md` — added this evidence report.

No routes, pages, entities, products, integrations, providers, infrastructure, or `/` behavior were added or changed.

## Fixes applied

- Added one integrated deterministic acceptance suite instead of relying on separate H1–H4 unit-style evidence.
- Added historical v1/v2 metadata assertions with stable field keys and historical labels.
- Added an explicit sensitive-report-field exclusion assertion.
- Added missing-end, broken-reference, circular-rule, and maker/checker publication negative assertions.
- Added duplicate workflow-resume evidence.

## Existing test modules reused

- `dynamic-form-runtime.ts`
- `service-builder-integrity-test-cases.ts`
- `workflow-application-service-test-cases.ts`
- `workflow-application-service.ts`
- `report-execution-test-cases.ts`
- `report-execution-service.ts`
- `workflow-designer.ts`

## Remaining limitations

- `CatalogSubmissionService` has no explicit submission idempotency token. Duplicate request submission is therefore **Partial**, not passed.
- The current repository has deterministic TypeScript test-case modules but no browser automation runner. Request-details visual rendering, keyboard behavior, and the complete click path remain **Partial**.
- Maker/checker publication blocking is deterministic, but a complete two-person UI transaction is not automated.
- Application-layer authorization and reporting field filtering are not a trusted server boundary.
- Workflow timers require explicit administrator due-step processing.
- Integration workflow nodes remain manual/unsupported states.
- All acceptance records are isolated in-memory records; no durability is claimed.
- No production-readiness claim is made.
