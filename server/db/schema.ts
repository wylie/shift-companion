import {
  boolean,
  date,
  index,
  jsonb,
  pgTable,
  text,
  time,
  timestamp,
  uniqueIndex,
} from "drizzle-orm/pg-core";

export const organizationsTable = pgTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  timezone: text("timezone").notNull(),
  isDemo: boolean("is_demo").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
});

export const departmentsTable = pgTable(
  "departments",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    isDemo: boolean("is_demo").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    organizationIndex: index("departments_organization_idx").on(
      table.organizationId,
    ),
    organizationNameIndex: uniqueIndex("departments_org_name_uidx").on(
      table.organizationId,
      table.name,
    ),
  }),
);

export const usersTable = pgTable(
  "users",
  {
    id: text("id").primaryKey(),
    organizationId: text("organization_id")
      .notNull()
      .references(() => organizationsTable.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    role: text("role").notNull(),
    tenantId: text("tenant_id"),
    entraObjectId: text("entra_object_id"),
    email: text("email"),
    userPrincipalName: text("user_principal_name"),
    isDemo: boolean("is_demo").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    organizationIndex: index("users_organization_idx").on(table.organizationId),
    tenantEmailIndex: index("users_tenant_email_idx").on(
      table.tenantId,
      table.email,
    ),
    tenantObjectIndex: uniqueIndex("users_tenant_entra_object_uidx").on(
      table.tenantId,
      table.entraObjectId,
    ),
    tenantUpnIndex: index("users_tenant_upn_idx").on(
      table.tenantId,
      table.userPrincipalName,
    ),
  }),
);

export const departmentMembershipsTable = pgTable(
  "department_memberships",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    departmentId: text("department_id")
      .notNull()
      .references(() => departmentsTable.id, { onDelete: "cascade" }),
    role: text("role").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIndex: index("department_memberships_user_idx").on(table.userId),
    departmentIndex: index("department_memberships_department_idx").on(
      table.departmentId,
    ),
    uniqueMembershipIndex: uniqueIndex("department_memberships_uidx").on(
      table.userId,
      table.departmentId,
    ),
  }),
);

export const unavailabilityRulesTable = pgTable(
  "unavailability_rules",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    daysOfWeek: jsonb("days_of_week").$type<string[]>().default([]).notNull(),
    startTime: time("start_time"),
    endTime: time("end_time"),
    oneTimeDate: date("one_time_date"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    note: text("note").notNull().default(""),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userIndex: index("unavailability_rules_user_idx").on(table.userId),
    typeIndex: index("unavailability_rules_type_idx").on(table.type),
  }),
);

export const shiftsTable = pgTable(
  "shifts",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    departmentId: text("department_id")
      .notNull()
      .references(() => departmentsTable.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    location: text("location").notNull(),
    startAt: timestamp("start_at", { withTimezone: true }).notNull(),
    endAt: timestamp("end_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    userStartIndex: index("shifts_user_start_idx").on(
      table.userId,
      table.startAt,
    ),
    departmentStartIndex: index("shifts_department_start_idx").on(
      table.departmentId,
      table.startAt,
    ),
  }),
);

export const auditEventsTable = pgTable(
  "audit_events",
  {
    id: text("id").primaryKey(),
    actorUserId: text("actor_user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    eventType: text("event_type").notNull(),
    summary: text("summary").notNull(),
    metadata: jsonb("metadata").$type<Record<string, string>>().default({}),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => ({
    actorCreatedIndex: index("audit_events_actor_created_idx").on(
      table.actorUserId,
      table.createdAt,
    ),
    eventTypeIndex: index("audit_events_type_idx").on(table.eventType),
  }),
);

export const calendarSubscriptionsTable = pgTable(
  "calendar_subscriptions",
  {
    id: text("id").primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    tokenHash: text("token_hash").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
  },
  (table) => ({
    tokenHashIndex: uniqueIndex("calendar_subscriptions_token_hash_uidx").on(
      table.tokenHash,
    ),
    userIndex: uniqueIndex("calendar_subscriptions_user_uidx").on(table.userId),
  }),
);
