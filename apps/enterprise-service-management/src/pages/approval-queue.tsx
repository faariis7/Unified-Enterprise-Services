import { useMemo, useState, type ChangeEvent } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { Check, Clock3, ExternalLink, ShieldCheck, X } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { useUser } from '@/hooks/use-user';
import { useRequestApprovalList, useUpdateRequestApproval } from '@/generated/hooks/use-request-approval';
import { useCreateApprovalDecision } from '@/generated/hooks/use-approval-decision';
import { useCreateRequestHistory } from '@/generated/hooks/use-request-history';
import { useRequestServiceTargetList } from '@/generated/hooks/use-request-service-target';
import { InMemoryDataBanner } from '@/generated/components/in-memory-data-banner';
import { HAS_IN_MEMORY_TABLES } from '@/generated/hooks';
import type { RequestApproval } from '@/generated/models/request-approval-model';
import type { RequestServiceTarget } from '@/generated/models/request-service-target-model';
import { ServiceTargetIndicator } from '@/components/service-target-indicator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const statusFilters = ['all', 'Pending', 'Approved', 'Rejected', 'Escalated', 'Expired'] as const;

export default function ApprovalQueuePage() {
  const { workspaceCode = '' } = useParams();
  const { activeWorkspace } = useWorkspaceContext();
  const { data: user } = useUser();
  const filter = activeWorkspace ? `workspaceId/id eq '${activeWorkspace.id}'` : 'id eq null';
  const { data: targets = [] } = useRequestServiceTargetList({ filter });
  const { data: approvals = [], isLoading } = useRequestApprovalList({ filter, orderBy: ['createdAt desc'] });
  const targetsByRequest = useMemo(() => new Map(targets.filter((target: RequestServiceTarget) => target.targetTypeKey === 'Approval').map((target: RequestServiceTarget) => [target.requestId.id, target])), [targets]);
  const updateApproval = useUpdateRequestApproval();
  const createDecision = useCreateApprovalDecision();
  const createHistory = useCreateRequestHistory();
  const [status, setStatus] = useState<(typeof statusFilters)[number]>('Pending');
  const [comments, setComments] = useState<Record<string, string>>({});
  const visible = useMemo(() => approvals.filter((approval: RequestApproval) => status === 'all' || approval.statusKey === status), [approvals, status]);
  if (!activeWorkspace) return <Navigate to="/no-workspace-access" replace />;
  const actor = { id: user?.objectId ?? activeWorkspace.id, displayName: user?.fullName ?? 'Current approver' };

  const decide = async (approval: RequestApproval, decision: 'Approved' | 'Rejected') => {
    const now = new Date().toISOString();
    const note = comments[approval.id]?.trim() ?? '';
    await createDecision.mutateAsync({ actingFor: approval.delegatedFromPerson, comments: note, decidedAt: now, decidedBy: actor, decisionKey: decision, decisionName: `${approval.approvalName} ${decision.toLowerCase()}`, requestApproval: { id: approval.id, approvalName: approval.approvalName }, source: 'Approval Engine', targetRecordID: approval.requestId.id, targetTypeKey: 'Request', workspace: { id: activeWorkspace.id, workspaceName: activeWorkspace.workspaceName } });
    await updateApproval.mutateAsync({ id: approval.id, changedFields: { comments: note, decidedAt: now, statusKey: decision } });
    await createHistory.mutateAsync({ actorPersonID: actor, changedAt: now, changeType: `Approval ${decision}`, fieldName: 'approvalStatus', oldValue: approval.statusKey, newValue: decision, reason: note || `${decision} in approval queue`, requestID: approval.requestId, source: 'Approval Engine', workspaceID: { id: activeWorkspace.id, workspaceName: activeWorkspace.workspaceName } });
    toast.success(`Approval ${decision.toLowerCase()}`);
  };

  return <main className="flex-1 p-4 md:p-6"><div className="mx-auto max-w-7xl space-y-5">
    <InMemoryDataBanner show={HAS_IN_MEMORY_TABLES} message="This app uses draft tables for testing. Data entered won't be saved. Contact the app owner to enable storage." className="border-border bg-secondary text-secondary-foreground" />
    <div className="flex flex-wrap items-end justify-between gap-3"><div><h1 className="text-2xl font-semibold">Approval queue</h1><p className="text-sm text-muted-foreground">Act on reusable, policy-driven approvals for this workspace.</p></div><Select value={status} onValueChange={(value: (typeof statusFilters)[number]) => setStatus(value)}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent>{statusFilters.filter((value: string) => Boolean(value)).map((value: (typeof statusFilters)[number]) => <SelectItem key={value} value={value}>{value === 'all' ? 'All statuses' : value}</SelectItem>)}</SelectContent></Select></div>
    {isLoading && <p aria-live="polite">Loading approvals…</p>}
    <div className="grid gap-4 xl:grid-cols-2">{visible.map((approval: RequestApproval) => { const target = targetsByRequest.get(approval.requestId.id); return <Card key={approval.id} className="border-l-4 border-l-primary"><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle className="text-base">{approval.approvalName}</CardTitle><CardDescription>{approval.requestId.requestNumber} · Stage {approval.stageNumber}</CardDescription></div><Badge variant={approval.statusKey === 'Rejected' ? 'destructive' : approval.statusKey === 'Pending' ? 'default' : 'secondary'}>{approval.statusKey}</Badge></div></CardHeader><CardContent className="space-y-4">{target && <ServiceTargetIndicator target={target} compact />}<div className="grid gap-2 text-sm sm:grid-cols-2"><p><span className="text-muted-foreground">Approver</span><br /><strong>{approval.approverPersonId.displayName}</strong></p><p><span className="text-muted-foreground">Rule</span><br /><strong>{approval.approverTypeKey}{approval.approverGroupCode ? ` · ${approval.approverGroupCode}` : ''}</strong></p><p className="flex items-center gap-2"><Clock3 className="size-4" />Created {new Date(approval.createdAt).toLocaleString()}</p><Button variant="outline" size="sm" asChild><Link to={`/w/${workspaceCode}/requests/${approval.requestId.id}`}>Open request<ExternalLink className="size-4" /></Link></Button></div>{approval.statusKey === 'Pending' && <><Textarea aria-label={`Comments for ${approval.approvalName}`} placeholder="Decision comments" value={comments[approval.id] ?? ''} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setComments((current: Record<string, string>) => ({ ...current, [approval.id]: event.target.value }))} /><div className="flex gap-2"><Button onClick={() => void decide(approval, 'Approved')} disabled={updateApproval.isPending}><Check className="size-4" />Approve</Button><Button variant="destructive" onClick={() => void decide(approval, 'Rejected')} disabled={updateApproval.isPending}><X className="size-4" />Reject</Button></div></>}</CardContent></Card>; })}{!isLoading && visible.length === 0 && <Card className="xl:col-span-2"><CardContent className="flex items-center gap-3 p-8"><ShieldCheck className="size-6" /><div><p className="font-medium">No approvals in this view</p><p className="text-sm text-muted-foreground">Choose another status to review completed actions.</p></div></CardContent></Card>}</div>
  </div></main>;
}
