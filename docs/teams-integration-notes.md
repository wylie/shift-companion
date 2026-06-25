# Teams Integration Notes

## Current approach

- Use `@microsoft/teams-js` so the client shell stays aligned with a future Teams tab app.
- Keep browser preview working outside Teams.
- Use a small Express API for persisted demo data, authorization checks, and server-side calendar downloads.
- Keep real auth and Graph integration out of scope until the product boundary is stable.
- Distinguish browser preview from Teams runtime in one centralized runtime layer.

## Current implementation boundaries

- `src/App.tsx` owns app-shell state and preview identity switching.
- `src/lib/teams.ts` owns Teams runtime detection, SDK initialization, and safe context fallback.
- `src/data/apiClient.ts` is the client-side service layer used by React components.
- `server/data/*` owns repository implementations for Postgres and fallback mock data.
- `server/services/appService.ts` owns authorization-aware application behavior.
- `server/app.ts` owns HTTP routes and safe error handling.
- `src/lib/conflicts.ts` and `src/lib/calendar.ts` remain reusable domain utilities.
- `teams-app/manifest.template.json` and `scripts/teams-manifest-utils.mjs` own Teams packaging inputs.

## Runtime behavior

### Browser preview

- Runs as the primary development and demo mode.
- Shows the Preview identity selector.
- Keeps the current demo-data framing and existing sidebar user card.

### Teams mode

- Initializes the Teams JavaScript SDK only when the app is embedded.
- Retrieves safe host context details such as tenant ID, host/client type, and user context fields when available.
- Hides the Preview identity selector and replaces it with a neutral Teams workspace indicator.
- Does not yet claim the Teams host user is authenticated or authorized for app data access.
- Continues to use demo data until Entra SSO and server-side identity mapping are added.

## Demo identity model

- Preview identity is still a demo/developer tool.
- The selected preview identity is sent to the server and resolved through the same user and membership services as the rest of the app.
- This is not real authentication and must later be replaced by Teams SSO and Entra-backed authorization.
- Preview identity is intentionally hidden when the app detects a Teams host.

## Packaging notes

- The Teams app package contains only the manifest and placeholder icons; Teams doesn't host the app itself.
- The current package targets the smallest appropriate scope for this product: a personal static tab.
- No Graph permissions, bots, messaging extensions, or other unnecessary capabilities are included.
- Manifest values are environment-driven so localhost and future tunnel domains can be configured without hard-coding production values.

## Future integration points

- Wire Teams theme and host context handling more fully
- Replace preview identity with Teams SSO
- Add persisted authorization records tied to real identities
- Introduce read-only Graph / Teams Shifts integration after role and privacy boundaries are enforced
- Keep live calendar subscription work deferred until backend identity, revocable token support, and privacy controls exist
