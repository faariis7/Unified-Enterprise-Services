# Complete contract information and operational controls

## Goal

Turn `/w/:workspaceCode/contracts` into a complete, workspace-scoped contract register where every high-priority field is validated, persisted through the generated data layer, permission-controlled, and represented in the audit timeline.

## Data model changes

- Extend **Contract** for commercial terms, renewal controls, termination controls, key contacts, approval/signature state, and completeness tracking inputs.
- Extend **ContractObligation** for owner assignment, completion evidence, completion notes, overdue context, waiver authorization, reminders, and custom recurrence.
- Extend **ContractDocument** for signature status, signed/executed dates, document category, version notes, and replacement lineage.
- Add **ContractContact**.
- Add **ContractApproval**.
- Preserve **ContractActivity** as the immutable field, lifecycle, document, approval, signature, and obligation audit trail.
- Regenerate all models, validators, services, and hooks after the model update.

## Contract register

- Add expiration filters for 30, 60, and 90 days alongside lifecycle status and text search.
- Add renewal countdown and action-required indicators derived from persisted end, notice, cancellation, renewal, and decision dates.
- Add visible warnings for missing owner, required contacts, commercial terms, approval/signature evidence, documents, or renewal decisions.
- Add a completeness score calculated from required persisted fields; show the missing requirements rather than storing a cosmetic score.
- Keep all lists and derived metrics restricted to the active workspace.

## Contract details and editing

- Reorganize the contract control area into Details, Commercials, Renewal & termination, Contacts, Documents, Approvals, Obligations, and Activity.
- Persist payment schedule, billing frequency, tax, discount, committed value, consumed value, cost center, budget reference, and currency.
- Persist notice period, renewal date, renewal owner, cancellation deadline, renewal decision, and price-escalation terms.
- Persist termination-for-convenience and for-cause terms, notice requirements, penalties, exit obligations, effective termination date, and termination reason.
- Validate date ordering, non-negative amounts, consumed value limits, required conditional fields, and unique contract numbers within a workspace.
- Record field-level before/after activities for every successful edit.

## Contacts

- Support internal business owner, contract manager, procurement, legal, vendor account manager, and escalation contacts.
- Select internal contacts from existing demo people and persist vendor contacts as structured contract contact records.
- Require one primary contract manager and one vendor contact before activation.
- Allow contacts to be added, edited, made primary, and deactivated with audit entries.

## Documents and signatures

- Add working document metadata create, edit, replace, retire, and version-history actions using ContractDocument.
- Support signed agreement, amendment, statement of work, purchase order, insurance certificate, and other governed categories.
- Persist file name, content type, size, storage reference, category, version, status, uploader, signature status, signatories, signature dates, and executed date.
- Validate replacement lineage and prevent multiple current versions of the same governed document.
- Treat external storage references as real persisted metadata; keep binary upload clearly unavailable until durable file storage is connected.

## Approval and signature workflow

- Add persisted approval steps with assigned approver/signatory, sequence, status, requested date, decision date, comments, and override context.
- Permit decisions only by the assigned active approver/signatory; allow Owners and Administrators to reassign or cancel with an audited reason.
- Block activation when required approvals, signatures, or executed documents are incomplete.
- Record all approval, rejection, reassignment, cancellation, and signature actions in ContractActivity.

## Obligations

- Allow selection of an obligation owner from active workspace demo people.
- Support edit, start, complete, reopen, mark overdue, and waive actions with valid transitions.
- Require completion notes and evidence metadata for completion; require reason, authorized approver, and effective date for waiver.
- Support reminder date and custom recurrence details while keeping scheduled outbound delivery identified as unavailable until a scheduler/notification integration exists.
- Derive overdue state from persisted due dates when the page loads and surface overdue obligations in contract warnings.

## Permissions

- Allow workspace Owners, Administrators, and Managers to view and maintain contracts; keep Auditors read-only.
- Allow assigned Approvers to view the relevant contract and act only on their assigned approval/signature steps.
- Allow assigned obligation owners, Managers, Administrators, and Owners to complete obligations.
- Limit waivers to Owners, Administrators, or assigned Approvers; prevent self-waiver unless the person independently holds an authorized approval role.
- Hide or disable unavailable actions for Agent, Requester, Approver, and Auditor personas and enforce the same checks in mutation handlers.

## Acceptance criteria

- Every new field loads from and saves to the generated data service; refreshing or switching records restores its stored value.
- Create and edit forms reject invalid financial, date, ownership, approval, signature, and obligation combinations with actionable messages.
- Activation is blocked until required contacts, approvals, signatures, executed-document metadata, and renewal/termination controls are complete.
- Document metadata, version replacement, approvals, contacts, obligation actions, and lifecycle changes produce immutable actor/timestamp audit records.
- Countdown, expiration filters, warnings, and completeness results are calculated from current persisted records and update after mutations.
- Every demo persona is tested against view, edit, approve/sign, complete, waive, and audit access paths.
- Existing contract creation, lifecycle transitions, workspace isolation, and activity history continue to work.
- Project validation and AppGen SDK usage validation pass with no errors.

## Boundaries

- Continue using the current in-memory tables for this phase while making all supported values genuinely persisted through those tables.
- Do not simulate binary file upload, outbound reminders, enterprise signatures, or external directory resolution; expose these as explicit integration-dependent capabilities while keeping their metadata and manual workflow fully operational.
