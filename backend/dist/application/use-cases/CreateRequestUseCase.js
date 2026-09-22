import { Request } from '../../domain/entities/Request.js';
import { RequestStatus, RequestPriority, DEFAULT_SLA_DEFINITIONS } from '../../domain/value-objects/RequestValueObjects.js';
export class CreateRequestUseCase {
    requestRepository;
    eventPublisher;
    constructor(requestRepository, eventPublisher) {
        this.requestRepository = requestRepository;
        this.eventPublisher = eventPublisher;
    }
    async execute(command) {
        // Validate input
        this.validateCommand(command);
        // Generate human-readable request ID
        const requestId = await this.generateRequestId(command.workspaceId, command.serviceId);
        // Calculate SLA due date based on priority
        const slaDefinition = DEFAULT_SLA_DEFINITIONS[command.priority];
        const slaDueDate = new Date();
        slaDueDate.setHours(slaDueDate.getHours() + slaDefinition.resolutionTimeHours);
        // Create request entity
        const request = new Request({
            id: crypto.randomUUID(),
            workspaceId: command.workspaceId,
            serviceId: command.serviceId,
            requestId,
            title: command.title.trim(),
            description: command.description.trim(),
            status: RequestStatus.SUBMITTED,
            priority: command.priority,
            requesterId: command.requesterId,
            categoryId: command.categoryId,
            formValues: command.formValues || {},
            slaDueDate,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        // Persist request
        await this.requestRepository.save(request);
        // Publish domain events
        const events = request.domainEvents;
        if (events.length > 0) {
            await this.eventPublisher.publishAll(events);
            request.clearDomainEvents();
        }
        return request;
    }
    validateCommand(command) {
        if (!command.workspaceId || command.workspaceId.trim().length === 0) {
            throw new Error('Workspace ID is required');
        }
        if (!command.serviceId || command.serviceId.trim().length === 0) {
            throw new Error('Service ID is required');
        }
        if (!command.title || command.title.trim().length === 0) {
            throw new Error('Title is required');
        }
        if (!command.description || command.description.trim().length === 0) {
            throw new Error('Description is required');
        }
        if (!command.requesterId || command.requesterId.trim().length === 0) {
            throw new Error('Requester ID is required');
        }
        if (!Object.values(RequestPriority).includes(command.priority)) {
            throw new Error(`Invalid priority: ${command.priority}`);
        }
    }
    async generateRequestId(workspaceId, serviceId) {
        // Get current year and month for the request ID format: SVC-YYYY-MM-NNN
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        // Get the count of requests for this service in this month to generate sequential number
        // This is a simplified implementation - in production, you'd use atomic increments
        const prefix = serviceId.toUpperCase().slice(0, 3);
        const sequence = Math.floor(Math.random() * 900) + 100; // Temporary random sequence
        return `${prefix}-${year}-${month}-${sequence}`;
    }
}
//# sourceMappingURL=CreateRequestUseCase.js.map