# Data Model

## Organization

- Purpose: top-level YMCA or operating organization that owns departments, users, and scheduling data.
- Key fields: `id`, `name`, `timezone`
- Privacy notes: organization membership alone should not grant access to staff schedules or unavailability.
- Status: future persisted data

## Department

- Purpose: a Teams Shifts department such as Wellness, Front Desk, Membership, Child Watch, or Facilities.
- Key fields: `id`, `name`
- Privacy notes: department membership and manager assignment determine scope; department names should not expose staff data on their own.
- Status: mocked/local data now, future persisted data later

## User

- Purpose: represents a staff member or manager using the app.
- Key fields: `id`, `name`, `role`
- Privacy notes: staff schedule access must remain current-user-only and manager access must later be enforced server-side.
- Status: mocked/local preview identities now, future persisted identity-backed data later

## DepartmentMembership

- Purpose: assigns a user to a department with a scoped role.
- Key fields: `id`, `userId`, `departmentId`, `role`
- Privacy notes: manager access must remain department-scoped and should later come from persisted authorization records.
- Status: mocked/local data now, future persisted data later

## UnavailabilityRule

- Purpose: stores staff-entered unavailable times for recurring, one-time, and date-range conflicts.
- Key fields: `id`, `userId`, `type`, `dayOfWeek`, `date`, `startDate`, `endDate`, `startTime`, `endTime`, `note`
- Privacy notes: staff unavailability access must remain current-user-only; managers should only review conflicts inside assigned departments.
- Status: mocked/local data now, future persisted data later

## Shift

- Purpose: represents an individual scheduled shift shown in My Schedule and Manager View.
- Key fields: `id`, `userId`, `department`, `title`, `start`, `end`, `location`
- Privacy notes: staff schedule access must remain current-user-only and calendar export must remain individual-only.
- Status: mocked/local data now, future persisted data later

## AuditEvent

- Purpose: records notable user actions such as unavailability changes, calendar downloads, and manager conflict reviews.
- Key fields: `id`, `actorUserId`, `timestamp`, `summary`
- Privacy notes: audit visibility should stay narrowly scoped and should not expose unnecessary personal details.
- Status: mocked/local data now, future persisted data later

## CalendarExportToken

- Purpose: future-only token for revocable calendar subscription access outside the app.
- Key fields: `id`, `userId`, `tokenHash`, `createdAt`, `revokedAt`, `lastUsedAt`
- Privacy notes: calendar export must remain individual-only, and future subscription tokens must be revocable and hashed at rest.
- Status: future persisted data only
