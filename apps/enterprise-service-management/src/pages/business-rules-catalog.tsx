import { useMemo, useState } from 'react';
import { BookOpenCheck, Braces, CheckCircle2, Copy, GitBranch, Plus, Save, Search, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { InMemoryDataBanner } from '@/generated/components/in-memory-data-banner';
import { HAS_IN_MEMORY_TABLES } from '@/generated/hooks';
import { useBusinessRuleDefinitionList, useCreateBusinessRuleDefinition, useUpdateBusinessRuleDefinition } from '@/generated/hooks/use-business-rule-definition';
import { useBusinessRuleDependencyList } from '@/generated/hooks/use-business-rule-dependency';
import { useBusinessRuleOverrideList } from '@/generated/hooks/use-business-rule-override';
import { useBusinessRuleUsageList } from '@/generated/hooks/use-business-rule-usage';
import { useBusinessRuleVersionList, useCreateBusinessRuleVersion } from '@/generated/hooks/use-business-rule-version';
import { usePersonList } from '@/generated/hooks/use-person';
import type { BusinessRuleDefinition, BusinessRuleDefinitionRuleTypeKey } from '@/generated/models/business-rule-definition-model';
import type { BusinessRuleDependency } from '@/generated/models/business-rule-dependency-model';
import type { BusinessRuleOverride } from '@/generated/models/business-rule-override-model';
import type { BusinessRuleUsage } from '@/generated/models/business-rule-usage-model';
import type { BusinessRuleVersion } from '@/generated/models/business-rule-version-model';
import { useWorkspaceContext } from '@/contexts/workspace-context';

const ruleTypes: BusinessRuleDefinitionRuleTypeKey[] = ['Validation', 'Eligibility', 'Assignment', 'Approval', 'Workflow', 'SLA'];
const prettyJson = (value: string) => { try { return JSON.stringify(JSON.parse(value), null, 2); } catch { return value; } };

export default function BusinessRulesCatalogPage() {
  const { activeWorkspace } = useWorkspaceContext();
  const { data: definitions = [] } = useBusinessRuleDefinitionList();
  const { data: versions = [] } = useBusinessRuleVersionList();
  const { data: dependencies = [] } = useBusinessRuleDependencyList();
  const { data: usages = [] } = useBusinessRuleUsageList();
  const { data: overrides = [] } = useBusinessRuleOverrideList();
  const { data: people = [] } = usePersonList();
  const createDefinition = useCreateBusinessRuleDefinition();
  const updateDefinition = useUpdateBusinessRuleDefinition();
  const createVersion = useCreateBusinessRuleVersion();
  const [selectedId, setSelectedId] = useState('');
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [name, setName] = useState('');
  const [stableKey, setStableKey] = useState('');
  const [description, setDescription] = useState('');
  const [ruleType, setRuleType] = useState<BusinessRuleDefinitionRuleTypeKey>('Validation');
  const [allowOverrides, setAllowOverrides] = useState(true);
  const [condition, setCondition] = useState('{\n  "all": []\n}');
  const [outcome, setOutcome] = useState('{\n  "result": "allow"\n}');

  const workspaceRules = useMemo(() => definitions.filter((rule: BusinessRuleDefinition) => rule.workspace.id === activeWorkspace?.id && !rule.isDeleted).filter((rule: BusinessRuleDefinition) => typeFilter === 'all' || rule.ruleTypeKey === typeFilter).filter((rule: BusinessRuleDefinition) => `${rule.name1} ${rule.stableRuleKey} ${rule.description}`.toLowerCase().includes(query.toLowerCase())).sort((a: BusinessRuleDefinition, b: BusinessRuleDefinition) => a.name1.localeCompare(b.name1)), [activeWorkspace?.id, definitions, query, typeFilter]);
  const selected = definitions.find((rule: BusinessRuleDefinition) => rule.id === selectedId) ?? workspaceRules[0];
  const selectedVersions = versions.filter((version: BusinessRuleVersion) => version.businessRuleDefinition.id === selected?.id && !version.isDeleted).sort((a: BusinessRuleVersion, b: BusinessRuleVersion) => b.versionNumber - a.versionNumber);
  const activeVersion = selectedVersions.find((version: BusinessRuleVersion) => version.statusKey === 'Published') ?? selectedVersions[0];
  const versionDependencies = dependencies.filter((item: BusinessRuleDependency) => item.businessRuleVersion.id === activeVersion?.id && !item.isDeleted);
  const versionUsages = usages.filter((item: BusinessRuleUsage) => item.businessRuleVersion.id === activeVersion?.id && !item.isDeleted);
  const ruleOverrides = overrides.filter((item: BusinessRuleOverride) => item.businessRuleDefinition.id === selected?.id && !item.isDeleted);

  const saveDefinition = async () => {
    if (!activeWorkspace || !name.trim() || !stableKey.trim() || !description.trim()) return toast.error('Complete the rule name, stable key, and description.');
    const now = new Date().toISOString();
    try {
      const created = await createDefinition.mutateAsync({ name1: name.trim(), stableRuleKey: stableKey.trim().toUpperCase().replace(/\s+/g, '_'), description: description.trim(), ruleTypeKey: ruleType, statusKey: 'Draft', allowLocalOverrides: allowOverrides, ownerPerson: people[0] ? { id: people[0].id, displayName: people[0].displayName } : undefined, currentPublishedVersion: undefined, workspace: { id: activeWorkspace.id, workspaceName: activeWorkspace.workspaceName }, createdAt: now, updatedAt: now, isDeleted: false });
      setSelectedId(created.id); setName(''); setStableKey(''); setDescription(''); toast.success('Business rule draft created.');
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Unable to create the business rule.'); }
  };

  const publishSnapshot = async () => {
    if (!selected) return toast.error('Select a business rule first.');
    try { JSON.parse(condition); JSON.parse(outcome); } catch { return toast.error('Condition and outcome must contain valid JSON.'); }
    const now = new Date().toISOString();
    const nextNumber = Math.max(0, ...selectedVersions.map((version: BusinessRuleVersion) => version.versionNumber)) + 1;
    try {
      const version = await createVersion.mutateAsync({ snapshotLabel: `${selected.stableRuleKey} v${nextNumber}`, businessRuleDefinition: { id: selected.id, name1: selected.name1 }, versionNumber: nextNumber, statusKey: 'Published', immutableConditionExpression: condition, immutableOutcomeConfiguration: outcome, effectiveFrom: now, effectiveTo: undefined, publishedBy: people[0] ? { id: people[0].id, displayName: people[0].displayName } : undefined, publishedAt: now, createdAt: now, updatedAt: now, isDeleted: false });
      await updateDefinition.mutateAsync({ id: selected.id, changedFields: { statusKey: 'Published', currentPublishedVersion: { id: version.id, snapshotLabel: version.snapshotLabel }, updatedAt: now } });
      toast.success(`Published immutable version ${nextNumber}.`);
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Unable to publish the rule version.'); }
  };

  return (
    <main className="flex-1 bg-background p-5 text-foreground md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <InMemoryDataBanner show={HAS_IN_MEMORY_TABLES} message="This app uses draft tables for testing. Data entered won't be saved. Contact the app owner to enable storage." className="border-border bg-secondary text-secondary-foreground" />
        <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between"><div><div className="mb-2 flex items-center gap-2"><div className="rounded-lg bg-primary p-2 text-primary-foreground"><BookOpenCheck className="size-5" /></div><Badge variant="secondary">Workspace governance</Badge></div><h1 className="text-2xl font-semibold">Business Rules Catalog</h1><p className="mt-1 text-sm text-muted-foreground">Govern reusable validation, eligibility, assignment, approval, workflow, and SLA logic.</p></div><div className="grid grid-cols-3 gap-2"><Card className="py-3"><CardContent className="px-4 text-center"><p className="text-xl font-semibold">{workspaceRules.length}</p><p className="text-xs text-muted-foreground">Rules</p></CardContent></Card><Card className="py-3"><CardContent className="px-4 text-center"><p className="text-xl font-semibold">{workspaceRules.filter((rule: BusinessRuleDefinition) => rule.statusKey === 'Published').length}</p><p className="text-xs text-muted-foreground">Published</p></CardContent></Card><Card className="py-3"><CardContent className="px-4 text-center"><p className="text-xl font-semibold">{overrides.filter((item: BusinessRuleOverride) => item.workspace.id === activeWorkspace?.id && item.statusKey === 'Active').length}</p><p className="text-xs text-muted-foreground">Overrides</p></CardContent></Card></div></header>
        <Tabs defaultValue="catalog"><TabsList><TabsTrigger value="catalog">Catalog</TabsTrigger><TabsTrigger value="author">Author rule</TabsTrigger><TabsTrigger value="governance">Governance</TabsTrigger></TabsList>
          <TabsContent value="catalog" className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_390px]"><Card><CardHeader><CardTitle>Reusable rule library</CardTitle><CardDescription>Stable definitions shared by services and execution adapters.</CardDescription><div className="grid gap-3 pt-3 sm:grid-cols-[1fr_190px]"><div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" value={query} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} placeholder="Search rules" /></div><Select value={typeFilter} onValueChange={setTypeFilter}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All rule types</SelectItem>{ruleTypes.filter((value: BusinessRuleDefinitionRuleTypeKey) => value).map((value: BusinessRuleDefinitionRuleTypeKey) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div></CardHeader><CardContent className="space-y-2">{workspaceRules.map((rule: BusinessRuleDefinition) => <button key={rule.id} type="button" onClick={() => setSelectedId(rule.id)} className="flex w-full items-center gap-4 rounded-lg border border-border bg-card p-4 text-left text-card-foreground transition hover:border-primary"><div className="rounded-md bg-secondary p-2 text-secondary-foreground"><Braces className="size-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-medium">{rule.name1}</p><Badge variant={rule.statusKey === 'Published' ? 'default' : 'secondary'}>{rule.statusKey}</Badge><Badge variant="outline">{rule.ruleTypeKey}</Badge></div><p className="mt-1 truncate text-sm text-muted-foreground">{rule.stableRuleKey} · {rule.description}</p></div></button>)}</CardContent></Card><Card><CardHeader><CardTitle>{selected?.name1 ?? 'Select a rule'}</CardTitle><CardDescription>{selected?.description ?? 'Choose a definition to inspect its published contract.'}</CardDescription></CardHeader><CardContent className="space-y-4">{selected && <><div className="grid grid-cols-2 gap-3"><div className="rounded-md bg-secondary p-3 text-secondary-foreground"><p className="text-xs">Stable key</p><p className="mt-1 font-semibold">{selected.stableRuleKey}</p></div><div className="rounded-md bg-secondary p-3 text-secondary-foreground"><p className="text-xs">Versions</p><p className="mt-1 font-semibold">{selectedVersions.length}</p></div></div>{activeVersion ? <><div><p className="mb-2 text-sm font-medium">Immutable condition</p><pre className="overflow-auto rounded-md border border-border bg-background p-3 text-xs">{prettyJson(activeVersion.immutableConditionExpression)}</pre></div><div><p className="mb-2 text-sm font-medium">Outcome configuration</p><pre className="overflow-auto rounded-md border border-border bg-background p-3 text-xs">{prettyJson(activeVersion.immutableOutcomeConfiguration)}</pre></div></> : <p className="rounded-md bg-secondary p-3 text-sm text-secondary-foreground">No published version yet.</p>}<div className="flex items-center gap-2 text-sm"><ShieldCheck className="size-4" /><span>{selected.allowLocalOverrides ? 'Governed local overrides allowed' : 'Local overrides blocked'}</span></div></>}</CardContent></Card></TabsContent>
          <TabsContent value="author" className="mt-5 grid gap-5 lg:grid-cols-2"><Card><CardHeader><CardTitle>Create definition</CardTitle><CardDescription>Create a stable reusable identity before publishing immutable versions.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="rule-name">Rule name</Label><Input id="rule-name" value={name} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setName(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="rule-key">Stable rule key</Label><Input id="rule-key" value={stableKey} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setStableKey(event.target.value)} placeholder="IT_ACCESS_REQUIRED" /></div></div><div className="space-y-2"><Label>Rule type</Label><Select value={ruleType} onValueChange={(value: string) => setRuleType(value as BusinessRuleDefinitionRuleTypeKey)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{ruleTypes.filter((value: BusinessRuleDefinitionRuleTypeKey) => value).map((value: BusinessRuleDefinitionRuleTypeKey) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="rule-description">Description</Label><Textarea id="rule-description" value={description} onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(event.target.value)} /></div><div className="flex items-center justify-between rounded-md border border-border p-4"><div><p className="font-medium">Allow local overrides</p><p className="text-sm text-muted-foreground">Services can inherit, extend, replace, or disable this rule.</p></div><Switch checked={allowOverrides} onCheckedChange={setAllowOverrides} /></div><Button onClick={() => void saveDefinition()} disabled={createDefinition.isPending}><Plus className="size-4" />Create draft</Button></CardContent></Card><Card><CardHeader><CardTitle>Publish immutable snapshot</CardTitle><CardDescription>{selected ? `Create the next version of ${selected.name1}.` : 'Select or create a definition first.'}</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label htmlFor="condition-json">Condition expression JSON</Label><Textarea id="condition-json" className="min-h-36" value={condition} onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setCondition(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="outcome-json">Outcome configuration JSON</Label><Textarea id="outcome-json" className="min-h-36" value={outcome} onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => setOutcome(event.target.value)} /></div><Button onClick={() => void publishSnapshot()} disabled={!selected || createVersion.isPending}><Save className="size-4" />Publish next version</Button></CardContent></Card></TabsContent>
          <TabsContent value="governance" className="mt-5 grid gap-5 lg:grid-cols-3"><Card><CardHeader><CardTitle>Dependencies</CardTitle><CardDescription>Required metadata and governed records.</CardDescription></CardHeader><CardContent className="space-y-3">{versionDependencies.map((item: BusinessRuleDependency) => <div key={item.id} className="rounded-md border border-border p-3"><div className="flex items-center justify-between gap-2"><Badge variant="outline">{item.dependencyTypeKey}</Badge>{item.required && <Badge variant="secondary">Required</Badge>}</div><p className="mt-2 font-medium">{item.displayLabel}</p><p className="text-xs text-muted-foreground">{item.referencedRecordIDOrKey}</p></div>)}</CardContent></Card><Card><CardHeader><CardTitle>Usage graph</CardTitle><CardDescription>Consumers bound to the selected version.</CardDescription></CardHeader><CardContent className="space-y-3">{versionUsages.map((item: BusinessRuleUsage) => <div key={item.id} className="rounded-md border border-border p-3"><div className="flex items-center gap-2"><GitBranch className="size-4" /><Badge variant="outline">{item.consumerTypeKey}</Badge></div><p className="mt-2 font-medium">{item.consumerLabel}</p><p className="text-sm text-muted-foreground">{item.usageContext}</p></div>)}</CardContent></Card><Card><CardHeader><CardTitle>Local overrides</CardTitle><CardDescription>Controlled service and form deviations.</CardDescription></CardHeader><CardContent className="space-y-3">{ruleOverrides.map((item: BusinessRuleOverride) => <div key={item.id} className="rounded-md border border-border p-3"><div className="flex items-center justify-between gap-2"><Badge variant={item.statusKey === 'Active' ? 'default' : 'secondary'}>{item.localOverrideModeKey}</Badge><Copy className="size-4" /></div><p className="mt-2 font-medium">{item.service?.serviceName ?? item.formVersion?.snapshotLabel ?? 'Workspace override'}</p><p className="text-sm text-muted-foreground">{item.reason}</p></div>)}</CardContent></Card></TabsContent>
        </Tabs>
        <div className="flex items-center gap-2 rounded-lg bg-accent p-4 text-accent-foreground"><CheckCircle2 className="size-5" /><p className="text-sm font-medium">Specialized validation, assignment, approval, automation, and SLA entities remain execution adapters governed by this catalog.</p></div>
      </div>
    </main>
  );
}
