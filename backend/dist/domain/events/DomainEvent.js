/**
 * In-memory implementation for development/testing
 */
export class InMemoryEventPublisher {
    handlers = new Map();
    subscribe(eventType, handler) {
        const handlers = this.handlers.get(eventType) || [];
        handlers.push(handler);
        this.handlers.set(eventType, handlers);
    }
    async publish(event) {
        const handlers = this.handlers.get(event.type) || [];
        await Promise.all(handlers.map(handler => handler(event)));
    }
    async publishAll(events) {
        await Promise.all(events.map(event => this.publish(event)));
    }
}
//# sourceMappingURL=DomainEvent.js.map