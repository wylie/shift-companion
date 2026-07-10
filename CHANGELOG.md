# Changelog

All notable changes to this project will be documented in this file.

The format follows Keep a Changelog, and versions follow Semantic Versioning.

## [Unreleased]

### Changed

- Documentation, CI/CD, runtime validation, health reporting, and release infrastructure are being hardened without expanding product scope.

## [0.3.0] - 2026-07-09

### Added

- Private, revocable calendar subscription feeds backed by the active schedule provider and the resolved current app user.
- Calendar subscription management APIs for generate/regenerate, status, revoke, and token-authenticated ICS feed access.
- Preview/demo-aware Calendar UI controls for managing private subscription URLs without exposing stored raw tokens.

### Changed

- Hardened calendar event generation with stable opaque UIDs, minimal event content, and safer feed headers.
- Clarified documentation around rolling calendar feed ranges, preview/demo limitations, and subscription privacy expectations.

## [0.2.0] - 2026-06-26

### Added

- Microsoft/Graph integration groundwork with explicit preview-vs-Microsoft provider boundaries, safe feature flags, and lightweight provider status reporting.

### Changed

- Clarified that Neon-backed demo data remains the source of truth for app-owned unavailability while future Teams Shifts data is still stubbed.

## [0.1.3] - 2026-06-26

### Fixed

- Synchronized `package.json`, release automation, and changelog metadata after the failed `v0.1.2` release attempt.
- Hardened the tagged release flow so GitHub Releases validate the pushed tag against `package.json` and publish changelog-backed release notes.

## [0.1.0] - 2026-06-26

### Added

- Persistent Neon/Postgres-backed demo data with repeatable migrations and seed flow
- Staff unavailability management, including recurring weekly rules
- Personal schedule review and one-time `.ics` calendar export
- Lightweight Settings feedback entry for feature requests and bug reports
- Release-ready project documentation and GitHub Actions CI
- Teams-ready architecture with browser preview, packaging, and Entra SSO scaffolding
