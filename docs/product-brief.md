# Product Brief

## Goal

Build a Teams-contained companion to Microsoft Teams Shifts that helps staff access their own work schedule and bring it into the calendar they already use, without replacing Teams Shifts.

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
- Persisted weekly personal schedule view
- Server-side personal `.ics` calendar download
- Private, revocable calendar subscription feed
- Dedicated calendar export view
- Dedicated feedback view
- Persisted read-only manager conflict review
- Privacy, database, and roadmap documentation
- Dormant unavailability functionality kept intact behind `features.unavailability = false`

## Phase 1 completion

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
- Private subscriptions currently use the resolved preview/demo identity rather than a real Microsoft-authenticated user.
- Availability management is preserved behind a feature flag and is intentionally not part of the current primary experience until validated by real users.

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
- Make Teams Shifts more useful rather than replacing it
