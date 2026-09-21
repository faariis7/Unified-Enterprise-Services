import { Link } from 'react-router-dom';
import { AlertTriangle, CheckCircle2, Clock3, Inbox, Target, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { InMemoryDataBanner } from '@/generated/components/in-memory-data-banner';
import { HAS_IN_MEMORY_TABLES } from '@/generated/hooks';
import { useRequestList } from '@/generated/hooks/use-request';
import { useRequestApprovalList } from '@/generated/hooks/use-request-approval';
import { useRequestServiceTargetList } from '@/generated/hooks/use-request-service-target';
import type { Request } from '@/generated/models/request-model';
import type { RequestApproval } from '@/generated/models/request-approval-model';
import type { RequestServiceTarget } from '@/generated/models/request-service-target-model';
import { useWorkspaceContext } from '@/contexts/workspace-context';

export default function OperationsHomePage() {
  const { activeWorkspace, accessibleServiceCodes } = useWorkspaceContext();
  const { data: requests = [] } = useRequestList();
  const { data: approvals = [] } = useRequestApprovalList();
  const { data: targets = [] } = useRequestServiceTargetList();
  const workspaceRequests = requests.filter((request: Request) => request.workspace.id === activeWorkspace?.id && (accessibleServiceCodes.size === 0 || accessibleServiceCodes.has(request.serviceCode)));
  const requestIds = new Set(workspaceRequests.map((request: Request) => request.id));
  const open = workspaceRequests.filter((request: Request) => !['Resolved', 'Closed', 'Cancelled'].includes(request.statusKey));
  const unassigned = open.filter((request: Request) => !request.assignee?.id);
  const pendingApprovals = approvals.filter((approval: RequestApproval) => requestIds.has(approval.requestId.id) && approval.statusKey === 'Pending');
  const atRisk = targets.filter((target: RequestServiceTarget) => requestIds.has(target.requestId.id) && ['Warning', 'Breached'].includes(target.statusKey));
  const base = `/w/${activeWorkspace?.workspaceKey.toLowerCase() ?? 'facility'}`;
  const summaries = [{ label: 'Open work', value: open.length, icon: Inbox }, { label: 'Unassigned', value: unassigned.length, icon: Users }, { label: 'Pending approvals', value: pendingApprovals.length, icon: Clock3 }, { label: 'Targets at risk', value: atRisk.length, icon: Target }];
  return <main className="flex-1 p-5 md:p-8"><div className="mx-auto max-w-7xl space-y-6"><InMemoryDataBanner show={HAS_IN_MEMORY_TABLES} message="Draft storage is active. Operational changes require a production data source before deployment." className="border-border bg-secondary text-secondary-foreground" /><header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between"><div><Badge variant="secondary">Live operations</Badge><h1 className="mt-3 text-2xl font-semibold">{activeWorkspace?.workspaceName}</h1><p className="mt-2 text-muted-foreground">Current workload derived from authorized request, approval, and service-target records.</p></div><Button asChild><Link to={`${base}/requests`}>Open My Services Queue</Link></Button></header><section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{summaries.map(({ label, value, icon: Icon }) => <Card key={label}><CardContent className="flex items-center justify-between p-5"><div><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{value}</p></div><div className="rounded-md bg-secondary p-3 text-secondary-foreground"><Icon className="size-5" /></div></CardContent></Card>)}</section><section className="grid gap-5 lg:grid-cols-[1.5fr_1fr]"><Card><CardHeader><CardTitle>Priority work</CardTitle><CardDescription>Newest authorized open requests requiring operational attention.</CardDescription></CardHeader><CardContent className="space-y-2">{open.slice(0, 6).map((request: Request) => <Link key={request.id} to={`${base}/requests/${request.id}`} className="flex items-center gap-3 rounded-md border border-border p-3 transition hover:bg-muted"><div className="min-w-0 flex-1"><p className="truncate font-medium">{request.title}</p><p className="text-sm text-muted-foreground">{request.requestNumber} · {request.serviceCode}</p></div><Badge variant={request.priorityKey === 'Critical' ? 'destructive' : 'secondary'}>{request.priorityKey}</Badge><span className="text-sm">{request.statusKey}</span></Link>)}{open.length === 0 && <div className="flex items-center gap-3 rounded-md bg-secondary p-4 text-secondary-foreground"><CheckCircle2 className="size-5" />No open work in your authorized services.</div>}</CardContent></Card><Card><CardHeader><CardTitle>Operational attention</CardTitle><CardDescription>Approval and target exceptions from live records.</CardDescription></CardHeader><CardContent className="space-y-3"><div className="flex items-center justify-between rounded-md bg-secondary p-4 text-secondary-foreground"><span>Approvals waiting</span><strong>{pendingApprovals.length}</strong></div><div className="flex items-center justify-between rounded-md bg-secondary p-4 text-secondary-foreground"><span>Target warnings</span><strong>{atRisk.filter((target: RequestServiceTarget) => target.statusKey === 'Warning').length}</strong></div><div className="flex items-center justify-between rounded-md bg-destructive p-4 text-destructive-foreground"><span className="flex items-center gap-2"><AlertTriangle className="size-4" />Breached targets</span><strong>{atRisk.filter((target: RequestServiceTarget) => target.statusKey === 'Breached').length}</strong></div></CardContent></Card></section></div></main>;
}
