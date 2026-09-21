import { useMemo, useState, type ChangeEvent } from 'react';
import { ArrowLeft, ArrowRight, Check, ClipboardList, Gauge, ShieldCheck, Sparkles, UserRound, UsersRound } from 'lucide-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { useCreateConfigurationAuditEvent } from '@/generated/hooks/use-configuration-audit-event';
import { useCreateFieldDefinition } from '@/generated/hooks/use-field-definition';
import { useCreateFormDefinition } from '@/generated/hooks/use-form-definition';
import { useCreateFormSection } from '@/generated/hooks/use-form-section';
import { useCreateFormVersion } from '@/generated/hooks/use-form-version';
import { usePersonList } from '@/generated/hooks/use-person';
import { useServiceCategoryList } from '@/generated/hooks/use-service-category';
import { useCreateService, useServiceList } from '@/generated/hooks/use-service';
import type { Person } from '@/generated/models/person-model';
import type { ServiceCategory } from '@/generated/models/service-category-model';
import type { Service } from '@/generated/models/service-model';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

const steps = [
  { key: 'owner', label: 'Service owner', icon: UserRound },
  { key: 'audience', label: 'Audience', icon: UsersRound },
  { key: 'approval', label: 'Approval flow', icon: ShieldCheck },
  { key: 'information', label: 'Required information', icon: ClipboardList },
  { key: 'sla', label: 'SLA', icon: Gauge },
  { key: 'reporting', label: 'Reporting needs', icon: Sparkles },
] as const;

type InformationKey = 'requestSummary' | 'businessJustification' | 'neededBy' | 'priority' | 'costCenter' | 'attachment';
type ReportingKey = 'volume' | 'completionTime' | 'slaCompliance' | 'approvalOutcome' | 'department' | 'cost';
type WizardDraft = {
  serviceName: string;
  description: string;
  categoryId: string;
  ownerId: string;
  audienceType: 'AllMembers' | 'Department' | 'Role';
  audienceReference: string;
  approvalFlow: 'None' | 'Manager' | 'ServiceOwner' | 'NamedApprover';
  approverId: string;
  information: InformationKey[];
  responseHours: string;
  resolutionHours: string;
  reporting: ReportingKey[];
};

const informationOptions: Array<{ key: InformationKey; label: string; description: string }> = [
  { key: 'requestSummary', label: 'Request summary', description: 'A concise description of what is needed.' },
  { key: 'businessJustification', label: 'Business justification', description: 'Why the request is needed.' },
  { key: 'neededBy', label: 'Needed-by date', description: 'The requested completion date.' },
  { key: 'priority', label: 'Business priority', description: 'Requester-selected urgency.' },
  { key: 'costCenter', label: 'Cost center', description: 'Financial ownership for fulfilment.' },
  { key: 'attachment', label: 'Supporting documents', description: 'Files needed to assess the request.' },
];

const reportingOptions: Array<{ key: ReportingKey; label: string }> = [
  { key: 'volume', label: 'Request volume' },
  { key: 'completionTime', label: 'Completion time' },
  { key: 'slaCompliance', label: 'SLA compliance' },
  { key: 'approvalOutcome', label: 'Approval outcomes' },
  { key: 'department', label: 'Demand by department' },
  { key: 'cost', label: 'Requested cost' },
];

const fieldTemplates: Record<InformationKey, { label: string; key: string; type: 'Text' | 'MultiLineText' | 'Date' | 'SingleChoice' | 'Lookup' | 'Attachment'; required: boolean; reportable: boolean }> = {
  requestSummary: { label: 'Request summary', key: 'request_summary', type: 'Text', required: true, reportable: true },
  businessJustification: { label: 'Business justification', key: 'business_justification', type: 'MultiLineText', required: true, reportable: false },
  neededBy: { label: 'Needed by', key: 'needed_by', type: 'Date', required: true, reportable: true },
  priority: { label: 'Business priority', key: 'business_priority', type: 'SingleChoice', required: true, reportable: true },
  costCenter: { label: 'Cost center', key: 'cost_center', type: 'Lookup', required: true, reportable: true },
  attachment: { label: 'Supporting documents', key: 'supporting_documents', type: 'Attachment', required: false, reportable: false },
};

