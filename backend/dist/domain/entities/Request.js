import { RequestStatus } from '../value-objects/RequestValueObjects.js';
export class Request {
    _id;
    _workspaceId;
    _serviceId;
    _requestId;
    _title;
    _description;
    _status;
    _priority;
    _requesterId;
    _assigneeId;
    _categoryId;
    _formValues;
    _slaDueDate;
    _createdAt;
    _updatedAt;
    _completedAt;
    _domainEvents = [];
    constructor(data) {
        this._id = data.id;
        this._workspaceId = data.workspaceId;
        this._serviceId = data.serviceId;
        this._requestId = data.requestId;
        this._title = data.title;
        this._description = data.description;
        this._status = data.status;
        this._priority = data.priority;
        this._requesterId = data.requesterId;
        this._assigneeId = data.assigneeId;
        this._categoryId = data.categoryId;
        this._formValues = data.formValues;
        this._slaDueDate = data.slaDueDate;
        this._createdAt = data.createdAt;
        this._updatedAt = data.updatedAt;
        this._completedAt = data.completedAt;
    }
    // Getters
    get id() { return this._id; }
    get workspaceId() { return this._workspaceId; }
    get serviceId() { return this._serviceId; }
    get requestId() { return this._requestId; }
    get title() { return this._title; }
    get description() { return this._description; }
    get status() { return this._status; }
    get priority() { return this._priority; }
    get requesterId() { return this._requesterId; }
    get assigneeId() { return this._assigneeId; }
    get categoryId() { return this._categoryId; }
    get formValues() { return { ...this._formValues }; }
    get slaDueDate() { return this._slaDueDate; }
    get createdAt() { return this._createdAt; }
    get updatedAt() { return this._updatedAt; }
    get completedAt() { return this._completedAt; }
    get domainEvents() { return [...this._domainEvents]; }
    // Business Logic Methods
    updateTitle(title) {
        if (title.trim().length === 0) {
            throw new Error('Title cannot be empty');
        }
        this._title = title.trim();
        this._updatedAt = new Date();
    }
    updateDescription(description) {
        this._description = description.trim();
        this._updatedAt = new Date();
    }
    changeStatus(newStatus, reason) {
        if (this._status === newStatus) {
            return;
        }
        const oldStatus = this._status;
        this._status = newStatus;
        this._updatedAt = new Date();
        if (newStatus === RequestStatus.COMPLETED || newStatus === RequestStatus.CANCELLED) {
            this._completedAt = new Date();
        }
        // Raise domain event
        this._domainEvents.push({
            type: 'REQUEST_STATUS_CHANGED',
            aggregateId: this._id,
            occurredAt: new Date(),
            payload: {
                oldStatus,
                newStatus,
                reason
            }
        });
    }
    assignTo(assigneeId) {
        if (this._assigneeId === assigneeId) {
            return;
        }
        const oldAssignee = this._assigneeId;
        this._assigneeId = assignee;
        this._updatedAt = new Date();
        this._domainEvents.push({
            type: 'REQUEST_ASSIGNED',
            aggregateId: this._id,
            occurredAt: new Date(),
            payload: {
                oldAssignee,
                newAssignee: assigneeId
            }
        });
    }
    unassign() {
        if (!this._assigneeId) {
            return;
        }
        const oldAssignee = this._assigneeId;
        this._assigneeId = undefined;
        this._updatedAt = new Date();
        this._domainEvents.push({
            type: 'REQUEST_UNASSIGNED',
            aggregateId: this._id,
            occurredAt: new Date(),
            payload: { oldAssignee }
        });
    }
    updateFormValues(values) {
        Object.assign(this._formValues, values);
        this._updatedAt = new Date();
    }
    setSlaDueDate(dueDate) {
        this._slaDueDate = dueDate;
        this._updatedAt = new Date();
    }
    clearDomainEvents() {
        this._domainEvents.splice(0, this._domainEvents.length);
    }
    hasActiveSlaBreach() {
        if (!this._slaDueDate || this._completedAt) {
            return false;
        }
        return new Date() > this._slaDueDate && this._status !== RequestStatus.COMPLETED;
    }
}
//# sourceMappingURL=Request.js.map