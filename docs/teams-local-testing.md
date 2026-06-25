# Teams Local Testing

## Current state

The app now supports both browser preview and Teams-tab SSO flow, but browser preview is still the primary development mode.

You do not need:

- a Microsoft 365 tenant
- the Teams Developer CLI
- a real Teams installation

to keep working locally in the browser after this phase.

## Browser preview

Use the normal local workflow:

```bash
npm run dev
```

This keeps:

- the Preview identity selector
- demo data framing
- local API-backed feature development

## Teams testing prerequisites

Before loading the app inside Teams, you still need:

- a Microsoft 365 developer/test tenant or organization admin support
- a reachable HTTPS development URL or tunnel
- manifest configuration values such as app ID, URLs, valid domains, `ENTRA_CLIENT_ID`, and `ENTRA_APP_ID_URI`
- a matching Entra app registration
- persisted user mappings for any Teams users you expect to test

## Manifest and package workflow

Validate the current manifest inputs:

```bash
npm run teams:validate
```

Assemble a local Teams app package:

```bash
npm run teams:package
```

The package zip is written to:

- `teams-app/dist/teams-shifts-companion.zip`

## URL guidance

- Browser preview can keep using local Vite development URLs.
- Teams normally needs an HTTPS URL it can reach, which usually means a tunnel during development.
- `APP_BASE_URL` drives the tab URLs used in the manifest build.

## Current limitations inside Teams

- Preview identity is hidden in Teams mode.
- Teams or Entra identity must map to a persisted app user before app data will load.
- Unmapped Teams users will see a setup-needed message instead of schedule or manager data.
- No Graph permissions, Teams Shifts data, or YMCA data are connected.

## Manual sideload outline

1. Create or update the Entra app registration described in `docs/entra-sso-setup.md`.
2. Set `.env` values for `APP_BASE_URL`, `TEAMS_APP_ID`, `ENTRA_CLIENT_ID`, `ENTRA_TENANT_ID`, and `ENTRA_APP_ID_URI`.
3. Point `APP_BASE_URL` at an HTTPS tunnel or another Teams-reachable URL.
4. Run `npm run teams:validate`.
5. Run `npm run teams:package`.
6. Upload `teams-app/dist/teams-shifts-companion.zip` to the Microsoft 365 tenant for sideload testing.
7. Confirm the signed-in Teams test account is mapped to a persisted app user.

## Next step

Phase 5 adds read-only Microsoft Graph and Teams Shifts integration after the current identity and authorization boundaries are stable.
