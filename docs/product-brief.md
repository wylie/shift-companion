# Product Brief

## Goal

Build a Teams-contained companion to Microsoft Teams Shifts for YMCA departments that use Teams Shifts, helping staff manage unavailable times and eventually subscribe to their own shift calendar.

## Non-goals

- Public scheduling website
- Full Shifts replacement
- Payroll
- Shift swaps
- Time clocks
- PTO balances
- Chat or notifications

## First version scope

- Teams-compatible embedded tab shell
- Mocked current user roles: staff and manager
- Staff-entered recurring and dated unavailability using mocked local state
- Mocked weekly schedules with local `.ics` calendar downloads
- Mocked manager conflicts
- Privacy and roadmap documentation

## Phase 1 completion

- Phase 1 staff experience is complete in mocked local form.
- Staff can manage recurring unavailable times and download a personal `.ics` file of mocked shifts.
- Live calendar subscriptions remain intentionally deferred until secure backend identity and privacy controls exist.

## Phase 2 scope

- Phase 2 is complete in mocked and local-only form.
- Identity and role handling are still mocked through preview identities.
- The first useful Manager View is read-only and focused on conflict review before publishing the Teams Shifts schedule.
- Manager tools are hidden and guarded for staff users and scoped to assigned mocked departments.
- Conflict detection currently compares mocked shifts with mocked staff unavailable rules.
- Real authorization must later be enforced server-side after Teams SSO and persistence exist.
- Real department permissions, Teams SSO, persistence, and Microsoft Graph / Shifts integration remain future work.

## Default department assumptions

- This app is for departments using Microsoft Teams Shifts.
- Aquatics may use Sling and is not the default use case.
- Neutral YMCA-style examples should be used unless a department-specific workflow is being designed.

## Design principles

- Staff-first experience
- Privacy by default
- Minimal permissions
- Mocked data first
- Future compatibility with Teams SDK and app packaging
