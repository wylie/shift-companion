import type {
  AppAuthSession,
  AuthMode,
  AuthProviderId,
  AuthStatus,
} from "./models/auth.js";
import type {
  UnavailabilityRule,
  UnavailabilityRuleInput,
  UnavailabilityRuleType,
} from "./models/availability.js";
import type {
  ProviderAvailability,
  ProviderCapability,
  ProviderStatus,
  ScheduleProviderId,
} from "./models/integration.js";
import type {
  MicrosoftIntegrationReadiness,
  MicrosoftReadinessCheck,
  MicrosoftReadinessState,
  MicrosoftSetupChecklistItem,
} from "./models/microsoft.js";
import type { Shift, ShiftAssignment } from "./models/schedule.js";

export type UserRole = "staff" | "manager";

export type MembershipRole = "staff" | "manager";

export type Organization = {
  id: string;
  name: string;
  timezone: string;
  isDemo: boolean;
};

export type Department = {
  id: string;
  organizationId: string;
  name: string;
  isDemo: boolean;
};

export type Team = Department;

export type CurrentUser = {
  id: string;
  organizationId: string;
  name: string;
  role: UserRole;
  teamIds: string[];
  isDemo: boolean;
  email?: string;
  entraObjectId?: string;
  tenantId?: string;
  userPrincipalName?: string;
};

export type PreviewUser = Pick<
  CurrentUser,
  "id" | "name" | "role" | "teamIds" | "isDemo"
> & {
  departmentNames: string[];
};

export type DepartmentMembership = {
  id: string;
  userId: string;
  departmentId: string;
  role: MembershipRole;
};

export type StaffMember = {
  id: string;
  organizationId: string;
  name: string;
  teamId: string;
  role: "staff";
  isDemo: boolean;
};

export type { UnavailabilityRuleType, UnavailabilityRule, Shift, ShiftAssignment };

export type NavItem = {
  id:
    | "calendar"
    | "feedback"
    | "manager"
    | "schedule"
    | "settings"
    | "unavailability";
  label: string;
};

export type {
  MicrosoftIntegrationReadiness,
  MicrosoftReadinessCheck,
  MicrosoftReadinessState,
  MicrosoftSetupChecklistItem,
  AppAuthSession,
  AuthMode,
  AuthProviderId,
  AuthStatus,
  ProviderAvailability,
  ProviderCapability,
  ProviderStatus,
  ScheduleProviderId,
};

export type AuditEvent = {
  id: string;
  actorUserId: string;
  timestamp: string;
  summary: string;
  eventType?: string;
};

export type CalendarSubscriptionStatus = {
  active: boolean;
  createdAt?: string;
  revokedAt?: string;
  updatedAt?: string;
};

export type CalendarSubscriptionSecret = {
  status: CalendarSubscriptionStatus;
  subscriptionUrl: string;
};

export type AppBootstrap = {
  auth: AppAuthSession;
  appVersion: string;
  buildEnvironment: "development" | "production" | "test";
  currentUser: CurrentUser | null;
  currentUserDepartments: Department[];
  dataSource: "in-memory" | "postgres";
  documentationUrl?: string;
  feedbackEmail?: string;
  microsoftReadiness: MicrosoftIntegrationReadiness;
  organization: Organization;
  providerStatus: {
    calendarExport: ProviderStatus;
    currentAuth: ProviderStatus;
    currentSchedule: ProviderStatus;
    database: {
      connected: boolean;
      migrationVersion?: string;
      name: string;
      status: "connected" | "demo";
    };
    feedback: ProviderStatus;
    microsoftAuth: ProviderStatus;
    microsoftGraph: ProviderStatus;
  };
  previewUsers: PreviewUser[];
};

export type { UnavailabilityRuleInput };

export type ManagerStaffSummary = {
  staffMember: StaffMember;
  unavailableRuleCount: number;
  staffConflictCount: number;
};

export type ManagerReviewData = {
  managedDepartments: Department[];
  selectedDepartment: Department | null;
  reviewedShiftCount: number;
  conflictCount: number;
  staffWithConflictsCount: number;
  conflicts: Array<{
    id: string;
    departmentId: string;
    departmentName: string;
    staff: StaffMember;
    shift: Shift;
    rule: UnavailabilityRule;
    ruleSummary: string;
  }>;
  staffSummaries: ManagerStaffSummary[];
};

export type AppErrorResponse = {
  error: string;
  requestId?: string;
  statusCode?: number;
};

export type HealthCheck = {
  details: string;
  name: "database";
  status: "error" | "ok" | "skipped";
};

export type AppHealthResponse = {
  checks: HealthCheck[];
  runtime: {
    authConfigured: boolean;
    authMode: AuthProviderId;
    dataSource: "in-memory" | "postgres";
    feedbackConfigured: boolean;
    teamsSsoConfigured: boolean;
  };
  status: "error" | "ok";
  timestamp: string;
  version: string;
};

export type AppRuntimeMode = "browserPreview" | "teams";

export type TeamsRuntimeMode =
  | "browserPreview"
  | "teamsInitializing"
  | "teamsReady"
  | "teamsUnavailable";

export type TeamsContextSummary = {
  clientType?: string;
  frameContext?: string;
  hostName?: string;
  locale?: string;
  tenantId?: string;
  theme?: string;
  userDisplayName?: string;
  userPrincipalName?: string;
};

export type TeamsRuntimeState = {
  context?: TeamsContextSummary;
  errorMessage?: string;
  isEmbedded: boolean;
  mode: TeamsRuntimeMode;
  sso: {
    errorCode?:
      | "sso_not_configured"
      | "token_request_failed"
      | "token_unavailable";
    errorMessage?: string;
    status:
      | "idle"
      | "requestingToken"
      | "setupRequired"
      | "tokenReady"
      | "tokenUnavailable";
    token?: string;
  };
};
