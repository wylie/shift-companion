# Entra SSO Setup

## Purpose

This app now supports Teams tab SSO with server-side Microsoft Entra token verification. Browser preview still works without these values, but Teams mode requires them.

## Required configuration values

Set these in `.env`:

- `APP_BASE_URL`: HTTPS URL Teams will load for the tab
- `TEAMS_APP_ID`: Teams app manifest ID
- `ENTRA_CLIENT_ID`: Microsoft Entra application or client ID
- `ENTRA_TENANT_ID`: tenant ID for the Microsoft 365 test tenant
- `ENTRA_APP_ID_URI`: application ID URI or resource, typically `api://<ENTRA_CLIENT_ID>`

## Entra app registration

Create an Entra app registration for the tab backend identity used by Teams SSO.

Configure:

- Application or client ID: maps to `ENTRA_CLIENT_ID`
- Tenant ID: maps to `ENTRA_TENANT_ID`
- Application ID URI: maps to `ENTRA_APP_ID_URI`
- Supported account type: use the tenant scope you intend to test first
- Redirect and app-platform settings: follow the current Teams tab SSO guidance for your tenant and host setup

The app does not request Microsoft Graph permissions in this phase.

## Teams manifest linkage

The Teams manifest uses:

- `id`: `TEAMS_APP_ID`
- `webApplicationInfo.id`: `ENTRA_CLIENT_ID`
- `webApplicationInfo.resource`: `ENTRA_APP_ID_URI`
- static tab URLs: derived from `APP_BASE_URL`

These values must agree with the Entra app registration and the URL that Teams can actually load.

## Server verification behavior

In Teams mode:

1. The client requests a Teams SSO token with the Teams SDK.
2. The token is sent to the Express API in the `Authorization` header.
3. The server validates:
   - signature against Microsoft Entra signing keys
   - issuer
   - audience
   - tenant
   - active and expiry timestamps
4. The server extracts stable identity fields such as tenant ID, Entra object ID, and user principal name.
5. The verified identity is mapped to a persisted app user.

If verification fails, the server does not return staff or manager data.

## User mapping

Persisted users now support:

- `tenantId`
- `entraObjectId`
- `email`
- `userPrincipalName`

The server looks up a Teams user by:

1. `tenantId + entraObjectId`
2. `tenantId + userPrincipalName`
3. `tenantId + email`

The app does not auto-create users in this phase.

## Unmapped users

If a Teams user is authenticated but not mapped to a persisted app user:

- the app shows a setup-needed message
- no schedule, unavailability, manager, or calendar-export data is returned
- the user must be mapped in the persisted app data before Teams mode can proceed

## Browser preview fallback

If these Entra values are missing:

- browser preview still works with the Preview identity selector
- Teams mode shows setup-needed or token-unavailable messaging instead of crashing

## Current scope limits

- No Microsoft Graph access
- No Teams Shifts data access
- No YMCA source-system integration
- No live calendar subscription URLs or tokens
