import { randomUUID } from "node:crypto";
import {
  canAccessManagerView,
  canDownloadOwnCalendar,
  canManageOwnUnavailability,
  canViewManagerDepartment,
  canViewOwnSchedule,
} from "../../src/lib/access";
import { detectManagerConflicts } from "../../src/lib/conflicts";
import type {
  AppBootstrap,
  AuditEvent,
  CurrentUser,
  Department,
  ManagerReviewData,
  PreviewUser,
  Shift,
  UnavailabilityRule,
  UnavailabilityRuleInput,
} from "../../src/types";
import type { AppDataAccess } from "../data/types";
import { HttpError } from "../http/errors";
import {
  addDays,
  formatWeekRange,
  isWithinRange,
  parseLocalDateTime,
} from "../../src/lib/date";

function toPreviewUser(
  user: CurrentUser,
  departments: Department[],
): PreviewUser {
  return {
    id: user.id,
    name: user.name,
    role: user.role,
    teamIds: user.teamIds,
    isDemo: user.isDemo,
    departmentNames: departments.map((department) => department.name),
  };
}

function buildRuleFromInput(
  input: UnavailabilityRuleInput,
  userId: string,
  existingRule?: UnavailabilityRule,
): UnavailabilityRule {
  return {
    id: existingRule?.id ?? `ua-${randomUUID()}`,
    userId,
    type: input.type,
    daysOfWeek:
      input.type === "weekly-recurring" ? input.daysOfWeek : undefined,
    dayOfWeek:
      input.type === "weekly-recurring" ? input.daysOfWeek[0] : undefined,
    startTime:
      input.type === "date-range" ? undefined : input.startTime || undefined,
    endTime:
      input.type === "date-range" ? undefined : input.endTime || undefined,
    date: input.type === "one-time-date" ? input.date || undefined : undefined,
    startDate:
      input.type === "date-range" ? input.startDate || undefined : undefined,
    endDate:
      input.type === "date-range" ? input.endDate || undefined : undefined,
    note: input.note.trim(),
  };
}

function describeRule(rule: UnavailabilityRule): string {
  if (rule.type === "weekly-recurring") {
    return "weekly unavailability";
  }

  if (rule.type === "one-time-date") {
    return "one-time unavailable date";
  }

  return "unavailable date range";
}

export class AppService {
  constructor(private readonly dataAccess: AppDataAccess) {}

  async getPreviewUser(previewUserId?: string): Promise<CurrentUser> {
    const previewUsers = await this.dataAccess.users.listPreviewUsers();
    const requestedUserId = previewUserId ?? previewUsers[0]?.id;

    if (!requestedUserId) {
      throw new HttpError(500, "No preview users are configured.");
    }

    const user = await this.dataAccess.users.getById(requestedUserId);

    if (!user) {
      throw new HttpError(404, "Preview identity not found.");
    }

    return user;
  }

  async getBootstrap(previewUserId?: string): Promise<AppBootstrap> {
    const [organization, previewUsers, currentUser] = await Promise.all([
      this.dataAccess.organizations.getDemoOrganization(),
      this.dataAccess.users.listPreviewUsers(),
      this.getPreviewUser(previewUserId),
    ]);

    const previewUsersWithDepartments = await Promise.all(
      previewUsers.map(async (user) =>
        toPreviewUser(
          user,
          await this.dataAccess.departments.listForUser(user.id),
        ),
      ),
    );
    const currentUserDepartments =
      await this.dataAccess.departments.listForUser(currentUser.id);

    return {
      previewUsers: previewUsersWithDepartments,
      currentUser,
      currentUserDepartments,
      organization,
    };
  }

  async listOwnUnavailability(currentUser: CurrentUser) {
    if (!canManageOwnUnavailability(currentUser, currentUser.id)) {
      throw new HttpError(
        403,
        "You cannot manage another staff member's unavailability.",
      );
    }

    return this.dataAccess.unavailabilityRules.listForUser(currentUser.id);
  }

