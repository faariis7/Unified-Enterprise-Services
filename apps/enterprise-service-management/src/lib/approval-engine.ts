import type { ApprovalStage } from '@/generated/models/approval-stage-model';
import type { RequestApproval } from '@/generated/models/request-approval-model';

export type ApprovalOutcome = 'Pending' | 'Approved' | 'Rejected' | 'Expired';

export function evaluateStage(stage: ApprovalStage, approvals: RequestApproval[]): ApprovalOutcome {
  if (approvals.some((approval: RequestApproval) => approval.statusKey === 'Rejected') && stage.rejectionBehaviorKey === 'StopFlow') return 'Rejected';
  const active = approvals.filter((approval: RequestApproval) => approval.statusKey !== 'Cancelled');
  const approved = active.filter((approval: RequestApproval) => approval.statusKey === 'Approved').length;
  if (stage.completionRuleKey === 'Any' && approved > 0) return 'Approved';
  if (stage.completionRuleKey === 'All' && active.length > 0 && approved >= Math.max(active.length, stage.minimumApprovals)) return 'Approved';
  if (active.length > 0 && active.every((approval: RequestApproval) => approval.statusKey === 'Expired')) return 'Expired';
  return 'Pending';
}

export function nextStage(stages: ApprovalStage[], currentStageNumber: number): ApprovalStage | undefined {
  return [...stages]
    .filter((stage: ApprovalStage) => stage.statusKey === 'Active' && stage.stageNumber > currentStageNumber)
    .sort((a: ApprovalStage, b: ApprovalStage) => a.stageNumber - b.stageNumber)[0];
}

export function isActionable(approval: RequestApproval, personId?: string): boolean {
  return approval.statusKey === 'Pending' && (!personId || approval.approverPersonId.id === personId || approval.delegatedFromPerson?.id === personId);
}

export function expirationState(approval: RequestApproval, expirationMinutes: number, now = new Date()): 'active' | 'expired' {
  const expiresAt = new Date(new Date(approval.createdAt).getTime() + expirationMinutes * 60_000);
  return expiresAt <= now ? 'expired' : 'active';
}