export default function GuidedServiceCreationPage() {
  const { workspaceCode = '' } = useParams();
  const navigate = useNavigate();
  const { activeWorkspace, currentPerson, can } = useWorkspaceContext();
  const { data: people = [] } = usePersonList();
  const { data: categories = [] } = useServiceCategoryList();
  const { data: services = [] } = useServiceList();
  const createService = useCreateService();
  const createForm = useCreateFormDefinition();
  const createVersion = useCreateFormVersion();
  const createSection = useCreateFormSection();
  const createField = useCreateFieldDefinition();
  const createAudit = useCreateConfigurationAuditEvent();
  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<WizardDraft>({ serviceName: '', description: '', categoryId: '', ownerId: currentPerson?.id ?? '', audienceType: 'AllMembers', audienceReference: 'all-members', approvalFlow: 'None', approverId: '', information: ['requestSummary', 'businessJustification'], responseHours: '8', resolutionHours: '40', reporting: ['volume', 'completionTime', 'slaCompliance'] });
  const workspacePeople = useMemo(() => people.filter((person: Person) => person.active && person.statusKey === 'Active'), [people]);
  const workspaceCategories = useMemo(() => categories.filter((category: ServiceCategory) => category.workspace.id === activeWorkspace?.id && !category.isDeleted), [activeWorkspace?.id, categories]);
  const progress = Math.round(((step + 1) / steps.length) * 100);

  if (!activeWorkspace) return <Navigate to="/no-workspace-access" replace />;
  if (!can('workspace.administer')) return <Navigate to={`/w/${workspaceCode}`} replace />;
  const workspace = activeWorkspace;

  const toggleInformation = (key: InformationKey, checked: boolean) => setDraft((current: WizardDraft) => ({ ...current, information: checked ? [...current.information, key] : current.information.filter((item: InformationKey) => item !== key) }));
  const toggleReporting = (key: ReportingKey, checked: boolean) => setDraft((current: WizardDraft) => ({ ...current, reporting: checked ? [...current.reporting, key] : current.reporting.filter((item: ReportingKey) => item !== key) }));

  const validateStep = () => {
    if (step === 0 && (!draft.serviceName.trim() || !draft.categoryId || !draft.ownerId)) return 'Enter a service name, category, and owner.';
    if (step === 1 && draft.audienceType !== 'AllMembers' && !draft.audienceReference.trim()) return 'Enter the audience reference.';
    if (step === 2 && draft.approvalFlow === 'NamedApprover' && !draft.approverId) return 'Select the named approver.';
    if (step === 3 && draft.information.length === 0) return 'Select at least one required-information field.';
    if (step === 4 && (Number(draft.responseHours) <= 0 || Number(draft.resolutionHours) <= 0)) return 'Enter positive response and resolution targets.';
    if (step === 4 && Number(draft.responseHours) > Number(draft.resolutionHours)) return 'Response target must not exceed resolution target.';
    return undefined;
  };

  const next = () => { const issue = validateStep(); if (issue) return toast.error(issue); setStep((current: number) => Math.min(current + 1, steps.length - 1)); };

  const generateDraft = async () => {
    const issue = validateStep();
    if (issue) return toast.error(issue);
    const category = workspaceCategories.find((item: ServiceCategory) => item.id === draft.categoryId);
    const owner = workspacePeople.find((item: Person) => item.id === draft.ownerId);
    if (!category || !owner || !currentPerson) return toast.error('Service owner, category, or administrator context is unavailable.');
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const suffix = Date.now().toString().slice(-6);
      const serviceCodeBase = draft.serviceName.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 22) || 'SERVICE';
      const serviceCode = `${serviceCodeBase}_${suffix}`;
      const configuration = { source: 'guided-service-creation', ownerId: owner.id, audience: { type: draft.audienceType, reference: draft.audienceReference }, approval: { type: draft.approvalFlow, approverId: draft.approverId || undefined }, sla: { responseHours: Number(draft.responseHours), resolutionHours: Number(draft.resolutionHours) }, reporting: draft.reporting, requiredInformation: draft.information };
      const form = await createForm.mutateAsync({ name1: `${draft.serviceName.trim()} form`, description: draft.description.trim() || `Guided form for ${draft.serviceName.trim()}`, currentVersionNumber: 1, statusKey: 'Draft', workspace: { id: workspace.id, workspaceName: workspace.workspaceName } });
      const version = await createVersion.mutateAsync({ snapshotLabel: `${draft.serviceName.trim()} v1`, configurationSnapshot: JSON.stringify(configuration), formDefinition: { id: form.id, name1: form.name1 }, statusKey: 'Draft', versionNumber: 1, workspace: { id: workspace.id, workspaceName: workspace.workspaceName }, createdAt: now, updatedAt: now, isDeleted: false });
      const section = await createSection.mutateAsync({ title: 'Request details', description: 'Information required to assess and fulfil this request.', instructions: 'Complete the fields below before reviewing your request.', formDefinition: { id: form.id, name1: form.name1 }, formVersionID: { id: version.id, snapshotLabel: version.snapshotLabel }, sortOrder: 1, workspace: { id: workspace.id, workspaceName: workspace.workspaceName }, createdAt: now, updatedAt: now, isDeleted: false });
      for (const [index, key] of draft.information.entries()) {
        const template = fieldTemplates[key];
        await createField.mutateAsync({ label: template.label, fieldCode: template.key, fieldTypeKey: template.type, placeholder: template.type === 'MultiLineText' ? 'Provide enough detail for the service team' : undefined, helpText: key === 'neededBy' ? 'Select the date when this request is needed.' : undefined, required: template.required, requesterVisible: true, readOnly1: false, searchable: template.reportable, reportable: template.reportable, sensitive: false, widthKey: template.type === 'MultiLineText' || template.type === 'Attachment' ? 'Full' : 'Half', configuration: JSON.stringify({ generatedBy: 'guided-service-creation', lookupSource: key === 'costCenter' ? 'cost-centers' : undefined, allowedFileTypes: key === 'attachment' ? 'pdf,docx,xlsx,png,jpg' : undefined, maximumFileSize: key === 'attachment' ? '20' : undefined }), agentOnly: false, sortOrder: index + 1, formDefinition: { id: form.id, name1: form.name1 }, formSection: { id: section.id, title: section.title }, formVersionID: { id: version.id, snapshotLabel: version.snapshotLabel }, workspace: { id: workspace.id, workspaceName: workspace.workspaceName }, createdAt: now, updatedAt: now, isDeleted: false });
      }
      const service = await createService.mutateAsync({ serviceName: draft.serviceName.trim(), serviceCode, description: draft.description.trim() || `Service draft created through guided setup.`, instructions: 'Review the generated form and connected configuration before publication.', defaultAssignmentGroupCode: 'UNASSIGNED', requesterEligible: true, serviceCategory: { id: category.id, name1: category.name1 }, workspace: { id: workspace.id, workspaceName: workspace.workspaceName }, lifecycleStateKey: 'Draft', statusKey: 'Inactive', reportingConfiguration: JSON.stringify({ selectedNeeds: draft.reporting, discoverReportableFields: true }), audienceConfiguration: JSON.stringify(configuration.audience), availabilityConfiguration: JSON.stringify({ enabled: false, sla: configuration.sla }), sortOrder: services.filter((item: Service) => item.workspace.id === workspace.id && !item.isDeleted).length + 1, createdAt: now, updatedAt: now, isDeleted: false, owner: { id: owner.id, displayName: owner.displayName }, ownerPerson: { id: owner.id, displayName: owner.displayName } });
      await createAudit.mutateAsync({ configurationAuditEventName: `Created ${service.serviceName} with guided setup`, actionKey: 'Created', actor: { id: currentPerson.id, displayName: currentPerson.displayName }, newValue: JSON.stringify({ serviceId: service.id, formId: form.id, formVersionId: version.id, configuration }), occurredAt: now, scopeKey: 'Service', settingKey: 'guidedServiceCreation', sourceKey: 'ServiceOverride', targetRecordID: service.id, workspace: { id: workspace.id, workspaceName: workspace.workspaceName } });
      toast.success('Service draft generated. Review and complete it in Service Builder.');
      navigate(`/w/${workspaceCode}/settings/service-builder`);
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Unable to generate the service draft.');
    } finally {
      setBusy(false);
    }
  };

  const ActiveIcon = steps[step].icon;
  return <main className="flex-1 bg-background p-4 text-foreground md:p-6"><div className="mx-auto max-w-6xl space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><Button variant="ghost" size="sm" asChild><Link to={`/w/${workspaceCode}/settings/service-builder`}><ArrowLeft className="size-4" />Service Builder</Link></Button><div className="mt-3 flex items-center gap-3"><div className="rounded-lg bg-primary p-2 text-primary-foreground"><Sparkles className="size-5" /></div><div><h1 className="text-2xl font-semibold">Guided service creation</h1><p className="text-sm text-muted-foreground">Answer six practical questions to generate an editable service draft.</p></div></div></div><Badge variant="secondary">Step {step + 1} of {steps.length}</Badge></header>
    <div className="h-2 overflow-hidden rounded-full bg-muted" aria-label={`${progress}% complete`}><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
    <div className="grid gap-5 lg:grid-cols-[250px_minmax(0,1fr)]"><aside><Card><CardContent className="space-y-1 p-3">{steps.map((item, index: number) => { const Icon = item.icon; return <button key={item.key} type="button" onClick={() => { if (index <= step) setStep(index); }} className={`flex w-full items-center gap-3 rounded-md p-3 text-left text-sm ${index === step ? 'bg-primary text-primary-foreground' : 'bg-background text-foreground'}`}><Icon className="size-4" /><span className="flex-1 font-medium">{item.label}</span>{index < step && <Check className="size-4" />}</button>; })}</CardContent></Card></aside>
      <Card><CardHeader><div className="flex items-center gap-3"><div className="rounded-lg bg-secondary p-2 text-secondary-foreground"><ActiveIcon className="size-5" /></div><div><CardTitle>{steps[step].label}</CardTitle><CardDescription>These choices become standard metadata and remain fully editable.</CardDescription></div></div></CardHeader><CardContent className="space-y-5">
        {step === 0 && <><div className="grid gap-4 md:grid-cols-2"><div className="space-y-2 md:col-span-2"><Label>Service name</Label><Input value={draft.serviceName} onChange={(event: ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, serviceName: event.target.value })} placeholder="Example: New software access" /></div><div className="space-y-2"><Label>Category</Label><Select value={draft.categoryId || 'none'} onValueChange={(value: string) => setDraft({ ...draft, categoryId: value === 'none' ? '' : value })}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent><SelectItem value="none">Select category</SelectItem>{workspaceCategories.filter((item: ServiceCategory) => Boolean(item.id)).map((item: ServiceCategory) => <SelectItem key={item.id} value={item.id}>{item.name1}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Service owner</Label><Select value={draft.ownerId || 'none'} onValueChange={(value: string) => setDraft({ ...draft, ownerId: value === 'none' ? '' : value })}><SelectTrigger><SelectValue placeholder="Select owner" /></SelectTrigger><SelectContent><SelectItem value="none">Select owner</SelectItem>{workspacePeople.filter((item: Person) => Boolean(item.id)).map((item: Person) => <SelectItem key={item.id} value={item.id}>{item.displayName}</SelectItem>)}</SelectContent></Select></div></div><div className="space-y-2"><Label>Description</Label><Textarea value={draft.description} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setDraft({ ...draft, description: event.target.value })} placeholder="What does this service help employees request?" /></div></>}
        {step === 1 && <><div className="space-y-2"><Label>Who can request this service?</Label><Select value={draft.audienceType} onValueChange={(value: WizardDraft['audienceType']) => setDraft({ ...draft, audienceType: value, audienceReference: value === 'AllMembers' ? 'all-members' : '' })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="AllMembers">All workspace members</SelectItem><SelectItem value="Department">A department</SelectItem><SelectItem value="Role">A role or group</SelectItem></SelectContent></Select></div>{draft.audienceType !== 'AllMembers' && <div className="space-y-2"><Label>{draft.audienceType === 'Department' ? 'Department code' : 'Role or group reference'}</Label><Input value={draft.audienceReference} onChange={(event: ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, audienceReference: event.target.value })} /></div>}<div className="rounded-lg bg-secondary p-4 text-sm text-secondary-foreground">Audience metadata is generated in the draft. Catalog publication remains governed by the existing eligibility checks.</div></>}
        {step === 2 && <><div className="space-y-2"><Label>Approval flow</Label><Select value={draft.approvalFlow} onValueChange={(value: WizardDraft['approvalFlow']) => setDraft({ ...draft, approvalFlow: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="None">No approval</SelectItem><SelectItem value="Manager">Requester manager</SelectItem><SelectItem value="ServiceOwner">Service owner</SelectItem><SelectItem value="NamedApprover">Named approver</SelectItem></SelectContent></Select></div>{draft.approvalFlow === 'NamedApprover' && <div className="space-y-2"><Label>Approver</Label><Select value={draft.approverId || 'none'} onValueChange={(value: string) => setDraft({ ...draft, approverId: value === 'none' ? '' : value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="none">Select approver</SelectItem>{workspacePeople.filter((item: Person) => Boolean(item.id)).map((item: Person) => <SelectItem key={item.id} value={item.id}>{item.displayName}</SelectItem>)}</SelectContent></Select></div>}</>}
        {step === 3 && <div className="grid gap-3 md:grid-cols-2">{informationOptions.map((item) => <label key={item.key} className="flex cursor-pointer gap-3 rounded-lg border p-4"><Checkbox checked={draft.information.includes(item.key)} onCheckedChange={(checked: boolean) => toggleInformation(item.key, checked)} /><span><span className="block font-medium">{item.label}</span><span className="block text-sm text-muted-foreground">{item.description}</span></span></label>)}</div>}
        {step === 4 && <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label>Response target (hours)</Label><Input type="number" min="1" value={draft.responseHours} onChange={(event: ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, responseHours: event.target.value })} /></div><div className="space-y-2"><Label>Resolution target (hours)</Label><Input type="number" min="1" value={draft.resolutionHours} onChange={(event: ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, resolutionHours: event.target.value })} /></div><div className="rounded-lg bg-secondary p-4 text-sm text-secondary-foreground md:col-span-2">Targets are stored in the draft configuration for completion in the existing SLA builder before publication.</div></div>}
        {step === 5 && <><div className="grid gap-3 md:grid-cols-2">{reportingOptions.map((item) => <label key={item.key} className="flex cursor-pointer items-center gap-3 rounded-lg border p-4"><Checkbox checked={draft.reporting.includes(item.key)} onCheckedChange={(checked: boolean) => toggleReporting(item.key, checked)} /><span className="font-medium">{item.label}</span></label>)}</div><div className="rounded-lg border-l-4 border-l-primary bg-card p-4 text-card-foreground"><p className="font-medium">Draft summary</p><p className="mt-1 text-sm">{draft.information.length} form fields · {draft.approvalFlow === 'None' ? 'No approval' : draft.approvalFlow} · {draft.responseHours}h response · {draft.resolutionHours}h resolution · {draft.reporting.length} reporting needs</p></div></>}
        <div className="flex items-center justify-between border-t pt-5"><Button variant="outline" onClick={() => setStep((current: number) => Math.max(0, current - 1))} disabled={step === 0 || busy}><ArrowLeft className="size-4" />Back</Button>{step < steps.length - 1 ? <Button onClick={next}>Continue<ArrowRight className="size-4" /></Button> : <Button onClick={() => void generateDraft()} disabled={busy}><Sparkles className="size-4" />{busy ? 'Generating…' : 'Generate service draft'}</Button>}</div>
      </CardContent></Card></div>
  </div></main>;
}
