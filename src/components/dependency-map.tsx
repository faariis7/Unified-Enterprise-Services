import { AlertTriangle, ArrowRight, CheckCircle2, GitBranch, ShieldAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { DependencyKind, DependencyMap as DependencyMapModel, ImpactSeverity } from '@/lib/dependency-mapping';

const kinds: DependencyKind[] = ['Field', 'Rule', 'Component', 'Workflow', 'Lifecycle', 'SLA', 'Report', 'Dashboard', 'Template'];
const severityLabel: Record<ImpactSeverity, string> = { safe: 'Safe impact', warning: 'Warning', breaking: 'Breaking change' };

export function DependencyMap({ map }: { map: DependencyMapModel }) {
  const counts = { safe: map.impacts.filter((item) => item.severity === 'safe').length, warning: map.impacts.filter((item) => item.severity === 'warning').length, breaking: map.impacts.filter((item) => item.severity === 'breaking').length };
  return <div className="space-y-4">
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-md bg-secondary p-3 text-secondary-foreground"><CheckCircle2 className="mb-2 size-4" /><p className="text-xl font-semibold">{counts.safe}</p><p className="text-xs">Safe impacts</p></div>
      <div className="rounded-md bg-accent p-3 text-accent-foreground"><AlertTriangle className="mb-2 size-4" /><p className="text-xl font-semibold">{counts.warning}</p><p className="text-xs">Warnings</p></div>
      <div className="rounded-md bg-destructive p-3 text-destructive-foreground"><ShieldAlert className="mb-2 size-4" /><p className="text-xl font-semibold">{counts.breaking}</p><p className="text-xs">Breaking changes</p></div>
    </div>
    <Card><CardHeader><CardTitle className="flex items-center gap-2 text-base"><GitBranch className="size-4" />Dependency graph</CardTitle><CardDescription>Trace metadata consumers before changing a published service.</CardDescription></CardHeader><CardContent className="space-y-5">{kinds.map((kind: DependencyKind) => { const nodes = map.nodes.filter((node) => node.kind === kind); if (!nodes.length) return null; return <section key={kind}><div className="mb-2 flex items-center gap-2"><Badge variant="outline">{kind}</Badge><span className="text-xs text-muted-foreground">{nodes.length} records</span></div><div className="grid gap-2 md:grid-cols-2">{nodes.map((node) => { const outgoing = map.edges.filter((edge) => edge.source === node.id); return <div key={node.id} className="rounded-md border bg-card p-3 text-card-foreground"><p className="font-medium">{node.label}</p><p className="text-xs text-muted-foreground">{node.detail}</p>{outgoing.map((edge) => { const target = map.nodes.find((item) => item.id === edge.target); return <div key={edge.id} className="mt-2 flex items-center gap-2 text-xs"><ArrowRight className="size-3" /><span>{edge.relation}</span><span className="font-medium">{target?.label ?? 'Missing reference'}</span></div>; })}</div>; })}</div></section>; })}</CardContent></Card>
    <Card><CardHeader><CardTitle className="text-base">Publication impact gate</CardTitle><CardDescription>Breaking changes block safe publication until dependencies are corrected or explicitly remapped.</CardDescription></CardHeader><CardContent className="space-y-2">{map.impacts.length ? map.impacts.map((impact) => <div key={impact.id} className={`rounded-md p-3 ${impact.severity === 'breaking' ? 'bg-destructive text-destructive-foreground' : impact.severity === 'warning' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}><div className="flex flex-wrap items-center justify-between gap-2"><p className="font-medium">{impact.title}</p><Badge variant={impact.severity === 'breaking' ? 'destructive' : 'outline'}>{severityLabel[impact.severity]}</Badge></div><p className="mt-1 text-sm">{impact.detail}</p></div>) : <div className="rounded-md bg-secondary p-3 text-secondary-foreground">No changes from the published version.</div>}</CardContent></Card>
  </div>;
}
