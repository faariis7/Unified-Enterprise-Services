import { Request } from '../entities/Request.js';
import { RequestStatus, RequestPriority } from '../value-objects/RequestValueObjects.js';
/**
 * Filter options for querying requests
 */
export interface RequestFilter {
    workspaceId?: string;
    status?: RequestStatus | RequestStatus[];
    priority?: RequestPriority | RequestPriority[];
    requesterId?: string;
    assigneeId?: string;
    serviceId?: string;
    categoryId?: string;
    createdAfter?: Date;
    createdBefore?: Date;
    searchQuery?: string;
}
/**
 * Pagination options
 */
export interface PaginationOptions {
    page: number;
    limit: number;
    sortBy?: keyof Request;
    sortOrder?: 'asc' | 'desc';
}
/**
 * Paginated result
 */
export interface PaginatedResult<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
/**
 * Request Repository Interface
 * Defines the contract for request persistence operations
 */
export interface IRequestRepository {
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
}
//# sourceMappingURL=IRequestRepository.d.ts.map