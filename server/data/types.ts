import type {
  AuditEvent,
  CurrentUser,
  Department,
  DepartmentMembership,
  Organization,
  Shift,
  StaffMember,
  UnavailabilityRule,
} from "../../src/types.js";

export type UnavailabilityRuleRecord = UnavailabilityRule;
export type ShiftRecord = Shift;
export type AuditEventRecord = AuditEvent;
export type CalendarSubscriptionRecord = {
  id: string;
  userId: string;
  tokenHash: string;
  createdAt: string;
  updatedAt: string;
  revokedAt?: string;
};

export type OrganizationsRepository = {
  getDemoOrganization(): Promise<Organization>;
};

export type DepartmentsRepository = {
  getById(departmentId: string): Promise<Department | undefined>;
  listAll(): Promise<Department[]>;
  listForUser(userId: string): Promise<Department[]>;
};

export type UsersRepository = {
  getByEntraIdentity(params: {
    email?: string;
    entraObjectId?: string;
    tenantId: string;
    userPrincipalName?: string;
  }): Promise<CurrentUser | undefined>;
  getById(userId: string): Promise<CurrentUser | undefined>;
  listPreviewUsers(): Promise<CurrentUser[]>;
};

export type MembershipsRepository = {
  listAll(): Promise<DepartmentMembership[]>;
  listForDepartment(departmentId: string): Promise<DepartmentMembership[]>;
  listForUser(userId: string): Promise<DepartmentMembership[]>;
};

export type UnavailabilityRulesRepository = {
  create(rule: UnavailabilityRule): Promise<UnavailabilityRuleRecord>;
  delete(ruleId: string): Promise<void>;
  getById(ruleId: string): Promise<UnavailabilityRuleRecord | undefined>;
  listAll(): Promise<UnavailabilityRuleRecord[]>;
  listForUser(userId: string): Promise<UnavailabilityRuleRecord[]>;
  update(rule: UnavailabilityRule): Promise<UnavailabilityRuleRecord>;
};

export type ShiftsRepository = {
  listAll(): Promise<ShiftRecord[]>;
  listForDepartment(departmentId: string): Promise<ShiftRecord[]>;
  listForUser(userId: string): Promise<ShiftRecord[]>;
};

export type StaffRepository = {
  listAll(): Promise<StaffMember[]>;
  listForDepartment(departmentId: string): Promise<StaffMember[]>;
};

export type AuditEventsRepository = {
  create(event: AuditEventRecord): Promise<AuditEventRecord>;
  findRecentBySummary(params: {
    actorUserId: string;
    eventType: string;
    summary: string;
    withinHours: number;
  }): Promise<AuditEventRecord | undefined>;
  listAll(): Promise<AuditEventRecord[]>;
  listForUser(userId: string): Promise<AuditEventRecord[]>;
};

export type CalendarSubscriptionsRepository = {
  getActiveByTokenHash(
    tokenHash: string,
  ): Promise<CalendarSubscriptionRecord | undefined>;
  getForUser(userId: string): Promise<CalendarSubscriptionRecord | undefined>;
  save(
    subscription: CalendarSubscriptionRecord,
  ): Promise<CalendarSubscriptionRecord>;
};

export type AppDataAccess = {
  auditEvents: AuditEventsRepository;
  calendarSubscriptions: CalendarSubscriptionsRepository;
  departments: DepartmentsRepository;
  memberships: MembershipsRepository;
  organizations: OrganizationsRepository;
  shifts: ShiftsRepository;
  staff: StaffRepository;
  unavailabilityRules: UnavailabilityRulesRepository;
  users: UsersRepository;
};
