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
  publishAll(events: readonly DomainEvent[]): Promise<void>;
}

/**
 * In-memory implementation for development/testing
 */
export class InMemoryEventPublisher implements DomainEventPublisher {
  private readonly handlers: Map<string, Array<(event: DomainEvent) => Promise<void>>> = new Map();

  subscribe(eventType: string, handler: (event: DomainEvent) => Promise<void>): void {
    const handlers = this.handlers.get(eventType) || [];
    handlers.push(handler);
    this.handlers.set(eventType, handlers);
  }

  async publish(event: DomainEvent): Promise<void> {
    const handlers = this.handlers.get(event.type) || [];
    await Promise.all(handlers.map(handler => handler(event)));
  }

  async publishAll(events: readonly DomainEvent[]): Promise<void> {
    await Promise.all(events.map(event => this.publish(event)));
  }
}
