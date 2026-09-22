/**
 * Request Status Enum
 * Represents the lifecycle states of a service request
 */
export var RequestStatus;
(function (RequestStatus) {
    RequestStatus["DRAFT"] = "DRAFT";
    RequestStatus["SUBMITTED"] = "SUBMITTED";
    RequestStatus["IN_PROGRESS"] = "IN_PROGRESS";
    RequestStatus["PENDING_APPROVAL"] = "PENDING_APPROVAL";
    RequestStatus["PENDING_INFO"] = "PENDING_INFO";
    RequestStatus["ON_HOLD"] = "ON_HOLD";
    RequestStatus["RESOLVED"] = "RESOLVED";
    RequestStatus["COMPLETED"] = "COMPLETED";
    RequestStatus["CANCELLED"] = "CANCELLED";
    RequestStatus["REJECTED"] = "REJECTED";
})(RequestStatus || (RequestStatus = {}));
/**
 * Request Priority Enum
 * Defines urgency levels for requests
 */
export var RequestPriority;
(function (RequestPriority) {
    RequestPriority["LOW"] = "LOW";
    RequestPriority["MEDIUM"] = "MEDIUM";
    RequestPriority["HIGH"] = "HIGH";
    RequestPriority["CRITICAL"] = "CRITICAL";
})(RequestPriority || (RequestPriority = {}));
/**
 * Status Transition Rules
 * Defines valid state transitions for requests
 */
export const STATUS_TRANSITIONS = {
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
export const PRIORITY_ORDER = {
    [RequestPriority.LOW]: 1,
    [RequestPriority.MEDIUM]: 2,
    [RequestPriority.HIGH]: 3,
    [RequestPriority.CRITICAL]: 4
};
/**
 * Default SLA Definitions by Priority
 */
export const DEFAULT_SLA_DEFINITIONS = {
    [RequestPriority.LOW]: { responseTimeHours: 24, resolutionTimeHours: 72 },
    [RequestPriority.MEDIUM]: { responseTimeHours: 8, resolutionTimeHours: 24 },
    [RequestPriority.HIGH]: { responseTimeHours: 4, resolutionTimeHours: 12 },
    [RequestPriority.CRITICAL]: { responseTimeHours: 1, resolutionTimeHours: 4 }
};
//# sourceMappingURL=RequestValueObjects.js.map