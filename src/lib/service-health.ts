import type { Request } from '@/generated/models/request-model';
import type { RequestApproval } from '@/generated/models/request-approval-model';
import type { RequestServiceTarget } from '@/generated/models/request-service-target-model';
import type { RequestStatusHistory } from '@/generated/models/request-status-history-model';
import type { RequestTask } from '@/generated/models/request-task-model';

export type ServiceHealthMetricKey = 'volume' | 'backlog' | 'aging' | 'sla' | 'approval-delays' | 'task-delays' | 'rejections' | 'reopens';

export interface ServiceHealthMetric {
  key: ServiceHealthMetricKey;
  label: string;
  value: number;
  format: 'count' | 'days' | 'percent';
  description: string;
  tone: 'neutral' | 'attention' | 'critical';
}

export interface ServiceHealthSnapshot {
  requests: Request[];
  metrics: ServiceHealthMetric[];
  backlogByStatus: Array<{ label: string; count: number }>;
  volumeByDay: Array<{ date: string; count: number }>;
  drilldowns: Record<ServiceHealthMetricKey, Request[]>;
}

const terminalStatuses = new Set(['Closed', 'Cancelled']);

function timestamp(value?: string): number | undefined {
  if (!value) return undefined;
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : undefined;
}

function uniqueRequests(requests: readonly Request[], ids: ReadonlySet<string>): Request[] {
  return requests.filter((request: Request) => ids.has(request.id));
}

