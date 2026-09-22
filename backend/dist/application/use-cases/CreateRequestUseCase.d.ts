import { Request } from '../../domain/entities/Request.js';
import { IRequestRepository } from '../../domain/repositories/IRequestRepository.js';
import { RequestPriority } from '../../domain/value-objects/RequestValueObjects.js';
import { DomainEventPublisher } from '../../domain/events/DomainEvent.js';
export interface CreateRequestCommand {
    workspaceId: string;
    serviceId: string;
    title: string;
    description: string;
    priority: RequestPriority;
    requesterId: string;
    categoryId?: string;
    formValues?: Record<string, unknown>;
}
export declare class CreateRequestUseCase {
    private readonly requestRepository;
    private readonly eventPublisher;
    constructor(requestRepository: IRequestRepository, eventPublisher: DomainEventPublisher);
    execute(command: CreateRequestCommand): Promise<Request>;
    private validateCommand;
    private generateRequestId;
}
//# sourceMappingURL=CreateRequestUseCase.d.ts.map