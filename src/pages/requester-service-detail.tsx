import { useMemo } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowLeft, ArrowRight, CheckCircle2, Clock3, FileText, Info, LockKeyhole, ShieldCheck, Sparkles, Users } from 'lucide-react';
import { useCatalogItemList } from '@/generated/hooks/use-catalog-item';
import { useCatalogItemAudienceList } from '@/generated/hooks/use-catalog-item-audience';
import { useCatalogItemApprovalPlanList } from '@/generated/hooks/use-catalog-item-approval-plan';
import { useCatalogItemFormAssignmentList } from '@/generated/hooks/use-catalog-item-form-assignment';
import { useFieldDefinitionList } from '@/generated/hooks/use-field-definition';
import { useFieldDefinitionPresentationList } from '@/generated/hooks/use-field-definition-presentation';
import { useFormVersionList } from '@/generated/hooks/use-form-version';
import { useServiceCategoryList } from '@/generated/hooks/use-service-category';
import { useServiceList } from '@/generated/hooks/use-service';
import type { CatalogItem } from '@/generated/models/catalog-item-model';
import type { CatalogItemAudience } from '@/generated/models/catalog-item-audience-model';
import type { CatalogItemApprovalPlan } from '@/generated/models/catalog-item-approval-plan-model';
import type { CatalogItemFormAssignment } from '@/generated/models/catalog-item-form-assignment-model';
import type { FieldDefinition } from '@/generated/models/field-definition-model';
import type { FieldDefinitionPresentation } from '@/generated/models/field-definition-presentation-model';
import type { Service } from '@/generated/models/service-model';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';

function audienceMatches(audience: CatalogItemAudience, personId: string, departmentCode: string, siteCode: string, workspaceRole: string): boolean {
  if (audience.statusKey !== 'Active' || !audience.isEligible) return false;
  if (audience.audienceTypeKey === 'AllMembers') return true;
  if (audience.audienceTypeKey === 'Person') return audience.audienceReference === personId;
  if (audience.audienceTypeKey === 'Department') return audience.audienceReference === departmentCode;
  if (audience.audienceTypeKey === 'Site') return audience.audienceReference === siteCode;
  return audience.audienceReference.toLowerCase() === workspaceRole.toLowerCase();
}

function audienceLabel(audience: CatalogItemAudience): string {
  if (audience.audienceTypeKey === 'AllMembers') return 'Available to all employees';
  if (audience.audienceTypeKey === 'Department') return `${audience.audienceName || audience.audienceReference} department`;
  if (audience.audienceTypeKey === 'Site') return `${audience.audienceName || audience.audienceReference} site`;
  if (audience.audienceTypeKey === 'Role') return `${audience.audienceName || audience.audienceReference} role`;
  return 'Available to selected employees';
}

function formatDuration(hours: number): string {
  if (hours < 24) return `${hours} business ${hours === 1 ? 'hour' : 'hours'}`;
  const days = Math.ceil(hours / 8);
  return `${days} business ${days === 1 ? 'day' : 'days'}`;
}

