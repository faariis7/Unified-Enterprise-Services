# Add inbound email request intake

## Goal
Enable the existing service-management app to create and continue requests from inbound support emails while preserving the current portal submission and requester conversation behavior.

## Scope
- Keep portal request submission, requester ownership checks, request detail routes, conversation sorting, autosaved drafts, attachments, and technician badges unchanged.
- Add an email intake path that uses the available Microsoft 365 Mail connector and the same request lifecycle used by portal submissions.
- Treat an email as either a new request or a reply to an existing request, with duplicate protection.

## Data sources
- Microsoft 365 Mail: read inbound messages and attachments at runtime; send or reply through the connected mailbox where supported.
- App data model: persist email-to-request linkage, processing status, source metadata, failures, and deduplication records.
- Existing request entities: reuse Request, Request Activity, Request Attachment, Request History, Person, Workspace, service targets, and automation.

## Data entities
- Email Intake Configuration
- Email Intake Message
- Email Request Link
- Email Intake Processing Event

## Features
- Email intake configuration: workspace administrators select the intake mailbox/folder behavior, default workspace routing, fallback service/catalog mapping, and enabled state.
- Inbox processing: authorized users can retrieve eligible unread inbound messages and process them into the service system.
- New-request creation: unmatched emails create requests with source `EMAIL`, sender identity, subject, cleaned message body, received timestamp, and downloaded attachments.
- Existing-request matching: messages containing a recognized request number or linked conversation identifier become public customer communications on that request.
- Sender resolution: match senders to active Person records by email; route unknown senders to a visible exception state instead of assigning an incorrect identity.
- Duplicate prevention: use the Microsoft 365 message/internet-message identifier so retries never create duplicate requests or replies.
- Request orchestration: apply the same authorization, numbering, initial status, service-target selection, audit/history, and automation behavior used by portal-created requests.
- Processing outcomes: record processed, duplicate, needs-review, and failed states with clear reasons and retry support.
- Source visibility: show Portal or Email as the request source in technician request views without changing requester-facing ownership rules.
- Email continuity: preserve the originating message/conversation linkage so technician public replies can be associated with the email thread when outbound mail is enabled.

## Pages and user experience
- Workspace settings / Email intake: configure and enable email intake, default routing, and processing rules.
- Email intake queue: review discovered messages, processing status, unmatched senders, failures, and retry actions.
- Technician request detail: display email source and thread metadata alongside the existing timeline.
- Requester request detail: keep the current portal conversation experience; email-originated public activity appears consistently when the sender maps to the requester.

## Processing rules
- Ignore drafts, sent items, system-generated loops, and messages without a usable sender.
- Prefer explicit request-number matching, then stored conversation linkage; otherwise create a new request.
- Strip quoted history and signatures only for the activity body while retaining source metadata for auditability.
- Download non-inline attachments and preserve filename, content type, size, uploader, and received time.
- Do not mark a message complete until all required request, activity, attachment, and linkage records succeed.

## Validation
- Verify portal-created requests still follow the existing path and remain unchanged.
- Verify one inbound email creates exactly one request with source `EMAIL`.
- Verify a follow-up email adds one public activity to the correct request.
- Verify repeated processing is idempotent.
- Verify known and unknown senders, malformed request numbers, attachments, connector failures, and retry behavior.
- Verify authorization boundaries between workspaces and requester ownership.
- Run project validation and Microsoft 365 SDK usage validation with zero errors.

## Deployment dependency
- The app can provide connector-backed discovery and processing, configuration, queueing, and retry behavior. Fully unattended 24/7 mailbox ingestion still requires an external scheduled or event-driven host such as Power Automate or an equivalent backend trigger to invoke the intake flow when new mail arrives.
