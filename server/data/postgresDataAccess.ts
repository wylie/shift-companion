import { and, desc, eq, gte, inArray, isNull } from "drizzle-orm";
import { getDb } from "../db/connection.js";
import {
  auditEventsTable,
  calendarSubscriptionsTable,
  departmentMembershipsTable,
  departmentsTable,
  organizationsTable,
  shiftsTable,
  unavailabilityRulesTable,
  usersTable,
} from "../db/schema.js";
import type { AppDataAccess } from "./types.js";
import type {
  AuditEvent,
  CurrentUser,
  Department,
  DepartmentMembership,
  Shift,
  UnavailabilityRule,
} from "../../src/types.js";
import { normalizeUnavailabilityRule } from "../../src/lib/unavailability.js";

function toUserDepartmentsMap(
  memberships: Array<{ userId: string; departmentId: string }>,
) {
  const userDepartments = new Map<string, string[]>();

  memberships.forEach((membership) => {
    const current = userDepartments.get(membership.userId) ?? [];
    current.push(membership.departmentId);
    userDepartments.set(membership.userId, current);
  });

  return userDepartments;
}

function mapUser(
  row: typeof usersTable.$inferSelect,
  teamIds: string[],
): CurrentUser {
  return {
    email: row.email ?? undefined,
    entraObjectId: row.entraObjectId ?? undefined,
    id: row.id,
    isDemo: row.isDemo,
    organizationId: row.organizationId,
    name: row.name,
    role: row.role as CurrentUser["role"],
    teamIds,
    tenantId: row.tenantId ?? undefined,
    userPrincipalName: row.userPrincipalName ?? undefined,
  };
}

function mapDepartment(row: typeof departmentsTable.$inferSelect): Department {
  return {
    id: row.id,
    organizationId: row.organizationId,
    name: row.name,
    isDemo: row.isDemo,
  };
}

function mapRule(
  row: typeof unavailabilityRulesTable.$inferSelect,
): UnavailabilityRule {
  return normalizeUnavailabilityRule({
    id: row.id,
    userId: row.userId,
    type: row.type as UnavailabilityRule["type"],
    daysOfWeek: row.daysOfWeek,
    dayOfWeek: row.daysOfWeek[0],
    startTime: row.startTime ?? undefined,
    endTime: row.endTime ?? undefined,
    date: row.oneTimeDate ?? undefined,
    startDate: row.startDate ?? undefined,
    endDate: row.endDate ?? undefined,
    note: row.note,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  });
}

