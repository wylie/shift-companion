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
import type {
  AuditEvent,
  CurrentUser,
  Department,
  DepartmentMembership,
  Shift,
  StaffMember,
  UnavailabilityRule,
} from "../../src/types";
import type { AppDataAccess } from "./types";
import { normalizeUnavailabilityRule } from "../../src/lib/unavailability";

type MockState = {
  auditEvents: AuditEvent[];
  departments: Department[];
  memberships: DepartmentMembership[];
  shifts: Shift[];
  staffMembers: StaffMember[];
  unavailabilityRules: UnavailabilityRule[];
  users: CurrentUser[];
};

function cloneAuditEvent(event: AuditEvent): AuditEvent {
  return { ...event };
}

function cloneDepartment(department: Department): Department {
  return { ...department };
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
  return normalizeUnavailabilityRule({
    ...rule,
    daysOfWeek: rule.daysOfWeek ? [...rule.daysOfWeek] : undefined,
  });
}

function cloneUser(user: CurrentUser): CurrentUser {
  return {
    ...user,
    teamIds: [...user.teamIds],
  };
}

function createInitialState(): MockState {
  return {
    auditEvents: auditEvents.map(cloneAuditEvent),
    departments: departments.map(cloneDepartment),
    memberships: departmentMemberships.map(cloneMembership),
    shifts: shifts.map(cloneShift),
    staffMembers: staffMembers.map(cloneStaffMember),
    unavailabilityRules: unavailabilityRules.map(cloneRule),
    users: mockUsers.map(cloneUser),
  };
}

export function createMockDataAccess(): AppDataAccess {
  const state = createInitialState();

  return {
    auditEvents: {
      async create(event) {
        state.auditEvents.unshift(cloneAuditEvent(event));
        return cloneAuditEvent(event);
      },
      async findRecentBySummary({
        actorUserId,
        eventType,
        summary,
        withinHours,
      }) {
        const cutoff = Date.now() - withinHours * 60 * 60 * 1000;
        const found = state.auditEvents.find((event) => {
          const createdAt = new Date(event.timestamp).getTime();
          return (
            event.actorUserId === actorUserId &&
            event.eventType === eventType &&
            event.summary === summary &&
            createdAt >= cutoff
          );
        });

        return found ? cloneAuditEvent(found) : undefined;
      },
      async listAll() {
        return state.auditEvents.map(cloneAuditEvent);
      },
      async listForUser(userId) {
        return state.auditEvents
          .filter((event) => event.actorUserId === userId)
          .map(cloneAuditEvent);
      },
    },
    departments: {
      async getById(departmentId) {
        const department = state.departments.find(
          (item) => item.id === departmentId,
        );
        return department ? cloneDepartment(department) : undefined;
      },
      async listAll() {
        return state.departments.map(cloneDepartment);
      },
      async listForUser(userId) {
        const departmentIds = new Set(
          state.memberships
            .filter((membership) => membership.userId === userId)
            .map((membership) => membership.departmentId),
        );

        return state.departments
          .filter((department) => departmentIds.has(department.id))
          .map(cloneDepartment);
      },
    },
    memberships: {
      async listAll() {
        return state.memberships.map(cloneMembership);
      },
      async listForDepartment(departmentId) {
        return state.memberships
          .filter((membership) => membership.departmentId === departmentId)
          .map(cloneMembership);
      },
      async listForUser(userId) {
        return state.memberships
          .filter((membership) => membership.userId === userId)
          .map(cloneMembership);
      },
    },
    organizations: {
      async getDemoOrganization() {
        return { ...demoOrganization };
      },
    },
    shifts: {
      async listAll() {
        return state.shifts.map(cloneShift);
      },
      async listForDepartment(departmentId) {
        return state.shifts
          .filter((shift) => shift.departmentId === departmentId)
          .map(cloneShift);
      },
      async listForUser(userId) {
        return state.shifts
          .filter((shift) => shift.userId === userId)
          .map(cloneShift);
      },
    },
    staff: {
      async listAll() {
        return state.staffMembers.map(cloneStaffMember);
      },
      async listForDepartment(departmentId) {
        return state.staffMembers
          .filter((staffMember) => staffMember.teamId === departmentId)
          .map(cloneStaffMember);
      },
    },
    unavailabilityRules: {
      async create(rule) {
        state.unavailabilityRules.push(cloneRule(rule));
        return cloneRule(rule);
      },
      async delete(ruleId) {
        state.unavailabilityRules = state.unavailabilityRules.filter(
          (rule) => rule.id !== ruleId,
        );
      },
      async getById(ruleId) {
        const rule = state.unavailabilityRules.find(
          (item) => item.id === ruleId,
        );
        return rule ? cloneRule(rule) : undefined;
      },
      async listAll() {
        return state.unavailabilityRules.map(cloneRule);
      },
      async listForUser(userId) {
        return state.unavailabilityRules
          .filter((rule) => rule.userId === userId)
          .map(cloneRule);
      },
      async update(rule) {
        const existingIndex = state.unavailabilityRules.findIndex(
          (item) => item.id === rule.id,
        );

        if (existingIndex < 0) {
          throw new Error(`Rule not found: ${rule.id}`);
        }

        state.unavailabilityRules[existingIndex] = cloneRule(rule);
        return cloneRule(state.unavailabilityRules[existingIndex]!);
      },
    },
    users: {
      async getById(userId) {
        const user = state.users.find((item) => item.id === userId);
        return user ? cloneUser(user) : undefined;
      },
      async getByEntraIdentity({
        email,
        entraObjectId,
        tenantId,
        userPrincipalName,
      }) {
        const normalizedEmail = email?.toLowerCase();
        const normalizedUpn = userPrincipalName?.toLowerCase();
        const user = state.users.find((item) => {
          if (item.tenantId !== tenantId) {
            return false;
          }

          if (entraObjectId && item.entraObjectId === entraObjectId) {
            return true;
          }

          return (
            (normalizedUpn && item.userPrincipalName === normalizedUpn) ||
            (normalizedEmail && item.email === normalizedEmail)
          );
        });

        return user ? cloneUser(user) : undefined;
      },
      async listPreviewUsers() {
        return state.users.map(cloneUser);
      },
    },
  };
}
