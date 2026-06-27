# Release Checklist

## Release target

`v0.1.0`

## Verification summary

- [x] migration complete
- [x] seed complete
- [x] build passing
- [x] CI passing
- [x] documentation complete
- [x] version verified
- [x] ready for GitHub

## What was verified

### Local engineering checks

- `npm run db:migrate`
- `npm run db:seed`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run release:verify`
- `npm run release:check -- v0.1.0`

### Running app checks

- App starts successfully in local dev mode
- Browser preview loads and renders correctly on desktop and mobile-sized layouts
- Preview identity switching works between staff and manager users
- Persisted unavailability create and delete flows work through the API-backed app
- Schedule data loads for the selected preview identity
- Calendar export returns a valid `.ics` payload
- Settings shows app version, build environment, data source, feedback links, and documentation link when configured
- Manager View still functions as an experimental read-only demo surface
- Health endpoint reports a healthy Postgres-backed runtime
- Tagged releases can validate the version/tag match and create a GitHub Release from `CHANGELOG.md`

## Recommendation

This project is ready for `v0.1.0` as a public MVP release.

That recommendation assumes the product is presented honestly as a lightweight companion:

- browser preview is still a demo/development mode
- manager review remains experimental and read-only
- Microsoft Graph and live Teams Shifts integrations are future work
- Teams SSO architecture is present, but tenant-specific production setup is still environment-dependent

Within that scope, the current release candidate is in good shape for GitHub publication and first-round MVP feedback.