  async createOwnUnavailability(
    currentUser: CurrentUser,
    input: UnavailabilityRuleInput,
  ) {
    if (!canManageOwnUnavailability(currentUser, currentUser.id)) {
      throw new HttpError(
        403,
        "You cannot manage another staff member's unavailability.",
      );
    }

    const savedRule = await this.dataAccess.unavailabilityRules.create(
      buildRuleFromInput(input, currentUser.id),
    );
    await this.recordAuditEvent({
      actorUserId: currentUser.id,
      eventType: "unavailability.created",
      summary: `${currentUser.name} added ${describeRule(savedRule)}.`,
    });

    return savedRule;
  }

  async updateOwnUnavailability(
    currentUser: CurrentUser,
    ruleId: string,
    input: UnavailabilityRuleInput,
  ) {
    const existingRule =
      await this.dataAccess.unavailabilityRules.getById(ruleId);

    if (
      !existingRule ||
      !canManageOwnUnavailability(currentUser, existingRule.userId)
    ) {
      throw new HttpError(403, "You cannot edit this unavailable rule.");
    }

    const updatedRule = await this.dataAccess.unavailabilityRules.update(
      buildRuleFromInput(input, currentUser.id, existingRule),
    );
    await this.recordAuditEvent({
      actorUserId: currentUser.id,
      eventType: "unavailability.updated",
      summary: `${currentUser.name} updated ${describeRule(updatedRule)}.`,
    });

    return updatedRule;
  }

  async deleteOwnUnavailability(currentUser: CurrentUser, ruleId: string) {
    const existingRule =
      await this.dataAccess.unavailabilityRules.getById(ruleId);

    if (
      !existingRule ||
      !canManageOwnUnavailability(currentUser, existingRule.userId)
    ) {
      throw new HttpError(403, "You cannot delete this unavailable rule.");
    }

    await this.dataAccess.unavailabilityRules.delete(ruleId);
    await this.recordAuditEvent({
      actorUserId: currentUser.id,
      eventType: "unavailability.deleted",
      summary: `${currentUser.name} deleted ${describeRule(existingRule)}.`,
    });
  }

  async listOwnShifts(currentUser: CurrentUser): Promise<Shift[]> {
    if (!canViewOwnSchedule(currentUser, currentUser.id)) {
      throw new HttpError(
        403,
        "You cannot view another staff member's schedule.",
      );
    }

    return this.dataAccess.shifts.listForUser(currentUser.id);
  }

  async listOwnAuditEvents(currentUser: CurrentUser) {
    return this.dataAccess.auditEvents.listForUser(currentUser.id);
  }

