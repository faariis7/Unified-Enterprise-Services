import { useMemo, useState } from 'react';
import { endOfDay, format, startOfDay, subDays } from 'date-fns';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { CalendarIcon, ChevronRight, Clock3, Gauge, HeartPulse, Inbox, LayoutDashboard, LockKeyhole, Plus, TableProperties, UsersRound } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Link, useParams } from 'react-router-dom';
import { useApprovalDecisionList } from '@/generated/hooks/use-approval-decision';
import { useRequestApprovalList } from '@/generated/hooks/use-request-approval';
import { useRequestServiceTargetList } from '@/generated/hooks/use-request-service-target';
import { useRequestList } from '@/generated/hooks/use-request';
import type { Request } from '@/generated/models/request-model';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { buildReportingSnapshot, type ReportKey } from '@/lib/reporting';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const chartConfig = { count: { label: 'Requests', color: 'var(--chart-1)' } } satisfies ChartConfig;
const defaultRange = { from: startOfDay(subDays(new Date(), 29)), to: endOfDay(new Date()) };

export default function ReportingPage() {
  const { workspaceCode = '' } = useParams();
  const { activeWorkspace, requestReadFilter } = useWorkspaceContext();
  const [range, setRange] = useState<DateRange | undefined>(defaultRange);
  const [drilldown, setDrilldown] = useState<ReportKey | undefined>();
  const { data: requests = [], isLoading: requestsLoading } = useRequestList({ filter: requestReadFilter });
  const { data: approvals = [], isLoading: approvalsLoading } = useRequestApprovalList({ filter: activeWorkspace ? `workspaceId eq '${activeWorkspace.id}'` : undefined });
  const { data: decisions = [], isLoading: decisionsLoading } = useApprovalDecisionList({ filter: activeWorkspace ? `workspace eq '${activeWorkspace.id}'` : undefined });
  const { data: targets = [], isLoading: targetsLoading } = useRequestServiceTargetList({ filter: activeWorkspace ? `workspaceId eq '${activeWorkspace.id}'` : undefined });
  const from = range?.from ? startOfDay(range.from) : defaultRange.from;
  const to = range?.to ? endOfDay(range.to) : endOfDay(range?.from ?? defaultRange.to);
  const snapshot = useMemo(() => buildReportingSnapshot(requests, approvals, decisions, targets, activeWorkspace?.id ?? '', from, to), [activeWorkspace?.id, approvals, decisions, from, requests, targets, to]);
  const loading = requestsLoading || approvalsLoading || decisionsLoading || targetsLoading;
  const drilldownRequests = drilldown === 'closed' ? snapshot.closedRequests : drilldown === 'open' || drilldown === 'aging' || drilldown === 'workload' ? snapshot.openRequests : snapshot.scopedRequests;
  const rangeLabel = `${format(from, 'MMM d, yyyy')} – ${format(to, 'MMM d, yyyy')}`;

  const openDrilldown = (key: ReportKey) => setDrilldown(key);
  return (
    <main className="flex-1 p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-5">
        <header className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-sm font-medium text-foreground">{activeWorkspace?.workspaceName}</p><h1 className="text-2xl font-semibold tracking-tight">Operational reporting</h1><p className="text-sm text-muted-foreground">Live, permission-scoped records for the selected workspace.</p></div>
          <div className="flex flex-wrap items-center gap-2"><Button asChild variant="outline"><Link to={`/w/${workspaceCode}/reports/service-health`}><HeartPulse className="size-4" />Service health</Link></Button><Button asChild variant="outline"><Link to={`/w/${workspaceCode}/reports/fields`}><TableProperties className="size-4" />Field catalog</Link></Button><Button asChild variant="outline"><Link to={`/w/${workspaceCode}/reports/dashboards`}><LayoutDashboard className="size-4" />Dashboards</Link></Button><Button asChild><Link to={`/w/${workspaceCode}/reports/builder`}><Plus className="size-4" />New report</Link></Button><Popover><PopoverTrigger asChild><Button variant="outline" className="justify-start"><CalendarIcon className="size-4" />{rangeLabel}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="end"><Calendar mode="range" selected={range} onSelect={setRange} numberOfMonths={1} /></PopoverContent></Popover></div>
        </header>
        <section aria-label="Request summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {[{ key: 'volume' as const, label: 'Request volume', value: snapshot.scopedRequests.length, icon: Inbox }, { key: 'open' as const, label: 'Open requests', value: snapshot.openRequests.length, icon: Clock3 }, { key: 'closed' as const, label: 'Closed requests', value: snapshot.closedRequests.length, icon: LockKeyhole }, { key: 'workload' as const, label: 'Active owners', value: snapshot.workloadRows.length, icon: UsersRound }].map(({ key, label, value, icon: Icon }) => <button type="button" key={key} onClick={() => openDrilldown(key)} className="rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Card className="h-full border-t-4 border-t-primary transition-shadow hover:shadow-md"><CardHeader className="flex-row items-center justify-between pb-2"><CardDescription>{label}</CardDescription><Icon className="size-4" aria-hidden="true" /></CardHeader><CardContent><p className="text-2xl font-semibold tabular-nums">{loading ? '—' : value}</p><p className="mt-1 flex items-center text-xs text-muted-foreground">View records <ChevronRight className="size-3" /></p></CardContent></Card></button>)}
        </section>
        <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
          <Card><CardHeader><CardTitle className="text-base">Request volume</CardTitle><CardDescription>Created records by day in the selected range.</CardDescription></CardHeader><CardContent><ChartContainer config={chartConfig} className="h-64 w-full"><BarChart accessibilityLayer data={snapshot.volumeByDay}><CartesianGrid vertical={false} /><XAxis dataKey="date" tickLine={false} axisLine={false} tickFormatter={(value: string) => format(new Date(`${value}T00:00:00`), 'MMM d')} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="count" fill="var(--chart-1)" radius={4} onClick={() => openDrilldown('volume')} /></BarChart></ChartContainer></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Aging</CardTitle><CardDescription>Current age of open requests.</CardDescription></CardHeader><CardContent className="space-y-4">{snapshot.agingBuckets.map((item: { bucket: string; count: number }) => <button type="button" className="block w-full text-left" key={item.bucket} onClick={() => openDrilldown('aging')}><div className="mb-1 flex justify-between text-sm"><span>{item.bucket}</span><span className="font-medium tabular-nums">{item.count}</span></div><Progress value={snapshot.openRequests.length ? (item.count / snapshot.openRequests.length) * 100 : 0} /></button>)}</CardContent></Card>
        </section>
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          <Card><CardHeader><CardTitle className="text-base">Approval performance</CardTitle><CardDescription>Completed outcomes from live approval records.</CardDescription></CardHeader><CardContent className="space-y-4"><div><p className="text-2xl font-semibold tabular-nums">{snapshot.approvalCompletionRate}%</p><p className="text-sm text-muted-foreground">Completion rate</p></div><div><p className="text-xl font-semibold tabular-nums">{snapshot.approvalAverageHours}h</p><p className="text-sm text-muted-foreground">Average decision time</p></div><Button variant="outline" className="w-full" onClick={() => openDrilldown('approval')}>Review approvals</Button></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Service target performance</CardTitle><CardDescription>Met versus breached completed targets.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="flex items-center gap-3"><div className="rounded-lg bg-primary p-2 text-primary-foreground"><Gauge className="size-5" /></div><p className="text-2xl font-semibold tabular-nums">{snapshot.targetMetRate}%</p></div><Progress value={snapshot.targetMetRate} /><Button variant="outline" className="w-full" onClick={() => openDrilldown('targets')}>Review targets</Button></CardContent></Card>
          <Card><CardHeader><CardTitle className="text-base">Workload</CardTitle><CardDescription>Open requests by current owner.</CardDescription></CardHeader><CardContent className="space-y-3">{snapshot.workloadRows.length ? snapshot.workloadRows.slice(0, 5).map((row: { owner: string; count: number }) => <button type="button" key={row.owner} onClick={() => openDrilldown('workload')} className="flex w-full items-center justify-between rounded-md border border-border px-3 py-2 text-left"><span className="truncate text-sm">{row.owner}</span><span className="font-medium tabular-nums">{row.count}</span></button>) : <p className="text-sm text-muted-foreground">No open workload in this range.</p>}</CardContent></Card>
        </section>
      </div>
      <Sheet open={Boolean(drilldown)} onOpenChange={(open: boolean) => { if (!open) setDrilldown(undefined); }}><SheetContent className="w-full overflow-y-auto sm:max-w-2xl"><SheetHeader><SheetTitle>Report drill-down</SheetTitle><SheetDescription>{rangeLabel} · {activeWorkspace?.workspaceName}</SheetDescription></SheetHeader><div className="px-4 pb-6"><Table><TableHeader><TableRow><TableHead>Request</TableHead><TableHead>Status</TableHead><TableHead>Priority</TableHead><TableHead>Owner</TableHead></TableRow></TableHeader><TableBody>{drilldownRequests.length ? drilldownRequests.map((request: Request) => <TableRow key={request.id}><TableCell><Link className="font-medium underline-offset-4 hover:underline" to={`/w/${workspaceCode}/requests/${request.id}`}>{request.requestNumber}</Link><p className="max-w-60 truncate text-xs text-muted-foreground">{request.title}</p></TableCell><TableCell>{request.statusKey}</TableCell><TableCell>{request.priorityKey}</TableCell><TableCell>{request.assignee.displayName || request.assignmentGroupCode || 'Unassigned'}</TableCell></TableRow>) : <TableRow><TableCell colSpan={4}>No records match this report and date range.</TableCell></TableRow>}</TableBody></Table></div></SheetContent></Sheet>
    </main>
  );
}
