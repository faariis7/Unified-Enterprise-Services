import type { Request } from '@/generated/models/request-model';
import { authorizeOperation, requestToRecordScope, type AuthorizationContext, type RecordScope } from '@/lib/authorization';

const requesterContext: AuthorizationContext = {
  identity: { objectId: 'identity-a', personId: 'person-a', personActive: true, departmentCode: 'D1', siteCode: 'S1', assignmentGroupCodes: [] },
  activeWorkspaceId: 'workspace-a', membershipActive: true,
  grantedPermissions: new Set(['request.read.own', 'request.read.requested_for']),
};

const anotherWorkspace: RecordScope = { workspaceId: 'workspace-b', requesterId: 'person-a', lifecycleState: 'New', environmentKey: 'production' };
const anotherRequester: RecordScope = { workspaceId: 'workspace-a', requesterId: 'person-b', requestedForId: 'person-b', lifecycleState: 'New', environmentKey: 'production' };
const ownRequest: RecordScope = { workspaceId: 'workspace-a', requesterId: 'person-a', lifecycleState: 'New', environmentKey: 'production' };
const sharedRequestScope = requestToRecordScope({ workspace: { id: 'workspace-a', workspaceName: 'A' }, requester: { id: 'person-b', displayName: 'B' }, requestedFor: { id: 'person-b', displayName: 'B' }, assignee: { id: 'person-b', displayName: 'B' }, assignmentGroupCode: 'G2', departmentCode: 'D2', siteCode: 'S2', serviceCode: 'shared', catalogItemCode: 'general', statusKey: 'New' } as Request);


export const authorizationIsolationTests = {
  deniesAnotherWorkspace: !authorizeOperation('request.read.own', requesterContext, anotherWorkspace),
  deniesAnotherRequester: !authorizeOperation('request.read.own', requesterContext, anotherRequester),
  deniesSharedRequestForAnotherRequester: !authorizeOperation('request.read.own', requesterContext, sharedRequestScope),
  allowsOwnRequest: authorizeOperation('request.read.own', requesterContext, ownRequest),
  previewNeverGrants: !authorizeOperation('request.read.own', { ...requesterContext, developmentPersonaPreview: true }, ownRequest),
} as const;

if (!Object.values(authorizationIsolationTests).every((passed: boolean) => passed)) throw new Error('Authorization isolation test failed');
