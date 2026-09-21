import type { ApprovalDecision } from '@/generated/models/approval-decision-model';
import type { Request } from '@/generated/models/request-model';
import type { RequestApproval } from '@/generated/models/request-approval-model';
import type { RequestServiceTarget } from '@/generated/models/request-service-target-model';

export type ReportKey = 'volume' | 'open' | 'closed' | 'aging' | 'approval' | 'targets' | 'workload';

export interface ReportingSnapshot {
  scopedRequests: Request[];
  volumeByDay: Array<{ date: string; count: number }>;
  openRequests: Request[];
  closedRequests: Request[];
  agingBuckets: Array<{ bucket: string; count: number }>;
  approvalRows: RequestApproval[];
  targetRows: RequestServiceTarget[];
  workloadRows: Array<{ owner: string; count: number }>;
  approvalCompletionRate: number;
  approvalAverageHours: number;
  targetMetRate: number;
}

const terminalStatuses = new Set(['Closed', 'Cancelled']);

function validTime(value: string): number | undefined {
  const time = new Date(value).getTime();
  return Number.isFinite(time) ? time : undefined;
}

function percentage(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
}

export function buildReportingSnapshot(
  requests: readonly Request[],
  approvals: readonly RequestApproval[],
  decisions: readonly ApprovalDecision[],
  targets: readonly RequestServiceTarget[],
  workspaceId: string,
  from: Date,
  to: Date,
): ReportingSnapshot {
  const fromTime = from.getTime();
  const toTime = to.getTime();
  const scopedRequests = requests.filter((request: Request) => {
    const created = validTime(request.createdAt);
    return request.workspace.id === workspaceId && created !== undefined && created >= fromTime && created <= toTime;
  });
  const requestIds = new Set(scopedRequests.map((request: Request) => request.id));
  const requestNumberIds = new Set(scopedRequests.map((request: Request) => request.requestNumber));
  const approvalRows = approvals.filter((approval: RequestApproval) => approval.workspaceId.id === workspaceId && (requestIds.has(approval.requestId.id) || requestNumberIds.has(approval.requestId.requestNumber)));
  const approvalIds = new Set(approvalRows.map((approval: RequestApproval) => approval.id));
  const decisionRows = decisions.filter((decision: ApprovalDecision) => decision.workspace.id === workspaceId && approvalIds.has(decision.requestApproval.id));
  const targetRows = targets.filter((target: RequestServiceTarget) => target.workspaceId.id === workspaceId && (requestIds.has(target.requestId.id) || requestNumberIds.has(target.requestId.requestNumber)));
  const openRequests = scopedRequests.filter((request: Request) => !terminalStatuses.has(request.statusKey));
  const closedRequests = scopedRequests.filter((request: Request) => request.statusKey === 'Closed');
  const volumeMap = new Map<string, number>();
  scopedRequests.forEach((request: Request) => {
    const date = request.createdAt.slice(0, 10);
    volumeMap.set(date, (volumeMap.get(date) ?? 0) + 1);
  });
  const volumeByDay = [...volumeMap.entries()].sort(([first]: [string, number], [second]: [string, number]) => first.localeCompare(second)).map(([date, count]: [string, number]) => ({ date, count }));
  const now = Date.now();
  const aging = { '0–2 days': 0, '3–7 days': 0, '8–14 days': 0, '15+ days': 0 };
  openRequests.forEach((request: Request) => {
    const created = validTime(request.createdAt) ?? now;
    const days = Math.max(0, Math.floor((now - created) / 86_400_000));
    if (days <= 2) aging['0–2 days'] += 1;
    else if (days <= 7) aging['3–7 days'] += 1;
    else if (days <= 14) aging['8–14 days'] += 1;
    else aging['15+ days'] += 1;
  });
  const workloadMap = new Map<string, number>();
  openRequests.forEach((request: Request) => {
    const owner = request.assignee.displayName || request.assignmentGroupCode || 'Unassigned';
    workloadMap.set(owner, (workloadMap.get(owner) ?? 0) + 1);
  });
  const completedApprovals = approvalRows.filter((approval: RequestApproval) => ['Approved', 'Rejected', 'Expired'].includes(approval.statusKey));
  const approvalDurations = completedApprovals.map((approval: RequestApproval) => {
    const start = validTime(approval.createdAt);
    const end = validTime(approval.decidedAt);
    return start !== undefined && end !== undefined && end >= start ? (end - start) / 3_600_000 : undefined;
  }).filter((duration: number | undefined): duration is number => duration !== undefined);
  const metTargets = targetRows.filter((target: RequestServiceTarget) => target.statusKey === 'Met');
  const measuredTargets = targetRows.filter((target: RequestServiceTarget) => ['Met', 'Breached'].includes(target.statusKey));
  return {
    scopedRequests,
    volumeByDay,
    openRequests,
    closedRequests,
    agingBuckets: Object.entries(aging).map(([bucket, count]: [string, number]) => ({ bucket, count })),
    approvalRows,
    targetRows,
    workloadRows: [...workloadMap.entries()].sort((first: [string, number], second: [string, number]) => second[1] - first[1]).map(([owner, count]: [string, number]) => ({ owner, count })),
    approvalCompletionRate: percentage(completedApprovals.length, approvalRows.length),
    approvalAverageHours: approvalDurations.length ? Math.round((approvalDurations.reduce((total: number, hours: number) => total + hours, 0) / approvalDurations.length) * 10) / 10 : 0,
    targetMetRate: percentage(metTargets.length, measuredTargets.length),
  };
}
