import { useMemo, useState, type ChangeEvent } from 'react';
import { Navigate, useParams } from 'react-router-dom';
import { CheckCircle2, ShieldCheck, UserRoundCheck, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { HAS_IN_MEMORY_TABLES } from '@/generated/hooks';
import { usePersonList } from '@/generated/hooks/use-person';
import { useServiceList, useUpdateService } from '@/generated/hooks/use-service';
import { useFormVersionList, useUpdateFormVersion } from '@/generated/hooks/use-form-version';
import { useFormDefinitionList, useUpdateFormDefinition } from '@/generated/hooks/use-form-definition';
import { useCreateConfigurationAuditEvent } from '@/generated/hooks/use-configuration-audit-event';
import { useCreateServiceGovernanceProfile, useServiceGovernanceProfileList, useUpdateServiceGovernanceProfile } from '@/generated/hooks/use-service-governance-profile';
import { usePublicationApprovalList, useUpdatePublicationApproval } from '@/generated/hooks/use-publication-approval';
import type { Person } from '@/generated/models/person-model';
import type { PublicationApproval } from '@/generated/models/publication-approval-model';
import type { Service } from '@/generated/models/service-model';
import type { ServiceGovernanceProfile } from '@/generated/models/service-governance-profile-model';
import { InMemoryDataBanner } from '@/generated/components/in-memory-data-banner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

const personRef = (person: Person) => ({ id: person.id, displayName: person.displayName });

export default function ServiceGovernancePage() {
  const { workspaceCode = '' } = useParams();
  const { activeWorkspace, currentPerson, can } = useWorkspaceContext();
  const { data: services = [] } = useServiceList();
  const { data: people = [] } = usePersonList();
  const { data: profiles = [] } = useServiceGovernanceProfileList();
  const { data: approvals = [] } = usePublicationApprovalList();
  const { data: versions = [] } = useFormVersionList();
  const { data: forms = [] } = useFormDefinitionList();
  const createProfile = useCreateServiceGovernanceProfile();
  const updateProfile = useUpdateServiceGovernanceProfile();
  const updateApproval = useUpdatePublicationApproval();
  const updateVersion = useUpdateFormVersion();
  const updateForm = useUpdateFormDefinition();
  const updateService = useUpdateService();
  const createAudit = useCreateConfigurationAuditEvent();
  const [serviceId, setServiceId] = useState('');
  const [ownerId, setOwnerId] = useState('');
  const [backupId, setBackupId] = useState('');
  const [designerId, setDesignerId] = useState('');
  const [workflowDesignerId, setWorkflowDesignerId] = useState('');
  const [reportAuthorId, setReportAuthorId] = useState('');
  const [publisherId, setPublisherId] = useState('');
  const [auditorId, setAuditorId] = useState('');
  const [reviewDays, setReviewDays] = useState('180');
  const [makerChecker, setMakerChecker] = useState(true);
  const [reviewComment, setReviewComment] = useState('');
  const workspaceServices = useMemo(() => services.filter((service: Service) => service.workspace.id === activeWorkspace?.id && !service.isDeleted), [activeWorkspace?.id, services]);
  const activePeople = people.filter((person: Person) => person.active);
  const workspaceProfiles = profiles.filter((profile: ServiceGovernanceProfile) => profile.workspace.id === activeWorkspace?.id);
  const pendingApprovals = approvals.filter((approval: PublicationApproval) => approval.workspace.id === activeWorkspace?.id && approval.statusKey === 'Pending' && !approval.isDeleted);
  const selectedProfile = workspaceProfiles.find((profile: ServiceGovernanceProfile) => profile.service.id === serviceId);

  if (!activeWorkspace) return <Navigate to="/no-workspace-access" replace />;
  if (!can('workspace.administer')) return <Navigate to={`/w/${workspaceCode}`} replace />;
  const workspace = activeWorkspace;

  const loadProfile = (nextServiceId: string) => {
    setServiceId(nextServiceId);
    const profile = workspaceProfiles.find((item: ServiceGovernanceProfile) => item.service.id === nextServiceId);
    if (!profile) return;
    setOwnerId(profile.serviceOwner.id); setBackupId(profile.backupOwner.id); setDesignerId(profile.serviceDesigner.id); setWorkflowDesignerId(profile.workflowDesigner.id); setReportAuthorId(profile.reportAuthor.id); setPublisherId(profile.publisher.id); setAuditorId(profile.auditor.id); setReviewDays(String(profile.reviewFrequencyDays)); setMakerChecker(profile.makerCheckerRequired);
  };

  const saveProfile = async () => {
    const service = workspaceServices.find((item: Service) => item.id === serviceId);
    const owner = activePeople.find((person: Person) => person.id === ownerId);
    const backup = activePeople.find((person: Person) => person.id === backupId);
    const designer = activePeople.find((person: Person) => person.id === designerId);
    const workflowDesigner = activePeople.find((person: Person) => person.id === workflowDesignerId);
    const reportAuthor = activePeople.find((person: Person) => person.id === reportAuthorId);
    const publisher = activePeople.find((person: Person) => person.id === publisherId);
    const auditor = activePeople.find((person: Person) => person.id === auditorId);
    if (!service || !owner || !backup || !designer || !workflowDesigner || !reportAuthor || !publisher || !auditor) return toast.error('Assign every governance role before saving.');
    const frequency = Math.max(30, Number(reviewDays) || 180);
    const nextReview = new Date(); nextReview.setDate(nextReview.getDate() + frequency);
    const data = { profileName: `${service.serviceName} governance`, service: { id: service.id, serviceName: service.serviceName }, workspace: { id: workspace.id, workspaceName: workspace.workspaceName }, serviceOwner: personRef(owner), backupOwner: personRef(backup), serviceDesigner: personRef(designer), workflowDesigner: personRef(workflowDesigner), reportAuthor: personRef(reportAuthor), publisher: personRef(publisher), auditor: personRef(auditor), makerCheckerRequired: makerChecker, reviewFrequencyDays: frequency, nextReviewDate: nextReview.toISOString(), statusKey: 'Active' as const };
    if (selectedProfile) await updateProfile.mutateAsync({ id: selectedProfile.id, changedFields: data }); else await createProfile.mutateAsync(data);
    toast.success('Service governance saved.');
  };

  const decide = async (approval: PublicationApproval, approved: boolean) => {
    if (!currentPerson) return;
    if (approval.requestedBy.id === currentPerson.id) return toast.error('Maker/checker requires a different reviewer.');
    const profile = workspaceProfiles.find((item: ServiceGovernanceProfile) => item.service.id === approval.service.id);
    if (profile && currentPerson.id !== profile.publisher.id && !can('global.administer')) return toast.error('Only the assigned publisher can decide this publication.');
    const now = new Date().toISOString();
    await updateApproval.mutateAsync({ id: approval.id, changedFields: { statusKey: approved ? 'Approved' : 'Rejected', reviewedBy: { id: currentPerson.id, displayName: currentPerson.displayName }, reviewedAt: now, reviewComment: reviewComment || (approved ? 'Publication approved.' : 'Publication rejected.'), makerCheckerSatisfied: approved } });
    if (approved) {
      const version = versions.find((item: { id: string }) => item.id === approval.formVersion.id);
      const service = workspaceServices.find((item: Service) => item.id === approval.service.id);
      const form = forms.find((item: { id: string }) => item.id === version?.formDefinition.id);
      if (version && service && form) {
        await updateVersion.mutateAsync({ id: version.id, changedFields: { statusKey: 'Published', publishedAt: now, publishedBy: { id: currentPerson.id, displayName: currentPerson.displayName }, updatedAt: now } });
        await updateService.mutateAsync({ id: service.id, changedFields: { lifecycleStateKey: 'Published', statusKey: 'Active', currentPublishedFormVersion: { id: version.id, snapshotLabel: version.snapshotLabel }, updatedAt: now } });
        await updateForm.mutateAsync({ id: form.id, changedFields: { statusKey: 'Published', currentVersionNumber: version.versionNumber } });
        await createAudit.mutateAsync({ configurationAuditEventName: `Approved publication ${version.snapshotLabel}`, actionKey: 'Updated', actor: { id: currentPerson.id, displayName: currentPerson.displayName }, newValue: JSON.stringify({ approvalId: approval.id, changeReason: approval.changeReason, makerCheckerSatisfied: true }), occurredAt: now, scopeKey: 'Service', settingKey: 'publicationApproval', sourceKey: 'ServiceOverride', targetRecordID: service.id, workspace: { id: workspace.id, workspaceName: workspace.workspaceName } });
      }
    }
    setReviewComment('');
    toast.success(approved ? 'Publication approved and version published.' : 'Publication rejected.');
  };

  const personSelect = (label: string, value: string, setter: (value: string) => void) => <div className="space-y-2"><Label>{label}</Label><Select value={value || 'none'} onValueChange={(next: string) => setter(next === 'none' ? '' : next)}><SelectTrigger><SelectValue placeholder={`Select ${label.toLowerCase()}`} /></SelectTrigger><SelectContent><SelectItem value="none">Not assigned</SelectItem>{activePeople.filter((person: Person) => Boolean(person.id)).map((person: Person) => <SelectItem key={person.id} value={person.id}>{person.displayName}</SelectItem>)}</SelectContent></Select></div>;

  return <main className="flex-1 p-4 md:p-6"><div className="mx-auto max-w-7xl space-y-6">
    <InMemoryDataBanner show={HAS_IN_MEMORY_TABLES} message="This app uses draft tables for testing. Data entered won't be saved. Contact the app owner to enable storage." />
    <header><h1 className="text-2xl font-semibold">Service governance</h1><p className="text-sm text-muted-foreground">Assign accountable roles and enforce maker/checker publication.</p></header>
    <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5" />Governance profile</CardTitle><CardDescription>Named responsibilities apply to one service and remain independent from operational request roles.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="space-y-2"><Label>Service</Label><Select value={serviceId || 'none'} onValueChange={loadProfile}><SelectTrigger><SelectValue placeholder="Select a service" /></SelectTrigger><SelectContent><SelectItem value="none">Select service</SelectItem>{workspaceServices.filter((service: Service) => Boolean(service.id)).map((service: Service) => <SelectItem key={service.id} value={service.id}>{service.serviceName}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-4 md:grid-cols-2">{personSelect('Service owner', ownerId, setOwnerId)}{personSelect('Backup owner', backupId, setBackupId)}{personSelect('Service designer', designerId, setDesignerId)}{personSelect('Workflow designer', workflowDesignerId, setWorkflowDesignerId)}{personSelect('Report author', reportAuthorId, setReportAuthorId)}{personSelect('Publisher', publisherId, setPublisherId)}{personSelect('Auditor', auditorId, setAuditorId)}<div className="space-y-2"><Label>Review frequency (days)</Label><Input type="number" min={30} value={reviewDays} onChange={(event: ChangeEvent<HTMLInputElement>) => setReviewDays(event.target.value)} /></div></div><div className="flex items-center justify-between rounded-md border p-3"><div><Label>Maker/checker publishing</Label><p className="text-xs text-muted-foreground">The author cannot approve their own publication.</p></div><Switch checked={makerChecker} onCheckedChange={setMakerChecker} /></div><Button onClick={() => void saveProfile()} disabled={!serviceId || createProfile.isPending || updateProfile.isPending}><UserRoundCheck className="size-4" />Save governance</Button></CardContent></Card>
      <Card><CardHeader><CardTitle>Publication approvals</CardTitle><CardDescription>Review change reasons and publish approved immutable versions.</CardDescription></CardHeader><CardContent className="space-y-4"><Textarea value={reviewComment} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setReviewComment(event.target.value)} placeholder="Review comment" />{pendingApprovals.length ? pendingApprovals.map((approval: PublicationApproval) => <div key={approval.id} className="space-y-3 rounded-md border p-4"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{approval.approvalName}</p><p className="text-sm text-muted-foreground">{approval.changeReason}</p></div><Badge variant="secondary">Pending</Badge></div><p className="text-xs text-muted-foreground">Requested by {approval.requestedBy.displayName} · review by {new Date(approval.reviewDate).toLocaleDateString()}</p><div className="flex gap-2"><Button size="sm" onClick={() => void decide(approval, true)}><CheckCircle2 className="size-4" />Approve</Button><Button size="sm" variant="destructive" onClick={() => void decide(approval, false)}><XCircle className="size-4" />Reject</Button></div></div>) : <p className="text-sm text-muted-foreground">No publication approvals are waiting.</p>}</CardContent></Card>
    </div>
  </div></main>;
}
