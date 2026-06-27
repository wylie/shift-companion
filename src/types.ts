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

export type UnavailabilityRuleType =
  | "weekly-recurring"
  | "one-time-date"
  | "date-range";

export type UnavailabilityRule = {
  id: string;
  userId: string;
  type: UnavailabilityRuleType;
  note: string;
  dayOfWeek?: string;
  daysOfWeek?: string[];
  startTime?: string;
  endTime?: string;
  date?: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
  updatedAt?: string;
};

export type Shift = {
  id: string;
  userId: string;
  departmentId?: string;
  title: string;
  department?: string;
  start: string;
  end: string;
  location: string;
  createdAt?: string;
  updatedAt?: string;
};

export type NavItem = {
  id: "unavailability" | "schedule" | "manager" | "settings";
  label: string;
};

export type AuthMode =
  | "preview-demo"
  | "microsoft-entra-not-configured"
  | "microsoft-entra-future";

export type AuthProviderId = "microsoft-entra" | "preview-demo";

export type AuthStatus = "authenticated" | "setup-required" | "unmapped";

export type ScheduleProviderId = "microsoft-graph" | "neon-demo";

export type ProviderAvailability =
  | "available"
  | "disabled"
  | "not_configured"
  | "not_implemented";

export type ProviderStatus = {
  availability: ProviderAvailability;
  enabled: boolean;
  message: string;
  providerId:
    | AuthProviderId
    | ScheduleProviderId;
};

export type AppAuthSession = {
  isConfigured: boolean;
  message?: string;
  mode: AuthMode;
  providerId: AuthProviderId;
  status: AuthStatus;
};

export type AuditEvent = {
  id: string;
  actorUserId: string;
  timestamp: string;
  summary: string;
  eventType?: string;
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
  organization: Organization;
  providerStatus: {
    currentAuth: ProviderStatus;
    currentSchedule: ProviderStatus;
    microsoftAuth: ProviderStatus;
    microsoftGraph: ProviderStatus;
  };
  previewUsers: PreviewUser[];
};

export type UnavailabilityRuleInput = {
  type: UnavailabilityRuleType;
  daysOfWeek: string[];
  startTime: string;
  endTime: string;
  date: string;
  startDate: string;
  endDate: string;
  note: string;
};

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
