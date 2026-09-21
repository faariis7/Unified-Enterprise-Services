import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CheckCircle2, Search, SlidersHorizontal } from 'lucide-react';
import { toast } from 'sonner';
import { InMemoryDataBanner } from '@/generated/components/in-memory-data-banner';
import { HAS_IN_MEMORY_TABLES } from '@/generated/hooks';
import { useCatalogItemList } from '@/generated/hooks/use-catalog-item';
import { useCatalogItemAudienceList } from '@/generated/hooks/use-catalog-item-audience';
import { useCatalogItemFormAssignmentList } from '@/generated/hooks/use-catalog-item-form-assignment';
import { useFieldDefinitionList } from '@/generated/hooks/use-field-definition';
import { useFieldDefinitionPresentationList } from '@/generated/hooks/use-field-definition-presentation';
import { useFieldOptionList } from '@/generated/hooks/use-field-option';
import { useFieldValidationRuleList } from '@/generated/hooks/use-field-validation-rule';
import { useFieldVisibilityRuleList } from '@/generated/hooks/use-field-visibility-rule';
import { useServiceCategoryList } from '@/generated/hooks/use-service-category';
import type { CatalogItemAudience } from '@/generated/models/catalog-item-audience-model';
import type { CatalogItemFormAssignment } from '@/generated/models/catalog-item-form-assignment-model';
import type { Service } from '@/generated/models/service-model';
import type { ServiceCategory } from '@/generated/models/service-category-model';
import { useServiceList } from '@/generated/hooks/use-service';
import { useFormSectionList } from '@/generated/hooks/use-form-section';
import { useFormVersionList } from '@/generated/hooks/use-form-version';
import type { CatalogItem } from '@/generated/models/catalog-item-model';
import type { FieldDefinitionPresentation } from '@/generated/models/field-definition-presentation-model';
import type { FieldDefinition } from '@/generated/models/field-definition-model';
import type { FieldOption } from '@/generated/models/field-option-model';

import type { FormSection } from '@/generated/models/form-section-model';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { useUser } from '@/hooks/use-user';
import { CatalogSubmissionService } from '@/lib/catalog-submission-service';
import { DynamicFormRenderer, validateDynamicForm } from '@/components/dynamic-form-renderer';
import { RequestReviewSummary } from '@/components/request-review-summary';
import { buildDraftRequestReview } from '@/lib/request-review-runtime';

