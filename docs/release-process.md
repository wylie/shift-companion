# Release Process

## Goal

This project uses lightweight tagged releases for MVP delivery. The release flow is intentionally small:

- keep `package.json` and `CHANGELOG.md` aligned
- require a clean local state
- refuse mismatched tags
- let GitHub Actions create the GitHub Release from the pushed tag

## Changelog discipline

`CHANGELOG.md` should keep a simple structure:

```md
# Changelog

## [Unreleased]

## [0.1.0] - YYYY-MM-DD

### Added
- ...
```

Guidelines:

- do not rewrite useful released history unnecessarily
- keep an `## [Unreleased]` section at the top
- add the new released section before tagging
- keep the release tag and the released changelog version identical

## Versioning guidance

This repo follows Semantic Versioning:

- `PATCH` for fixes, small hardening work, and non-breaking maintenance
- `MINOR` for backward-compatible additions that still fit the companion scope
- `MAJOR` for intentional breaking changes to contracts, runtime behavior, or data expectations

## Release flow

1. Make sure `main` is green in GitHub Actions.
2. Make sure the Vercel deployment is green if that environment is part of the release path.
3. Confirm the local worktree is clean.
4. Update `package.json` with the intended version.
5. Update `CHANGELOG.md` with the matching released section.
6. Run local verification:

```bash
npm run version:check
npm run release:check -- v0.1.0
npm run lint
npm run test
npm run build
```

7. Commit and push the release preparation changes.
8. Create and push an annotated tag:

```bash
git tag -a v0.1.0 -m "v0.1.0"
git push origin v0.1.0
```

9. GitHub Actions runs `.github/workflows/release.yml`.
10. The workflow validates the tag/version match, extracts release notes from `CHANGELOG.md`, packages the Teams artifact, and creates the GitHub Release.

## Guardrails

- Do not tag if CI is failing.
- Do not tag if the Vercel deployment is failing when that deployment is part of the release gate.
- Do not create releases from a dirty local state.
- The Git tag must match `package.json` exactly.
