import type { Request } from '@/generated/models/request-model';
import { authorizeOperation, type AuthorizationContext } from '@/lib/authorization';
import { buildAuthorizedRequestFilter } from '@/lib/authorized-request-service';
import { expirationState } from '@/lib/approval-engine';
import { assertSameWorkspace } from '@/lib/request-orchestration';

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Quality gate failed: ${message}`);
}

export function runQualityGatePolicyTests(request: Request, baseContext: AuthorizationContext): void {
  const groupContext: AuthorizationContext = {
    ...baseContext,
    grantedPermissions: new Set(['request.read.assignment_group']),
    identity: baseContext.identity ? { ...baseContext.identity, assignmentGroupCodes: ['SERVICE-DESK'] } : undefined,
  };
  const groupFilter = buildAuthorizedRequestFilter(groupContext);
  assert(groupFilter.includes("assignmentGroupCode eq 'SERVICE-DESK'"), 'assignment group access must filter by assignmentGroupCode');
  assert(!groupFilter.includes("serviceCode eq 'SERVICE-DESK'"), 'assignment group access must not be interpreted as a service code');

  const foreignRecord = { workspaceId: 'foreign-workspace', requesterId: groupContext.identity?.personId };
  assert(!authorizeOperation('request.read.own', groupContext, foreignRecord), 'workspace isolation must deny foreign records');

  let crossWorkspaceBlocked = false;
  try {
    assertSameWorkspace(request, 'foreign-workspace');
  } catch {
    crossWorkspaceBlocked = true;
  }
  assert(crossWorkspaceBlocked, 'workflow orchestration must reject cross-workspace execution');

  const approval = {
    id: 'approval-quality-gate',
    statusKey: 'Pending',
    createdAt: '2026-01-01T00:00:00.000Z',
  } as Parameters<typeof expirationState>[0];
  assert(expirationState(approval, 60, new Date('2026-01-01T02:00:00.000Z')) === 'expired', 'approval expiry must be deterministic');

  assert(Boolean(request.formVersion?.id), 'historical requests must retain their submitted form version');
}
