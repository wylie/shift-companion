# Teams Integration Notes

## Current approach

- Use `@microsoft/teams-js` so the client shell stays aligned with a future Teams tab app.
- Keep browser preview working outside Teams.
- Use a small Express API for persisted demo data, authorization checks, and server-side calendar downloads.
- Keep real auth and Graph integration out of scope until the product boundary is stable.

## Current implementation boundaries

- `src/App.tsx` owns app-shell state and preview identity switching.
- `src/data/apiClient.ts` is the client-side service layer used by React components.
- `server/data/*` owns repository implementations for Postgres and fallback mock data.
- `server/services/appService.ts` owns authorization-aware application behavior.
- `server/app.ts` owns HTTP routes and safe error handling.
- `src/lib/conflicts.ts` and `src/lib/calendar.ts` remain reusable domain utilities.

## Demo identity model

- Preview identity is still a demo/developer tool.
- The selected preview identity is sent to the server and resolved through the same user and membership services as the rest of the app.
- This is not real authentication and must later be replaced by Teams SSO and Entra-backed authorization.

## Future integration points

- Add Teams app manifest and packaging assets
- Wire Teams theme and host context handling
- Replace preview identity with Teams SSO
- Add persisted authorization records tied to real identities
- Introduce read-only Graph / Teams Shifts integration after role and privacy boundaries are enforced
- Keep live calendar subscription work deferred until backend identity, revocable token support, and privacy controls exist
