# Privacy Principles

## Core principles

- Staff can only see their own schedule and unavailability.
- Managers can only see staff and related conflict data for teams they manage.
- Access scope should stay narrow at every phase.
- Broad Microsoft Graph permissions should be deferred until they are clearly required.
- Calendar export should remain personal, explicit, and revocable when introduced later.

## Current scaffold posture

- Local mocked data only
- Staff-entered unavailability is the first real feature and remains local-only for now
- No production authentication
- No Microsoft Graph integration
- No YMCA source-system integration
- No database persistence

## Product scope notes

- This app is a Teams Shifts companion for departments using Teams Shifts.
- Aquatics may use Sling and is not the default product assumption.
- Manager visibility into staff unavailability comes later and should remain narrowly scoped.

## Future enforcement notes

- UI role checks are not enough on their own.
- Manager-only access must later be enforced in server-side authorization.
- Any future calendar feed must use private, revocable tokens.
