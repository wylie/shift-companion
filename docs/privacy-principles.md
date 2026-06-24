# Privacy Principles

## Core principles

- Staff can only see their own schedule and unavailability.
- Managers can only see staff and related conflict data for teams they manage.
- Access scope should stay narrow at every phase.
- Broad Microsoft Graph permissions should be deferred until they are clearly required.
- Calendar export should remain personal, explicit, and revocable when introduced later.

## Current scaffold posture

- Local mocked data only
- Staff-entered unavailability is the first real feature and remains current-user-only local state for now
- Calendar download is current-user-only and exports only that staff member's mocked shifts
- No production authentication
- No Microsoft Graph integration
- No YMCA source-system integration
- No database persistence
- Manager View is mocked, read-only, and limited to assigned departments in the demo
- Manager tools are hidden and guarded for staff users in the demo

## Product scope notes

- This app is a Teams Shifts companion for departments using Teams Shifts.
- Aquatics may use Sling and is not the default product assumption.
- Manager visibility into staff unavailability comes later and should remain narrowly scoped.

## Future enforcement notes

- UI role checks are not enough on their own.
- Manager-only access must later be enforced in server-side authorization.
- Real department permissions should later come from secure identity, authorization, and persisted team assignments.
- Conflict detection is currently mocked and should later run against persisted shift and unavailability data.
- Live calendar subscriptions should not launch until identity, authorization, token storage, revocation, and privacy controls are in place.
- Any future calendar feed must use private, revocable tokens.
