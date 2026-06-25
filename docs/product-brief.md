# Product Brief

## Goal

Build a Teams-contained companion to Microsoft Teams Shifts for YMCA departments that use Teams Shifts, helping staff manage unavailable times and access their own shift calendars without replacing Teams Shifts.

## Non-goals

- Public scheduling website
- Full Teams Shifts replacement
- Payroll
- Shift swaps
- Time clocks
- PTO balances
- Chat or notifications

## Current scope

- Teams-compatible tab shell
- Demo-only Preview identity selector
- Persisted staff unavailability with recurring, one-time, and date-range rules
- Persisted weekly personal schedule view
- Server-side personal `.ics` calendar download
- Persisted read-only manager conflict review
- Privacy, database, and roadmap documentation

## Phase 1 completion

- Staff can manage unavailable times.
- Staff can review a weekly schedule.
- Staff can download a personal calendar file.
- The app remains browser-previewable and Teams-compatible in structure.

## Phase 2 completion

- Manager View is read-only and scoped to assigned departments.
- Manager tools are hidden and guarded for staff users.
- Conflict detection compares shifts with unavailable rules.

## Phase 3 completion

- Repository and service boundaries are in place.
- Neon/Postgres persistence is supported.
- Demo organization, users, departments, memberships, shifts, unavailability rules, and audit events can be migrated and seeded.
- Current UI behavior now runs through persisted or fallback server-backed data.
- Calendar download is generated server-side and scoped to the selected preview identity.

## Current limits

- Preview identity remains a demo/developer tool, not real authentication.
- Real authorization still needs Teams SSO and Microsoft Entra identity later.
- No Microsoft Graph, Teams Shifts, or YMCA data is connected yet.
- Live calendar subscriptions remain deferred until secure backend token and revocation support exist.

## Default department assumptions

- This app is for departments using Microsoft Teams Shifts.
- Aquatics may use Sling and is not the default use case.
- Neutral YMCA-style examples should be used unless a department-specific workflow is being designed.

## Design principles

- Staff-first experience
- Privacy by default
- Minimal permissions
- Mocked and demo data first
- Future compatibility with Teams SDK and app packaging
