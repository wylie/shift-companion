import {
  auditEvents,
  departmentMemberships,
  mockUsers,
  shifts,
  staffMembers,
  teams,
  unavailabilityRules,
} from "./mockData";
import type {
  AuditEvent,
  CurrentUser,
  DepartmentMembership,
  Shift,
  StaffMember,
  Team,
  UnavailabilityRule,
} from "../types";

type UserRepository = {
  getById(userId: string): CurrentUser | undefined;
  listPreviewUsers(): CurrentUser[];
};

type DepartmentRepository = {
  getById(departmentId: string): Team | undefined;
  listAll(): Team[];
  listForUser(userId: string): Team[];
};

type MembershipRepository = {
  listAll(): DepartmentMembership[];
  listForDepartment(departmentId: string): DepartmentMembership[];
  listForUser(userId: string): DepartmentMembership[];
};

type UnavailabilityRuleRepository = {
  delete(ruleId: string): void;
  listAll(): UnavailabilityRule[];
  listForUser(userId: string): UnavailabilityRule[];
  save(rule: UnavailabilityRule): UnavailabilityRule;
};

type ShiftRepository = {
  listAll(): Shift[];
  listForDepartment(departmentName: string): Shift[];
  listForUser(userId: string): Shift[];
};

type StaffRepository = {
  listAll(): StaffMember[];
  listForDepartment(departmentId: string): StaffMember[];
};

type AuditEventRepository = {
  listAll(): AuditEvent[];
  listForUser(userId: string): AuditEvent[];
};

export type AppRepositories = {
  auditEvents: AuditEventRepository;
  departments: DepartmentRepository;
  memberships: MembershipRepository;
  shifts: ShiftRepository;
  staff: StaffRepository;
  unavailabilityRules: UnavailabilityRuleRepository;
  users: UserRepository;
};

type MockRepositoryState = {
  auditEvents: AuditEvent[];
  departments: Team[];
  memberships: DepartmentMembership[];
  shifts: Shift[];
  staff: StaffMember[];
  unavailabilityRules: UnavailabilityRule[];
  users: CurrentUser[];
};

function cloneAuditEvent(event: AuditEvent): AuditEvent {
  return { ...event };
}

function cloneDepartment(department: Team): Team {
  return {
    ...department,
    managerIds: [...department.managerIds],
  };
}

function cloneMembership(
  membership: DepartmentMembership,
): DepartmentMembership {
  return { ...membership };
}

function cloneShift(shift: Shift): Shift {
  return { ...shift };
}

function cloneStaffMember(staffMember: StaffMember): StaffMember {
  return { ...staffMember };
}

function cloneRule(rule: UnavailabilityRule): UnavailabilityRule {
  return { ...rule };
}

function cloneUser(user: CurrentUser): CurrentUser {
  return {
    ...user,
    teamIds: [...user.teamIds],
  };
}

function createInitialState(): MockRepositoryState {
  return {
    auditEvents: auditEvents.map(cloneAuditEvent),
    departments: teams.map(cloneDepartment),
    memberships: departmentMemberships.map(cloneMembership),
    shifts: shifts.map(cloneShift),
    staff: staffMembers.map(cloneStaffMember),
    unavailabilityRules: unavailabilityRules.map(cloneRule),
    users: mockUsers.map(cloneUser),
  };
}

export function createMockRepositories(): AppRepositories {
  const state = createInitialState();

  const memberships: MembershipRepository = {
    listAll() {
      return state.memberships.map(cloneMembership);
    },
    listForDepartment(departmentId) {
      return state.memberships
        .filter((membership) => membership.departmentId === departmentId)
        .map(cloneMembership);
    },
    listForUser(userId) {
      return state.memberships
        .filter((membership) => membership.userId === userId)
        .map(cloneMembership);
    },
  };

  const departments: DepartmentRepository = {
    getById(departmentId) {
      const department = state.departments.find(
        (item) => item.id === departmentId,
      );

      return department ? cloneDepartment(department) : undefined;
    },
    listAll() {
      return state.departments.map(cloneDepartment);
    },
    listForUser(userId) {
      const departmentIds = new Set(
        state.memberships
          .filter((membership) => membership.userId === userId)
          .map((membership) => membership.departmentId),
      );

      return state.departments
        .filter((department) => departmentIds.has(department.id))
        .map(cloneDepartment);
    },
  };

  return {
    auditEvents: {
      listAll() {
        return state.auditEvents.map(cloneAuditEvent);
      },
      listForUser(userId) {
        return state.auditEvents
          .filter((event) => event.actorUserId === userId)
          .map(cloneAuditEvent);
      },
    },
    departments,
    memberships,
    shifts: {
      listAll() {
        return state.shifts.map(cloneShift);
      },
      listForDepartment(departmentName) {
        return state.shifts
          .filter((shift) => shift.department === departmentName)
          .map(cloneShift);
      },
      listForUser(userId) {
        return state.shifts
          .filter((shift) => shift.userId === userId)
          .map(cloneShift);
      },
    },
    staff: {
      listAll() {
        return state.staff.map(cloneStaffMember);
      },
      listForDepartment(departmentId) {
        return state.staff
          .filter((staffMember) => staffMember.teamId === departmentId)
          .map(cloneStaffMember);
      },
    },
    unavailabilityRules: {
      delete(ruleId) {
        state.unavailabilityRules = state.unavailabilityRules.filter(
          (rule) => rule.id !== ruleId,
        );
      },
      listAll() {
        return state.unavailabilityRules.map(cloneRule);
      },
      listForUser(userId) {
        return state.unavailabilityRules
          .filter((rule) => rule.userId === userId)
          .map(cloneRule);
      },
      save(rule) {
        const existingIndex = state.unavailabilityRules.findIndex(
          (item) => item.id === rule.id,
        );

        if (existingIndex >= 0) {
          state.unavailabilityRules[existingIndex] = cloneRule(rule);
          return cloneRule(state.unavailabilityRules[existingIndex]!);
        }

        state.unavailabilityRules.push(cloneRule(rule));
        return cloneRule(rule);
      },
    },
    users: {
      getById(userId) {
        const user = state.users.find((item) => item.id === userId);
        return user ? cloneUser(user) : undefined;
      },
      listPreviewUsers() {
        return state.users.map(cloneUser);
      },
    },
  };
}

export const appRepositories = createMockRepositories();
