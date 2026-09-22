import { Request } from '@domain/entities/Request.js';
import { IRequestRepository, RequestFilter, PaginationOptions, PaginatedResult } from '@domain/repositories/IRequestRepository.js';
import { RequestStatus, RequestPriority } from '@domain/value-objects/RequestValueObjects.js';
import { PostgresDatabase } from '../database/PostgresDatabase.js';
import { NewRequest } from '../database/types.js';

export class PostgresRequestRepository implements IRequestRepository {
  constructor(private readonly database: PostgresDatabase) {}

  async findById(id: string): Promise<Request | null> {
    const db = this.database.getDb();
    const result = await db
      .selectFrom('requests')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!result) return null;
    return this.mapToEntity(result);
  }

  async findByRequestId(workspaceId: string, requestId: string): Promise<Request | null> {
    const db = this.database.getDb();
    const result = await db
      .selectFrom('requests')
      .selectAll()
      .where('workspace_id', '=', workspaceId)
      .where('request_id', '=', requestId)
      .executeTakeFirst();

    if (!result) return null;
    return this.mapToEntity(result);
  }

  async save(request: Request): Promise<void> {
    const db = this.database.getDb();
    
    // Check if request exists
    const existing = await this.findById(request.id);
    
    if (existing) {
      // Update existing
      await db
        .updateTable('requests')
        .set({
          title: request.title,
          description: request.description,
          status: request.status,
          priority: request.priority,
          assignee_id: request.assigneeId || null,
          category_id: request.categoryId || null,
          form_values: request.formValues,
          sla_due_date: request.slaDueDate || null,
          updated_at: new Date(),
          completed_at: request.completedAt || null,
        })
        .where('id', '=', request.id)
        .execute();
    } else {
      // Insert new
      const newRequest: NewRequest = {
        id: request.id,
        workspace_id: request.workspaceId,
        service_id: request.serviceId,
        request_id: request.requestId,
        title: request.title,
        description: request.description,
        status: request.status,
        priority: request.priority,
        requester_id: request.requesterId,
        assignee_id: request.assigneeId || null,
        category_id: request.categoryId || null,
        form_values: request.formValues,
        sla_due_date: request.slaDueDate || null,
        created_at: request.createdAt,
        updated_at: request.updatedAt,
        completed_at: request.completedAt || null,
      };

      await db.insertInto('requests').values(newRequest).execute();
    }
  }

  async delete(id: string): Promise<void> {
    const db = this.database.getDb();
    await db.deleteFrom('requests').where('id', '=', id).execute();
  }

  async find(filter: RequestFilter): Promise<Request[]> {
    const db = this.database.getDb();
    let query = db.selectFrom('requests').selectAll();

    // Apply filters
    if (filter.workspaceId) {
      query = query.where('workspace_id', '=', filter.workspaceId);
    }
    if (filter.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      query = query.where('status', 'in', statuses);
    }
    if (filter.priority) {
      const priorities = Array.isArray(filter.priority) ? filter.priority : [filter.priority];
      query = query.where('priority', 'in', priorities);
    }
    if (filter.requesterId) {
      query = query.where('requester_id', '=', filter.requesterId);
    }
    if (filter.assigneeId) {
      query = query.where('assignee_id', '=', filter.assigneeId);
    }
    if (filter.serviceId) {
      query = query.where('service_id', '=', filter.serviceId);
    }
    if (filter.createdAfter) {
      query = query.where('created_at', '>=', filter.createdAfter);
    }
    if (filter.createdBefore) {
      query = query.where('created_at', '<=', filter.createdBefore);
    }
    if (filter.searchQuery) {
      query = query.where((eb) =>
        eb.or([
          eb('title', 'ilike', `%${filter.searchQuery}%`),
          eb('description', 'ilike', `%${filter.searchQuery}%`),
          eb('request_id', 'ilike', `%${filter.searchQuery}%`),
        ])
      );
    }

    const results = await query.execute();
    return results.map(row => this.mapToEntity(row));
  }

  async findPaginated(filter: RequestFilter, pagination: PaginationOptions): Promise<PaginatedResult<Request>> {
    const db = this.database.getDb();
    
    // Build base query for counting
    let countQuery = db.selectFrom('requests').select('id');
    
    // Apply filters to count query (same as find method)
    if (filter.workspaceId) countQuery = countQuery.where('workspace_id', '=', filter.workspaceId);
    if (filter.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      countQuery = countQuery.where('status', 'in', statuses);
    }
    // ... apply other filters as needed

    const totalResult = await countQuery.execute();
    const total = totalResult.length;

    // Build main query with pagination
    let query = db.selectFrom('requests').selectAll();
    
    // Apply filters
    if (filter.workspaceId) query = query.where('workspace_id', '=', filter.workspaceId);
    if (filter.status) {
      const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
      query = query.where('status', 'in', statuses);
    }
    
    // Apply sorting with type-safe column validation
    if (pagination.sortBy && pagination.sortOrder) {
      const allowedColumns = ['id', 'request_id', 'title', 'status', 'priority', 'created_at', 'updated_at'] as const;
      type SortColumn = typeof allowedColumns[number];
      
      const column = pagination.sortBy as SortColumn;
      if (allowedColumns.includes(column)) {
        query = query.orderBy(column, pagination.sortOrder);
      } else {
        query = query.orderBy('created_at', 'desc');
      }
    } else {
      query = query.orderBy('created_at', 'desc');
    }

    // Apply pagination
    const offset = (pagination.page - 1) * pagination.limit;
    query = query.limit(pagination.limit).offset(offset);

    const results = await query.execute();
    const items = results.map(row => this.mapToEntity(row));

    return {
      items,
      total,
      page: pagination.page,
      limit: pagination.limit,
      totalPages: Math.ceil(total / pagination.limit),
    };
  }

  async findByStatus(workspaceId: string, status: RequestStatus): Promise<Request[]> {
    return this.find({ workspaceId, status });
  }

  async findByAssignee(workspaceId: string, assigneeId: string): Promise<Request[]> {
    return this.find({ workspaceId, assigneeId });
  }

  async findByRequester(workspaceId: string, requesterId: string): Promise<Request[]> {
    return this.find({ workspaceId, requesterId });
  }

  async findOverdueSla(workspaceId: string): Promise<Request[]> {
    const db = this.database.getDb();
    const now = new Date();
    
    const results = await db
      .selectFrom('requests')
      .selectAll()
      .where('workspace_id', '=', workspaceId)
      .where('sla_due_date', '<', now)
      .where('status', 'not in', ['COMPLETED', 'CANCELLED'])
      .execute();

    return results.map(row => this.mapToEntity(row));
  }

  async count(filter: RequestFilter): Promise<number> {
    const results = await this.find(filter);
    return results.length;
  }

  async countByStatus(workspaceId: string): Promise<Map<RequestStatus, number>> {
    const db = this.database.getDb();
    const results = await db
      .selectFrom('requests')
      .select(['status', db.fn.count('id').as('count')])
      .where('workspace_id', '=', workspaceId)
      .groupBy('status')
      .execute();

    const map = new Map<RequestStatus, number>();
    for (const row of results) {
      map.set(row.status as RequestStatus, Number(row.count));
    }
    return map;
  }

  async bulkUpdateStatus(ids: string[], newStatus: RequestStatus): Promise<number> {
    const db = this.database.getDb();
    const result = await db
      .updateTable('requests')
      .set({ status: newStatus, updated_at: new Date() })
      .where('id', 'in', ids)
      .executeTakeFirstOrThrow();

    return Number(result.numUpdatedRows ?? 0);
  }

  async bulkAssign(ids: string[], assigneeId: string): Promise<number> {
    const db = this.database.getDb();
    const result = await db
      .updateTable('requests')
      .set({ assignee_id: assigneeId, updated_at: new Date() })
      .where('id', 'in', ids)
      .executeTakeFirstOrThrow();

    return Number(result.numUpdatedRows ?? 0);
  }

  private mapToEntity(row: any): Request {
    return new Request({
      id: row.id,
      workspaceId: row.workspace_id,
      serviceId: row.service_id,
      requestId: row.request_id,
      title: row.title,
      description: row.description,
      status: row.status as RequestStatus,
      priority: row.priority as RequestPriority,
      requesterId: row.requester_id,
      assigneeId: row.assignee_id ?? undefined,
      categoryId: row.category_id ?? undefined,
      formValues: row.form_values as Record<string, unknown>,
      slaDueDate: row.sla_due_date ?? undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      completedAt: row.completed_at ?? undefined,
    });
  }
}
