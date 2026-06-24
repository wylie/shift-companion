# Privacy Principles

## Core principles

- Staff can only see their own schedule and unavailability.
- Managers can only see staff and related conflict data for teams they manage.
- Access scope should stay narrow at every phase.
- Broad Microsoft Graph permissions should be deferred until they are clearly required.
- Calendar export should be personal, explicit, and revocable.

## Current scaffold posture

- Local mocked data only
- No production authentication
- No Microsoft Graph integration
- No YMCA source-system integration
- No database persistence

## Future enforcement notes

- UI role checks are not enough on their own.
- Manager-only access must later be enforced in server-side authorization.
- Any future calendar feed must use private, revocable tokens.
