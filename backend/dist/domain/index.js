// Domain Layer Exports
// This is the only layer that has no dependencies on other layers
// Entities
export { Request } from './entities/Request.js';
// Value Objects
export { RequestStatus, RequestPriority } from './value-objects/RequestValueObjects.js';
export { STATUS_TRANSITIONS, PRIORITY_ORDER, DEFAULT_SLA_DEFINITIONS } from './value-objects/RequestValueObjects.js';
export { InMemoryEventPublisher } from './events/DomainEvent.js';
// Domain Services (to be implemented)
// export { RequestLifecycleService } from './services/RequestLifecycleService.js';
//# sourceMappingURL=index.js.map