  async getManagerReview(
    currentUser: CurrentUser,
    departmentId: string | undefined,
    weekStart: Date,
  ): Promise<ManagerReviewData> {
    if (!canAccessManagerView(currentUser)) {
      throw new HttpError(403, "Staff cannot access Manager View.");
    }

    const memberships = await this.dataAccess.memberships.listAll();
    const managedDepartments = (
      await this.dataAccess.departments.listForUser(currentUser.id)
    ).filter((department) =>
      canViewManagerDepartment(currentUser, department.id, memberships),
    );

    if (managedDepartments.length === 0) {
      return {
        managedDepartments: [],
        selectedDepartment: null,
        reviewedShiftCount: 0,
        conflictCount: 0,
        staffWithConflictsCount: 0,
        conflicts: [],
        staffSummaries: [],
      };
    }

    const selectedDepartment =
      managedDepartments.find((department) => department.id === departmentId) ??
      managedDepartments[0]!;

    if (
      !canViewManagerDepartment(currentUser, selectedDepartment.id, memberships)
    ) {
      throw new HttpError(403, "You cannot view this department.");
    }

    const [allDepartments, reviewedShifts, departmentStaff, allRules] =
      await Promise.all([
        this.dataAccess.departments.listAll(),
        this.dataAccess.shifts.listForDepartment(selectedDepartment.id),
        this.dataAccess.staff.listForDepartment(selectedDepartment.id),
        this.dataAccess.unavailabilityRules.listAll(),
      ]);

    const weekEnd = addDays(weekStart, 7);
    const visibleShifts = reviewedShifts
      .filter((shift) =>
        isWithinRange(parseLocalDateTime(shift.start), weekStart, weekEnd),
      )
      .sort((left, right) => left.start.localeCompare(right.start));

    const conflicts = detectManagerConflicts({
      departmentId: selectedDepartment.id,
      shifts: visibleShifts,
      staffMembers: departmentStaff,
      teams: allDepartments,
      unavailabilityRules: allRules,
      weekStart,
      weekEnd,
    });

    const staffSummaries = departmentStaff.map((staffMember) => {
      const unavailableRuleCount = allRules.filter(
        (rule) => rule.userId === staffMember.id,
      ).length;
      const staffConflictCount = conflicts.filter(
        (conflict) => conflict.staff.id === staffMember.id,
      ).length;

      return {
        staffMember,
        unavailableRuleCount,
        staffConflictCount,
      };
    });

    return {
      managedDepartments,
      selectedDepartment,
      reviewedShiftCount: visibleShifts.length,
      conflictCount: conflicts.length,
      staffWithConflictsCount: new Set(
        conflicts.map((conflict) => conflict.staff.id),
      ).size,
      conflicts,
      staffSummaries,
    };
  }

  async recordManagerReview(
    currentUser: CurrentUser,
    departmentId: string,
    weekStart: Date,
  ) {
    if (!canAccessManagerView(currentUser)) {
      throw new HttpError(403, "Staff cannot access Manager View.");
    }

    const memberships = await this.dataAccess.memberships.listAll();

    if (!canViewManagerDepartment(currentUser, departmentId, memberships)) {
      throw new HttpError(403, "You cannot review this department.");
    }

    const department = await this.dataAccess.departments.getById(departmentId);

    if (!department) {
      throw new HttpError(404, "Department not found.");
    }

    const summary = `${currentUser.name} reviewed ${department.name} conflicts for ${formatWeekRange(
      weekStart,
    )}.`;
    const existing = await this.dataAccess.auditEvents.findRecentBySummary({
      actorUserId: currentUser.id,
      eventType: "manager.reviewed_conflicts",
      summary,
      withinHours: 12,
    });

    if (existing) {
      return existing;
    }

    return this.recordAuditEvent({
      actorUserId: currentUser.id,
      eventType: "manager.reviewed_conflicts",
      summary,
    });
  }

  async getOwnCalendarShifts(currentUser: CurrentUser, weekStart: Date) {
    if (!canDownloadOwnCalendar(currentUser, currentUser.id)) {
      throw new HttpError(
        403,
        "You cannot download another staff member's calendar.",
      );
    }

    const exportRangeStart = addDays(weekStart, -7);
    const exportRangeEnd = addDays(weekStart, 14);
    const shifts = await this.dataAccess.shifts.listForUser(currentUser.id);
    const exportableShifts = shifts.filter((shift) =>
      isWithinRange(
        parseLocalDateTime(shift.start),
        exportRangeStart,
        exportRangeEnd,
      ),
    );

    await this.recordAuditEvent({
      actorUserId: currentUser.id,
      eventType: "calendar.downloaded",
      summary: `${currentUser.name} downloaded a calendar file.`,
    });

    return exportableShifts;
  }

  private async recordAuditEvent(event: {
    actorUserId: string;
    eventType: string;
    summary: string;
  }): Promise<AuditEvent> {
    const auditEvent: AuditEvent = {
      id: `audit-${randomUUID()}`,
      actorUserId: event.actorUserId,
      timestamp: new Date().toISOString(),
      summary: event.summary,
      eventType: event.eventType,
    };

    return this.dataAccess.auditEvents.create(auditEvent);
  }
}
