import type { Generated, Insertable, Selectable, Updateable } from 'kysely';
export interface Database {
    requests: RequestsTable;
    workspaces: WorkspacesTable;
    users: UsersTable;
    services: ServicesTable;
    approvals: ApprovalsTable;
    audit_logs: AuditLogsTable;
}
interface RequestsTable {
    id: Generated<string>;
    workspace_id: string;
    service_id: string;
    request_id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    requester_id: string;
    assignee_id: string | null;
    category_id: string | null;
    form_values: Record<string, unknown>;
    sla_due_date: Date | null;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
    completed_at: Date | null;
}
export type RequestRow = Selectable<RequestsTable>;
export type NewRequest = Insertable<RequestsTable>;
export type RequestUpdate = Updateable<RequestsTable>;
interface WorkspacesTable {
    id: Generated<string>;
    name: string;
    slug: string;
    description: string | null;
    logo_url: string | null;
    settings: Record<string, unknown>;
    active: boolean;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
}
export type WorkspaceRow = Selectable<WorkspacesTable>;
export type NewWorkspace = Insertable<WorkspacesTable>;
export type WorkspaceUpdate = Updateable<WorkspacesTable>;
interface UsersTable {
    id: Generated<string>;
    email: string;
    name: string;
    password_hash: string | null;
    entra_id: string | null;
    avatar_url: string | null;
    active: boolean;
    last_login_at: Date | null;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
}
export type UserRow = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;
interface ServicesTable {
    id: Generated<string>;
    workspace_id: string;
    name: string;
    description: string;
    icon: string | null;
    category_id: string | null;
    form_schema: Record<string, unknown>;
    workflow_config: Record<string, unknown>;
    sla_config: Record<string, unknown>;
    active: boolean;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
}
export type ServiceRow = Selectable<ServicesTable>;
export type NewService = Insertable<ServicesTable>;
export type ServiceUpdate = Updateable<ServicesTable>;
interface ApprovalsTable {
    id: Generated<string>;
    request_id: string;
    approver_id: string;
    level: number;
    status: string;
    comments: string | null;
    decided_at: Date | null;
    created_at: Generated<Date>;
    updated_at: Generated<Date>;
}
export type ApprovalRow = Selectable<ApprovalsTable>;
export type NewApproval = Insertable<ApprovalsTable>;
export type ApprovalUpdate = Updateable<ApprovalsTable>;
interface AuditLogsTable {
    id: Generated<string>;
    entity_type: string;
    entity_id: string;
    action: string;
    user_id: string;
    old_values: Record<string, unknown> | null;
    new_values: Record<string, unknown> | null;
    ip_address: string | null;
    user_agent: string | null;
    created_at: Generated<Date>;
}
export type AuditLogRow = Selectable<AuditLogsTable>;
export type NewAuditLog = Insertable<AuditLogsTable>;
export {};
//# sourceMappingURL=types.d.ts.map