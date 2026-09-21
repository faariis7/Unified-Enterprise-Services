import { initialize } from '@microsoft/power-apps/app';
import type { Request } from '@/generated/models/request-model';
import type { Workspace } from '@/generated/models/workspace-model';
import { RequestNumberSequenceService } from '@/generated/services/request-number-sequence-service';
import { RequestService } from '@/generated/services/request-service';
import { assertAuthorized, type AuthorizationContext, type ProtectedOperation, requestToRecordScope } from '@/lib/authorization';

function escapeOData(value: string): string {
  return value.replaceAll("'", "''");
}

function formatRequestNumber(workspace: Workspace, year: number, number: number): string {
  return workspace.requestNumberFormat
    .replace('{PREFIX}', workspace.requestNumberPrefix)
    .replace('{YYYY}', String(year))
    .replace('{NUMBER:6}', String(number).padStart(6, '0'))
    .replace('{NUMBER}', String(number));
}

export function buildAuthorizedRequestFilter(context: AuthorizationContext): string {
  const identity = context.identity;
  if (!identity || !context.membershipActive) return 'id eq null';
  const workspace = `workspace/id eq '${escapeOData(context.activeWorkspaceId)}'`;
  if (context.grantedPermissions.has('request.read')) return workspace;
  const scopes: string[] = [];
  if (context.grantedPermissions.has('request.read.own')) scopes.push(`requester/id eq '${escapeOData(identity.personId)}'`);
  if (context.grantedPermissions.has('request.read.requested_for')) scopes.push(`requestedFor/id eq '${escapeOData(identity.personId)}'`);
  if (context.grantedPermissions.has('request.read.assigned')) scopes.push(`assignee/id eq '${escapeOData(identity.personId)}'`);
  if (context.grantedPermissions.has('request.read.assignment_group')) identity.assignmentGroupCodes.forEach((code: string) => scopes.push(`assignmentGroupCode eq '${escapeOData(code)}'`));
  return scopes.length ? `${workspace} and (${scopes.join(' or ')})` : 'id eq null';
}

export class AuthorizedRequestService {
  static async list(context: AuthorizationContext): Promise<Request[]> {
    assertAuthorized('request.read.own', context);
    await initialize();
    return RequestService.getAll({ filter: buildAuthorizedRequestFilter(context) });
  }

  static async create(
    record: Omit<Request, 'id' | 'requestNumber' | 'workspace' | 'createdAt' | 'updatedAt' | 'versionNumber'>,
    workspace: Workspace,
    context: AuthorizationContext,
  ): Promise<Request> {
    assertAuthorized('request.create', context, { workspaceId: workspace.id, requesterId: record.requester.id, requestedForId: record.requestedFor.id, serviceCode: record.serviceCode, catalogItemCode: record.catalogItemCode });
    const year = new Date().getUTCFullYear();
    await initialize();
    const sequences = await RequestNumberSequenceService.getAll({ filter: `workspaceId/id eq '${escapeOData(workspace.id)}' and calendarYear eq ${year}` });
    const sequence = sequences[0];
    if (!sequence) throw new Error('Request numbering sequence is not configured for this workspace and year');
    const requestNumber = formatRequestNumber(workspace, year, sequence.nextNumber);
    const existing = await RequestService.getAll({ filter: `requestNumber eq '${escapeOData(requestNumber)}'` });
    if (existing.length) throw new Error('Request number collision detected; retry after refreshing the sequence');
    await RequestNumberSequenceService.update(sequence.id, { nextNumber: sequence.nextNumber + 1, updatedAt: new Date().toISOString(), versionNumber: sequence.versionNumber + 1 });
    const now = new Date().toISOString();
    return RequestService.create({ ...record, requestNumber, workspace: { id: workspace.id, workspaceName: workspace.workspaceName }, createdAt: now, updatedAt: now, versionNumber: 1 });
  }

  static async get(id: string, context: AuthorizationContext): Promise<Request> {
    await initialize();
    const request = await RequestService.getAll({ filter: `id eq '${escapeOData(id)}' and ${buildAuthorizedRequestFilter(context)}` });
    if (!request[0]) throw new Error('Request not found or access denied');
    assertAuthorized('request.read.own', context, requestToRecordScope(request[0]));
    return request[0];
  }

  static async update(id: string, changedFields: Partial<Omit<Request, 'id'>>, context: AuthorizationContext): Promise<Request> {
    if ('workspace' in changedFields || 'requestNumber' in changedFields || 'createdAt' in changedFields || 'createdBy' in changedFields) {
      throw new Error('Workspace, request number, and creation audit fields are immutable');
    }
    const current = await this.get(id, context);
    const fields = Object.keys(changedFields);
    assertAuthorized('request.update.own', context, requestToRecordScope(current), fields);
    await initialize();
    return RequestService.update(id, { ...changedFields, updatedAt: new Date().toISOString(), versionNumber: current.versionNumber + 1 });
  }

  static async executeProtected(operation: ProtectedOperation, request: Request, context: AuthorizationContext): Promise<void> {
    assertAuthorized(operation, context, requestToRecordScope(request));
  }
}
