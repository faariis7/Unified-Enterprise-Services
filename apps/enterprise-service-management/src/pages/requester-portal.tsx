import { useMemo, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { BookOpen, Boxes, CheckCircle2, ClipboardList, Plus } from 'lucide-react';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { useRequestList } from '@/generated/hooks/use-request';
import { useRequestApprovalList } from '@/generated/hooks/use-request-approval';
import type { Request } from '@/generated/models/request-model';
import type { RequestApproval } from '@/generated/models/request-approval-model';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import KnowledgeCenterPage from '@/pages/knowledge-center';

const portalSections = [
  { route: 'my-requests', title: 'My requests', description: 'Track updates, reply, and confirm outcomes.', icon: ClipboardList },
  { route: 'catalog', title: 'Service catalog', description: 'Request an available service.', icon: Plus },
  { route: 'knowledge', title: 'Knowledge', description: 'Find guidance and common solutions.', icon: BookOpen },
  { route: 'my-approvals', title: 'My approvals', description: 'Review decisions assigned to you.', icon: CheckCircle2 },
  { route: 'my-assets', title: 'My assets', description: 'View assets associated with your requests.', icon: Boxes },
] as const;

export default function RequesterPortalPage() {
  const { workspaceCode = '', portalSection = '' } = useParams();
  const { activeWorkspace, currentPerson } = useWorkspaceContext();
  const ownFilter = activeWorkspace && currentPerson ? `workspace/id eq '${activeWorkspace.id}' and (requester/id eq '${currentPerson.id}' or requestedFor/id eq '${currentPerson.id}')` : 'id eq null';
  const { data: requests = [], isLoading } = useRequestList({ filter: ownFilter, orderBy: ['updatedAt desc'] });
  const approvalFilter = activeWorkspace && currentPerson ? `workspaceId/id eq '${activeWorkspace.id}' and approverPersonId/id eq '${currentPerson.id}'` : 'id eq null';
  const { data: approvals = [] } = useRequestApprovalList({ filter: approvalFilter, orderBy: ['createdAt desc'] });

  if (!activeWorkspace || !currentPerson) return <Navigate to="/no-workspace-access" replace />;
  const base = `/w/${workspaceCode}/portal`;

  if (portalSection === 'catalog') return <Navigate to={`/w/${workspaceCode}/catalog`} replace />;
  if (portalSection === 'my-requests') return <PortalFrame title="My requests" description="Only requests you submitted or requested for yourself are shown."><RequestCards requests={requests} workspaceCode={workspaceCode} loading={isLoading} /></PortalFrame>;
  if (portalSection === 'my-approvals') return <PortalFrame title="My approvals" description="Approvals assigned directly to you in this workspace."><div className="grid gap-3">{approvals.map((approval: RequestApproval) => <Card key={approval.id}><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><div><p className="font-medium">{approval.approvalName}</p><p className="text-sm text-muted-foreground">{approval.requestId.requestNumber} · Stage {approval.stageNumber}</p></div><div className="flex items-center gap-2"><Badge variant={approval.statusKey === 'Rejected' ? 'destructive' : approval.statusKey === 'Pending' ? 'default' : 'secondary'}>{approval.statusKey}</Badge><Button variant="outline" size="sm" asChild><Link to={`/w/${workspaceCode}/portal/requests/${approval.requestId.id}`}>View request</Link></Button></div></CardContent></Card>)}{approvals.length === 0 && <PortalEmpty title="No approvals" description="You have no approval actions in this workspace." />}</div></PortalFrame>;
  if (portalSection === 'knowledge') return <KnowledgeCenterPage requesterMode />;
  if (portalSection === 'my-assets' || portalSection === 'profile') return <PortalFrame title="Profile" description="Your requester identity and service preferences."><InfoCard title={currentPerson.displayName} description="Your profile is used to personalize services and protect your request information." /></PortalFrame>;

  return <Navigate to="/" replace />;
}

function PortalFrame({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <main className="flex-1 p-4 md:p-6"><div className="mx-auto max-w-6xl space-y-5"><div><h1 className="text-2xl font-semibold">{title}</h1><p className="text-muted-foreground">{description}</p></div>{children}</div></main>;
}

type StatusFilter = 'all' | 'open' | 'resolved' | 'closed';

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'open', label: 'Open' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
];

function RequestCards({ requests, workspaceCode, loading }: { requests: Request[]; workspaceCode: string; loading: boolean }) {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const filteredRequests = useMemo(() => requests.filter((request: Request) => {
    if (statusFilter === 'all') return true;
    if (statusFilter === 'open') return !['Resolved', 'Closed', 'Cancelled'].includes(request.statusKey);
    if (statusFilter === 'resolved') return request.statusKey === 'Resolved';
    return ['Closed', 'Cancelled'].includes(request.statusKey);
  }), [requests, statusFilter]);
  const countFor = (filter: StatusFilter) => requests.filter((request: Request) => {
    if (filter === 'all') return true;
    if (filter === 'open') return !['Resolved', 'Closed', 'Cancelled'].includes(request.statusKey);
    if (filter === 'resolved') return request.statusKey === 'Resolved';
    return ['Closed', 'Cancelled'].includes(request.statusKey);
  }).length;

  if (loading) return <p aria-live="polite">Loading your requests…</p>;
  if (!requests.length) return <PortalEmpty title="No requests yet" description="Use the service catalog to create your first request." />;
  return <div className="space-y-4"><div className="flex flex-wrap gap-2" role="group" aria-label="Filter requests by status">{statusFilters.map((filter: { value: StatusFilter; label: string }) => <Button key={filter.value} type="button" size="sm" variant={statusFilter === filter.value ? 'default' : 'outline'} onClick={() => setStatusFilter(filter.value)} aria-pressed={statusFilter === filter.value}>{filter.label}<Badge variant={statusFilter === filter.value ? 'secondary' : 'outline'}>{countFor(filter.value)}</Badge></Button>)}</div>{filteredRequests.length > 0 ? <div className="grid gap-3">{filteredRequests.map((request: Request) => <Card key={request.id}><CardContent className="flex flex-wrap items-center justify-between gap-3 p-4"><div><div className="flex items-center gap-2"><p className="font-semibold">{request.requestNumber}</p><Badge variant="secondary">{request.statusKey}</Badge></div><p className="mt-1">{request.title}</p><p className="text-sm text-muted-foreground">Updated {new Date(request.updatedAt).toLocaleString()}</p></div><Button asChild><Link to={`/w/${workspaceCode}/portal/requests/${request.id}`}>View</Link></Button></CardContent></Card>)}</div> : <PortalEmpty title="No matching requests" description={`You have no ${statusFilter} requests right now.`} />}</div>;
}

function PortalEmpty({ title, description }: { title: string; description: string }) {
  return <Empty className="rounded-lg border py-12"><EmptyHeader><EmptyTitle>{title}</EmptyTitle><EmptyDescription>{description}</EmptyDescription></EmptyHeader></Empty>;
}

function InfoCard({ title, description }: { title: string; description: string }) {
  return <Card><CardHeader><CardTitle className="text-base">{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader></Card>;
}
