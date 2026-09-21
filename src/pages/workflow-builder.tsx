import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, CirclePlay, FlaskConical, Save, Send, Workflow } from 'lucide-react';
import { toast } from 'sonner';
import { Navigate, useParams } from 'react-router-dom';
import { WorkflowCanvas } from '@/components/workflow-canvas';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { useAutomationActionList } from '@/generated/hooks/use-automation-action';
import { useAutomationConditionList } from '@/generated/hooks/use-automation-condition';
import { useAutomationRuleList, useUpdateAutomationRule } from '@/generated/hooks/use-automation-rule';
import { useAutomationTriggerList, useUpdateAutomationTrigger } from '@/generated/hooks/use-automation-trigger';
import { useFieldDefinitionList } from '@/generated/hooks/use-field-definition';
import { useFormVersionList } from '@/generated/hooks/use-form-version';
import type { AutomationAction } from '@/generated/models/automation-action-model';
import type { AutomationCondition } from '@/generated/models/automation-condition-model';
import type { AutomationRule } from '@/generated/models/automation-rule-model';
import type { AutomationTrigger } from '@/generated/models/automation-trigger-model';
import type { FieldDefinition } from '@/generated/models/field-definition-model';
import type { FormVersion } from '@/generated/models/form-version-model';
import { parseWorkflowDefinition, previewWorkflow, validateWorkflowDefinition, type WorkflowDefinition } from '@/lib/workflow-designer';

