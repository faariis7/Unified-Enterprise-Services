/**
 * Base interface for all domain events
 * Domain events represent something significant that happened in the domain
 */
export interface DomainEvent {
    type: string;
    aggregateId: string;
    occurredAt: Date;
    payload: Record<string, unknown>;
}
/**
 * Domain Event Publisher Interface
 * Used to publish domain events to event handlers
 */
export interface DomainEventPublisher {
    publish(event: DomainEvent): Promise<void>;
    publishAll(events: DomainEvent[]): Promise<void>;
}
/**
 * In-memory implementation for development/testing
 */
export declare class InMemoryEventPublisher implements DomainEventPublisher {
    private readonly handlers;
    subscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void;
    publish(event: DomainEvent): Promise<void>;
    publishAll(events: DomainEvent[]): Promise<void>;
}
//# sourceMappingURL=DomainEvent.d.ts.map