import { useMemo, useState, type ChangeEvent } from 'react';
import { ArrowRight, CheckCircle2, GitBranch, Plus, Save, ShieldCheck, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { useLifecycleDefinitionList } from '@/generated/hooks/use-lifecycle-definition';
import { useLifecycleStageList, useCreateLifecycleStage } from '@/generated/hooks/use-lifecycle-stage';
import { useStatusDefinitionList, useCreateStatusDefinition, useUpdateStatusDefinition } from '@/generated/hooks/use-status-definition';
import { useStatusTransitionList, useCreateStatusTransition, useUpdateStatusTransition } from '@/generated/hooks/use-status-transition';
import { useTransitionValidationList, useCreateTransitionValidation } from '@/generated/hooks/use-transition-validation';
import { useTransitionPermissionList, useCreateTransitionPermission } from '@/generated/hooks/use-transition-permission';
import { useCreateConfigurationAuditEvent } from '@/generated/hooks/use-configuration-audit-event';
import type { LifecycleDefinition } from '@/generated/models/lifecycle-definition-model';
import type { LifecycleStage } from '@/generated/models/lifecycle-stage-model';
import type { StatusDefinition } from '@/generated/models/status-definition-model';
import type { StatusTransition } from '@/generated/models/status-transition-model';
import type { TransitionValidationValidationTypeKey } from '@/generated/models/transition-validation-model';
import { validateLifecycle } from '@/lib/lifecycle-engine';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';

export default function LifecycleBuilderPage() {
  const { activeWorkspace, currentPerson } = useWorkspaceContext();
  const workspaceFilter = activeWorkspace ? `workspace/id eq '${activeWorkspace.id}'` : 'id eq null';
  const alternateFilter = activeWorkspace ? `workspaceID/id eq '${activeWorkspace.id}'` : 'id eq null';
  const { data: definitions = [] } = useLifecycleDefinitionList({ filter: workspaceFilter });
  const { data: stages = [] } = useLifecycleStageList({ filter: alternateFilter });
  const { data: statuses = [] } = useStatusDefinitionList({ filter: alternateFilter });
  const { data: transitions = [] } = useStatusTransitionList({ filter: alternateFilter });
  const { data: validations = [] } = useTransitionValidationList({ filter: alternateFilter });
  const { data: permissions = [] } = useTransitionPermissionList({ filter: alternateFilter });
  const createStage = useCreateLifecycleStage();
  const createStatus = useCreateStatusDefinition();
  const updateStatus = useUpdateStatusDefinition();
  const createTransition = useCreateStatusTransition();
  const updateTransition = useUpdateStatusTransition();
  const createValidation = useCreateTransitionValidation();
  const createPermission = useCreateTransitionPermission();
  const createAudit = useCreateConfigurationAuditEvent();
  const activeDefinitions = useMemo(() => definitions.filter((item: LifecycleDefinition) => item.statusKey === 'Active'), [definitions]);
  const [definitionId, setDefinitionId] = useState('');
  const definition = activeDefinitions.find((item: LifecycleDefinition) => item.id === definitionId) ?? activeDefinitions[0];
  const lifecycleStages = stages.filter((item: LifecycleStage) => item.lifecycleDefinitionID.id === definition?.id && item.statusKey === 'Active').sort((a: LifecycleStage, b: LifecycleStage) => a.sortOrder - b.sortOrder);
  const lifecycleStatuses = statuses.filter((item: StatusDefinition) => item.lifecycleDefinitionID.id === definition?.id && item.statusKey === 'Active').sort((a: StatusDefinition, b: StatusDefinition) => a.sortOrder - b.sortOrder);
  const lifecycleTransitions = transitions.filter((item: StatusTransition) => item.lifecycleDefinitionID.id === definition?.id && item.statusKey === 'Active').sort((a: StatusTransition, b: StatusTransition) => a.sortOrder - b.sortOrder);
  const report = definition ? validateLifecycle(definition, statuses, transitions) : undefined;
  const [stageName, setStageName] = useState('');
  const [statusName, setStatusName] = useState('');
  const [stageId, setStageId] = useState('');
  const [initial, setInitial] = useState(false);
  const [terminal, setTerminal] = useState(false);
  const [sourceId, setSourceId] = useState('');
  const [destinationId, setDestinationId] = useState('');
  const [transitionName, setTransitionName] = useState('');
  const [permissionCode, setPermissionCode] = useState('request.transition');
  const [validationType, setValidationType] = useState<TransitionValidationValidationTypeKey>('MandatoryComment');
  const [fieldCode, setFieldCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('A transition comment is required.');
  const scope = activeWorkspace ? { id: activeWorkspace.id, workspaceName: activeWorkspace.workspaceName } : undefined;
  const audit = async (action: string, targetId: string, value: string) => {
    if (!scope || !currentPerson) return;
    await createAudit.mutateAsync({ configurationAuditEventName: action, actionKey: 'Updated', actor: { id: currentPerson.id, displayName: currentPerson.displayName }, newValue: value, occurredAt: new Date().toISOString(), scopeKey: 'Workspace', settingKey: 'lifecycle', sourceKey: 'WorkspaceOverride', targetRecordID: targetId, workspace: scope });
  };
  const addStage = async () => {
    if (!definition || !scope || !stageName.trim()) return;
    const code = stageName.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-');
    const created = await createStage.mutateAsync({ stageName: stageName.trim(), stageCode: code, lifecycleDefinitionID: { id: definition.id, name1: definition.name1 }, sortOrder: lifecycleStages.length + 1, statusKey: 'Active', workspaceID: scope });
    await audit('Lifecycle stage created', created.id, created.stageName); setStageName(''); toast.success('Stage added.');
  };
  const addStatus = async () => {
    const selectedStage = lifecycleStages.find((item: LifecycleStage) => item.id === stageId) ?? lifecycleStages[0];
    if (!definition || !scope || !selectedStage || !statusName.trim()) return;
    if (initial) await Promise.all(lifecycleStatuses.filter((item: StatusDefinition) => item.isInitial).map((item: StatusDefinition) => updateStatus.mutateAsync({ id: item.id, changedFields: { isInitial: false } })));
    const created = await createStatus.mutateAsync({ statusName: statusName.trim(), statusCode: statusName.trim().replaceAll(' ', ''), isInitial: initial, isTerminal: terminal, lifecycleDefinitionID: { id: definition.id, name1: definition.name1 }, lifecycleStageID: { id: selectedStage.id, stageName: selectedStage.stageName }, sortOrder: lifecycleStatuses.length + 1, statusKey: 'Active', workspaceID: scope });
    await audit('Lifecycle status created', created.id, created.statusName); setStatusName(''); setInitial(false); setTerminal(false); toast.success('Status added.');
  };
  const addTransition = async () => {
    const source = lifecycleStatuses.find((item: StatusDefinition) => item.id === sourceId);
    const destination = lifecycleStatuses.find((item: StatusDefinition) => item.id === destinationId);
    if (!definition || !scope || !source || !destination || source.id === destination.id || !transitionName.trim()) return toast.error('Choose two different statuses and enter a name.');
    const created = await createTransition.mutateAsync({ transitionName: transitionName.trim(), transitionCode: `${source.statusCode}-${destination.statusCode}`.toLowerCase(), sourceStatusDefinitionID: { id: source.id, statusName: source.statusName }, destinationStatusDefinitionID: { id: destination.id, statusName: destination.statusName }, lifecycleDefinitionID: { id: definition.id, name1: definition.name1 }, sortOrder: lifecycleTransitions.length + 1, statusKey: 'Active', workspaceID: scope });
    if (permissionCode.trim()) await createPermission.mutateAsync({ permissionCode: permissionCode.trim(), scopeKey: 'Workspace', statusKey: 'Active', statusTransitionID: { id: created.id, transitionName: created.transitionName }, workspaceID: scope });
    if (errorMessage.trim()) await createValidation.mutateAsync({ errorMessage: errorMessage.trim(), fieldCode: validationType === 'FieldRequired' || validationType === 'ExpectedValue' ? fieldCode.trim() || undefined : undefined, sortOrder: 1, statusKey: 'Active', statusTransitionID: { id: created.id, transitionName: created.transitionName }, validationTypeKey: validationType, workspaceID: scope });
    await audit('Lifecycle transition created', created.id, created.transitionName); setTransitionName(''); toast.success('Transition, permission, and guard saved.');
  };
  if (!activeWorkspace) return null;
  return <main className="flex-1 p-4 md:p-6"><div className="mx-auto max-w-7xl space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><div className="flex items-center gap-2"><GitBranch className="size-5" /><Badge variant="secondary">{activeWorkspace.workspaceName}</Badge></div><h1 className="mt-2 text-2xl font-semibold">Workflow & lifecycle builder</h1><p className="text-sm text-muted-foreground">Configure workspace-scoped stages, statuses, guarded transitions, and role permissions.</p></div><Select value={definition?.id ?? ''} onValueChange={setDefinitionId}><SelectTrigger className="w-72"><SelectValue placeholder="Select lifecycle" /></SelectTrigger><SelectContent>{activeDefinitions.filter((item: LifecycleDefinition) => Boolean(item.id)).map((item: LifecycleDefinition) => <SelectItem key={item.id} value={item.id}>{item.name1} · v{item.version}</SelectItem>)}</SelectContent></Select></header>
    {!definition ? <Card><CardContent className="py-12 text-center text-muted-foreground">No active lifecycle is available in this workspace.</CardContent></Card> : <>
      <div className="grid gap-4 lg:grid-cols-3"><Card><CardHeader><CardTitle className="text-base">Add stage</CardTitle><CardDescription>Group statuses into an ordered business phase.</CardDescription></CardHeader><CardContent className="space-y-3"><Label htmlFor="stage-name">Stage name</Label><Input id="stage-name" value={stageName} onChange={(event: ChangeEvent<HTMLInputElement>) => setStageName(event.target.value)} placeholder="Assessment" /><Button onClick={() => void addStage()} disabled={!stageName.trim()}><Plus className="size-4" />Add stage</Button></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Add status</CardTitle><CardDescription>Create an initial, working, or terminal state.</CardDescription></CardHeader><CardContent className="space-y-3"><Input value={statusName} onChange={(event: ChangeEvent<HTMLInputElement>) => setStatusName(event.target.value)} placeholder="Awaiting review" /><Select value={stageId || lifecycleStages[0]?.id || ''} onValueChange={setStageId}><SelectTrigger><SelectValue placeholder="Select stage" /></SelectTrigger><SelectContent>{lifecycleStages.filter((item: LifecycleStage) => Boolean(item.id)).map((item: LifecycleStage) => <SelectItem key={item.id} value={item.id}>{item.stageName}</SelectItem>)}</SelectContent></Select><div className="flex items-center justify-between rounded-md border p-3"><Label htmlFor="initial-status">Initial</Label><Switch id="initial-status" checked={initial} onCheckedChange={setInitial} /></div><div className="flex items-center justify-between rounded-md border p-3"><Label htmlFor="terminal-status">Terminal</Label><Switch id="terminal-status" checked={terminal} onCheckedChange={setTerminal} /></div><Button onClick={() => void addStatus()} disabled={!statusName.trim() || lifecycleStages.length === 0}><Save className="size-4" />Save status</Button></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Configuration health</CardTitle><CardDescription>Publish-safe structural validation.</CardDescription></CardHeader><CardContent className="space-y-3"><Badge variant={report?.valid ? 'default' : 'destructive'}>{report?.valid ? 'Valid lifecycle' : 'Action required'}</Badge><p className="text-sm text-muted-foreground">{report?.issues.length ?? 0} finding(s) · {lifecycleStatuses.length} statuses · {lifecycleTransitions.length} transitions</p>{report?.issues.slice(0, 4).map((issue, index: number) => <p key={`${issue.message}-${index}`} className="rounded-md border p-2 text-sm">{issue.message}</p>)}</CardContent></Card></div>
      <Card><CardHeader><CardTitle className="text-base">Add guarded transition</CardTitle><CardDescription>Every transition is workspace-scoped and may require both a permission and runtime validation.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3"><div className="space-y-2"><Label>From</Label><Select value={sourceId} onValueChange={setSourceId}><SelectTrigger><SelectValue placeholder="Source status" /></SelectTrigger><SelectContent>{lifecycleStatuses.filter((item: StatusDefinition) => Boolean(item.id)).map((item: StatusDefinition) => <SelectItem key={item.id} value={item.id}>{item.statusName}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>To</Label><Select value={destinationId} onValueChange={setDestinationId}><SelectTrigger><SelectValue placeholder="Destination status" /></SelectTrigger><SelectContent>{lifecycleStatuses.filter((item: StatusDefinition) => Boolean(item.id)).map((item: StatusDefinition) => <SelectItem key={item.id} value={item.id}>{item.statusName}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="transition-name">Action label</Label><Input id="transition-name" value={transitionName} onChange={(event: ChangeEvent<HTMLInputElement>) => setTransitionName(event.target.value)} placeholder="Submit for approval" /></div><div className="space-y-2"><Label htmlFor="permission-code">Required permission</Label><Input id="permission-code" value={permissionCode} onChange={(event: ChangeEvent<HTMLInputElement>) => setPermissionCode(event.target.value)} /></div><div className="space-y-2"><Label>Guard</Label><Select value={validationType} onValueChange={(value: TransitionValidationValidationTypeKey) => setValidationType(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{(['MandatoryComment','FieldRequired','ExpectedValue','CompletedTasks','ApprovalsComplete','ResolutionRequired'] as TransitionValidationValidationTypeKey[]).filter((value: TransitionValidationValidationTypeKey) => Boolean(value)).map((value: TransitionValidationValidationTypeKey) => <SelectItem key={value} value={value}>{value.replace(/([A-Z])/g, ' $1').trim()}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="field-code">Field code</Label><Input id="field-code" value={fieldCode} onChange={(event: ChangeEvent<HTMLInputElement>) => setFieldCode(event.target.value)} disabled={!['FieldRequired','ExpectedValue'].includes(validationType)} placeholder="Stable field key" /></div><div className="space-y-2 md:col-span-2"><Label htmlFor="guard-message">Guard message</Label><Input id="guard-message" value={errorMessage} onChange={(event: ChangeEvent<HTMLInputElement>) => setErrorMessage(event.target.value)} /></div><div className="flex items-end"><Button className="w-full" onClick={() => void addTransition()}><ShieldCheck className="size-4" />Save transition</Button></div></CardContent></Card>
      <Card><CardHeader><CardTitle className="text-base">Lifecycle map</CardTitle><CardDescription>Active transitions in execution order.</CardDescription></CardHeader><CardContent className="space-y-2">{lifecycleTransitions.map((transition: StatusTransition) => { const guardCount = validations.filter((item) => item.statusTransitionID.id === transition.id && item.statusKey === 'Active').length; const permissionCount = permissions.filter((item) => item.statusTransitionID.id === transition.id && item.statusKey === 'Active').length; return <div key={transition.id} className="flex flex-wrap items-center gap-3 rounded-md border bg-card p-3 text-card-foreground"><Badge variant="outline">{transition.sortOrder}</Badge><span className="font-medium">{transition.sourceStatusDefinitionID.statusName}</span><ArrowRight className="size-4" /><span className="font-medium">{transition.destinationStatusDefinitionID.statusName}</span><span className="text-sm text-muted-foreground">{transition.transitionName} · {permissionCount} permission · {guardCount} guard</span><Button className="ml-auto" variant="ghost" size="icon-sm" aria-label="Deactivate transition" onClick={() => void updateTransition.mutateAsync({ id: transition.id, changedFields: { statusKey: 'Inactive' } }).then(() => toast.success('Transition deactivated.'))}><Trash2 className="size-4" /></Button></div>; })}{lifecycleTransitions.length === 0 && <div className="flex items-center gap-2 rounded-md bg-muted p-4 text-sm text-muted-foreground"><CheckCircle2 className="size-4" />Add a transition to connect lifecycle statuses.</div>}</CardContent></Card>
    </>}
  </div></main>;
}
