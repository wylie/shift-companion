# Data Model

## Organization

- Purpose: top-level YMCA or operating organization that owns departments, users, shifts, and audit data.
- Key fields: `id`, `name`, `timezone`, `isDemo`
- Privacy notes: organization membership alone does not grant schedule or unavailability access.
- Status: persisted demo data now, future live org data later

## Department

- Purpose: Teams Shifts department such as Wellness, Front Desk, Membership, Child Watch, or Facilities.
- Key fields: `id`, `organizationId`, `name`, `isDemo`
- Privacy notes: manager access stays department-scoped; department names alone should not expose staff data.
- Status: persisted demo data now

## User

- Purpose: staff member or manager identity used by the app.
- Key fields: `id`, `organizationId`, `name`, `role`, `isDemo`
- Privacy notes: staff schedule and unavailability access remain current-user-only; preview identity is not real authentication.
- Status: persisted demo data now, real identity integration later

## DepartmentMembership

- Purpose: assigns a user to a department with a scoped role.
- Key fields: `id`, `userId`, `departmentId`, `role`
- Privacy notes: manager access remains department-scoped and must later be enforced with real identity-backed authorization.
- Status: persisted demo data now

## UnavailabilityRule

- Purpose: stores staff-entered unavailable times for recurring, one-time, and date-range conflicts.
- Key fields: `id`, `userId`, `type`, `daysOfWeek`, `startTime`, `endTime`, `date`, `startDate`, `endDate`, `note`, `createdAt`, `updatedAt`
- Privacy notes: staff unavailability remains current-user-only; manager conflict review should only surface rules for staff in assigned departments.
- Status: persisted demo data now

## Shift

- Purpose: individual scheduled shift shown in My Schedule, Manager View, and personal calendar downloads.
- Key fields: `id`, `userId`, `departmentId`, `title`, `location`, `start`, `end`, `createdAt`, `updatedAt`
- Privacy notes: staff schedule access remains current-user-only and calendar export remains individual-only.
- Status: persisted demo data now

## AuditEvent

- Purpose: records notable user actions such as unavailability changes, calendar downloads, and manager conflict reviews.
- Key fields: `id`, `actorUserId`, `eventType`, `summary`, `timestamp`
- Privacy notes: audit visibility stays narrowly scoped to the current preview identity in the current product.
- Status: persisted demo data now

## CalendarExportToken

- Purpose: future-only token for revocable calendar subscription access outside the app.
- Key fields: `id`, `userId`, `tokenHash`, `createdAt`, `revokedAt`, `lastUsedAt`
- Privacy notes: future subscription tokens must be revocable, individual-only, and hashed at rest.
- Status: future persisted data only

## Privacy modeling notes

- Staff schedule access remains current-user-only.
- Staff unavailability access remains current-user-only.
- Manager access remains department-scoped.
- Calendar export remains individual-only.
- Future subscription tokens should be revocable and hashed at rest.
