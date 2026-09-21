# Local version-bound workflow execution

## Application boundary

`WorkflowApplicationService` is the single local graph execution service. It depends on the provider-neutral `WorkflowStateProvider` interface. `InMemoryWorkflowStateProvider` is the current provider and commits each operation against an isolated cloned state.

At start, the service verifies the request form version, copies the configured `WorkflowDefinition` into an immutable `WorkflowSnapshot`, and binds the instance to that snapshot. Subsequent edits to the builder definition do not change an active or historical instance.

## Execution records

The local state contains existing operational records—`Request`, `RequestFieldValue`, `RequestApproval`, `RequestTask`, `RequestNotification`, and `RequestRelationship`—plus workflow snapshots, instances, step records, branch state, and audit records behind the provider interface.

Supported semantics are Start, nested condition expressions, Approval, Fulfilment Task, Notification, Status Transition, Field Update, Child Request, Parallel Branch, all-of/any-of Join, Wait/Timer, Integration Placeholder, and End.

Approvals and tasks pause against their actual record IDs and resume exactly once after the existing record reaches its terminal state. Timers expose `processDue` as an explicit administrator operation. Integration placeholders never call an external system; they pause in `WaitingForIntegration` or `ManualIntervention` until an administrator resumes or fails the step.

## Deterministic test evidence

`runWorkflowApplicationServiceTests` exercises:

| Scenario | Expected records |
| --- | --- |
| Approval → task → end | 1 approval, 1 task, completed instance |
| Typed condition path | 1 queued notification on true path, completed instance |
| Parallel all-of join | 2 branch step paths, 1 notification, completed instance |
| Parallel any-of join | Explicit any join mode, completed instance |
| Wait and due processing | Deferred instance, no early resume, explicit due processing completes |
| Failure and retry | Failed instance and audit, administrator retry completes after correction |
| Duplicate resume | No additional step record after completion |
| Field update and child request | Updated request, 2 total requests, 1 relationship |
| Historical binding | Snapshot remains unchanged after the source definition is edited |

## Safety behavior

- Instance start is idempotent per request and form version.
- Node/branch idempotency keys prevent duplicate execution.
- A maximum-step guard and branch loop guard fail unsafe graphs.
- Failures preserve instance state and append an audit record.
- Administrator retry, manual resume/fail, and due-step processing are explicit operations.
- Safe test mode uses the same application service with an isolated in-memory provider.

## Current limitations

- There is no background scheduler. An administrator must call `processDue` for due timers.
- Integration placeholders are intentionally unsupported locally and require explicit manual resume or failure.
- The provider is in memory; workflow state is not durable across application restarts.
- The current parallel runner executes non-pausing local branch nodes. Approval, task, timer, integration, child-request, and nested parallel nodes inside a parallel branch are rejected rather than simulated.
- Any-of joins cancel remaining branches only after a branch reaches the join in the synchronous local runner.
- Approval actor authorization and lifecycle transition authorization continue to rely on the existing approval/lifecycle application policies; no server enforcement is claimed.
- Notifications are queued records only; no external delivery is claimed.
