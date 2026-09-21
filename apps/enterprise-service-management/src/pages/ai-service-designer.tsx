import { useState, type ChangeEvent } from 'react';
import { ArrowLeft, Bot, Check, Pencil, ShieldCheck, Sparkles, WandSparkles } from 'lucide-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { useCreateConfigurationAuditEvent } from '@/generated/hooks/use-configuration-audit-event';
import { useCreateFieldDefinition } from '@/generated/hooks/use-field-definition';
import { useCreateFieldOption } from '@/generated/hooks/use-field-option';
import { useCreateFormDefinition } from '@/generated/hooks/use-form-definition';
import { useCreateFormSection } from '@/generated/hooks/use-form-section';
import { useCreateFormVersion } from '@/generated/hooks/use-form-version';
import { useServiceCategoryList } from '@/generated/hooks/use-service-category';
import { useCreateService, useServiceList } from '@/generated/hooks/use-service';
import type { ServiceCategory } from '@/generated/models/service-category-model';
import type { Service } from '@/generated/models/service-model';
import { getAiDesignProvider, sanitizeAiSuggestion, type AiDesignFieldSuggestion, type AiDesignSuggestion } from '@/lib/ai-design-adapter';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

export default function AiServiceDesignerPage() {
  const { workspaceCode = '' } = useParams();
  const navigate = useNavigate();
  const { activeWorkspace, currentPerson, can } = useWorkspaceContext();
  const { data: categories = [] } = useServiceCategoryList();
  const { data: services = [] } = useServiceList();
  const createService = useCreateService();
  const createForm = useCreateFormDefinition();
  const createVersion = useCreateFormVersion();
  const createSection = useCreateFormSection();
  const createField = useCreateFieldDefinition();
  const createOption = useCreateFieldOption();
  const createAudit = useCreateConfigurationAuditEvent();
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [suggestion, setSuggestion] = useState<AiDesignSuggestion>();
  const [busy, setBusy] = useState(false);

  if (!activeWorkspace) return <Navigate to="/no-workspace-access" replace />;
  if (!can('workspace.administer')) return <Navigate to={`/w/${workspaceCode}`} replace />;
  const workspace = activeWorkspace;
  const workspaceCategories = categories.filter((category: ServiceCategory) => category.workspace.id === workspace.id && !category.isDeleted);

  const generate = async () => {
    if (description.trim().length < 20) return toast.error('Describe the service in at least 20 characters.');
    const provider = getAiDesignProvider();
    if (!provider) return toast.error('No AI design provider is configured.');
    setBusy(true);
    try { setSuggestion(sanitizeAiSuggestion(await provider.generate(description))); toast.success('Editable design suggestions generated.'); }
    catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Unable to generate suggestions.'); }
    finally { setBusy(false); }
  };

  const createDraft = async () => {
    if (!suggestion || !currentPerson || !categoryId) return toast.error('Review the suggestion and select a category.');
    const category = workspaceCategories.find((item: ServiceCategory) => item.id === categoryId);
    if (!category) return toast.error('Select an active category.');
    setBusy(true);
    try {
      const now = new Date().toISOString();
      const suffix = Date.now().toString().slice(-6);
      const form = await createForm.mutateAsync({ name1: `${suggestion.title} form`, description: suggestion.summary, currentVersionNumber: 1, statusKey: 'Draft', workspace: { id: workspace.id, workspaceName: workspace.workspaceName } });
      const version = await createVersion.mutateAsync({ snapshotLabel: `${suggestion.title} v1`, configurationSnapshot: JSON.stringify({ source: 'ai-design-adapter', provider: 'local-design-heuristics', reviewRequired: true, rules: suggestion.rules, workflow: suggestion.workflow, lifecycle: suggestion.lifecycle, sla: suggestion.sla, reports: suggestion.reports, warnings: suggestion.warnings }), formDefinition: { id: form.id, name1: form.name1 }, statusKey: 'Draft', versionNumber: 1, workspace: { id: workspace.id, workspaceName: workspace.workspaceName }, createdAt: now, updatedAt: now, isDeleted: false });
      for (const [sectionIndex, sectionSuggestion] of suggestion.sections.entries()) {
        const section = await createSection.mutateAsync({ title: sectionSuggestion.title, description: sectionSuggestion.description, instructions: 'Review generated fields before publication.', formDefinition: { id: form.id, name1: form.name1 }, formVersionID: { id: version.id, snapshotLabel: version.snapshotLabel }, sortOrder: sectionIndex + 1, workspace: { id: workspace.id, workspaceName: workspace.workspaceName }, createdAt: now, updatedAt: now, isDeleted: false });
        for (const [fieldIndex, fieldSuggestion] of sectionSuggestion.fields.entries()) {
          const field = await createField.mutateAsync({ label: fieldSuggestion.label, fieldCode: fieldSuggestion.key, fieldTypeKey: fieldSuggestion.type, helpText: fieldSuggestion.helpText, required: fieldSuggestion.required, requesterVisible: true, readOnly1: false, searchable: fieldSuggestion.reportable, reportable: fieldSuggestion.reportable, sensitive: false, widthKey: fieldSuggestion.type === 'MultiLineText' || fieldSuggestion.type === 'Attachment' ? 'Full' : 'Half', configuration: JSON.stringify({ generatedBy: 'ai-design-adapter', administratorReviewed: false }), agentOnly: false, sortOrder: fieldIndex + 1, formDefinition: { id: form.id, name1: form.name1 }, formSection: { id: section.id, title: section.title }, formVersionID: { id: version.id, snapshotLabel: version.snapshotLabel }, workspace: { id: workspace.id, workspaceName: workspace.workspaceName }, createdAt: now, updatedAt: now, isDeleted: false });
          await Promise.all((fieldSuggestion.options ?? []).map((label: string, optionIndex: number) => createOption.mutateAsync({ label, value: label.toLowerCase().replace(/[^a-z0-9]+/g, '-'), fieldDefinition: { id: field.id, label: field.label }, sortOrder: optionIndex + 1, statusKey: 'Active', workspace: { id: workspace.id, workspaceName: workspace.workspaceName }, createdAt: now, updatedAt: now, isDeleted: false })));
        }
      }
      const serviceCode = `${suggestion.title.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '').slice(0, 22) || 'SERVICE'}_${suffix}`;
      const service = await createService.mutateAsync({ serviceName: suggestion.title, serviceCode, description: suggestion.summary, instructions: 'AI-assisted draft. Administrator review and normal readiness checks are required before publication.', defaultAssignmentGroupCode: 'UNASSIGNED', requesterEligible: true, serviceCategory: { id: category.id, name1: category.name1 }, workspace: { id: workspace.id, workspaceName: workspace.workspaceName }, lifecycleStateKey: 'Draft', statusKey: 'Inactive', reportingConfiguration: JSON.stringify({ suggestedReports: suggestion.reports, discoverReportableFields: true }), availabilityConfiguration: JSON.stringify({ enabled: false, suggestedSla: suggestion.sla }), audienceConfiguration: JSON.stringify({ status: 'RequiresReview' }), sortOrder: services.filter((item: Service) => item.workspace.id === workspace.id && !item.isDeleted).length + 1, createdAt: now, updatedAt: now, isDeleted: false, owner: { id: currentPerson.id, displayName: currentPerson.displayName } });
      await createAudit.mutateAsync({ configurationAuditEventName: `Created AI-assisted draft ${service.serviceName}`, actionKey: 'Created', actor: { id: currentPerson.id, displayName: currentPerson.displayName }, newValue: JSON.stringify({ serviceId: service.id, formVersionId: version.id, provider: 'local-design-heuristics', administratorReviewRequired: true }), occurredAt: now, scopeKey: 'Service', settingKey: 'aiDesignDraft', sourceKey: 'ServiceOverride', targetRecordID: service.id, workspace: { id: workspace.id, workspaceName: workspace.workspaceName } });
      toast.success('Editable draft created. Nothing was published.');
      navigate(`/w/${workspaceCode}/settings/service-builder`);
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Unable to create the draft.'); }
    finally { setBusy(false); }
  };

  const updateField = (sectionIndex: number, fieldIndex: number, changes: Partial<AiDesignFieldSuggestion>) => setSuggestion((current: AiDesignSuggestion | undefined) => current ? ({ ...current, sections: current.sections.map((section, index: number) => index === sectionIndex ? ({ ...section, fields: section.fields.map((field: AiDesignFieldSuggestion, innerIndex: number) => innerIndex === fieldIndex ? { ...field, ...changes } : field) }) : section) }) : current);

  return <main className="flex-1 bg-background p-4 text-foreground md:p-6"><div className="mx-auto max-w-6xl space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><Button variant="ghost" size="sm" asChild><Link to={`/w/${workspaceCode}/settings/service-builder`}><ArrowLeft className="size-4" />Service Builder</Link></Button><div className="mt-3 flex items-center gap-3"><div className="rounded-lg bg-primary p-2 text-primary-foreground"><WandSparkles className="size-5" /></div><div><h1 className="text-2xl font-semibold">AI-assisted service design</h1><p className="text-sm text-muted-foreground">Turn a plain-language need into editable metadata suggestions.</p></div></div></div><Badge variant="secondary"><ShieldCheck className="size-3" />Administrator review required</Badge></header>
    <div className="grid gap-5 lg:grid-cols-[minmax(0,0.85fr)_minmax(0,1.4fr)]"><Card><CardHeader><CardTitle>Describe the service</CardTitle><CardDescription>The provider interface is replaceable. Suggestions never publish automatically.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label>Natural-language description</Label><Textarea className="min-h-48" value={description} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setDescription(event.target.value)} placeholder="Example: Employees need to request temporary application access. Their manager and the application owner should approve it, and access should expire on a selected date." /></div><Button className="w-full" onClick={() => void generate()} disabled={busy}><Sparkles className="size-4" />{busy ? 'Generating…' : 'Generate suggestions'}</Button><div className="rounded-lg bg-secondary p-4 text-sm text-secondary-foreground"><p className="font-medium">Control boundary</p><p className="mt-1">The assistant can only propose draft metadata. Existing governance, readiness, maker/checker, and publication controls remain authoritative.</p></div></CardContent></Card>
      <div className="space-y-4">{!suggestion ? <Card><CardContent className="flex min-h-80 flex-col items-center justify-center gap-3 text-center"><Bot className="size-9" /><div><p className="font-medium">No design generated yet</p><p className="text-sm text-muted-foreground">Describe the operational outcome, users, approvals, information, and timing.</p></div></CardContent></Card> : <><Card><CardHeader><div className="flex items-start justify-between gap-3"><div><CardTitle>{suggestion.title}</CardTitle><CardDescription>{suggestion.summary}</CardDescription></div><Badge variant="outline">Editable draft</Badge></div></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label>Draft service name</Label><Input value={suggestion.title} onChange={(event: ChangeEvent<HTMLInputElement>) => setSuggestion({ ...suggestion, title: event.target.value })} /></div><div className="space-y-2"><Label>Category</Label><Select value={categoryId || 'none'} onValueChange={(value: string) => setCategoryId(value === 'none' ? '' : value)}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent><SelectItem value="none">Select category</SelectItem>{workspaceCategories.filter((item: ServiceCategory) => Boolean(item.id)).map((item: ServiceCategory) => <SelectItem key={item.id} value={item.id}>{item.name1}</SelectItem>)}</SelectContent></Select></div></CardContent></Card>
        {suggestion.sections.map((section, sectionIndex: number) => <Card key={`${section.title}-${sectionIndex}`}><CardHeader><CardTitle>{section.title}</CardTitle><CardDescription>{section.description}</CardDescription></CardHeader><CardContent className="space-y-3">{section.fields.map((field: AiDesignFieldSuggestion, fieldIndex: number) => <div key={field.key} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[1fr_1fr_auto]"><div className="space-y-1"><Label>Label</Label><Input value={field.label} onChange={(event: ChangeEvent<HTMLInputElement>) => updateField(sectionIndex, fieldIndex, { label: event.target.value })} /></div><div className="space-y-1"><Label>Stable key</Label><Input value={field.key} onChange={(event: ChangeEvent<HTMLInputElement>) => updateField(sectionIndex, fieldIndex, { key: event.target.value })} /></div><div className="flex items-end gap-2"><Badge variant={field.required ? 'default' : 'outline'}>{field.required ? 'Required' : 'Optional'}</Badge><Badge variant={field.reportable ? 'secondary' : 'outline'}>{field.type}</Badge></div></div>)}</CardContent></Card>)}
        <Card><CardHeader><CardTitle>Connected suggestions</CardTitle><CardDescription>These remain editable configuration notes until reviewed in their existing builders.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2"><div><p className="font-medium">Workflow</p><p className="mt-1 text-sm text-muted-foreground">{suggestion.workflow.join(' → ')}</p></div><div><p className="font-medium">Lifecycle</p><p className="mt-1 text-sm text-muted-foreground">{suggestion.lifecycle.join(' → ')}</p></div><div><p className="font-medium">SLA</p><p className="mt-1 text-sm text-muted-foreground">{suggestion.sla.responseHours}h response · {suggestion.sla.resolutionHours}h resolution</p></div><div><p className="font-medium">Reporting</p><p className="mt-1 text-sm text-muted-foreground">{suggestion.reports.join(', ')}</p></div>{suggestion.warnings.map((warning: string) => <div key={warning} className="rounded-lg border-l-4 border-l-primary bg-card p-3 text-sm text-card-foreground md:col-span-2">{warning}</div>)}</CardContent></Card>
        <div className="flex items-center justify-between rounded-lg bg-primary p-4 text-primary-foreground"><div><p className="font-medium">Ready for administrator review</p><p className="text-sm">Creates an inactive draft only. Publication is unavailable from this page.</p></div><Button variant="secondary" onClick={() => void createDraft()} disabled={busy || !categoryId}><Check className="size-4" />Create editable draft</Button></div></>}</div>
    </div>
  </div></main>;
}