export default function WorkflowBuilderPage() {
  const { workspaceCode = '' } = useParams();
  const { activeWorkspace, can } = useWorkspaceContext();
  const { data: rules = [] } = useAutomationRuleList();
  const { data: triggers = [] } = useAutomationTriggerList();
  const { data: conditions = [] } = useAutomationConditionList();
  const { data: actions = [] } = useAutomationActionList();
  const { data: versions = [] } = useFormVersionList();
  const { data: fields = [] } = useFieldDefinitionList();
  const updateTrigger = useUpdateAutomationTrigger();
  const updateRule = useUpdateAutomationRule();
  const workspaceRules = useMemo(() => rules.filter((rule: AutomationRule) => rule.workspace.id === activeWorkspace?.id), [activeWorkspace?.id, rules]);
  const [selectedId, setSelectedId] = useState('');
  const selected = workspaceRules.find((rule: AutomationRule) => rule.id === selectedId) ?? workspaceRules[0];
  const ruleTrigger = triggers.find((trigger: AutomationTrigger) => trigger.automationRule.id === selected?.id && trigger.active);
  const ruleActions = actions.filter((action: AutomationAction) => action.automationRule.id === selected?.id);
  const ruleConditions = conditions.filter((condition: AutomationCondition) => condition.automationRule.id === selected?.id);
  const [definition, setDefinition] = useState<WorkflowDefinition>({ version: 1, nodes: [], edges: [] });
  const [versionId, setVersionId] = useState('unbound');
  const [testMode, setTestMode] = useState(false);
  const [testPriority, setTestPriority] = useState('High');
  const [testAnswer, setTestAnswer] = useState('');
  const workspaceVersions = versions.filter((version: FormVersion) => version.workspace.id === activeWorkspace?.id && version.statusKey === 'Published' && !version.isDeleted);
  const selectedVersion = workspaceVersions.find((version: FormVersion) => version.id === versionId);
  const validKeys = new Set(fields.filter((field: FieldDefinition) => !selectedVersion || field.formVersionID.id === selectedVersion.id).map((field: FieldDefinition) => field.fieldCode));
  const findings = validateWorkflowDefinition(definition, validKeys);
  const testSteps = testMode ? previewWorkflow(definition, { request: { priorityKey: testPriority }, answers: testAnswer ? { [definition.nodes.find((node) => node.type === 'Condition')?.configuration.field ?? '']: testAnswer } : {} }) : [];

  useEffect(() => { if (!selected) return; const parsed = parseWorkflowDefinition(ruleTrigger, ruleActions, ruleConditions); setDefinition(parsed); setVersionId(parsed.formVersionId ?? 'unbound'); }, [selected?.id, ruleTrigger?.id]);

  if (!activeWorkspace) return <Navigate to="/no-workspace-access" replace />;
  if (!can('workspace.administer')) return <Navigate to={`/w/${workspaceCode}`} replace />;

  const save = async (activate: boolean) => {
    if (!selected || !ruleTrigger) return toast.error('Select a workflow with an active start trigger.');
    if (activate && findings.some((finding) => finding.severity === 'error')) return toast.error('Resolve validation errors before activation.');
    if (activate && versionId === 'unbound') return toast.error('Bind the workflow to a published service version.');
    try {
      const snapshot = { ...definition, formVersionId: versionId === 'unbound' ? undefined : versionId };
      await updateTrigger.mutateAsync({ id: ruleTrigger.id, changedFields: { eventFilters: JSON.stringify(snapshot) } });
      await updateRule.mutateAsync({ id: selected.id, changedFields: { statusKey: activate ? 'Active' : 'Inactive' } });
      toast.success(activate ? 'Version-bound workflow activated.' : 'Workflow draft saved.');
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Unable to save workflow.'); }
  };

  return <main className="flex-1 bg-background p-4 text-foreground md:p-6"><div className="mx-auto max-w-[1800px] space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 flex items-center gap-2"><span className="rounded-md bg-primary p-2 text-primary-foreground"><Workflow className="size-5" /></span><Badge variant="secondary">Configured execution</Badge></div><h1 className="text-2xl font-semibold">Workflow builder</h1><p className="text-sm text-muted-foreground">Design version-bound request paths using the existing automation, approval, task, and lifecycle engine.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => setTestMode((value: boolean) => !value)}><FlaskConical className="size-4" />{testMode ? 'Close test' : 'Safe test'}</Button><Button variant="outline" onClick={() => void save(false)}><Save className="size-4" />Save draft</Button><Button onClick={() => void save(true)}><Send className="size-4" />Validate & activate</Button></div></header>
    <Card><CardContent className="grid gap-4 p-4 md:grid-cols-2"><div className="space-y-2"><Label>Workflow</Label><Select value={selected?.id ?? 'none'} onValueChange={setSelectedId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{workspaceRules.filter((rule: AutomationRule) => Boolean(rule.id)).map((rule: AutomationRule) => <SelectItem key={rule.id} value={rule.id}>{rule.name1}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Published service version</Label><Select value={versionId} onValueChange={setVersionId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="unbound">Not bound</SelectItem>{workspaceVersions.filter((version: FormVersion) => Boolean(version.id)).map((version: FormVersion) => <SelectItem key={version.id} value={version.id}>{version.snapshotLabel}</SelectItem>)}</SelectContent></Select></div></CardContent></Card>
    {selected ? <WorkflowCanvas definition={definition} onChange={setDefinition} /> : <Card><CardContent className="p-8 text-center text-muted-foreground">Create an automation rule first, then design its workflow here.</CardContent></Card>}
    <div className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle>Validation</CardTitle><CardDescription>Graph, reference, outcome, loop, assignment, and end-path checks.</CardDescription></CardHeader><CardContent className="space-y-2">{findings.length === 0 ? <div className="flex items-center gap-2 rounded-md bg-accent p-3 text-accent-foreground"><CheckCircle2 className="size-4" />Workflow is structurally ready.</div> : findings.map((finding, index: number) => <div key={`${finding.message}-${index}`} className={finding.severity === 'error' ? 'flex gap-2 rounded-md bg-destructive p-3 text-destructive-foreground' : 'flex gap-2 rounded-md bg-secondary p-3 text-secondary-foreground'}><AlertTriangle className="mt-0.5 size-4" /><span className="text-sm">{finding.message}</span></div>)}</CardContent></Card>
      <Card><CardHeader><div className="flex items-center justify-between"><div><CardTitle>Safe test mode</CardTitle><CardDescription>Evaluates configuration without creating or changing a request.</CardDescription></div><Switch checked={testMode} onCheckedChange={setTestMode} /></div></CardHeader><CardContent>{testMode ? <div className="space-y-3"><div className="grid gap-3 sm:grid-cols-2"><div className="space-y-2"><Label>Test priority</Label><Select value={testPriority} onValueChange={setTestPriority}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Low','Medium','High','Critical'].map((value: string) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>First condition answer</Label><Input value={testAnswer} onChange={(event) => setTestAnswer(event.target.value)} /></div></div><ol className="space-y-2">{testSteps.map((step, index: number) => <li key={`${step.nodeId}-${index}`} className="flex items-center gap-3 rounded-md border p-3"><CirclePlay className="size-4" /><span className="flex-1 text-sm">{step.label}</span><Badge variant="outline">{step.outcome}</Badge></li>)}</ol></div> : <p className="text-sm text-muted-foreground">Enable test mode to preview a non-production path.</p>}</CardContent></Card></div>
  </div></main>;
}
