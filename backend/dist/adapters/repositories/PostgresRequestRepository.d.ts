import { Request } from '../../domain/entities/Request.js';
import { IRequestRepository, RequestFilter, PaginationOptions, PaginatedResult } from '../../domain/repositories/IRequestRepository.js';
import { RequestStatus } from '../../domain/value-objects/RequestValueObjects.js';
import { PostgresDatabase } from '../database/PostgresDatabase.js';
export declare class PostgresRequestRepository implements IRequestRepository {
    private readonly database;
    constructor(database: PostgresDatabase);
    findById(id: string): Promise<Request | null>;
    findByRequestId(workspaceId: string, requestId: string): Promise<Request | null>;
    save(request: Request): Promise<void>;
    delete(id: string): Promise<void>;
    find(filter: RequestFilter): Promise<Request[]>;
    findPaginated(filter: RequestFilter, pagination: PaginationOptions): Promise<PaginatedResult<Request>>;
    findByStatus(workspaceId: string, status: RequestStatus): Promise<Request[]>;
    findByAssignee(workspaceId: string, assigneeId: string): Promise<Request[]>;
    findByRequester(workspaceId: string, requesterId: string): Promise<Request[]>;
    findOverdueSla(workspaceId: string): Promise<Request[]>;
    count(filter: RequestFilter): Promise<number>;
    countByStatus(workspaceId: string): Promise<Map<RequestStatus, number>>;
    bulkUpdateStatus(ids: string[], newStatus: RequestStatus): Promise<number>;
    bulkAssign(ids: string[], assigneeId: string): Promise<number>;
    private mapToEntity;
}
//# sourceMappingURL=PostgresRequestRepository.d.ts.map