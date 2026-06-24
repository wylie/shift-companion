# Teams Integration Notes

## Current approach

- Use `@microsoft/teams-js` now so the client shell stays aligned with a future Teams tab app.
- Keep local browser preview working without requiring a Teams host.
- Avoid auth and Graph integration until the product scope is validated with mocked data.

## Future integration points

- Add Teams app manifest and packaging assets
- Wire Teams theme/context handling
- Add Teams SSO once product scope is stable
- Keep calendar subscription work deferred until backend identity and revocable token support exist
- Introduce read-only Graph / Shifts integration after role and privacy boundaries are enforced

## Notes for implementation

- `src/lib/teams.ts` is the placeholder for Teams SDK initialization.
- `src/App.tsx` is the main place to extend host context, theming, and future auth bootstrapping.
- Manager-only UI in `src/components/ManagerView.tsx` must eventually be backed by server-side authorization.
