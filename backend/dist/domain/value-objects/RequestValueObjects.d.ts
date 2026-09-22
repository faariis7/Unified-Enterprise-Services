/**
 * Request Status Enum
 * Represents the lifecycle states of a service request
 */
export declare enum RequestStatus {
    DRAFT = "DRAFT",
    SUBMITTED = "SUBMITTED",
    IN_PROGRESS = "IN_PROGRESS",
    PENDING_APPROVAL = "PENDING_APPROVAL",
    PENDING_INFO = "PENDING_INFO",
    ON_HOLD = "ON_HOLD",
    RESOLVED = "RESOLVED",
    COMPLETED = "COMPLETED",
    CANCELLED = "CANCELLED",
    REJECTED = "REJECTED"
}
/**
 * Request Priority Enum
 * Defines urgency levels for requests
 */
export declare enum RequestPriority {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
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
export declare const STATUS_TRANSITIONS: Record<RequestStatus, RequestStatus[]>;
/**
 * Priority Order for sorting and comparison
 */
export declare const PRIORITY_ORDER: Record<RequestPriority, number>;
/**
 * Default SLA Definitions by Priority
 */
export declare const DEFAULT_SLA_DEFINITIONS: Record<RequestPriority, {
    responseTimeHours: number;
    resolutionTimeHours: number;
}>;
//# sourceMappingURL=RequestValueObjects.d.ts.map