/**
 * Request Status Enum
 * Represents the lifecycle states of a service request
 */
export enum RequestStatus {
  DRAFT = 'DRAFT',
  SUBMITTED = 'SUBMITTED',
  IN_PROGRESS = 'IN_PROGRESS',
  PENDING_APPROVAL = 'PENDING_APPROVAL',
  PENDING_INFO = 'PENDING_INFO',
  ON_HOLD = 'ON_HOLD',
  RESOLVED = 'RESOLVED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
  REJECTED = 'REJECTED'
}

/**
 * Request Priority Enum
 * Defines urgency levels for requests
 */
export enum RequestPriority {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

/**
 * SLA Definition Interface
 */
export interface SlaDefinition {
  id: string;
  name: string;
  workspaceId: string;
  priority: RequestPriority;
  responseTimeHours: number;
  resolutionTimeHours: number;
  businessHoursOnly: boolean;
  active: boolean;
}

/**
 * Status Transition Rules
 * Defines valid state transitions for requests
 */
export const STATUS_TRANSITIONS: Record<RequestStatus, RequestStatus[]> = {
  [RequestStatus.DRAFT]: [RequestStatus.SUBMITTED, RequestStatus.CANCELLED],
  [RequestStatus.SUBMITTED]: [RequestStatus.IN_PROGRESS, RequestStatus.PENDING_APPROVAL, RequestStatus.REJECTED, RequestStatus.CANCELLED],
  [RequestStatus.IN_PROGRESS]: [RequestStatus.PENDING_APPROVAL, RequestStatus.PENDING_INFO, RequestStatus.ON_HOLD, RequestStatus.RESOLVED, RequestStatus.CANCELLED],
  [RequestStatus.PENDING_APPROVAL]: [RequestStatus.IN_PROGRESS, RequestStatus.APPROVED, RequestStatus.REJECTED],
  [RequestStatus.PENDING_INFO]: [RequestStatus.IN_PROGRESS, RequestStatus.CANCELLED],
  [RequestStatus.ON_HOLD]: [RequestStatus.IN_PROGRESS, RequestStatus.CANCELLED],
  [RequestStatus.RESOLVED]: [RequestStatus.COMPLETED, RequestStatus.IN_PROGRESS],
  [RequestStatus.COMPLETED]: [],
  [RequestStatus.CANCELLED]: [],
  [RequestStatus.REJECTED]: []
};

/**
 * Priority Order for sorting and comparison
 */
export const PRIORITY_ORDER: Record<RequestPriority, number> = {
  [RequestPriority.LOW]: 1,
  [RequestPriority.MEDIUM]: 2,
  [RequestPriority.HIGH]: 3,
  [RequestPriority.CRITICAL]: 4
};

/**
 * Default SLA Definitions by Priority
 */
export const DEFAULT_SLA_DEFINITIONS: Record<RequestPriority, { responseTimeHours: number; resolutionTimeHours: number }> = {
  [RequestPriority.LOW]: { responseTimeHours: 24, resolutionTimeHours: 72 },
  [RequestPriority.MEDIUM]: { responseTimeHours: 8, resolutionTimeHours: 24 },
  [RequestPriority.HIGH]: { responseTimeHours: 4, resolutionTimeHours: 12 },
  [RequestPriority.CRITICAL]: { responseTimeHours: 1, resolutionTimeHours: 4 }
};
