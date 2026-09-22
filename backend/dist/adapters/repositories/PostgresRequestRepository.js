import { Request } from '../../domain/entities/Request.js';
export class PostgresRequestRepository {
    database;
    constructor(database) {
        this.database = database;
    }
    async findById(id) {
        const db = this.database.getDb();
        const result = await db
            .selectFrom('requests')
            .selectAll()
            .where('id', '=', id)
            .executeTakeFirst();
        if (!result)
            return null;
        return this.mapToEntity(result);
    }
    async findByRequestId(workspaceId, requestId) {
        const db = this.database.getDb();
        const result = await db
            .selectFrom('requests')
            .selectAll()
            .where('workspace_id', '=', workspaceId)
            .where('request_id', '=', requestId)
            .executeTakeFirst();
        if (!result)
            return null;
        return this.mapToEntity(result);
    }
    async save(request) {
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
        }
        else {
            // Insert new
            const newRequest = {
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
    async delete(id) {
        const db = this.database.getDb();
        await db.deleteFrom('requests').where('id', '=', id).execute();
    }
    async find(filter) {
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
            query = query.where((eb) => eb.or([
                eb('title', 'ilike', `%${filter.searchQuery}%`),
                eb('description', 'ilike', `%${filter.searchQuery}%`),
                eb('request_id', 'ilike', `%${filter.searchQuery}%`),
            ]));
        }
        const results = await query.execute();
        return results.map(row => this.mapToEntity(row));
    }
    async findPaginated(filter, pagination) {
        const db = this.database.getDb();
        // Build base query for counting
        let countQuery = db.selectFrom('requests').select('id');
        // Apply filters to count query (same as find method)
        if (filter.workspaceId)
            countQuery = countQuery.where('workspace_id', '=', filter.workspaceId);
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
        if (filter.workspaceId)
            query = query.where('workspace_id', '=', filter.workspaceId);
        if (filter.status) {
            const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
            query = query.where('status', 'in', statuses);
        }
        // Apply sorting
        if (pagination.sortBy && pagination.sortOrder) {
            query = query.orderBy(pagination.sortBy, pagination.sortOrder);
        }
        else {
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
    async findByStatus(workspaceId, status) {
        return this.find({ workspaceId, status });
    }
    async findByAssignee(workspaceId, assigneeId) {
        return this.find({ workspaceId, assigneeId });
    }
    async findByRequester(workspaceId, requesterId) {
        return this.find({ workspaceId, requesterId });
    }
    async findOverdueSla(workspaceId) {
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
    async count(filter) {
        const results = await this.find(filter);
        return results.length;
    }
    async countByStatus(workspaceId) {
        const db = this.database.getDb();
        const results = await db
            .selectFrom('requests')
            .select(['status', db.fn.count('id').as('count')])
            .where('workspace_id', '=', workspaceId)
            .groupBy('status')
            .execute();
        const map = new Map();
        for (const row of results) {
            map.set(row.status, Number(row.count));
        }
        return map;
    }
    async bulkUpdateStatus(ids, newStatus) {
        const db = this.database.getDb();
        const result = await db
            .updateTable('requests')
            .set({ status: newStatus, updated_at: new Date() })
            .where('id', 'in', ids)
            .execute();
        return Number(result.numUpdatedRows);
    }
    async bulkAssign(ids, assigneeId) {
        const db = this.database.getDb();
        const result = await db
            .updateTable('requests')
            .set({ assignee_id: assigneeId, updated_at: new Date() })
            .where('id', 'in', ids)
            .execute();
        return Number(result.numUpdatedRows);
    }
    mapToEntity(row) {
        return new Request({
            id: row.id,
            workspaceId: row.workspace_id,
            serviceId: row.service_id,
            requestId: row.request_id,
            title: row.title,
            description: row.description,
            status: row.status,
            priority: row.priority,
            requesterId: row.requester_id,
            assigneeId: row.assignee_id ?? undefined,
            categoryId: row.category_id ?? undefined,
            formValues: row.form_values,
            slaDueDate: row.sla_due_date ?? undefined,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            completedAt: row.completed_at ?? undefined,
        });
    }
}
//# sourceMappingURL=PostgresRequestRepository.js.map