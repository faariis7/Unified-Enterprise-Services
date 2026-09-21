import { useMemo, useState } from 'react';
import { ArrowLeft, Search, ShieldAlert } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { useFieldDefinitionList } from '@/generated/hooks/use-field-definition';
import { useFieldDependencyList } from '@/generated/hooks/use-field-dependency';
import { useFormVersionList } from '@/generated/hooks/use-form-version';
import { useRequestFieldValueList } from '@/generated/hooks/use-request-field-value';
import { useServiceList } from '@/generated/hooks/use-service';
import { buildFieldCatalog, type ReportingFieldCatalogRow } from '@/lib/reporting-projections';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function ReportFieldCatalogPage() {
  const { workspaceCode = '' } = useParams();
  const { activeWorkspace } = useWorkspaceContext();
  const [query, setQuery] = useState('');
  const [eligibility, setEligibility] = useState('all');
  const { data: fields = [] } = useFieldDefinitionList();
  const { data: dependencies = [] } = useFieldDependencyList();
  const { data: versions = [] } = useFormVersionList();
  const { data: answers = [] } = useRequestFieldValueList();
  const { data: services = [] } = useServiceList();
  const rows = useMemo(() => buildFieldCatalog(fields, services, versions, dependencies, answers).filter((row: ReportingFieldCatalogRow) => row.workspaceId === activeWorkspace?.id), [activeWorkspace?.id, answers, dependencies, fields, services, versions]);
  const filtered = rows.filter((row: ReportingFieldCatalogRow) => {
    const matchesQuery = `${row.serviceName} ${row.label} ${row.stableKey} ${row.type} ${row.versionLabel}`.toLowerCase().includes(query.toLowerCase());
    const matchesEligibility = eligibility === 'all' || (eligibility === 'reportable' ? row.reportable && !row.sensitive : !row.reportable || row.sensitive);
    return matchesQuery && matchesEligibility;
  });
  return <main className="flex-1 p-4 md:p-6"><div className="mx-auto max-w-7xl space-y-5"><header className="flex flex-col gap-4 border-b border-border pb-5 md:flex-row md:items-end md:justify-between"><div><Button asChild variant="ghost" size="sm"><Link to={`/w/${workspaceCode}/reports`}><ArrowLeft className="size-4" />Reporting</Link></Button><h1 className="mt-2 text-2xl font-semibold">Field catalog</h1><p className="text-sm text-muted-foreground">Historical, version-aware inventory of metadata fields and reporting eligibility.</p></div><div className="flex gap-2"><div className="relative"><Search className="absolute left-3 top-3 size-4" aria-hidden="true" /><Input className="pl-9" aria-label="Search fields" placeholder="Search fields" value={query} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} /></div><Select value={eligibility} onValueChange={setEligibility}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All fields</SelectItem><SelectItem value="reportable">Reportable</SelectItem><SelectItem value="restricted">Restricted</SelectItem></SelectContent></Select></div></header><section className="grid gap-3 sm:grid-cols-3"><Card><CardHeader className="pb-2"><CardDescription>Field versions</CardDescription><CardTitle>{rows.length}</CardTitle></CardHeader></Card><Card><CardHeader className="pb-2"><CardDescription>Available to reports</CardDescription><CardTitle>{rows.filter((row: ReportingFieldCatalogRow) => row.reportable && !row.sensitive).length}</CardTitle></CardHeader></Card><Card><CardHeader className="pb-2"><CardDescription>Protected fields</CardDescription><CardTitle>{rows.filter((row: ReportingFieldCatalogRow) => row.sensitive).length}</CardTitle></CardHeader></Card></section><Card><CardHeader><CardTitle className="text-base">Metadata inventory</CardTitle><CardDescription>Labels and types are retained per version so historical reports keep their original meaning.</CardDescription></CardHeader><CardContent><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Service / field</TableHead><TableHead>Version</TableHead><TableHead>Type</TableHead><TableHead>Eligibility</TableHead><TableHead>Dependencies</TableHead><TableHead className="text-right">Answers</TableHead></TableRow></TableHeader><TableBody>{filtered.length ? filtered.map((row: ReportingFieldCatalogRow) => <TableRow key={row.id}><TableCell><p className="font-medium">{row.label}</p><p className="text-xs text-muted-foreground">{row.serviceName} · {row.stableKey}</p></TableCell><TableCell>{row.versionLabel}</TableCell><TableCell><Badge variant="outline">{row.type}</Badge></TableCell><TableCell>{row.sensitive ? <Badge variant="destructive"><ShieldAlert className="size-3" />Sensitive</Badge> : row.reportable ? <Badge>Reportable</Badge> : <Badge variant="secondary">Not reportable</Badge>}</TableCell><TableCell>{row.dependencies.length ? row.dependencies.join(', ') : 'None'}</TableCell><TableCell className="text-right tabular-nums">{row.usageCount}</TableCell></TableRow>) : <TableRow><TableCell colSpan={6}>No metadata fields match this view.</TableCell></TableRow>}</TableBody></Table></div></CardContent></Card></div></main>;
}
