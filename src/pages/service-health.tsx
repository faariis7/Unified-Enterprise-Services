import { useMemo, useState } from 'react';
import { endOfDay, format, startOfDay, subDays } from 'date-fns';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { Activity, AlertTriangle, CalendarIcon, ChevronRight, Clock3, RotateCcw, ShieldAlert, TimerOff } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useRequestApprovalList } from '@/generated/hooks/use-request-approval';
import { useRequestList } from '@/generated/hooks/use-request';
import { useRequestServiceTargetList } from '@/generated/hooks/use-request-service-target';
import { useRequestStatusHistoryList } from '@/generated/hooks/use-request-status-history';
import { useRequestTaskList } from '@/generated/hooks/use-request-task';
import { useServiceGovernanceProfileList } from '@/generated/hooks/use-service-governance-profile';
import { useServiceList } from '@/generated/hooks/use-service';
import type { Request } from '@/generated/models/request-model';
import type { Service } from '@/generated/models/service-model';
import type { ServiceGovernanceProfile } from '@/generated/models/service-governance-profile-model';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { buildServiceHealthSnapshot, type ServiceHealthMetric, type ServiceHealthMetricKey } from '@/lib/service-health';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const chartConfig = { count: { label: 'Requests', color: 'var(--chart-1)' } } satisfies ChartConfig;
const defaultRange = { from: startOfDay(subDays(new Date(), 89)), to: endOfDay(new Date()) };
const metricIcons = { volume: Activity, backlog: Clock3, aging: TimerOff, sla: ShieldAlert, 'approval-delays': AlertTriangle, 'task-delays': TimerOff, rejections: ShieldAlert, reopens: RotateCcw };

