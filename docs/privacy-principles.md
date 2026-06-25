# Privacy Principles

## Core principles

- Staff can only see their own schedule and unavailability.
- Managers can only see staff and related conflict data for departments they manage.
- Access scope should stay narrow at every phase.
- Broad Microsoft Graph permissions should be deferred until clearly required.
- Calendar export should remain personal, explicit, and revocable when subscriptions exist later.

## Current Phase 3 posture

- Persisted demo data by default when `DATABASE_URL` is configured
- In-memory fallback only when the database is intentionally absent for visual preview
- Staff-entered unavailability remains current-user-only
- Calendar download remains current-user-only and exports only that staff member&apos;s shifts
- Manager View is persisted, read-only, and limited to assigned departments
- Manager tools remain hidden and guarded for staff users in the UI
- Server-side routes scope manager data by assigned department memberships
- Preview identity and role handling are still mocked demo states only
- No production authentication
- No Microsoft Graph integration
- No YMCA source-system integration

## Product scope notes

- This app is a Teams Shifts companion for departments using Teams Shifts.
- Aquatics may use Sling and is not the default product assumption.
- Manager visibility into staff unavailability remains limited to conflict review inside assigned departments.

## Authorization notes

- UI guards improve usability but are not treated as the security boundary.
- Staff routes do not accept arbitrary target user IDs.
- Server-side queries scope schedule, unavailability, calendar export, and manager review data.
- Real authorization must later be enforced with Teams SSO, Entra identity, and durable authorization records.

## Calendar privacy notes

- Current `.ics` downloads are individual-only.
- Downloads contain only the selected preview staff member&apos;s shifts.
- Downloads exclude coworker names, unavailability notes, and internal scheduling comments.
- Live calendar subscriptions remain deferred until token storage, revocation, and privacy controls exist.
- Future subscription tokens must be revocable and hashed at rest.

## Developer demo checklist

- Staff cannot access Manager View.
- Staff only see their own schedule.
- Staff only export their own calendar.
- Staff only edit their own unavailability.
- Managers only see assigned departments.
- Live Teams, Shifts, Graph, and YMCA data are not connected yet.
