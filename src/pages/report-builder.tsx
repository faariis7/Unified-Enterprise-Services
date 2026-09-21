import { useMemo, useState } from 'react';
import { endOfDay, format, startOfDay, subDays } from 'date-fns';
import { ArrowLeft, CalendarIcon, Save, ShieldCheck, TableProperties } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { Link, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { ReportVisualization } from '@/components/report-visualization';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { InMemoryDataBanner } from '@/generated/components/in-memory-data-banner';
import { HAS_IN_MEMORY_TABLES } from '@/generated/hooks';
import { useFieldDefinitionList } from '@/generated/hooks/use-field-definition';
import { useFormVersionList } from '@/generated/hooks/use-form-version';
import { useRequestFieldValueList } from '@/generated/hooks/use-request-field-value';
import { useRequestList } from '@/generated/hooks/use-request';
import { useCreateSavedReportConfiguration } from '@/generated/hooks/use-saved-report-configuration';
import { useCreateSavedReportDefinition } from '@/generated/hooks/use-saved-report-definition';
import { useServiceList } from '@/generated/hooks/use-service';
import type { FieldDefinition } from '@/generated/models/field-definition-model';
import type { Request } from '@/generated/models/request-model';
import type { Service } from '@/generated/models/service-model';
import { discoverReportDimensions, executeReport, validAggregations, type ReportAggregation, type ReportDefinitionInput, type ReportDimension, type ReportVisualization as Visualization } from '@/lib/report-execution-service';

export default function ReportBuilderPage() {
  const { workspaceCode = '' } = useParams();
  const { activeWorkspace, currentPerson, requestReadFilter, can } = useWorkspaceContext();
  const [name, setName] = useState('Request demand by day');
  const [description, setDescription] = useState('Created requests grouped by day for operational planning.');
  const [serviceCode, setServiceCode] = useState('all');
  const [dimensionKey, setDimensionKey] = useState('createdDate');
  const [aggregation, setAggregation] = useState<ReportAggregation>('Count');
  const [visualization, setVisualization] = useState<Visualization>('Bar');
  const [sharing, setSharing] = useState<'Private' | 'Workspace' | 'Service'>('Workspace');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [range, setRange] = useState<DateRange | undefined>({ from: startOfDay(subDays(new Date(), 29)), to: endOfDay(new Date()) });
  const { data: requests = [] } = useRequestList({ filter: requestReadFilter });
  const { data: services = [] } = useServiceList();
  const { data: fields = [] } = useFieldDefinitionList();
  const { data: versions = [] } = useFormVersionList();
  const { data: answers = [] } = useRequestFieldValueList();
  const createDefinition = useCreateSavedReportDefinition();
  const createConfiguration = useCreateSavedReportConfiguration();
  const workspaceServices = services.filter((service: Service) => service.workspace.id === activeWorkspace?.id && !service.isDeleted);
  const context = useMemo(() => ({ workspaceId: activeWorkspace?.id ?? '', requests, answers, fields, versions, canReadRequest: (request: Request) => can('request.read', { workspaceId: request.workspace.id, requesterId: request.requester.id, requestedForId: request.requestedFor.id, assigneeId: request.assignee.id, assignmentGroupCode: request.assignmentGroupCode, serviceCode: request.serviceCode }), canReadField: (field: FieldDefinition) => !field.sensitive }), [activeWorkspace?.id, answers, can, fields, requests, versions]);
  const dimensions = useMemo(() => discoverReportDimensions(context, serviceCode === 'all' ? undefined : serviceCode), [context, serviceCode]);
  const selectedDimension = dimensions.find((item: ReportDimension) => item.key === dimensionKey) ?? dimensions[0];
  const aggregations = selectedDimension ? validAggregations(selectedDimension) : ['Count'] as ReportAggregation[];
  const from = startOfDay(range?.from ?? subDays(new Date(), 29));
  const to = endOfDay(range?.to ?? range?.from ?? new Date());
  const input: ReportDefinitionInput = { dimensionKey: selectedDimension?.key ?? 'createdDate', aggregation: aggregations.includes(aggregation) ? aggregation : aggregations[0], visualization, serviceCode: serviceCode === 'all' ? undefined : serviceCode, from: from.toISOString(), to: to.toISOString(), filters: [], sort: { by: 'value', direction: sortDirection }, page: 1, pageSize: 20 };
  const result = useMemo(() => executeReport(input, context), [context, input.aggregation, input.dimensionKey, input.from, input.serviceCode, input.sort.direction, input.to, input.visualization]);
  const saveReport = async () => {
    if (!activeWorkspace || !currentPerson || !name.trim() || !selectedDimension || !can('report.definition.manage')) { toast.error('You do not have permission to save this report.'); return; }
    try {
      const definition = await createDefinition.mutateAsync({ name1: name.trim(), description: description.trim(), workspace: { id: activeWorkspace.id, workspaceName: activeWorkspace.workspaceName }, ownerPerson: { id: currentPerson.id, displayName: currentPerson.displayName }, sharingScopeKey: sharing, serviceCode: input.serviceCode, accessPermissionKey: 'report.workspace.read', statusKey: 'Active', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), isDeleted: false });
      const persistedAggregation: 'Average' | 'Count' | 'Maximum' | 'Minimum' | 'None' | 'Sum' = input.aggregation === 'DistinctCount' || input.aggregation === 'Median' || input.aggregation === 'TrueFalseDistribution' ? 'Count' : input.aggregation;
      await createConfiguration.mutateAsync({ configurationName: `${name.trim()} configuration`, savedReportDefinition: { id: definition.id, name1: definition.name1 }, dateScopeKey: 'Custom', measureKey: input.aggregation, dimensionKey: input.dimensionKey, aggregationKey: persistedAggregation, customFieldDefinition: selectedDimension.fieldDefinitionId ? { id: selectedDimension.fieldDefinitionId, label: selectedDimension.label } : undefined, filtersJSON: JSON.stringify({ workspaceId: activeWorkspace.id, serviceCode: input.serviceCode, from: input.from, to: input.to, execution: input }), sortingJSON: JSON.stringify([{ field: input.dimensionKey, direction: input.sort.direction }]), visualizationKey: visualization, layoutJSON: JSON.stringify({ width: 'Full' }) });
      toast.success('Governed report saved.');
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'The report could not be saved.'); }
  };
  return <main className="flex-1 p-4 md:p-6"><div className="mx-auto max-w-7xl space-y-5"><InMemoryDataBanner show={HAS_IN_MEMORY_TABLES} message="Reporting currently uses application-layer authorization and in-memory records." className="border-border bg-secondary text-secondary-foreground" /><header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between"><div><Button asChild variant="ghost" size="sm"><Link to={`/w/${workspaceCode}/reports`}><ArrowLeft className="size-4" />Reporting</Link></Button><h1 className="mt-2 text-2xl font-semibold">Report builder</h1><p className="text-sm text-muted-foreground">Execute common and version-bound custom dimensions through one governed engine.</p></div><div className="flex gap-2"><Button asChild variant="outline"><Link to={`/w/${workspaceCode}/reports/fields`}><TableProperties className="size-4" />Field catalog</Link></Button><Button onClick={() => void saveReport()}><Save className="size-4" />Save report</Button></div></header><div className="grid gap-5 xl:grid-cols-[400px_1fr]"><Card><CardHeader><CardTitle className="text-base">Definition</CardTitle><CardDescription>Request and field permissions are applied before values enter results.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="report-name">Name</Label><Input id="report-name" value={name} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setName(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="report-description">Description</Label><Textarea id="report-description" value={description} onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(event.target.value)} /></div><div className="space-y-2"><Label>Date scope</Label><Popover><PopoverTrigger asChild><Button variant="outline" className="w-full justify-start"><CalendarIcon className="size-4" />{format(from, 'MMM d, yyyy')} – {format(to, 'MMM d, yyyy')}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="range" selected={range} onSelect={setRange} /></PopoverContent></Popover></div><div className="space-y-2"><Label>Service scope</Label><Select value={serviceCode} onValueChange={(value: string) => { setServiceCode(value); setDimensionKey('createdDate'); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All services</SelectItem>{workspaceServices.filter((service: Service) => Boolean(service.serviceCode)).map((service: Service) => <SelectItem key={service.id} value={service.serviceCode}>{service.serviceName}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Dimension</Label><Select value={selectedDimension?.key} onValueChange={(value: string) => { setDimensionKey(value); setAggregation('Count'); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{dimensions.filter((item: ReportDimension) => Boolean(item.key)).map((item: ReportDimension) => <SelectItem key={item.key} value={item.key}>{item.label} · {item.source}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Measure</Label><Select value={input.aggregation} onValueChange={(value: ReportAggregation) => setAggregation(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{aggregations.map((value: ReportAggregation) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Sort</Label><Select value={sortDirection} onValueChange={(value: 'asc' | 'desc') => setSortDirection(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="desc">Highest first</SelectItem><SelectItem value="asc">Lowest first</SelectItem></SelectContent></Select></div></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Visualization</Label><Select value={visualization} onValueChange={(value: Visualization) => setVisualization(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(['Summary', 'Table', 'Bar', 'Line', 'Donut'] as Visualization[]).map((value: Visualization) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Sharing</Label><Select value={sharing} onValueChange={(value: 'Private' | 'Workspace' | 'Service') => setSharing(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Private', 'Workspace', 'Service'].map((value: string) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div></div><div className="rounded-md bg-secondary p-3 text-secondary-foreground"><p className="flex items-center gap-2 text-sm font-medium"><ShieldCheck className="size-4" />Application-layer governance</p><p className="mt-1 text-xs">Sensitive metadata and unauthorized requests are excluded before projection. A trusted backend remains a future security boundary.</p></div></CardContent></Card><Card><CardHeader><CardTitle className="text-base">Live preview</CardTitle><CardDescription>{result.authorizedRequestCount} authorized requests · {dimensions.filter((item: ReportDimension) => item.source === 'custom').length} custom dimensions.</CardDescription></CardHeader><CardContent><ReportVisualization result={result} title={name} /></CardContent></Card></div></div></main>;
}
