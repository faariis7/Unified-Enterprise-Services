import type { Request } from '@/generated/models/request-model';
import type { RequestActivity } from '@/generated/models/request-activity-model';

export function isRequestOwner(request: Request, personId: string, workspaceId: string): boolean {
  return request.workspace.id === workspaceId && (request.requester.id === personId || request.requestedFor.id === personId);
}

export function requesterVisibleActivities(activities: readonly RequestActivity[]): RequestActivity[] {
  return activities.filter((activity: RequestActivity) => activity.activityTypeKey !== 'InternalNote');
}

export function canRequesterReopen(request: Request): boolean {
  if (request.statusKey !== 'Resolved') return false;
  const resolvedAt = new Date(request.resolvedAt).getTime();
  return Number.isFinite(resolvedAt) && Date.now() - resolvedAt <= 7 * 24 * 60 * 60 * 1000;
}
