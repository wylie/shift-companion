# Teams Local Testing

## Current state

The app is now Teams-tab-ready, but browser preview is still the primary development mode.

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
- manifest configuration values such as app ID, URLs, and valid domains

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
- The manifest build path is environment-driven so you can swap between placeholder localhost values and a tunnel URL later.

## Current limitations inside Teams

- Preview identity is hidden in Teams mode.
- Teams host context is not yet mapped to a real app user.
- Teams or Entra identity is not yet used for authorization.
- No Graph permissions, Teams Shifts data, or YMCA data are connected.

## Next step

Phase 4 Prompt 2 adds:

- Microsoft Entra SSO
- server-side identity mapping
- the first real connection between Teams runtime identity and app authorization
