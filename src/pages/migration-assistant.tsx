import { useMemo, useState, type ChangeEvent } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowRight, CheckCircle2, FlaskConical, History, RotateCcw, Save, Search, ShieldCheck, WandSparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { useServiceList, useUpdateService } from '@/generated/hooks/use-service';
import { useCatalogItemList } from '@/generated/hooks/use-catalog-item';
import { useCatalogItemFormAssignmentList, useCreateCatalogItemFormAssignment, useUpdateCatalogItemFormAssignment } from '@/generated/hooks/use-catalog-item-form-assignment';
import { useFormDefinitionList, useCreateFormDefinition } from '@/generated/hooks/use-form-definition';
import { useFormVersionList, useCreateFormVersion, useUpdateFormVersion } from '@/generated/hooks/use-form-version';
import { useFormSectionList, useCreateFormSection } from '@/generated/hooks/use-form-section';
import { useFieldDefinitionList, useCreateFieldDefinition } from '@/generated/hooks/use-field-definition';
import { useAutomationRuleList } from '@/generated/hooks/use-automation-rule';
import { useAutomationTriggerList } from '@/generated/hooks/use-automation-trigger';
import { useServiceTargetRuleList } from '@/generated/hooks/use-service-target-rule';
import { useMetadataRecordList, useCreateMetadataRecord, useUpdateMetadataRecord } from '@/generated/hooks/use-metadata-record';
import { useCreateConfigurationAuditEvent } from '@/generated/hooks/use-configuration-audit-event';
import type { Service } from '@/generated/models/service-model';
import type { CatalogItem } from '@/generated/models/catalog-item-model';
import type { CatalogItemFormAssignment } from '@/generated/models/catalog-item-form-assignment-model';
import type { FormDefinition } from '@/generated/models/form-definition-model';
import type { FormVersion } from '@/generated/models/form-version-model';
import type { FieldDefinition } from '@/generated/models/field-definition-model';
import type { MetadataRecord } from '@/generated/models/metadata-record-model';
import { analyzeLegacyService, runMigrationTest, validateMigrationPlan, type MigrationFieldMapping, type MigrationFinding, type MigrationPlanSnapshot } from '@/lib/migration-assistant';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const parsePlan = (record?: MetadataRecord): MigrationPlanSnapshot | undefined => {
  if (!record) return undefined;
  try { return JSON.parse(record.configurationJSON) as MigrationPlanSnapshot; } catch { return undefined; }
};

