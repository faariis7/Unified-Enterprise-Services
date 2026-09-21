import { useMemo, useState, type ChangeEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useRequestList } from '@/generated/hooks/use-request';
import type { Request } from '@/generated/models/request-model';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function RequestQueuePage() {
  const { workspaceCode = '' } = useParams();
  const { activeWorkspace, requestReadFilter } = useWorkspaceContext();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const { data: requests = [], isLoading, isError } = useRequestList({ filter: requestReadFilter, orderBy: ['updatedAt desc'] });
  const visible = useMemo(() => requests.filter((request: Request) => {
    const matchesSearch = `${request.requestNumber} ${request.title} ${request.requester.displayName}`.toLowerCase().includes(search.toLowerCase());
    return matchesSearch && (status === 'all' || request.statusKey === status);
  }), [requests, search, status]);

  return (
    <main className="flex-1 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <div><p className="text-sm font-medium text-foreground">{activeWorkspace?.workspaceName}</p><h1 className="text-2xl font-semibold tracking-tight">Requests</h1><p className="text-sm text-muted-foreground">Workspace-scoped service requests and current ownership.</p></div>
        <Card>
          <CardHeader className="gap-3 border-b md:flex-row md:items-center md:justify-between"><CardTitle className="text-base">Request queue</CardTitle><div className="flex w-full gap-2 md:w-auto"><div className="relative flex-1 md:w-72"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input value={search} onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)} placeholder="Search requests" className="pl-9" /></div><Select value={status} onValueChange={setStatus}><SelectTrigger className="w-40"><SlidersHorizontal className="size-4" /><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{['New','Assigned','InProgress','Pending','Resolved','Closed','Cancelled'].map((value: string) => <SelectItem key={value} value={value}>{value === 'InProgress' ? 'In Progress' : value}</SelectItem>)}</SelectContent></Select></div></CardHeader>
          <CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Request</TableHead><TableHead>Status</TableHead><TableHead>Priority</TableHead><TableHead>Requester</TableHead><TableHead>Assignment</TableHead><TableHead>Updated</TableHead></TableRow></TableHeader><TableBody>{isLoading ? <TableRow><TableCell colSpan={6}>Loading authorized requests…</TableCell></TableRow> : isError ? <TableRow><TableCell colSpan={6}>The authorized request queue could not be loaded. Refresh to try again.</TableCell></TableRow> : visible.length === 0 ? <TableRow><TableCell colSpan={6}>No matching requests in this workspace.</TableCell></TableRow> : visible.map((request: Request) => <TableRow key={request.id}><TableCell><Link className="font-medium text-foreground underline-offset-4 hover:underline" to={`/w/${workspaceCode}/requests/${request.id}`}>{request.requestNumber}</Link><div className="max-w-md truncate text-sm text-muted-foreground">{request.title}</div></TableCell><TableCell><Badge variant="secondary">{request.statusKey === 'InProgress' ? 'In Progress' : request.statusKey}</Badge></TableCell><TableCell>{request.priorityKey}</TableCell><TableCell>{request.requester.displayName}</TableCell><TableCell>{request.assignmentGroupCode || request.assignee.displayName}</TableCell><TableCell>{new Date(request.updatedAt).toLocaleString()}</TableCell></TableRow>)}</TableBody></Table></CardContent>
        </Card>
      </div>
    </main>
  );
}