export default function RequesterServiceDetailPage() {
  const { workspaceCode = '', itemCode = '' } = useParams();
  const { activeWorkspace, currentPerson, getWorkspaceRole } = useWorkspaceContext();
  const { data: items = [], isLoading: itemsLoading } = useCatalogItemList();
  const { data: services = [] } = useServiceList();
  const { data: categories = [] } = useServiceCategoryList();
  const { data: audiences = [] } = useCatalogItemAudienceList();
  const { data: approvalPlans = [] } = useCatalogItemApprovalPlanList();
  const { data: assignments = [] } = useCatalogItemFormAssignmentList();
  const { data: versions = [] } = useFormVersionList();
  const { data: fields = [] } = useFieldDefinitionList();
  const { data: presentations = [] } = useFieldDefinitionPresentationList();

  const item = items.find((candidate: CatalogItem) => candidate.workspace.id === activeWorkspace?.id && candidate.itemCode.toLowerCase() === itemCode.toLowerCase());
  const service = services.find((candidate: Service) => candidate.id === item?.service.id && candidate.workspace.id === activeWorkspace?.id);
  const category = categories.find((candidate) => candidate.id === service?.serviceCategory.id);
  const itemAudiences = audiences.filter((audience: CatalogItemAudience) => audience.catalogItem.id === item?.id && audience.workspace.id === activeWorkspace?.id);
  const eligible = Boolean(item && service && currentPerson && activeWorkspace && item.statusKey === 'Published' && item.requesterEligible && service.statusKey === 'Active' && service.requesterEligible && itemAudiences.some((audience: CatalogItemAudience) => audienceMatches(audience, currentPerson.id, currentPerson.departmentCode, currentPerson.siteCode, getWorkspaceRole(activeWorkspace.id))));
  const assignment = assignments.find((candidate: CatalogItemFormAssignment) => candidate.catalogItem.id === item?.id && candidate.workspace.id === activeWorkspace?.id && candidate.statusKey === 'Active' && candidate.isDefault);
  const formVersion = versions.find((candidate) => candidate.id === assignment?.formVersion.id && candidate.statusKey === 'Published');
  const requesterFields = useMemo(() => fields.filter((field: FieldDefinition) => field.formDefinition.id === assignment?.formDefinition.id && field.formVersionID.id === formVersion?.id && field.requesterVisible && !field.agentOnly && field.fieldTypeKey !== 'Information'), [assignment?.formDefinition.id, fields, formVersion?.id]);
  const presentationByField = useMemo(() => new Map(presentations.map((presentation: FieldDefinitionPresentation) => [presentation.fieldDefinition.id, presentation])), [presentations]);
  const requiredFields = requesterFields.filter((field: FieldDefinition) => field.required);
  const plans = approvalPlans.filter((plan: CatalogItemApprovalPlan) => plan.catalogItem.id === item?.id && plan.workspace.id === activeWorkspace?.id && plan.statusKey === 'Active').sort((first: CatalogItemApprovalPlan, second: CatalogItemApprovalPlan) => first.stageOrder - second.stageOrder);
  const approvalSummary = plans.length === 0 ? 'No approval is normally required.' : plans.some((plan: CatalogItemApprovalPlan) => plan.approverTypeKey === 'Manager') ? 'Your manager or an authorized business approver will review this request.' : `This request includes ${new Set(plans.map((plan: CatalogItemApprovalPlan) => plan.stageOrder)).size} approval ${new Set(plans.map((plan: CatalogItemApprovalPlan) => plan.stageOrder)).size === 1 ? 'stage' : 'stages'}.`;

  if (!activeWorkspace || activeWorkspace.workspaceKey.toLowerCase() !== workspaceCode.toLowerCase()) return <Navigate to="/" replace />;
  if (itemsLoading) return <main className="flex-1 p-6"><p aria-live="polite">Loading service details…</p></main>;
  if (!eligible || !item || !service || !currentPerson) {
    return <main className="flex-1 px-5 py-12 md:px-10"><div className="mx-auto max-w-4xl"><Button variant="ghost" asChild><Link to="/"><ArrowLeft />Back to services</Link></Button><Empty className="mt-8 rounded-lg bg-muted py-16"><EmptyHeader><EmptyTitle>Service unavailable</EmptyTitle><EmptyDescription>This service is not currently available for your profile, or the link is no longer active.</EmptyDescription></EmptyHeader></Empty></div></main>;
  }

  const canProceed = Boolean(assignment && formVersion);
  const eligibilityLabels = Array.from(new Set(itemAudiences.filter((audience: CatalogItemAudience) => audienceMatches(audience, currentPerson.id, currentPerson.departmentCode, currentPerson.siteCode, getWorkspaceRole(activeWorkspace.id))).map(audienceLabel)));

  return (
    <main className="flex-1 bg-background px-5 py-8 text-foreground md:px-10 md:py-12">
      <div className="mx-auto max-w-6xl">
        <Button variant="ghost" asChild><Link to="/"><ArrowLeft />Back to services</Link></Button>
        <div className="mt-8 grid gap-12 lg:grid-cols-[minmax(0,1fr)_21rem]">
          <div>
            <div className="flex items-start gap-5"><span className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-secondary text-secondary-foreground"><Sparkles className="size-6" /></span><div><div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">{category?.name1 ?? 'Employee service'}</Badge><Badge variant="outline">Available</Badge></div><h1 className="mt-4 text-3xl font-semibold tracking-tight text-primary md:text-4xl">{item.itemName}</h1><p className="mt-3 max-w-3xl text-lg leading-8 text-muted-foreground">{item.shortDescription}</p></div></div>
            <div className="mt-12 space-y-10">
              <DetailSection icon={Info} title="About this service"><p>{service.description || item.shortDescription}</p></DetailSection>
              <DetailSection icon={Users} title="Who this is for"><div className="flex flex-wrap gap-2">{eligibilityLabels.map((label: string) => <Badge key={label} variant="outline">{label}</Badge>)}</div></DetailSection>
              <DetailSection icon={FileText} title="What you will need">{requiredFields.length ? <ul className="grid gap-2 sm:grid-cols-2">{requiredFields.map((field: FieldDefinition) => <li key={field.id} className="flex gap-2"><CheckCircle2 className="mt-0.5 size-4 shrink-0" /><span>{field.label}{presentationByField.get(field.id)?.helpText ? ` — ${presentationByField.get(field.id)?.helpText}` : ''}</span></li>)}</ul> : <p>No special preparation is listed. You can provide the request details on the next step.</p>}</DetailSection>
              <DetailSection icon={ShieldCheck} title="Approval"><p>{approvalSummary}</p></DetailSection>
              <DetailSection icon={LockKeyhole} title="Your privacy"><p>Your request is visible only to you, the person requested for, and authorized service teams and approvers.</p></DetailSection>
            </div>
          </div>
          <aside className="lg:sticky lg:top-28 lg:self-start">
            <div className="rounded-xl bg-card p-6 text-card-foreground shadow-sm"><h2 className="text-lg font-semibold">Service summary</h2><dl className="mt-6 space-y-5"><SummaryItem term="Expected completion" value={formatDuration(item.serviceTargetHours)} /><SummaryItem term="Business area" value={category?.name1 ?? service.serviceName} /><SummaryItem term="Provided by" value={activeWorkspace.workspaceName} /><SummaryItem term="Request details" value={`${requiredFields.length} required ${requiredFields.length === 1 ? 'field' : 'fields'}`} /></dl>{canProceed ? <Button className="mt-8 w-full bg-accent text-accent-foreground hover:bg-accent" size="lg" asChild><Link to={`/w/${workspaceCode}/portal/request/${item.itemCode}`}>Proceed to request <ArrowRight /></Link></Button> : <div className="mt-8 rounded-lg bg-muted p-4 text-muted-foreground"><p className="font-semibold text-foreground">Request form unavailable</p><p className="mt-1 text-sm">This service cannot accept new requests right now.</p></div>}<p className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground"><Clock3 className="size-3.5" />You can return without submitting.</p></div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function DetailSection({ icon: Icon, title, children }: { icon: typeof Info; title: string; children: React.ReactNode }) {
  return <section className="grid gap-4 border-t border-border pt-8 sm:grid-cols-[2.5rem_1fr]"><span className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground"><Icon className="size-5" /></span><div><h2 className="text-xl font-semibold">{title}</h2><div className="mt-3 leading-7 text-muted-foreground">{children}</div></div></section>;
}

function SummaryItem({ term, value }: { term: string; value: string }) {
  return <div><dt className="text-xs font-semibold text-muted-foreground">{term}</dt><dd className="mt-1 font-semibold">{value}</dd></div>;
}
