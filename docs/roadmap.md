# Roadmap

## Phase 1

Complete. Teams-compatible staff experience with unavailability add, edit, delete, validation, multi-day recurring weekly rules, horizontal weekly schedule view, and personal calendar download.

## Phase 2

Complete. Read-only manager conflict review with identity-scoped departments, weekly review, conflict detection, and staff guardrails.

## Phase 3

Complete. Persistence-ready architecture now includes:

- repository and service boundaries
- Neon/Postgres schema and migration support
- repeatable demo seed data
- persisted unavailability, shifts, memberships, and audit events
- server-side calendar download generation
- server-side department-scoped manager review queries

## Phase 4

Complete.

- Teams runtime detection and safe browser-preview fallback
- Teams app packaging and manifest template with `webApplicationInfo`
- Teams tab SSO token request flow
- Server-side Entra token verification
- Persisted Teams-user to app-user mapping
- Teams-mode server authorization using the mapped persisted user
- Browser preview preserved with the existing Preview identity selector

## Phase 5

Read-only Microsoft Graph / Teams Shifts integration

## Phase 6

Private revocable calendar subscription feed

## Phase 7

Hardening for production authorization, persistence operations, and admin controls