export default function MigrationAssistantPage() {
  const { workspaceCode = '' } = useParams();
  const { activeWorkspace, currentPerson, can } = useWorkspaceContext();
  const { data: services = [] } = useServiceList();
  const { data: catalogItems = [] } = useCatalogItemList();
  const { data: assignments = [] } = useCatalogItemFormAssignmentList();
  const { data: forms = [] } = useFormDefinitionList();
  const { data: versions = [] } = useFormVersionList();
  const { data: sections = [] } = useFormSectionList();
  const { data: fields = [] } = useFieldDefinitionList();
  const { data: automationRules = [] } = useAutomationRuleList();
  const { data: automationTriggers = [] } = useAutomationTriggerList();
  const { data: targetRules = [] } = useServiceTargetRuleList();
  const { data: metadataRecords = [] } = useMetadataRecordList();
  const createMetadata = useCreateMetadataRecord(); const updateMetadata = useUpdateMetadataRecord();
  const createForm = useCreateFormDefinition(); const createVersion = useCreateFormVersion(); const updateVersion = useUpdateFormVersion();
  const createSection = useCreateFormSection(); const createField = useCreateFieldDefinition();
  const createAssignment = useCreateCatalogItemFormAssignment(); const updateAssignment = useUpdateCatalogItemFormAssignment(); const updateService = useUpdateService(); const createAudit = useCreateConfigurationAuditEvent();
  const [serviceId, setServiceId] = useState(''); const [search, setSearch] = useState(''); const [busy, setBusy] = useState(false); const [draftMappings, setDraftMappings] = useState<MigrationFieldMapping[]>(); const [testChecks, setTestChecks] = useState<string[]>([]);

  const workspaceServices = useMemo(() => services.filter((service: Service) => service.workspace.id === activeWorkspace?.id && !service.isDeleted), [activeWorkspace?.id, services]);
  const selectedService = workspaceServices.find((service: Service) => service.id === serviceId) ?? workspaceServices[0];
  const serviceItems = catalogItems.filter((item: CatalogItem) => item.workspace.id === activeWorkspace?.id && item.service.id === selectedService?.id && item.statusKey !== 'Retired');
  const serviceRuleIds = new Set(automationRules.filter((rule) => rule.workspace.id === activeWorkspace?.id && rule.serviceCode === selectedService?.serviceCode).map((rule) => rule.id));
  const analysis = selectedService ? analyzeLegacyService({
    service: selectedService, catalogItems: serviceItems, assignments, forms, versions, fields,
    hasRules: automationRules.some((rule) => rule.workspace.id === activeWorkspace?.id && rule.serviceCode === selectedService.serviceCode),
    hasWorkflow: automationTriggers.some((trigger) => serviceRuleIds.has(trigger.automationRule.id) && trigger.active),
    hasSla: targetRules.some((rule) => rule.workspace.id === activeWorkspace?.id && rule.serviceCode === selectedService.serviceCode && rule.active),
    hasReports: Boolean(selectedService.reportingConfiguration),
  }) : undefined;
  const planRecord = metadataRecords.find((record: MetadataRecord) => record.active && !record.isDeleted && record.configurationKey === `migration-plan:${selectedService?.id}`);
  const storedPlan = parsePlan(planRecord);
  const plan = storedPlan ? { ...storedPlan, mappings: draftMappings ?? storedPlan.mappings } : undefined;
  const findings = plan ? validateMigrationPlan(plan) : analysis?.findings ?? [];
  const statusSteps = ['Analyzed', 'Draft generated', 'Validated', 'Tested', 'Cut over'];

  if (!activeWorkspace) return <Navigate to="/no-workspace-access" replace />;
  if (!can('workspace.administer')) return <Navigate to={`/w/${workspaceCode}`} replace />;
  const workspace = activeWorkspace;

  const audit = async (name: string, value: object) => {
    if (!currentPerson || !selectedService) return;
    await createAudit.mutateAsync({ configurationAuditEventName: name, actionKey: 'Updated', actor: { id: currentPerson.id, displayName: currentPerson.displayName }, newValue: JSON.stringify(value), occurredAt: new Date().toISOString(), scopeKey: 'Service', settingKey: 'migrationAssistant', sourceKey: 'ServiceOverride', targetRecordID: selectedService.id, workspace: { id: workspace.id, workspaceName: workspace.workspaceName } });
  };
  const savePlan = async (next: MigrationPlanSnapshot) => {
    if (!currentPerson) return;
    if (planRecord) await updateMetadata.mutateAsync({ id: planRecord.id, changedFields: { recordName: `${selectedService?.serviceName} migration plan`, configurationJSON: JSON.stringify(next), updatedAt: next.updatedAt, updatedBy: { id: currentPerson.id, displayName: currentPerson.displayName } } });
    else await createMetadata.mutateAsync({ recordName: `${selectedService?.serviceName} migration plan`, active: true, configurationJSON: JSON.stringify(next), configurationKey: `migration-plan:${selectedService?.id}`, createdAt: next.createdAt, createdBy: { id: currentPerson.id, displayName: currentPerson.displayName }, entityRecordID: selectedService?.id ?? '', entityTypeKey: 'FormVersion', isDeleted: false, sortOrder: 1, updatedAt: next.updatedAt, updatedBy: { id: currentPerson.id, displayName: currentPerson.displayName } });
  };
  const beginAnalysis = async () => {
    if (!selectedService || !analysis || !currentPerson) return;
    const now = new Date().toISOString();
    const next: MigrationPlanSnapshot = { schemaVersion: 1, serviceId: selectedService.id, serviceCode: selectedService.serviceCode, serviceName: selectedService.serviceName, classification: analysis.classification, status: 'Analyzed', createdAt: storedPlan?.createdAt ?? now, updatedAt: now, createdById: storedPlan?.createdById ?? currentPerson.id, createdByName: storedPlan?.createdByName ?? currentPerson.displayName, sourceFormIds: analysis.forms.map((form: FormDefinition) => form.id), sourceCatalogItemIds: analysis.catalogItems.map((item: CatalogItem) => item.id), mappings: draftMappings ?? analysis.mappings, findings: analysis.findings, previousPublishedVersionId: selectedService.currentPublishedFormVersion?.id, previousAssignmentIds: analysis.assignments.filter((assignment: CatalogItemFormAssignment) => assignment.statusKey === 'Active').map((assignment: CatalogItemFormAssignment) => assignment.id), targetFormId: storedPlan?.targetFormId, targetVersionId: storedPlan?.targetVersionId, targetAssignmentId: storedPlan?.targetAssignmentId };
    await savePlan(next); setDraftMappings(undefined); await audit(`Analyzed legacy service ${selectedService.serviceName}`, { classification: next.classification, findings: next.findings.length }); toast.success('Analysis saved without changing production routing.');
  };
  const generateDraft = async () => {
    if (!plan || !selectedService || !currentPerson || !analysis?.readyForDraft) return;
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const form = await createForm.mutateAsync({ name1: `${selectedService.serviceName} metadata form`, description: `Controlled migration draft for ${selectedService.serviceName}`, currentVersionNumber: 1, statusKey: 'Draft', workspace: { id: workspace.id, workspaceName: workspace.workspaceName } });
      const version = await createVersion.mutateAsync({ snapshotLabel: `${selectedService.serviceName} migration v1`, configurationSnapshot: JSON.stringify({ migrationPlanServiceId: selectedService.id, historicalRequestsUnchanged: true }), formDefinition: { id: form.id, name1: form.name1 }, statusKey: 'Draft', versionNumber: 1, workspace: { id: workspace.id, workspaceName: workspace.workspaceName }, createdAt: now, updatedAt: now, isDeleted: false });
      const section = await createSection.mutateAsync({ title: 'Request details', description: 'Mapped legacy request information', instructions: 'Review this generated draft in Service Builder before publication.', formDefinition: { id: form.id, name1: form.name1 }, formVersionID: { id: version.id, snapshotLabel: version.snapshotLabel }, sortOrder: 1, workspace: { id: workspace.id, workspaceName: workspace.workspaceName }, createdAt: now, updatedAt: now, isDeleted: false });
      for (const [index, mapping] of plan.mappings.filter((item: MigrationFieldMapping) => item.included).entries()) await createField.mutateAsync({ label: mapping.legacyLabel, fieldCode: mapping.recommendedKey, fieldTypeKey: mapping.recommendedType as FieldDefinition['fieldTypeKey'], required: false, requesterVisible: true, readOnly1: false, searchable: true, reportable: true, sensitive: false, widthKey: 'Full', configuration: JSON.stringify({ migratedFrom: mapping.legacyKey, confidence: mapping.confidence }), agentOnly: false, sortOrder: index + 1, formDefinition: { id: form.id, name1: form.name1 }, formSection: { id: section.id, title: section.title }, formVersionID: { id: version.id, snapshotLabel: version.snapshotLabel }, workspace: { id: workspace.id, workspaceName: workspace.workspaceName }, createdAt: now, updatedAt: now, isDeleted: false });
      const next = { ...plan, status: 'Draft generated' as const, targetFormId: form.id, targetVersionId: version.id, updatedAt: now }; await savePlan(next); await audit(`Generated migration draft for ${selectedService.serviceName}`, { formId: form.id, versionId: version.id }); toast.success('Independent metadata draft generated. Production routing is unchanged.');
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Draft generation failed.'); } finally { setBusy(false); }
  };
  const validatePlan = async () => { if (!plan) return; const blockers = validateMigrationPlan(plan).filter((finding: MigrationFinding) => finding.severity === 'blocking'); if (blockers.length) return toast.error(`${blockers.length} blocking migration findings remain.`); const next = { ...plan, status: 'Validated' as const, updatedAt: new Date().toISOString() }; await savePlan(next); await audit(`Validated migration plan for ${plan.serviceName}`, { targetVersionId: plan.targetVersionId }); toast.success('Migration draft validated.'); };
  const testPlan = async () => { if (!plan) return; const result = runMigrationTest(plan); setTestChecks(result.checks); if (!result.passed) return toast.error(result.summary); const next = { ...plan, status: 'Tested' as const, testSummary: result.summary, updatedAt: new Date().toISOString() }; await savePlan(next); await audit(`Tested migration plan for ${plan.serviceName}`, { checks: result.checks }); toast.success(result.summary); };
  const cutover = async () => {
    if (!plan?.targetVersionId || !plan.targetFormId || !selectedService || plan.status !== 'Tested') return toast.error('Generate, validate, and test the draft before cutover.');
    const targetVersion = versions.find((version: FormVersion) => version.id === plan.targetVersionId); const targetForm = forms.find((form: FormDefinition) => form.id === plan.targetFormId); const item = serviceItems[0]; if (!targetVersion || !targetForm || !item) return toast.error('Target draft or catalog route is unavailable.');
    setBusy(true); try { const now = new Date().toISOString(); await updateVersion.mutateAsync({ id: targetVersion.id, changedFields: { statusKey: 'Published', publishedAt: now, publishedBy: currentPerson ? { id: currentPerson.id, displayName: currentPerson.displayName } : undefined, updatedAt: now } });
      await Promise.all(analysis?.assignments.filter((assignment: CatalogItemFormAssignment) => assignment.statusKey === 'Active').map((assignment: CatalogItemFormAssignment) => updateAssignment.mutateAsync({ id: assignment.id, changedFields: { statusKey: 'Inactive', effectiveTo: now, isDefault: false } })) ?? []);
      const assignment = await createAssignment.mutateAsync({ assignmentName: `${item.itemName} metadata assignment`, catalogItem: { id: item.id, itemName: item.itemName }, effectiveFrom: now, formDefinition: { id: targetForm.id, name1: targetForm.name1 }, formVersion: { id: targetVersion.id, snapshotLabel: targetVersion.snapshotLabel }, isDefault: true, statusKey: 'Active', workspace: { id: workspace.id, workspaceName: workspace.workspaceName } });
      await updateService.mutateAsync({ id: selectedService.id, changedFields: { currentPublishedFormVersion: { id: targetVersion.id, snapshotLabel: targetVersion.snapshotLabel }, lifecycleStateKey: 'Published', statusKey: 'Active', updatedAt: now } });
      const next = { ...plan, status: 'Cut over' as const, targetAssignmentId: assignment.id, cutoverAt: now, updatedAt: now }; await savePlan(next); await audit(`Cut over ${selectedService.serviceName} to metadata`, { targetVersionId: targetVersion.id, assignmentId: assignment.id, historicalRequestsUnchanged: true }); toast.success('New submissions now use metadata. Historical requests were not changed.');
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Cutover failed.'); } finally { setBusy(false); }
  };
  const rollback = async () => {
    if (!plan || plan.status !== 'Cut over' || !selectedService) return;
    setBusy(true); try { const now = new Date().toISOString(); if (plan.targetAssignmentId) await updateAssignment.mutateAsync({ id: plan.targetAssignmentId, changedFields: { statusKey: 'Inactive', effectiveTo: now, isDefault: false } });
      await Promise.all(assignments.filter((assignment: CatalogItemFormAssignment) => plan.previousAssignmentIds.includes(assignment.id)).map((assignment: CatalogItemFormAssignment) => updateAssignment.mutateAsync({ id: assignment.id, changedFields: { statusKey: 'Active', effectiveTo: undefined, isDefault: true } })));
      const previous = versions.find((version: FormVersion) => version.id === plan.previousPublishedVersionId); await updateService.mutateAsync({ id: selectedService.id, changedFields: { currentPublishedFormVersion: previous ? { id: previous.id, snapshotLabel: previous.snapshotLabel } : undefined, updatedAt: now } });
      const next = { ...plan, status: 'Rolled back' as const, rolledBackAt: now, updatedAt: now }; await savePlan(next); await audit(`Rolled back metadata cutover for ${selectedService.serviceName}`, { restoredVersionId: previous?.id, historicalRequestsUnchanged: true }); toast.success('New-submission routing rolled back. Historical requests remain unchanged.');
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Rollback failed.'); } finally { setBusy(false); }
  };

  return <main className="flex-1 p-4 md:p-6"><div className="mx-auto max-w-[1500px] space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><div className="mb-2 flex items-center gap-2"><span className="rounded-md bg-primary p-2 text-primary-foreground"><WandSparkles className="size-5" /></span><Badge variant="secondary">Controlled adoption</Badge></div><h1 className="text-2xl font-semibold">Migration assistant</h1><p className="text-sm text-muted-foreground">Analyze, map, test, and route new submissions without rewriting historical requests.</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => void beginAnalysis()}><Search className="size-4" />Analyze</Button><Button onClick={() => void generateDraft()} disabled={!plan || Boolean(plan.targetVersionId) || busy}><Save className="size-4" />Generate draft</Button></div></header>
    <Card><CardContent className="grid gap-4 p-4 md:grid-cols-[1fr_auto]"><div className="space-y-2"><Label>Legacy service</Label><Select value={selectedService?.id ?? 'none'} onValueChange={(value: string) => { setServiceId(value); setDraftMappings(undefined); setTestChecks([]); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{workspaceServices.filter((service: Service) => Boolean(service.id)).map((service: Service) => <SelectItem key={service.id} value={service.id}>{service.serviceName}</SelectItem>)}</SelectContent></Select></div><div className="flex items-end gap-2"><Badge variant="outline">{analysis?.classification ?? 'Select service'}</Badge>{plan && <Badge variant={plan.status === 'Cut over' ? 'default' : 'secondary'}>{plan.status}</Badge>}</div></CardContent></Card>
    <div className="grid gap-3 md:grid-cols-5">{statusSteps.map((step: string, index: number) => { const activeIndex = plan ? statusSteps.indexOf(plan.status === 'Rolled back' ? 'Cut over' : plan.status) : -1; return <Card key={step} className={index <= activeIndex ? 'border-primary' : ''}><CardContent className="flex items-center gap-2 p-3"><span className={index <= activeIndex ? 'rounded-full bg-primary p-1 text-primary-foreground' : 'rounded-full bg-muted p-1 text-muted-foreground'}>{index <= activeIndex ? <CheckCircle2 className="size-4" /> : <ArrowRight className="size-4" />}</span><span className="text-sm font-medium">{step}</span></CardContent></Card>; })}</div>
    <Tabs defaultValue="analysis"><TabsList><TabsTrigger value="analysis">Analysis</TabsTrigger><TabsTrigger value="mapping">Mappings</TabsTrigger><TabsTrigger value="validate">Validate & test</TabsTrigger><TabsTrigger value="cutover">Cutover & rollback</TabsTrigger><TabsTrigger value="history">History</TabsTrigger></TabsList>
      <TabsContent value="analysis"><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{(analysis?.findings ?? []).map((finding: MigrationFinding) => <Card key={finding.id}><CardHeader><div className="flex items-start justify-between gap-3"><CardTitle>{finding.area}</CardTitle><Badge variant={finding.severity === 'blocking' ? 'destructive' : finding.severity === 'warning' ? 'secondary' : 'outline'}>{finding.severity}</Badge></div><CardDescription>{finding.title}</CardDescription></CardHeader><CardContent className="space-y-3"><p className="text-sm">{finding.detail}</p><div className="rounded-md bg-muted p-3 text-muted-foreground"><p className="text-sm"><strong>Next:</strong> {finding.remediation}</p></div></CardContent></Card>)}</div></TabsContent>
      <TabsContent value="mapping"><Card><CardHeader><CardTitle>Stable field mappings</CardTitle><CardDescription>Recommendations seed an independent draft. Editing these values never changes historical answers.</CardDescription></CardHeader><CardContent className="space-y-3"><div className="relative max-w-md"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input value={search} onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)} className="pl-9" placeholder="Search fields" /></div>{(draftMappings ?? plan?.mappings ?? analysis?.mappings ?? []).filter((mapping: MigrationFieldMapping) => `${mapping.legacyLabel} ${mapping.legacyKey}`.toLowerCase().includes(search.toLowerCase())).map((mapping: MigrationFieldMapping) => <div key={mapping.legacyKey} className="grid gap-3 rounded-md border p-3 md:grid-cols-[auto_1fr_1fr_150px]"><Switch checked={mapping.included} onCheckedChange={(checked: boolean) => { const source = draftMappings ?? plan?.mappings ?? analysis?.mappings ?? []; setDraftMappings(source.map((item: MigrationFieldMapping) => item.legacyKey === mapping.legacyKey ? { ...item, included: checked } : item)); }} /><div><p className="font-medium">{mapping.legacyLabel}</p><p className="text-xs text-muted-foreground">Legacy: {mapping.legacyKey}</p></div><Input value={mapping.recommendedKey} onChange={(event: ChangeEvent<HTMLInputElement>) => { const source = draftMappings ?? plan?.mappings ?? analysis?.mappings ?? []; setDraftMappings(source.map((item: MigrationFieldMapping) => item.legacyKey === mapping.legacyKey ? { ...item, recommendedKey: event.target.value } : item)); }} /><Badge variant="outline">{mapping.recommendedType} · {mapping.confidence}</Badge></div>)}<Button variant="outline" onClick={() => void beginAnalysis()} disabled={!draftMappings}>Save mappings</Button></CardContent></Card></TabsContent>
      <TabsContent value="validate"><div className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle>Migration validation</CardTitle><CardDescription>Checks mapping integrity, target draft, and production routing prerequisites.</CardDescription></CardHeader><CardContent className="space-y-2">{findings.map((finding: MigrationFinding, index: number) => <div key={`${finding.id}-${index}`} className={finding.severity === 'blocking' ? 'rounded-md bg-destructive p-3 text-destructive-foreground' : 'rounded-md bg-secondary p-3 text-secondary-foreground'}><p className="text-sm font-medium">{finding.title}</p><p className="text-sm">{finding.remediation}</p></div>)}<Button onClick={() => void validatePlan()} disabled={!plan?.targetVersionId}><ShieldCheck className="size-4" />Validate draft</Button></CardContent></Card><Card><CardHeader><CardTitle>Safe test mode</CardTitle><CardDescription>Tests the migration plan without requests, workflows, or routing changes.</CardDescription></CardHeader><CardContent className="space-y-3"><Button variant="outline" onClick={() => void testPlan()} disabled={!plan || (plan.status !== 'Validated' && plan.status !== 'Tested')}><FlaskConical className="size-4" />Run non-production test</Button>{testChecks.map((check: string) => <div key={check} className="flex gap-2 rounded-md bg-accent p-3 text-accent-foreground"><CheckCircle2 className="mt-0.5 size-4" /><p className="text-sm">{check}</p></div>)}</CardContent></Card></div></TabsContent>
      <TabsContent value="cutover"><div className="grid gap-4 lg:grid-cols-2"><Card><CardHeader><CardTitle>Controlled cutover</CardTitle><CardDescription>Publish the tested draft and route only new submissions through the existing catalog entry.</CardDescription></CardHeader><CardContent className="space-y-3"><div className="rounded-md bg-muted p-3 text-muted-foreground"><p className="text-sm">Historical requests keep their original request record, field values, version binding, and renderer path.</p></div><Button onClick={() => void cutover()} disabled={plan?.status !== 'Tested' || busy}><ArrowRight className="size-4" />Cut over new submissions</Button></CardContent></Card><Card><CardHeader><CardTitle>Rollback</CardTitle><CardDescription>Restore the previous default assignment for new submissions.</CardDescription></CardHeader><CardContent className="space-y-3"><div className="rounded-md bg-secondary p-3 text-secondary-foreground"><p className="text-sm">Rollback does not delete the metadata version or rewrite requests created before or after cutover.</p></div><Button variant="destructive" onClick={() => void rollback()} disabled={plan?.status !== 'Cut over' || busy}><RotateCcw className="size-4" />Rollback routing</Button></CardContent></Card></div></TabsContent>
      <TabsContent value="history"><Card><CardHeader><CardTitle>Migration record</CardTitle><CardDescription>Governed status, ownership, mappings, and timestamps retained with configuration audit events.</CardDescription></CardHeader><CardContent>{plan ? <dl className="grid gap-4 md:grid-cols-2"><div><dt className="text-sm text-muted-foreground">Responsible administrator</dt><dd className="font-medium">{plan.createdByName}</dd></div><div><dt className="text-sm text-muted-foreground">Last updated</dt><dd className="font-medium">{new Date(plan.updatedAt).toLocaleString()}</dd></div><div><dt className="text-sm text-muted-foreground">Target version</dt><dd className="font-medium">{plan.targetVersionId ?? 'Not generated'}</dd></div><div><dt className="text-sm text-muted-foreground">Rollback state</dt><dd className="font-medium">{plan.status === 'Rolled back' ? `Rolled back ${plan.rolledBackAt ? new Date(plan.rolledBackAt).toLocaleString() : ''}` : 'Not rolled back'}</dd></div></dl> : <div className="flex items-center gap-2 text-muted-foreground"><History className="size-4" />Run analysis to create a governed migration record.</div>}</CardContent></Card></TabsContent>
    </Tabs>
    <div className="flex gap-2 rounded-md bg-accent p-4 text-accent-foreground"><AlertTriangle className="mt-0.5 size-5" /><div><p className="font-medium">Historical-data guarantee</p><p className="text-sm">The assistant creates new drafts and changes only future-submission routing. It never updates request records or historical typed answers.</p></div></div>
  </div></main>;
}
