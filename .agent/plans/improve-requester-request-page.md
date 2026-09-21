# Improve requester request page

## Goal
Make the requester request detail page clearer, more actionable, and easier to review without exposing internal service-team information.

## Request detail page
- Add a structured **Request details** card showing service, priority, status, submitted date, site, requester, requested-for person, and the original submitted form answers.
- Surface the request’s SLA-calculated **Due by** time, target status, and plain-language progress guidance within Request details.
- Add a prominent **Action required from you** notice when a requester-visible update indicates that the request is waiting for requester input; link the notice to the response composer.
- Keep internal notes, operational assignments, and private workflow information hidden from requester views.

## Requester actions
- Add **Cancel request** only while the requester-owned request is in a lifecycle state that permits cancellation; require confirmation and record the cancellation in status, timestamps, and requester-visible activity.
- Do not allow requesters to edit submitted request fields.
- Explain the seven-day reopen window on resolved requests, show the deadline, and clearly distinguish eligible, expired, and closed states.
- Preserve the existing resolution confirmation and eligible reopen actions.

## Communication and timeline
- Combine the public reply and attachment upload into one composer so a requester can send text, files, or both in one action.
- Add timeline controls for chronological order and requester-visible event types such as messages, status updates, resolutions, and attachments.
- Keep attachment events directly in the timeline and remove the duplicate standalone Attachments card.
- Retain image thumbnails and attachment preview; add download or full-size viewing when file content is available and clearly explain metadata-only demo files.

## Satisfaction feedback
- Add a post-closure feedback card with a required 1–5 rating and optional comment.
- Show the requester’s submitted feedback and prevent duplicate feedback for the same request and person.

## Demo coverage
- Enrich the currently viewed Support request `SSV-2026-000003` so its details demonstrate original answers, a warning SLA target, and the existing requester-action-needed state.
- Ensure requester demo records cover cancellable, resolved/reopen-eligible, closed/feedback-eligible, attachment, and metadata-only preview states.

## Data entities
- Request
- RequestActivity
- RequestAttachment
- RequestFieldValue
- RequestResolution
- RequestServiceTarget
- RequestFeedback

## What stays the same
- Keep the existing route, requester ownership/workspace access checks, requester status filters, navigation, visual theme, and service-team request page.
- Continue excluding internal notes and records belonging to other requesters or workspaces.
