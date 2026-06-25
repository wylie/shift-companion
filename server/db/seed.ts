import { eq, inArray } from "drizzle-orm";
import { closePool, getDb } from "./connection";
import {
  auditEvents,
  demoOrganization,
  departmentMemberships,
  departments,
  mockUsers,
  shifts,
  staffMembers,
  unavailabilityRules,
} from "../../src/data/mockData";
import {
  auditEventsTable,
  departmentMembershipsTable,
  departmentsTable,
  organizationsTable,
  shiftsTable,
  unavailabilityRulesTable,
  usersTable,
} from "./schema";

async function main() {
  const db = getDb();
  const departmentIds = departments.map((department) => department.id);
  const userRecords = [
    ...mockUsers,
    ...staffMembers.filter(
      (member) => !mockUsers.some((user) => user.id === member.id),
    ),
  ];
  const userIds = userRecords.map((user) => user.id);

  await db
    .delete(auditEventsTable)
    .where(inArray(auditEventsTable.actorUserId, userIds));
  await db
    .delete(unavailabilityRulesTable)
    .where(inArray(unavailabilityRulesTable.userId, userIds));
  await db.delete(shiftsTable).where(inArray(shiftsTable.userId, userIds));
  await db
    .delete(departmentMembershipsTable)
    .where(inArray(departmentMembershipsTable.userId, userIds));
  await db.delete(usersTable).where(inArray(usersTable.id, userIds));
  await db
    .delete(departmentsTable)
    .where(inArray(departmentsTable.id, departmentIds));
  await db
    .delete(organizationsTable)
    .where(eq(organizationsTable.id, demoOrganization.id));

  await db.insert(organizationsTable).values({
    id: demoOrganization.id,
    name: demoOrganization.name,
    timezone: demoOrganization.timezone,
    isDemo: demoOrganization.isDemo,
  });

  await db.insert(departmentsTable).values(
    departments.map((department) => ({
      id: department.id,
      organizationId: department.organizationId,
      name: department.name,
      isDemo: department.isDemo,
    })),
  );

  await db.insert(usersTable).values(
    userRecords.map((user) => ({
      email:
        "email" in user && typeof user.email === "string"
          ? user.email.toLowerCase()
          : null,
      entraObjectId:
        "entraObjectId" in user && typeof user.entraObjectId === "string"
          ? user.entraObjectId
          : null,
      id: user.id,
      organizationId: user.organizationId,
      name: user.name,
      role: user.role,
      tenantId:
        "tenantId" in user && typeof user.tenantId === "string"
          ? user.tenantId
          : null,
      userPrincipalName:
        "userPrincipalName" in user && typeof user.userPrincipalName === "string"
          ? user.userPrincipalName.toLowerCase()
          : null,
      isDemo: user.isDemo,
    })),
  );

  await db.insert(departmentMembershipsTable).values(
    departmentMemberships.map((membership) => ({
      id: membership.id,
      userId: membership.userId,
      departmentId: membership.departmentId,
      role: membership.role,
    })),
  );

  await db.insert(unavailabilityRulesTable).values(
    unavailabilityRules.map((rule) => ({
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
    })),
  );

  await db.insert(shiftsTable).values(
    shifts.map((shift) => ({
      id: shift.id,
      userId: shift.userId,
      departmentId: shift.departmentId ?? "",
      title: shift.title,
      location: shift.location,
      startAt: new Date(shift.start),
      endAt: new Date(shift.end),
    })),
  );

  await db.insert(auditEventsTable).values(
    auditEvents.map((event) => ({
      id: event.id,
      actorUserId: event.actorUserId,
      eventType: event.eventType ?? "audit.event",
      summary: event.summary,
      createdAt: new Date(event.timestamp),
      metadata: {},
    })),
  );

  await closePool();
  console.log(
    "Seeded demo organization, users, departments, shifts, rules, and audit events.",
  );
}

main().catch(async (error) => {
  console.error("Seed failed.");
  console.error(error);
  await closePool();
  process.exitCode = 1;
});