function mapShift(
  row: typeof shiftsTable.$inferSelect & { departmentName?: string },
): Shift {
  return {
    id: row.id,
    userId: row.userId,
    departmentId: row.departmentId,
    department: row.departmentName,
    title: row.title,
    start: row.startAt.toISOString(),
    end: row.endAt.toISOString(),
    location: row.location,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function mapAuditEvent(row: typeof auditEventsTable.$inferSelect): AuditEvent {
  return {
    id: row.id,
    actorUserId: row.actorUserId,
    timestamp: row.createdAt.toISOString(),
    summary: row.summary,
    eventType: row.eventType,
  };
}

function mapMembership(
  row: typeof departmentMembershipsTable.$inferSelect,
): DepartmentMembership {
  return {
    id: row.id,
    userId: row.userId,
    departmentId: row.departmentId,
    role: row.role as DepartmentMembership["role"],
  };
}

function mapCalendarSubscription(
  row: typeof calendarSubscriptionsTable.$inferSelect,
) {
  return {
    id: row.id,
    userId: row.userId,
    tokenHash: row.tokenHash,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    revokedAt: row.revokedAt?.toISOString(),
  };
}

export function createPostgresDataAccess(): AppDataAccess {
  const db = getDb();
  const unavailabilityRulesRepository: AppDataAccess["unavailabilityRules"] = {
    async create(rule) {
      await db.insert(unavailabilityRulesTable).values({
        id: rule.id,
        userId: rule.userId,
        type: rule.type,
        daysOfWeek: rule.daysOfWeek ?? [],
        startTime: rule.startTime ?? null,
        endTime: rule.endTime ?? null,
        oneTimeDate: rule.date ?? null,
        startDate: rule.startDate ?? null,
        endDate: rule.endDate ?? null,
        note: rule.note,
      });

      const created = await unavailabilityRulesRepository.getById(rule.id);

      if (!created) {
        throw new Error("Failed to create unavailability rule.");
      }

      return created;
    },
    async delete(ruleId) {
      await db
        .delete(unavailabilityRulesTable)
        .where(eq(unavailabilityRulesTable.id, ruleId));
    },
    async getById(ruleId) {
      const [row] = await db
        .select()
        .from(unavailabilityRulesTable)
        .where(eq(unavailabilityRulesTable.id, ruleId))
        .limit(1);
      return row ? mapRule(row) : undefined;
    },
    async listAll() {
      const rows = await db.select().from(unavailabilityRulesTable);
      return rows.map(mapRule);
    },
    async listForUser(userId) {
      const rows = await db
        .select()
        .from(unavailabilityRulesTable)
        .where(eq(unavailabilityRulesTable.userId, userId));
      return rows.map(mapRule);
    },
    async update(rule) {
      await db
        .update(unavailabilityRulesTable)
        .set({
          type: rule.type,
          daysOfWeek: rule.daysOfWeek ?? [],
          startTime: rule.startTime ?? null,
          endTime: rule.endTime ?? null,
          oneTimeDate: rule.date ?? null,
          startDate: rule.startDate ?? null,
          endDate: rule.endDate ?? null,
          note: rule.note,
          updatedAt: new Date(),
        })
        .where(eq(unavailabilityRulesTable.id, rule.id));

      const updated = await unavailabilityRulesRepository.getById(rule.id);

      if (!updated) {
        throw new Error("Failed to update unavailability rule.");
      }

      return updated;
    },
  };

  return {
    auditEvents: {
      async create(event) {
        await db.insert(auditEventsTable).values({
          id: event.id,
          actorUserId: event.actorUserId,
          createdAt: new Date(event.timestamp),
          eventType: event.eventType ?? "audit.event",
          summary: event.summary,
          metadata: {},
        });

        return event;
      },
      async findRecentBySummary({
        actorUserId,
        eventType,
        summary,
        withinHours,
      }) {
        const cutoff = new Date(Date.now() - withinHours * 60 * 60 * 1000);
        const [row] = await db
          .select()
          .from(auditEventsTable)
          .where(
            and(
              eq(auditEventsTable.actorUserId, actorUserId),
              eq(auditEventsTable.eventType, eventType),
              eq(auditEventsTable.summary, summary),
              gte(auditEventsTable.createdAt, cutoff),
            ),
          )
          .orderBy(desc(auditEventsTable.createdAt))
          .limit(1);

        return row ? mapAuditEvent(row) : undefined;
      },
      async listAll() {
        const rows = await db
          .select()
          .from(auditEventsTable)
          .orderBy(desc(auditEventsTable.createdAt));
        return rows.map(mapAuditEvent);
      },
      async listForUser(userId) {
        const rows = await db
          .select()
          .from(auditEventsTable)
          .where(eq(auditEventsTable.actorUserId, userId))
          .orderBy(desc(auditEventsTable.createdAt));
        return rows.map(mapAuditEvent);
      },
    },
    calendarSubscriptions: {
      async getActiveByTokenHash(tokenHash) {
        const [row] = await db
          .select()
          .from(calendarSubscriptionsTable)
          .where(
            and(
              eq(calendarSubscriptionsTable.tokenHash, tokenHash),
              isNull(calendarSubscriptionsTable.revokedAt),
            ),
          )
          .limit(1);

        return row ? mapCalendarSubscription(row) : undefined;
      },
      async getForUser(userId) {
        const [row] = await db
          .select()
          .from(calendarSubscriptionsTable)
          .where(eq(calendarSubscriptionsTable.userId, userId))
          .limit(1);

        return row ? mapCalendarSubscription(row) : undefined;
      },
      async save(subscription) {
        await db
          .insert(calendarSubscriptionsTable)
          .values({
            id: subscription.id,
            userId: subscription.userId,
            tokenHash: subscription.tokenHash,
            createdAt: new Date(subscription.createdAt),
            updatedAt: new Date(subscription.updatedAt),
            revokedAt: subscription.revokedAt
              ? new Date(subscription.revokedAt)
              : null,
          })
          .onConflictDoUpdate({
            target: calendarSubscriptionsTable.userId,
            set: {
              tokenHash: subscription.tokenHash,
              updatedAt: new Date(subscription.updatedAt),
              revokedAt: subscription.revokedAt
                ? new Date(subscription.revokedAt)
                : null,
            },
          });

        const saved = await this.getForUser(subscription.userId);

        if (!saved) {
          throw new Error("Failed to save calendar subscription.");
        }

        return saved;
      },
    },
    departments: {
      async getById(departmentId) {
        const [row] = await db
          .select()
          .from(departmentsTable)
          .where(eq(departmentsTable.id, departmentId))
          .limit(1);

        return row ? mapDepartment(row) : undefined;
      },
      async listAll() {
        const rows = await db.select().from(departmentsTable);
        return rows.map(mapDepartment);
      },
      async listForUser(userId) {
        const rows = await db
          .select({ department: departmentsTable })
          .from(departmentMembershipsTable)
          .innerJoin(
            departmentsTable,
            eq(departmentMembershipsTable.departmentId, departmentsTable.id),
          )
          .where(eq(departmentMembershipsTable.userId, userId));

        return rows.map((row) => mapDepartment(row.department));
      },
    },
    memberships: {
      async listAll() {
        const rows = await db.select().from(departmentMembershipsTable);
        return rows.map(mapMembership);
      },
      async listForDepartment(departmentId) {
        const rows = await db
          .select()
          .from(departmentMembershipsTable)
          .where(eq(departmentMembershipsTable.departmentId, departmentId));
        return rows.map(mapMembership);
      },
      async listForUser(userId) {
        const rows = await db
          .select()
          .from(departmentMembershipsTable)
          .where(eq(departmentMembershipsTable.userId, userId));
        return rows.map(mapMembership);
      },
    },
    organizations: {
      async getDemoOrganization() {
        const [row] = await db
          .select()
          .from(organizationsTable)
          .where(eq(organizationsTable.isDemo, true))
          .limit(1);

        if (!row) {
          throw new Error("Demo organization not found.");
        }

        return {
          id: row.id,
          name: row.name,
          timezone: row.timezone,
          isDemo: row.isDemo,
        };
      },
    },
    shifts: {
      async listAll() {
        const rows = await db
          .select({
            shift: shiftsTable,
            departmentName: departmentsTable.name,
          })
          .from(shiftsTable)
          .innerJoin(
            departmentsTable,
            eq(shiftsTable.departmentId, departmentsTable.id),
          );

        return rows.map((row) =>
          mapShift({
            ...row.shift,
            departmentName: row.departmentName,
          }),
        );
      },
      async listForDepartment(departmentId) {
        const rows = await db
          .select({
            shift: shiftsTable,
            departmentName: departmentsTable.name,
          })
          .from(shiftsTable)
          .innerJoin(
            departmentsTable,
            eq(shiftsTable.departmentId, departmentsTable.id),
          )
          .where(eq(shiftsTable.departmentId, departmentId));

        return rows.map((row) =>
          mapShift({
            ...row.shift,
            departmentName: row.departmentName,
          }),
        );
      },
      async listForUser(userId) {
        const rows = await db
          .select({
            shift: shiftsTable,
            departmentName: departmentsTable.name,
          })
          .from(shiftsTable)
          .innerJoin(
            departmentsTable,
            eq(shiftsTable.departmentId, departmentsTable.id),
          )
          .where(eq(shiftsTable.userId, userId));

        return rows.map((row) =>
          mapShift({
            ...row.shift,
            departmentName: row.departmentName,
          }),
        );
      },
    },
    staff: {
      async listAll() {
        const membershipRows = await db
          .select()
          .from(departmentMembershipsTable)
          .where(eq(departmentMembershipsTable.role, "staff"));
        const userIds = membershipRows.map((membership) => membership.userId);

        if (userIds.length === 0) {
          return [];
        }

        const rows = await db
          .select()
          .from(usersTable)
          .where(inArray(usersTable.id, userIds));
        const teamIdsByUser = toUserDepartmentsMap(membershipRows);

        return rows.map((row) => ({
          id: row.id,
          organizationId: row.organizationId,
          name: row.name,
          teamId: teamIdsByUser.get(row.id)?.[0] ?? "",
          role: "staff" as const,
          isDemo: row.isDemo,
        }));
      },
      async listForDepartment(departmentId) {
        const membershipRows = await db
          .select()
          .from(departmentMembershipsTable)
          .where(
            and(
              eq(departmentMembershipsTable.departmentId, departmentId),
              eq(departmentMembershipsTable.role, "staff"),
            ),
          );
        const userIds = membershipRows.map((membership) => membership.userId);

        if (userIds.length === 0) {
          return [];
        }

        const rows = await db
          .select()
          .from(usersTable)
          .where(inArray(usersTable.id, userIds));

        return rows.map((row) => ({
          id: row.id,
          organizationId: row.organizationId,
          name: row.name,
          teamId: departmentId,
          role: "staff" as const,
          isDemo: row.isDemo,
        }));
      },
    },
    unavailabilityRules: unavailabilityRulesRepository,
    users: {
      async getById(userId) {
        const [userRow] = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.id, userId))
          .limit(1);

        if (!userRow) {
          return undefined;
        }

        const membershipRows = await db
          .select()
          .from(departmentMembershipsTable)
          .where(eq(departmentMembershipsTable.userId, userId));

        return mapUser(
          userRow,
          membershipRows.map((membership) => membership.departmentId),
        );
      },
      async getByEntraIdentity({
        email,
        entraObjectId,
        tenantId,
        userPrincipalName,
      }) {
        const membershipRows = await db
          .select()
          .from(departmentMembershipsTable);
        const teamIdsByUser = toUserDepartmentsMap(membershipRows);

        if (entraObjectId) {
          const [userRow] = await db
            .select()
            .from(usersTable)
            .where(
              and(
                eq(usersTable.tenantId, tenantId),
                eq(usersTable.entraObjectId, entraObjectId),
              ),
            )
            .limit(1);

          if (userRow) {
            return mapUser(userRow, teamIdsByUser.get(userRow.id) ?? []);
          }
        }

        const normalizedUserPrincipalName = userPrincipalName?.toLowerCase();
        const normalizedEmail = email?.toLowerCase();

        if (normalizedUserPrincipalName) {
          const [userRow] = await db
            .select()
            .from(usersTable)
            .where(
              and(
                eq(usersTable.tenantId, tenantId),
                eq(usersTable.userPrincipalName, normalizedUserPrincipalName),
              ),
            )
            .limit(1);

          if (userRow) {
            return mapUser(userRow, teamIdsByUser.get(userRow.id) ?? []);
          }
        }

        if (normalizedEmail) {
          const [userRow] = await db
            .select()
            .from(usersTable)
            .where(
              and(
                eq(usersTable.tenantId, tenantId),
                eq(usersTable.email, normalizedEmail),
              ),
            )
            .limit(1);

          if (userRow) {
            return mapUser(userRow, teamIdsByUser.get(userRow.id) ?? []);
          }
        }

        return undefined;
      },
      async listPreviewUsers() {
        const userRows = await db
          .select()
          .from(usersTable)
          .where(eq(usersTable.isDemo, true));
        const membershipRows = await db
          .select()
          .from(departmentMembershipsTable);
        const teamIdsByUser = toUserDepartmentsMap(membershipRows);

        return userRows.map((row) =>
          mapUser(row, teamIdsByUser.get(row.id) ?? []),
        );
      },
    },
  };
}
