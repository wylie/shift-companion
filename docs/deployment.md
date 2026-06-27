# Deployment

## Overview

Deployment has two deliverables:

1. the web app and API deployment
2. the Teams app package that points at that deployment

The app should be deployed as a lightweight web service. The Teams package is metadata and icons, not hosted application logic.

## Environment checklist

Recommended deployment variables:

- `PORT`
- `DATABASE_URL`
- `APP_BASE_URL`
- `FEEDBACK_EMAIL`
- `APP_DOCUMENTATION_URL`
- `ENTRA_CLIENT_ID`
- `ENTRA_TENANT_ID`
- `ENTRA_APP_ID_URI`

If Teams packaging is part of the release process, also configure:

- `TEAMS_APP_ID`
- `TEAMS_APP_NAME_SHORT`
- `TEAMS_APP_NAME_FULL`
- `TEAMS_DEVELOPER_NAME`
- `TEAMS_DEVELOPER_WEBSITE_URL`
- `TEAMS_PRIVACY_POLICY_URL`
- `TEAMS_TERMS_OF_USE_URL`
- `TEAMS_VALID_DOMAINS`

## Startup expectations

On startup the API now validates:

- `PORT`
- `APP_BASE_URL` format
- `APP_DOCUMENTATION_URL` format
- `DATABASE_URL` format
- `FEEDBACK_EMAIL` format
- partial Teams SSO configuration

The process exits on invalid required configuration combinations and logs warnings for non-fatal issues such as in-memory mode or missing feedback email.

## Health checks

The API exposes:

```text
/api/health
```

The endpoint returns:

- app version
- runtime mode details
- feedback and Teams SSO configuration flags
- database health status

Use this endpoint for deployment smoke checks and external uptime probes.

## CI/CD

### Continuous integration

`.github/workflows/ci.yml` runs on pull requests and pushes to `main`.

It performs:

- `npm ci`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`

`actions/setup-node` provides npm dependency caching.

### Release validation

`.github/workflows/release.yml` runs on tags matching `v*.*.*`.

It performs:

- `npm ci`
- `npm run version:check`
- `npm run release:check`
- `npm run typecheck`
- `npm run lint`
- `npm run test`
- `npm run build`
- `npm run teams:validate`
- `npm run teams:package`

It also:

- verifies the pushed tag matches `package.json`
- extracts the matching `CHANGELOG.md` section for release notes
- uploads the Teams app package as a workflow artifact
- creates a GitHub Release for the pushed tag

## Release workflow documentation

Recommended release flow:

1. Finish the intended changes.
2. Update `CHANGELOG.md`.
3. Bump `package.json` with an appropriate SemVer version.
4. Run `npm run release:verify`.
5. Commit the release preparation changes.
6. Create a Git tag in the form `vX.Y.Z`.
7. Optionally run `npm run release:check -- vX.Y.Z` locally before pushing the tag.
8. Push the branch and tag when ready for GitHub Actions to validate the release and create the GitHub Release entry.

This repo now includes local and CI checks for version metadata and automated GitHub Release creation. It still does not publish npm packages.

## Teams deployment notes

- `APP_BASE_URL` should resolve to the deployed HTTPS app URL.
- The Teams manifest package must use domains that match the deployment environment.
- Teams SSO must be aligned with the Entra app registration used by the server.

Additional setup references:

- [release-checklist.md](release-checklist.md)
- [release-process.md](release-process.md)
- [entra-sso-setup.md](entra-sso-setup.md)
- [teams-local-testing.md](teams-local-testing.md)
