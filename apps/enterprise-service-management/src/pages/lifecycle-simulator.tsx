import { useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, GitBranch, RotateCcw, ShieldCheck } from 'lucide-react';
import { useLifecycleDefinitionList } from '@/generated/hooks/use-lifecycle-definition';
import { useStatusDefinitionList } from '@/generated/hooks/use-status-definition';
import { useStatusTransitionList } from '@/generated/hooks/use-status-transition';
import type { LifecycleDefinition } from '@/generated/models/lifecycle-definition-model';
import type { StatusDefinition } from '@/generated/models/status-definition-model';
import type { StatusTransition } from '@/generated/models/status-transition-model';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { getAvailableTransitions, validateLifecycle } from '@/lib/lifecycle-engine';

export default function LifecycleSimulatorPage() {
  const { activeWorkspace } = useWorkspaceContext();
  const workspaceFilter = activeWorkspace ? `workspace/id eq '${activeWorkspace.id}'` : 'id eq null';
  const alternateWorkspaceFilter = activeWorkspace ? `workspaceID/id eq '${activeWorkspace.id}'` : 'id eq null';
  const { data: definitions = [], isLoading: definitionsLoading } = useLifecycleDefinitionList({ filter: workspaceFilter });
  const { data: statuses = [], isLoading: statusesLoading } = useStatusDefinitionList({ filter: alternateWorkspaceFilter });
  const { data: transitions = [], isLoading: transitionsLoading } = useStatusTransitionList({ filter: alternateWorkspaceFilter });
  const workspaceDefinitions = useMemo(() => definitions.filter((definition: LifecycleDefinition) => definition.statusKey === 'Active'), [definitions]);
  const [selectedLifecycleId, setSelectedLifecycleId] = useState('');
  const selectedLifecycle = workspaceDefinitions.find((definition: LifecycleDefinition) => definition.id === selectedLifecycleId) ?? workspaceDefinitions[0];
  const report = selectedLifecycle ? validateLifecycle(selectedLifecycle, statuses, transitions) : undefined;
  const [simulatedStatusId, setSimulatedStatusId] = useState('');
  const currentStatus = statuses.find((status: StatusDefinition) => status.id === simulatedStatusId) ?? report?.initialStatus;
  const availableTransitions = selectedLifecycle && currentStatus ? getAvailableTransitions(activeWorkspace?.id ?? '', selectedLifecycle.id, currentStatus.id, transitions) : [];
  const loading = definitionsLoading || statusesLoading || transitionsLoading;
  const resetSimulation = () => setSimulatedStatusId(report?.initialStatus?.id ?? '');

  return <main className="flex-1 p-4 md:p-6"><div className="mx-auto max-w-6xl space-y-5">
    <div className="flex flex-col justify-between gap-3 md:flex-row md:items-end"><div><p className="text-sm font-medium text-foreground">{activeWorkspace?.workspaceName}</p><h1 className="text-2xl font-semibold tracking-tight">Lifecycle simulator</h1><p className="text-sm text-muted-foreground">Validate configured request lifecycles and simulate valid paths without changing requests.</p></div><Select value={selectedLifecycle?.id ?? ''} onValueChange={(value: string) => { setSelectedLifecycleId(value); setSimulatedStatusId(''); }}><SelectTrigger className="w-full md:w-72"><SelectValue placeholder="Select lifecycle" /></SelectTrigger><SelectContent>{workspaceDefinitions.filter((definition: LifecycleDefinition) => definition.id).map((definition: LifecycleDefinition) => <SelectItem key={definition.id} value={definition.id}>{definition.name1}</SelectItem>)}</SelectContent></Select></div>
    {loading ? <Card><CardContent className="py-10 text-center text-muted-foreground">Loading lifecycle configuration…</CardContent></Card> : !selectedLifecycle ? <Card><CardContent className="py-10 text-center text-muted-foreground">No active lifecycle is configured for this workspace.</CardContent></Card> : <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
      <Card><CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle className="flex items-center gap-2"><GitBranch className="size-5" />{selectedLifecycle.name1}</CardTitle><CardDescription>Version {selectedLifecycle.version} · {selectedLifecycle.requestTypeCode}</CardDescription></div><Button variant="outline" size="sm" onClick={resetSimulation}><RotateCcw className="size-4" />Reset</Button></div></CardHeader><CardContent className="space-y-5"><div className="rounded-lg border bg-card p-4 text-card-foreground"><p className="text-sm font-medium">Current simulated status</p><p className="mt-1 text-xl font-semibold">{currentStatus?.statusName ?? 'Not available'}</p></div><div><h2 className="mb-3 text-sm font-semibold">Available transitions</h2><div className="grid gap-2">{availableTransitions.length ? availableTransitions.map((transition: StatusTransition) => <Button key={transition.id} variant="outline" className="h-auto justify-between py-3" onClick={() => setSimulatedStatusId(transition.destinationStatusDefinitionID.id)}><span>{transition.transitionName}</span><span className="text-xs">{transition.destinationStatusDefinitionID.statusName}</span></Button>) : <p className="rounded-lg bg-muted p-4 text-sm text-muted-foreground">No outgoing transition is configured. Terminal states intentionally stop here.</p>}</div></div></CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5" />Validation report</CardTitle><CardDescription>Structural checks run against workspace-scoped records.</CardDescription></CardHeader><CardContent className="space-y-3"><Badge variant={report?.valid ? 'default' : 'destructive'}>{report?.valid ? 'Valid configuration' : 'Action required'}</Badge>{!report?.issues.length ? <div className="flex gap-2 rounded-lg bg-secondary p-3 text-sm text-secondary-foreground"><CheckCircle2 className="mt-0.5 size-4 shrink-0" />Initial and terminal states, reachability, and transition paths are valid.</div> : report.issues.map((issue, index: number) => <div key={`${issue.message}-${index}`} className="flex gap-2 rounded-lg border p-3 text-sm"><AlertTriangle className="mt-0.5 size-4 shrink-0" /><div><p className="font-medium">{issue.severity === 'error' ? 'Error' : 'Warning'}</p><p className="text-muted-foreground">{issue.message}</p></div></div>)}</CardContent></Card>
    </div>}
  </div></main>;
}