export default function ServiceCatalogPage() {
  const { itemCode } = useParams();
  const [categoryFilter, setCategoryFilter] = useState('all');
  const navigate = useNavigate();
  const location = useLocation();
  const requesterFormMode = location.pathname.includes('/portal/request/');
  const { activeWorkspace, currentPerson, grantedPermissions, getWorkspaceRole } = useWorkspaceContext();
  const { data: items = [] } = useCatalogItemList();
  const { data: presentations = [] } = useFieldDefinitionPresentationList();
  const { data: sections = [] } = useFormSectionList();
  const { data: fields = [] } = useFieldDefinitionList();
  const { data: audiences = [] } = useCatalogItemAudienceList();
  const { data: formAssignments = [] } = useCatalogItemFormAssignmentList();
  const { data: categories = [] } = useServiceCategoryList();
  const { data: services = [] } = useServiceList();
  const { data: options = [] } = useFieldOptionList();
  const { data: validationRules = [] } = useFieldValidationRuleList();
  const { data: visibilityRules = [] } = useFieldVisibilityRuleList();
  const { data: versions = [] } = useFormVersionList();
  const [search, setSearch] = useState('');
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [draftOpen, setDraftOpen] = useState(false);
  const eligibleItemIds = useMemo(() => new Set(audiences.filter((audience: CatalogItemAudience) => {
    if (audience.workspace.id !== activeWorkspace?.id || audience.statusKey !== 'Active' || !audience.isEligible) return false;
    if (audience.audienceTypeKey === 'AllMembers') return true;
    if (audience.audienceTypeKey === 'Person') return audience.audienceReference === currentPerson?.id;
    if (audience.audienceTypeKey === 'Department') return audience.audienceReference === currentPerson?.departmentCode;
    if (audience.audienceTypeKey === 'Site') return audience.audienceReference === currentPerson?.siteCode;
    if (audience.audienceTypeKey === 'Role') return audience.audienceReference.toLowerCase() === getWorkspaceRole(activeWorkspace.id).toLowerCase();
    return false;
  }).map((audience: CatalogItemAudience) => audience.catalogItem.id)), [activeWorkspace?.id, audiences, currentPerson?.departmentCode, currentPerson?.id, currentPerson?.siteCode, getWorkspaceRole]);
  const workspaceServices = useMemo(() => services.filter((service: Service) => service.workspace.id === activeWorkspace?.id && service.statusKey === 'Active' && service.requesterEligible), [activeWorkspace?.id, services]);
  const serviceById = useMemo(() => new Map(workspaceServices.map((service: Service) => [service.id, service])), [workspaceServices]);
  const workspaceCategories = useMemo(() => categories.filter((category: ServiceCategory) => category.workspace.id === activeWorkspace?.id && category.statusKey === 'Active').sort((a: ServiceCategory, b: ServiceCategory) => a.sortOrder - b.sortOrder), [activeWorkspace?.id, categories]);
  const workspaceItems = useMemo(() => items.filter((item: CatalogItem) => item.workspace.id === activeWorkspace?.id && item.statusKey === 'Published' && item.requesterEligible && eligibleItemIds.has(item.id) && serviceById.has(item.service.id)), [activeWorkspace?.id, eligibleItemIds, items, serviceById]);
  const selected = workspaceItems.find((item: CatalogItem) => item.itemCode.toLowerCase() === itemCode?.toLowerCase());
  const assignment = formAssignments.find((item: CatalogItemFormAssignment) => item.workspace.id === activeWorkspace?.id && item.catalogItem.id === selected?.id && item.statusKey === 'Active' && item.isDefault);
  const version = versions.find((item) => item.id === assignment?.formVersion.id && item.statusKey === 'Published');
  const presentationFor = (fieldId: string) => presentations.find((item: FieldDefinitionPresentation) => item.fieldDefinition.id === fieldId);
  const formSections = sections.filter((section: FormSection) => section.formDefinition.id === assignment?.formDefinition.id && section.formVersionID.id === version?.id).sort((a: FormSection, b: FormSection) => a.sortOrder - b.sortOrder);
  const formFields = fields.filter((field: FieldDefinition) => field.formDefinition.id === assignment?.formDefinition.id && field.formVersionID.id === version?.id && field.requesterVisible && !field.agentOnly && (!field.visibilityRoleKey || field.visibilityRoleKey === 'requester')).sort((a: FieldDefinition, b: FieldDefinition) => (presentationFor(a.id)?.sortOrder ?? 0) - (presentationFor(b.id)?.sortOrder ?? 0));
  const draftKey = `service-request-draft-${activeWorkspace?.id ?? 'none'}-${version?.id ?? itemCode ?? 'none'}`;
  const dirty = Object.keys(values).length > 0;
  const review = buildDraftRequestReview({ title: selected?.itemName ?? 'Request review', sections: formSections, fields: formFields, options, visibilityRules, values, validationErrors: errors });
  useEffect(() => {
    const saved = window.localStorage.getItem(draftKey);
    if (saved) setDraftOpen(true);
  }, [draftKey]);
  useEffect(() => {
    const protect = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
    window.addEventListener('beforeunload', protect);
    return () => window.removeEventListener('beforeunload', protect);
  }, [dirty]);
  const setValue = (id: string, value: string) => setValues((current: Record<string, string>) => ({ ...current, [id]: value }));
  const saveDraft = () => { window.localStorage.setItem(draftKey, JSON.stringify(values)); toast.success('Draft saved on this device.'); };
  const requestSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateDynamicForm(formFields, validationRules, visibilityRules, values);
    setErrors(nextErrors);
    const firstError = Object.values(nextErrors)[0];
    if (firstError) { toast.error(firstError); return; }
    setConfirmOpen(true);
  };
  const submit = async () => {
    if (!selected || !version || !activeWorkspace || !currentPerson) return;
    setConfirmOpen(false);
    setSubmitting(true);
    try {
      const title = values[formFields.find((field: FieldDefinition) => field.fieldCode === 'title')?.id ?? ''] || selected.itemName;
      const description = values[formFields.find((field: FieldDefinition) => field.fieldCode === 'description')?.id ?? ''] || selected.shortDescription;
      const request = await CatalogSubmissionService.submit({ workspace: activeWorkspace, catalogItem: selected, formVersion: version, fields: formFields, values, title, description, actor: { id: currentPerson.id, displayName: currentPerson.displayName }, context: { identity: { objectId: currentPerson.externalObjectID, personId: currentPerson.id, personActive: currentPerson.active && currentPerson.statusKey === 'Active', departmentCode: currentPerson.departmentCode, siteCode: currentPerson.siteCode, assignmentGroupCodes: [] }, activeWorkspaceId: activeWorkspace.id, membershipActive: true, grantedPermissions } });
      window.localStorage.removeItem(draftKey);
      setValues({});
      toast.success(`Request ${request.requestNumber} created.`);
      navigate(`/w/${activeWorkspace.workspaceKey.toLowerCase()}/portal/requests/${request.id}`);
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Request submission failed.'); } finally { setSubmitting(false); }
  };
  return <main className="flex-1 space-y-5 p-4 md:p-6"><InMemoryDataBanner show={HAS_IN_MEMORY_TABLES} message="This app uses draft tables for testing. Data entered won't be saved. Contact the app owner to enable storage." className="border-border bg-muted text-muted-foreground" />
    {!selected ? <><div><h1 className="text-2xl font-semibold">Service catalog</h1><p className="text-muted-foreground">Browse requestable services for {activeWorkspace?.workspaceName}.</p></div><div className="flex flex-col gap-3 md:flex-row"><div className="relative max-w-md flex-1"><Search className="absolute left-3 top-3 size-4 text-muted-foreground" /><Input value={search} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)} placeholder="Search catalog" className="pl-9" /></div><Select value={categoryFilter} onValueChange={setCategoryFilter}><SelectTrigger className="w-full md:w-64"><SlidersHorizontal className="size-4" /><SelectValue placeholder="All categories" /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{workspaceCategories.filter((category: ServiceCategory) => category.id).map((category: ServiceCategory) => <SelectItem key={category.id} value={category.id}>{category.name1}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{workspaceItems.filter((item: CatalogItem) => { const service = serviceById.get(item.service.id); const matchesCategory = categoryFilter === 'all' || service?.serviceCategory.id === categoryFilter; const query = search.trim().toLowerCase(); return matchesCategory && (!query || `${item.itemName} ${item.shortDescription} ${service?.serviceName ?? ''}`.toLowerCase().includes(query)); }).map((item: CatalogItem) => { const service = serviceById.get(item.service.id); return <Card key={item.id}><CardHeader><CardDescription>{service?.serviceName}</CardDescription><CardTitle className="text-lg">{item.itemName}</CardTitle><CardDescription>{item.shortDescription}</CardDescription></CardHeader><CardContent><Button asChild><Link to={`/w/${activeWorkspace?.workspaceKey.toLowerCase()}/catalog/${item.itemCode}`}>Start request</Link></Button></CardContent></Card>; })}</div>{workspaceItems.length === 0 && <Card><CardHeader><CardTitle>No catalog items available</CardTitle><CardDescription>No published items match your workspace membership and audience permissions.</CardDescription></CardHeader></Card>}</> : <><Button variant="ghost" asChild><Link to={requesterFormMode && selected ? `/services/${activeWorkspace?.workspaceKey.toLowerCase()}/${selected.itemCode}` : '/'}><ArrowLeft className="size-4" />{requesterFormMode ? 'Service details' : 'Services'}</Link></Button><div><h1 className="text-2xl font-semibold">{selected.itemName}</h1><p className="text-muted-foreground">{selected.shortDescription}</p></div>{!version ? <Card><CardHeader><CardTitle>Form unavailable</CardTitle><CardDescription>This item does not have an active published form assignment.</CardDescription></CardHeader></Card> : <form onSubmit={requestSubmit} className="space-y-5"><DynamicFormRenderer sections={formSections} fields={formFields} options={options} validationRules={validationRules} visibilityRules={visibilityRules} values={values} onChange={setValue} errors={errors} mode="create" /><div className="flex flex-wrap gap-2"><Button type="button" variant="outline" onClick={saveDraft}>Save and continue</Button><Button type="submit" disabled={submitting}><CheckCircle2 className="size-4" />{submitting ? 'Submitting…' : 'Review and submit'}</Button></div></form>}</>}
    <Dialog open={draftOpen} onOpenChange={setDraftOpen}><DialogContent><DialogHeader><DialogTitle>Continue your saved draft?</DialogTitle><DialogDescription>A draft for this service is stored on this device.</DialogDescription></DialogHeader><DialogFooter><Button variant="outline" onClick={() => { window.localStorage.removeItem(draftKey); setValues({}); setDraftOpen(false); }}>Discard draft</Button><Button onClick={() => { try { const saved = JSON.parse(window.localStorage.getItem(draftKey) ?? '{}') as Record<string, string>; setValues(saved); } catch { window.localStorage.removeItem(draftKey); } setDraftOpen(false); }}>Continue draft</Button></DialogFooter></DialogContent></Dialog>
    <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}><AlertDialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-3xl"><AlertDialogHeader><AlertDialogTitle>Review and confirm</AlertDialogTitle><AlertDialogDescription>Your request will be bound to {version?.snapshotLabel ?? 'this published form version'}.</AlertDialogDescription></AlertDialogHeader><RequestReviewSummary review={review} /><AlertDialogFooter><AlertDialogCancel>Back to edit</AlertDialogCancel><AlertDialogAction onClick={() => void submit()}>Confirm and submit</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </main>;
}