export default function ServiceHealthPage() {
  const { workspaceCode = '' } = useParams();
  const { activeWorkspace, currentPerson, requestReadFilter, can } = useWorkspaceContext();
  const [serviceId, setServiceId] = useState('all');
  const [range, setRange] = useState<DateRange | undefined>(defaultRange);
  const [drilldown, setDrilldown] = useState<ServiceHealthMetricKey | undefined>();
  const { data: services = [] } = useServiceList();
  const { data: governanceProfiles = [] } = useServiceGovernanceProfileList();
  const { data: requests = [] } = useRequestList({ filter: requestReadFilter });
  const { data: approvals = [] } = useRequestApprovalList({ filter: activeWorkspace ? `workspaceId eq '${activeWorkspace.id}'` : undefined });
  const { data: tasks = [] } = useRequestTaskList({ filter: activeWorkspace ? `workspaceId eq '${activeWorkspace.id}'` : undefined });
  const { data: targets = [] } = useRequestServiceTargetList({ filter: activeWorkspace ? `workspaceId eq '${activeWorkspace.id}'` : undefined });
  const { data: history = [] } = useRequestStatusHistoryList({ filter: activeWorkspace ? `workspaceId eq '${activeWorkspace.id}'` : undefined });
  const governedServiceIds = useMemo(() => new Set(governanceProfiles.filter((profile: ServiceGovernanceProfile) => profile.workspace.id === activeWorkspace?.id && profile.statusKey === 'Active' && [profile.serviceOwner.id, profile.backupOwner.id, profile.reportAuthor.id, profile.auditor.id].includes(currentPerson?.id ?? '')).map((profile: ServiceGovernanceProfile) => profile.service.id)), [activeWorkspace?.id, currentPerson?.id, governanceProfiles]);
  const visibleServices = useMemo(() => services.filter((service: Service) => service.workspace.id === activeWorkspace?.id && !service.isDeleted && (can('workspace.administer') || governedServiceIds.has(service.id))), [activeWorkspace?.id, can, governedServiceIds, services]);
  const selectedService = visibleServices.find((service: Service) => service.id === serviceId) ?? visibleServices[0];
  const from = range?.from ? startOfDay(range.from) : defaultRange.from;
  const to = range?.to ? endOfDay(range.to) : endOfDay(range?.from ?? defaultRange.to);
  const snapshot = useMemo(() => buildServiceHealthSnapshot(requests, approvals, tasks, targets, history, selectedService?.serviceCode ?? '', from, to), [approvals, from, history, requests, selectedService?.serviceCode, targets, tasks, to]);
  const drilldownRequests = drilldown ? snapshot.drilldowns[drilldown] : [];
  const rangeLabel = `${format(from, 'MMM d, yyyy')} – ${format(to, 'MMM d, yyyy')}`;
  if (!activeWorkspace) return <Navigate to="/no-workspace-access" replace />;
  if (!visibleServices.length) return <Navigate to={`/w/${workspaceCode}/reports`} replace />;
  const metricValue = (metric: ServiceHealthMetric) => metric.format === 'percent' ? `${metric.value}%` : metric.format === 'days' ? `${metric.value}d` : metric.value;
  return <main className="flex-1 p-4 md:p-6"><div className="mx-auto max-w-7xl space-y-5">
    <header className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between"><div><Button asChild variant="ghost" size="sm"><Link to={`/w/${workspaceCode}/reports`}>Reporting</Link></Button><h1 className="mt-2 text-2xl font-semibold">Service health</h1><p className="text-sm text-muted-foreground">Operational bottlenecks for services you own or govern.</p></div><div className="flex flex-wrap gap-2"><Select value={selectedService?.id ?? 'none'} onValueChange={setServiceId}><SelectTrigger className="w-64"><SelectValue /></SelectTrigger><SelectContent>{visibleServices.filter((service: Service) => Boolean(service.id)).map((service: Service) => <SelectItem key={service.id} value={service.id}>{service.serviceName}</SelectItem>)}</SelectContent></Select><Popover><PopoverTrigger asChild><Button variant="outline"><CalendarIcon className="size-4" />{rangeLabel}</Button></PopoverTrigger><PopoverContent className="w-auto p-0" align="end"><Calendar mode="range" selected={range} onSelect={setRange} /></PopoverContent></Popover></div></header>
    <section aria-label="Service health metrics" className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{snapshot.metrics.map((metric: ServiceHealthMetric) => { const Icon = metricIcons[metric.key]; return <button type="button" key={metric.key} onClick={() => setDrilldown(metric.key)} className="rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><Card className={`h-full border-l-4 ${metric.tone === 'critical' ? 'border-l-destructive' : metric.tone === 'attention' ? 'border-l-accent-foreground' : 'border-l-primary'} transition-shadow hover:shadow-md`}><CardHeader className="flex-row items-center justify-between pb-2"><CardDescription>{metric.label}</CardDescription><Icon className="size-4" aria-hidden="true" /></CardHeader><CardContent><p className="text-2xl font-semibold tabular-nums">{metricValue(metric)}</p><p className="mt-1 flex items-center text-xs text-muted-foreground">{metric.description}<ChevronRight className="ml-auto size-3" /></p></CardContent></Card></button>; })}</section>
    <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]"><Card><CardHeader><CardTitle className="text-base">Demand trend</CardTitle><CardDescription>New requests for {selectedService?.serviceName}.</CardDescription></CardHeader><CardContent>{snapshot.volumeByDay.length ? <ChartContainer config={chartConfig} className="h-72 w-full"><BarChart accessibilityLayer data={snapshot.volumeByDay}><CartesianGrid vertical={false} /><XAxis dataKey="date" tickLine={false} axisLine={false} tickFormatter={(value: string) => format(new Date(`${value}T00:00:00`), 'MMM d')} /><YAxis allowDecimals={false} tickLine={false} axisLine={false} /><ChartTooltip content={<ChartTooltipContent />} /><Bar dataKey="count" fill="var(--chart-1)" radius={4} /></BarChart></ChartContainer> : <div className="flex h-72 items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">No demand in the selected period.</div>}</CardContent></Card><Card><CardHeader><CardTitle className="text-base">Backlog composition</CardTitle><CardDescription>Open work by current status.</CardDescription></CardHeader><CardContent className="space-y-3">{snapshot.backlogByStatus.length ? snapshot.backlogByStatus.map((row: { label: string; count: number }) => <button type="button" key={row.label} onClick={() => setDrilldown('backlog')} className="flex w-full items-center justify-between rounded-md border border-border p-3 text-left"><span>{row.label === 'InProgress' ? 'In Progress' : row.label}</span><Badge variant="secondary">{row.count}</Badge></button>) : <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">No backlog for this service.</div>}</CardContent></Card></section>
  </div><Sheet open={Boolean(drilldown)} onOpenChange={(open: boolean) => { if (!open) setDrilldown(undefined); }}><SheetContent className="w-full overflow-y-auto sm:max-w-3xl"><SheetHeader><SheetTitle>{snapshot.metrics.find((metric: ServiceHealthMetric) => metric.key === drilldown)?.label ?? 'Service health'} drill-through</SheetTitle><SheetDescription>{selectedService?.serviceName} · {rangeLabel}</SheetDescription></SheetHeader><div className="px-4 pb-6"><Table><TableHeader><TableRow><TableHead>Request</TableHead><TableHead>Status</TableHead><TableHead>Priority</TableHead><TableHead>Assignment</TableHead></TableRow></TableHeader><TableBody>{drilldownRequests.length ? drilldownRequests.map((request: Request) => <TableRow key={request.id}><TableCell><Link className="font-medium underline-offset-4 hover:underline" to={`/w/${workspaceCode}/requests/${request.id}`}>{request.requestNumber}</Link><p className="max-w-72 truncate text-xs text-muted-foreground">{request.title}</p></TableCell><TableCell>{request.statusKey}</TableCell><TableCell>{request.priorityKey}</TableCell><TableCell>{request.assignee.displayName || request.assignmentGroupCode || 'Unassigned'}</TableCell></TableRow>) : <TableRow><TableCell colSpan={4}>No requests contribute to this metric.</TableCell></TableRow>}</TableBody></Table></div></SheetContent></Sheet></main>;
}
