import type { Generated, Insertable, Selectable, Updateable } from 'kysely';

export interface Database {
  workspaces: WorkspacesTable;
  users: UsersTable;
  requests: RequestsTable;
  approvals: ApprovalsTable;
  audit_logs: AuditLogsTable;
  migrations: MigrationsTable;
}

interface WorkspacesTable {
  id: Generated<string>;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  settings: Generated<Record<string, unknown>>;
  active: Generated<boolean>;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

interface UsersTable {
  id: Generated<string>;
  email: string;
  name: string;
  password_hash: string | null;
  entra_id: string | null;
  avatar_url: string | null;
  active: Generated<boolean>;
  last_login_at: Date | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

interface RequestsTable {
  id: Generated<string>;
  workspace_id: string;
  service_id: string;
  request_id: string;
  title: string;
  description: string;
  status: Generated<string>;
  priority: Generated<string>;
  requester_id: string;
  assignee_id: string | null;
  category_id: string | null;
  form_values: Generated<Record<string, unknown>>;
  sla_due_date: Date | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
  completed_at: Date | null;
}

interface ApprovalsTable {
  id: Generated<string>;
  request_id: string;
  approver_id: string;
  level: Generated<number>;
  status: Generated<string>;
  comments: string | null;
  decided_at: Date | null;
  created_at: Generated<Date>;
  updated_at: Generated<Date>;
}

interface AuditLogsTable {
  id: Generated<string>;
  entity_type: string;
  entity_id: string;
  action: string;
  user_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: Generated<Date>;
}

interface MigrationsTable {
  id: Generated<number>;
  name: string;
  executed_at: Generated<Date>;
}

export type Workspace = Selectable<WorkspacesTable>;
export type NewWorkspace = Insertable<WorkspacesTable>;
export type WorkspaceUpdate = Updateable<WorkspacesTable>;

export type User = Selectable<UsersTable>;
export type NewUser = Insertable<UsersTable>;
export type UserUpdate = Updateable<UsersTable>;

export type Request = Selectable<RequestsTable>;
export type NewRequest = Insertable<RequestsTable>;
export type RequestUpdate = Updateable<RequestsTable>;

export type Approval = Selectable<ApprovalsTable>;
export type NewApproval = Insertable<ApprovalsTable>;
export type ApprovalUpdate = Updateable<ApprovalsTable>;

export type AuditLog = Selectable<AuditLogsTable>;
export type NewAuditLog = Insertable<AuditLogsTable>;

export type Migration = Selectable<MigrationsTable>;
export type NewMigration = Insertable<MigrationsTable>;