export function buildServiceHealthSnapshot(
  requests: readonly Request[],
  approvals: readonly RequestApproval[],
  tasks: readonly RequestTask[],
  targets: readonly RequestServiceTarget[],
  history: readonly RequestStatusHistory[],
  serviceCode: string,
  from: Date,
  to: Date,
  now = new Date(),
): ServiceHealthSnapshot {
  const fromTime = from.getTime();
  const toTime = to.getTime();
  const nowTime = now.getTime();
  const scoped = requests.filter((request: Request) => {
    const created = timestamp(request.createdAt);
    return request.serviceCode === serviceCode && created !== undefined && created >= fromTime && created <= toTime;
  });
  const requestIds = new Set(scoped.map((request: Request) => request.id));
  const requestByNumber = new Map(scoped.map((request: Request) => [request.requestNumber, request]));
  const backlog = scoped.filter((request: Request) => !terminalStatuses.has(request.statusKey));
  const ages = backlog.map((request: Request) => Math.max(0, (nowTime - (timestamp(request.createdAt) ?? nowTime)) / 86_400_000));
  const agingRequests = backlog.filter((request: Request) => nowTime - (timestamp(request.createdAt) ?? nowTime) >= 7 * 86_400_000);
  const serviceApprovals = approvals.filter((approval: RequestApproval) => requestIds.has(approval.requestId.id) || requestByNumber.has(approval.requestId.requestNumber));
  const delayedApprovalIds = new Set(serviceApprovals.filter((approval: RequestApproval) => {
    const start = timestamp(approval.createdAt);
    const end = timestamp(approval.decidedAt) ?? nowTime;
    return ['Waiting', 'Pending', 'Escalated'].includes(approval.statusKey) && start !== undefined && end - start >= 48 * 3_600_000;
  }).map((approval: RequestApproval) => approval.requestId.id || requestByNumber.get(approval.requestId.requestNumber)?.id).filter((id: string | undefined): id is string => Boolean(id)));
  const serviceTasks = tasks.filter((task: RequestTask) => requestIds.has(task.requestId.id) || requestByNumber.has(task.requestId.requestNumber));
  const delayedTaskIds = new Set(serviceTasks.filter((task: RequestTask) => !['Completed', 'Cancelled'].includes(task.statusIdKey) && Boolean(timestamp(task.dueDate)) && (timestamp(task.dueDate) ?? nowTime) < nowTime).map((task: RequestTask) => task.requestId.id || requestByNumber.get(task.requestId.requestNumber)?.id).filter((id: string | undefined): id is string => Boolean(id)));
  const serviceTargets = targets.filter((target: RequestServiceTarget) => requestIds.has(target.requestId.id) || requestByNumber.has(target.requestId.requestNumber));
  const measuredTargets = serviceTargets.filter((target: RequestServiceTarget) => ['Met', 'Breached'].includes(target.statusKey));
  const breachedIds = new Set(serviceTargets.filter((target: RequestServiceTarget) => target.statusKey === 'Breached').map((target: RequestServiceTarget) => target.requestId.id || requestByNumber.get(target.requestId.requestNumber)?.id).filter((id: string | undefined): id is string => Boolean(id)));
  const rejectedIds = new Set(serviceApprovals.filter((approval: RequestApproval) => approval.statusKey === 'Rejected').map((approval: RequestApproval) => approval.requestId.id || requestByNumber.get(approval.requestId.requestNumber)?.id).filter((id: string | undefined): id is string => Boolean(id)));
  const reopenedIds = new Set([
    ...scoped.filter((request: Request) => Boolean(timestamp(request.reopenedAt))).map((request: Request) => request.id),
    ...history.filter((item: RequestStatusHistory) => requestIds.has(item.requestId.id) && item.newStatusId === 'InProgress' && item.previousStatusId === 'Resolved').map((item: RequestStatusHistory) => item.requestId.id),
  ]);
  const metRate = measuredTargets.length ? Math.round((measuredTargets.filter((target: RequestServiceTarget) => target.statusKey === 'Met').length / measuredTargets.length) * 100) : 0;
  const averageAge = ages.length ? Math.round((ages.reduce((sum: number, age: number) => sum + age, 0) / ages.length) * 10) / 10 : 0;
  const volumeMap = new Map<string, number>();
  scoped.forEach((request: Request) => volumeMap.set(request.createdAt.slice(0, 10), (volumeMap.get(request.createdAt.slice(0, 10)) ?? 0) + 1));
  const statusMap = new Map<string, number>();
  backlog.forEach((request: Request) => statusMap.set(request.statusKey, (statusMap.get(request.statusKey) ?? 0) + 1));
  return {
    requests: scoped,
    metrics: [
      { key: 'volume', label: 'Volume', value: scoped.length, format: 'count', description: 'Requests created in this period', tone: 'neutral' },
      { key: 'backlog', label: 'Backlog', value: backlog.length, format: 'count', description: 'Requests not closed or cancelled', tone: backlog.length ? 'attention' : 'neutral' },
      { key: 'aging', label: 'Average age', value: averageAge, format: 'days', description: `${agingRequests.length} open for 7+ days`, tone: agingRequests.length ? 'attention' : 'neutral' },
      { key: 'sla', label: 'SLA met', value: metRate, format: 'percent', description: `${breachedIds.size} requests breached`, tone: breachedIds.size ? 'critical' : 'neutral' },
      { key: 'approval-delays', label: 'Approval delays', value: delayedApprovalIds.size, format: 'count', description: 'Pending for at least 48 hours', tone: delayedApprovalIds.size ? 'attention' : 'neutral' },
      { key: 'task-delays', label: 'Task delays', value: delayedTaskIds.size, format: 'count', description: 'Open tasks past due date', tone: delayedTaskIds.size ? 'critical' : 'neutral' },
      { key: 'rejections', label: 'Rejections', value: rejectedIds.size, format: 'count', description: 'Requests with a rejected approval', tone: rejectedIds.size ? 'attention' : 'neutral' },
      { key: 'reopens', label: 'Reopens', value: reopenedIds.size, format: 'count', description: 'Requests returned after resolution', tone: reopenedIds.size ? 'attention' : 'neutral' },
    ],
    backlogByStatus: [...statusMap.entries()].map(([label, count]: [string, number]) => ({ label, count })).sort((first, second) => second.count - first.count),
    volumeByDay: [...volumeMap.entries()].map(([date, count]: [string, number]) => ({ date, count })).sort((first, second) => first.date.localeCompare(second.date)),
    drilldowns: {
      volume: scoped,
      backlog,
      aging: agingRequests,
      sla: uniqueRequests(scoped, breachedIds),
      'approval-delays': uniqueRequests(scoped, delayedApprovalIds),
      'task-delays': uniqueRequests(scoped, delayedTaskIds),
      rejections: uniqueRequests(scoped, rejectedIds),
      reopens: uniqueRequests(scoped, reopenedIds),
    },
  };
}
