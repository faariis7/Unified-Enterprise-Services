import type { FieldPermission } from '@/generated/models/field-permission-model';
import type { Permission } from '@/generated/models/permission-model';
import type { Request } from '@/generated/models/request-model';
import type { ServicePermission } from '@/generated/models/service-permission-model';

export type ProtectedOperation =
  | 'request.create' | 'request.read' | 'request.read.own' | 'request.read.requested_for'
  | 'request.read.assigned' | 'request.read.assignment_group' | 'request.read.watched'
  | 'request.update' | 'request.update.own' | 'request.update.requested_for'
  | 'request.update.assigned' | 'request.update.assignment_group' | 'request.delete'
  | 'request.assign' | 'request.transition' | 'request.resolve' | 'request.reopen'
  | 'request.export' | 'request.administer' | 'workspace.administer'
  | 'global.administer' | 'global.audit' | 'platform.cross_workspace_access'
  | 'attachment.upload' | 'attachment.download' | 'notification.send'
  | 'search.workspace' | 'search.global' | 'report.workspace.read' | 'report.definition.manage'
  | 'report.dashboard.manage' | 'report.export' | 'report.global.administer'
  | 'integration.administer' | 'integration.execute';

export type FieldOperation = 'read' | 'create' | 'update';

export interface AuthorizationIdentity {
  objectId: string;
  personId: string;
  personActive: boolean;
  departmentCode: string;
  siteCode: string;
  assignmentGroupCodes: readonly string[];
}

export interface RecordScope {
  workspaceId: string;
  requesterId?: string;
  requestedForId?: string;
  assigneeId?: string;
  watcherPersonIds?: readonly string[];
  assignmentGroupCode?: string;
  departmentCode?: string;
  siteCode?: string;
  serviceCode?: string;
  catalogItemCode?: string;
  lifecycleState?: string;
  environmentKey?: string;
}

export interface AuthorizationContext {
  identity?: AuthorizationIdentity;
  activeWorkspaceId: string;
  membershipActive: boolean;
  grantedPermissions: ReadonlySet<string>;
  permissionDefinitions?: readonly Permission[];
  activeRoleIds?: ReadonlySet<string>;
  fieldPermissions?: readonly FieldPermission[];
  servicePermissions?: readonly ServicePermission[];
  allowedLifecycleStates?: ReadonlySet<string>;
  allowedEnvironments?: ReadonlySet<string>;
  developmentPersonaPreview?: boolean;
}

function hasRecordScope(operation: ProtectedOperation, context: AuthorizationContext, record: RecordScope): boolean {
  const identity = context.identity;
  if (!identity) return false;
  if (context.grantedPermissions.has(operation)) return true;
  if (context.grantedPermissions.has('request.read') || context.grantedPermissions.has('request.update')) return true;
  const read = operation.includes('.read') || operation === 'attachment.download' || operation === 'request.export';
  const update = operation.includes('.update') || operation === 'attachment.upload';
  if (read && context.grantedPermissions.has('request.read.own') && record.requesterId === identity.personId) return true;
  if (update && context.grantedPermissions.has('request.update.own') && record.requesterId === identity.personId) return true;
  if (read && context.grantedPermissions.has('request.read.requested_for') && record.requestedForId === identity.personId) return true;
  if (update && context.grantedPermissions.has('request.update.requested_for') && record.requestedForId === identity.personId) return true;
  if (read && context.grantedPermissions.has('request.read.assigned') && record.assigneeId === identity.personId) return true;
  if (update && context.grantedPermissions.has('request.update.assigned') && record.assigneeId === identity.personId) return true;
  if (read && context.grantedPermissions.has('request.read.watched') && record.watcherPersonIds?.includes(identity.personId)) return true;
  const inGroup = Boolean(record.assignmentGroupCode && identity.assignmentGroupCodes.includes(record.assignmentGroupCode));
  if (read && context.grantedPermissions.has('request.read.assignment_group') && inGroup) return true;
  return Boolean(update && context.grantedPermissions.has('request.update.assignment_group') && inGroup);
}

function fieldAllowed(operation: FieldOperation, entityName: string, fields: readonly string[], context: AuthorizationContext): boolean {
  if (!fields.length || !context.fieldPermissions?.length || !context.activeRoleIds) return true;
  return fields.every((fieldName: string) => {
    const rules = context.fieldPermissions?.filter((rule: FieldPermission) => rule.statusKey === 'Active' && rule.entityName === entityName && rule.fieldName === fieldName && context.activeRoleIds?.has(rule.roleId.id)) ?? [];
    if (!rules.length) return true;
    return rules.some((rule: FieldPermission) => operation === 'read' ? rule.canRead : operation === 'create' ? rule.canCreate : rule.canUpdate);
  });
}

function serviceAllowed(record: RecordScope, context: AuthorizationContext): boolean {
  const applicable = context.servicePermissions?.filter((rule: ServicePermission) => rule.statusKey === 'Active' && rule.workspaceId.id === record.workspaceId && context.activeRoleIds?.has(rule.roleId.id)) ?? [];
  if (!applicable.length) return true;
  return applicable.some((rule: ServicePermission) => rule.serviceCode === record.serviceCode && (!rule.catalogItemCode || rule.catalogItemCode === record.catalogItemCode));
}

export function authorizeOperation(operation: ProtectedOperation, context: AuthorizationContext, record?: RecordScope, fields: readonly string[] = []): boolean {
  if (context.developmentPersonaPreview || !context.identity?.objectId || !context.identity.personActive) return false;
  if (!context.membershipActive && !operation.startsWith('global.') && !operation.startsWith('integration.') && !operation.startsWith('report.global') && operation !== 'search.global') return false;
  if (!context.grantedPermissions.has(operation) && !record) return false;
  if (record) {
    const sameWorkspace = record.workspaceId === context.activeWorkspaceId;
    if (!sameWorkspace && !context.grantedPermissions.has('platform.cross_workspace_access')) return false;
    if (!hasRecordScope(operation, context, record) || !serviceAllowed(record, context)) return false;
    if (record.lifecycleState && context.allowedLifecycleStates && !context.allowedLifecycleStates.has(record.lifecycleState)) return false;
    if (record.environmentKey && context.allowedEnvironments && !context.allowedEnvironments.has(record.environmentKey)) return false;
  }
  const fieldOperation: FieldOperation = operation.includes('create') ? 'create' : operation.includes('update') || operation.includes('transition') ? 'update' : 'read';
  return fieldAllowed(fieldOperation, 'request', fields, context);
}

export function requestToRecordScope(request: Request, watcherPersonIds: readonly string[] = []): RecordScope {
  return {
    workspaceId: request.workspace.id,
    requesterId: request.requester.id,
    requestedForId: request.requestedFor.id,
    assigneeId: request.assignee.id,
    watcherPersonIds,
    assignmentGroupCode: request.assignmentGroupCode,
    departmentCode: request.departmentCode,
    siteCode: request.siteCode,
    serviceCode: request.serviceCode,
    catalogItemCode: request.catalogItemCode,
    lifecycleState: request.statusKey,
    environmentKey: 'production',
  };
}

export function assertAuthorized(operation: ProtectedOperation, context: AuthorizationContext, record?: RecordScope, fields?: readonly string[]): void {
  if (!authorizeOperation(operation, context, record, fields)) throw new Error(`Operation denied: ${operation}`);
}
