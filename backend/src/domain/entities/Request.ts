import { RequestStatus, RequestPriority } from '../value-objects/RequestValueObjects.js';
import { DomainEvent } from '../events/DomainEvent.js';

export interface RequestData {
  id: string;
  workspaceId: string;
  serviceId: string;
  requestId: string; // Human-readable ID like "IT-2024-00123"
  title: string;
  description: string;
  status: RequestStatus;
  priority: RequestPriority;
  requesterId: string;
  assigneeId?: string;
  categoryId?: string;
  formValues: Record<string, unknown>;
  slaDueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

export class Request {
  private readonly _id: string;
  private readonly _workspaceId: string;
  private readonly _serviceId: string;
  private readonly _requestId: string;
  private _title: string;
  private _description: string;
  private _status: RequestStatus;
  private _priority: RequestPriority;
  private readonly _requesterId: string;
  private _assigneeId?: string;
  private _categoryId?: string;
  private readonly _formValues: Record<string, unknown>;
  private _slaDueDate?: Date;
  private readonly _createdAt: Date;
  private _updatedAt: Date;
  private _completedAt?: Date;
  private readonly _domainEvents: DomainEvent[] = [];

  constructor(data: RequestData) {
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
  get id(): string { return this._id; }
  get workspaceId(): string { return this._workspaceId; }
  get serviceId(): string { return this._serviceId; }
  get requestId(): string { return this._requestId; }
  get title(): string { return this._title; }
  get description(): string { return this._description; }
  get status(): RequestStatus { return this._status; }
  get priority(): RequestPriority { return this._priority; }
  get requesterId(): string { return this._requesterId; }
  get assigneeId(): string | undefined { return this._assigneeId; }
  get categoryId(): string | undefined { return this._categoryId; }
  get formValues(): Record<string, unknown> { return { ...this._formValues }; }
  get slaDueDate(): Date | undefined { return this._slaDueDate; }
  get createdAt(): Date { return this._createdAt; }
  get updatedAt(): Date { return this._updatedAt; }
  get completedAt(): Date | undefined { return this._completedAt; }
  get domainEvents(): ReadonlyArray<DomainEvent> { return [...this._domainEvents]; }

  // Business Logic Methods
  updateTitle(title: string): void {
    if (title.trim().length === 0) {
      throw new Error('Title cannot be empty');
    }
    this._title = title.trim();
    this._updatedAt = new Date();
  }

  updateDescription(description: string): void {
    this._description = description.trim();
    this._updatedAt = new Date();
  }

  changeStatus(newStatus: RequestStatus, reason?: string): void {
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

  assignTo(assigneeId: string): void {
    if (this._assigneeId === assigneeId) {
      return;
    }

    const oldAssignee = this._assigneeId;
    this._assigneeId = assigneeId;
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

  unassign(): void {
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

  updateFormValues(values: Record<string, unknown>): void {
    Object.assign(this._formValues, values);
    this._updatedAt = new Date();
  }

  setSlaDueDate(dueDate: Date): void {
    this._slaDueDate = dueDate;
    this._updatedAt = new Date();
  }

  clearDomainEvents(): void {
    this._domainEvents.splice(0, this._domainEvents.length);
  }

  hasActiveSlaBreach(): boolean {
    if (!this._slaDueDate || this._completedAt) {
      return false;
    }
    return new Date() > this._slaDueDate && this._status !== RequestStatus.COMPLETED;
  }
}
