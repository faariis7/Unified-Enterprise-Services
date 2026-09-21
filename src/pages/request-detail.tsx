import { useMemo, useState, type ChangeEvent, type KeyboardEvent } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Clock, History, Link2, Paperclip, Pencil, Plus, Search, Send, ShieldCheck, Tag, X } from 'lucide-react';
import { toast } from 'sonner';
import { useUser } from '@/hooks/use-user';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { useRequestList, useUpdateRequest } from '@/generated/hooks/use-request';
import { useCreateRequestActivity, useRequestActivityList } from '@/generated/hooks/use-request-activity';
import { useCreateRequestHistory, useRequestHistoryList } from '@/generated/hooks/use-request-history';
import { useRequestAttachmentList } from '@/generated/hooks/use-request-attachment';
import { useRequestTaskList } from '@/generated/hooks/use-request-task';
import { useRequestChecklistList } from '@/generated/hooks/use-request-checklist';
import { useRequestApprovalList, useUpdateRequestApproval } from '@/generated/hooks/use-request-approval';
import { useCreateApprovalDecision } from '@/generated/hooks/use-approval-decision';
import { useRequestWorklogList } from '@/generated/hooks/use-request-worklog';
import { useRequestReminderList } from '@/generated/hooks/use-request-reminder';
import { useRequestResolutionList, useCreateRequestResolution } from '@/generated/hooks/use-request-resolution';
import { useRequestFieldValueList, useUpdateRequestFieldValue } from '@/generated/hooks/use-request-field-value';
import { useFieldDefinitionList } from '@/generated/hooks/use-field-definition';
import { useFieldOptionList } from '@/generated/hooks/use-field-option';
import type { FieldDefinition } from '@/generated/models/field-definition-model';
import type { FieldOption } from '@/generated/models/field-option-model';
import type { RequestFieldValue } from '@/generated/models/request-field-value-model';
import { useRequestServiceTargetList } from '@/generated/hooks/use-request-service-target';
import { useCreateRequestTag, useDeleteRequestTag, useRequestTagList } from '@/generated/hooks/use-request-tag';
import { useCreateRequestRelationship, useDeleteRequestRelationship, useRequestRelationshipList } from '@/generated/hooks/use-request-relationship';
import type { RequestTag } from '@/generated/models/request-tag-model';
import type { RequestRelationship } from '@/generated/models/request-relationship-model';
import type { Request } from '@/generated/models/request-model';
import type { RequestServiceTarget } from '@/generated/models/request-service-target-model';
import { ServiceTargetIndicator } from '@/components/service-target-indicator';
import type { RequestActivity } from '@/generated/models/request-activity-model';
import type { RequestHistory } from '@/generated/models/request-history-model';
import type { RequestPriorityKey } from '@/generated/models/request-model';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';


type RequestDetailsDraft = {
  title: string;
  description: string;
  requestTypeId: string;
  serviceCode: string;
  catalogItemCode: string;
  formDefinitionId: string;
  priorityKey: RequestPriorityKey;
  impactId: string;
  urgencyId: string;
  siteCode: string;
  departmentCode: string;
  assignmentGroupCode: string;
};

const priorities: RequestPriorityKey[] = ['Low', 'Medium', 'High', 'Critical'];
const tabs = ['activity', 'work', 'resolution', 'history'] as const;

export default function RequestDetailPage() {
  const { requestId = '', workspaceCode = '' } = useParams();
  const { activeWorkspace, can, requestReadFilter, grantedPermissions } = useWorkspaceContext();
  const { data: user } = useUser();
  const queryClient = useQueryClient();
  const requestFilter = activeWorkspace ? `id eq '${requestId}' and (${requestReadFilter})` : 'id eq null';
  const { data: requests = [], isLoading, isError } = useRequestList({ filter: requestFilter });
  const request = requests[0];
  const authorizedRelatedFilter = request && activeWorkspace ? `requestId/id eq '${request.id}' and workspaceId/id eq '${activeWorkspace.id}'` : 'id eq null';
  const authorizedAlternateRelatedFilter = request && activeWorkspace ? `request/id eq '${request.id}' and workspace/id eq '${activeWorkspace.id}'` : 'id eq null';
  const { data: activities = [] } = useRequestActivityList({ filter: authorizedAlternateRelatedFilter, orderBy: ['occurredAt desc'] });
  const { data: attachments = [] } = useRequestAttachmentList({ filter: authorizedRelatedFilter });
  const { data: tasks = [] } = useRequestTaskList({ filter: authorizedRelatedFilter });
  const { data: checklists = [] } = useRequestChecklistList({ filter: authorizedRelatedFilter });
  const [editingDynamicFieldId, setEditingDynamicFieldId] = useState<string | null>(null);
  const [dynamicFieldDraft, setDynamicFieldDraft] = useState('');
  const { data: approvals = [] } = useRequestApprovalList({ filter: authorizedRelatedFilter });
  const { data: fieldDefinitions = [] } = useFieldDefinitionList({ filter: activeWorkspace ? `workspace/id eq '${activeWorkspace.id}'` : 'id eq null' });
  const { data: fieldOptions = [] } = useFieldOptionList({ filter: activeWorkspace ? `workspace/id eq '${activeWorkspace.id}' and statusKey eq 'Active'` : 'id eq null', orderBy: ['sortOrder asc'] });
  const { data: worklogs = [] } = useRequestWorklogList({ filter: authorizedRelatedFilter });
  const { data: reminders = [] } = useRequestReminderList({ filter: authorizedRelatedFilter });
  const [editingDetailKey, setEditingDetailKey] = useState<keyof RequestDetailsDraft | null>(null);
  const { data: requestTags = [] } = useRequestTagList({ filter: authorizedAlternateRelatedFilter, orderBy: ['createdAt asc'] });
  const relationshipFilter = request && activeWorkspace ? `requestId/id eq '${request.id}' and workspaceId/id eq '${activeWorkspace.id}'` : 'id eq null';
  const { data: relationships = [] } = useRequestRelationshipList({ filter: relationshipFilter, orderBy: ['createdAt desc'] });
  const previousRequestFilter = request && activeWorkspace ? `workspace/id eq '${activeWorkspace.id}' and requester/id eq '${request.requester.id}'` : 'id eq null';
  const { data: requesterRequests = [] } = useRequestList({ filter: previousRequestFilter, orderBy: ['createdAt desc'] });
  const createTag = useCreateRequestTag();
  const deleteTag = useDeleteRequestTag();
  const createRelationship = useCreateRequestRelationship();
  const deleteRelationship = useDeleteRequestRelationship();
  const [tagDraft, setTagDraft] = useState('');
  const [linkRequestId, setLinkRequestId] = useState('none');
  const [detailFieldDraft, setDetailFieldDraft] = useState('');
  const updateFieldValue = useUpdateRequestFieldValue();
  const { data: resolutions = [] } = useRequestResolutionList({ filter: authorizedAlternateRelatedFilter });
  const { data: fields = [] } = useRequestFieldValueList({ filter: authorizedRelatedFilter });
  const { data: targets = [] } = useRequestServiceTargetList({ filter: authorizedRelatedFilter });
  const historyFilter = request && activeWorkspace ? `requestID/id eq '${request.id}' and workspaceID/id eq '${activeWorkspace.id}'` : 'id eq null';
  const { data: history = [] } = useRequestHistoryList({ filter: historyFilter, orderBy: ['changedAt desc'] });
  const createActivity = useCreateRequestActivity();
  const createHistory = useCreateRequestHistory();
  const createResolution = useCreateRequestResolution();
  const updateRequest = useUpdateRequest();
  const updateApproval = useUpdateRequestApproval();
  const createDecision = useCreateApprovalDecision();
  const openDetailFieldEditor = (key: keyof RequestDetailsDraft, value: string) => {
    setEditingDetailKey(key);
    setDetailFieldDraft(value);
  };
  const closeDetailFieldEditor = () => {
    setEditingDetailKey(null);
    setDetailFieldDraft('');
  };
  const saveDetailField = async () => {
    if (!editable || !editingDetailKey) return;
    const optionalFields: Array<keyof RequestDetailsDraft> = ['description', 'catalogItemCode'];
    const nextValue = detailFieldDraft.trim();
    if (!optionalFields.includes(editingDetailKey) && !nextValue) {
      toast.error('This field is required.');
      return;
    }
    const oldValue = String(request[editingDetailKey]);
    if (oldValue === nextValue) {
      closeDetailFieldEditor();
      return;
    }
    try {
      const changedFields = { [editingDetailKey]: nextValue, updatedAt: new Date().toISOString(), updatedBy: actor, versionNumber: request.versionNumber + 1 };
      await updateRequest.mutateAsync({ id: request.id, changedFields });
      await audit('Details Updated', editingDetailKey, oldValue, nextValue, `${editingDetailKey} updated by ${actor.displayName}`);
      closeDetailFieldEditor();
      toast.success('Field updated.');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Field could not be updated.');
    }
  };
  const definitionById = new Map(fieldDefinitions.map((definition: FieldDefinition) => [definition.id, definition]));
  const optionsByFieldId = fieldOptions.reduce((groups: Map<string, FieldOption[]>, option: FieldOption) => {
    const existing = groups.get(option.fieldDefinition.id) ?? [];
    groups.set(option.fieldDefinition.id, [...existing, option]);
    return groups;
  }, new Map<string, FieldOption[]>());
  const openDynamicFieldEditor = (field: RequestFieldValue) => {
    setEditingDynamicFieldId(field.id);
    setDynamicFieldDraft(field.value);
  };
  const closeDynamicFieldEditor = () => {
    setEditingDynamicFieldId(null);
    setDynamicFieldDraft('');
  };
  const saveDynamicField = async (field: RequestFieldValue) => {
    if (!editable) return;
    const definition = definitionById.get(field.fieldDefinitionId);
    if (definition?.required && !dynamicFieldDraft.trim()) {
      toast.error('This field is required.');
      return;
    }
    if (field.value === dynamicFieldDraft) {
      closeDynamicFieldEditor();
      return;
    }
    try {
      const updatedAt = new Date().toISOString();
      await updateFieldValue.mutateAsync({ id: field.id, changedFields: { value: dynamicFieldDraft, updatedAt, updatedBy: actor } });
      await audit('Dynamic Field Updated', field.fieldLabel, field.value, dynamicFieldDraft, `${field.fieldLabel} updated by ${actor.displayName}`);
      closeDynamicFieldEditor();
      toast.success('Field updated.');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Field could not be updated.');
    }
  };
  const [activitySearch, setActivitySearch] = useState('');
  const [activityType, setActivityType] = useState('all');
  const [message, setMessage] = useState('');
  const [visibility, setVisibility] = useState('public');
  const [outcome, setOutcome] = useState('Fulfilled');
  const [summary, setSummary] = useState('');
  const [rootCause, setRootCause] = useState('');

  const canViewInternalActivity = grantedPermissions.has('request.read');
  const filteredActivities = useMemo(() => activities.filter((activity: RequestActivity) => canViewInternalActivity || activity.activityTypeKey !== 'InternalNote').filter((activity: RequestActivity) => (activityType === 'all' || activity.activityTypeKey === activityType) && `${activity.body} ${activity.actor.displayName}`.toLowerCase().includes(activitySearch.toLowerCase())), [activities, activitySearch, activityType, canViewInternalActivity]);
  if (isLoading) return <main className="flex-1 p-6" aria-live="polite">Loading request…</main>;
  if (!activeWorkspace) return <Navigate to="/no-workspace-access" replace />;
  if (isError) return <main className="flex-1 p-6" role="alert">The authorized request could not be loaded. Refresh to try again.</main>;
  if (!request) return <Navigate to={`/w/${workspaceCode}/requests`} replace />;
  const actor = { id: user?.objectId ?? request.updatedBy.id, displayName: user?.fullName ?? request.updatedBy.displayName };
  const recordScope = { workspaceId: request.workspace.id, requesterId: request.requester.id, requestedForId: request.requestedFor.id, assigneeId: request.assignee.id, departmentCode: request.departmentCode, siteCode: request.siteCode, assignmentGroupCode: request.assignmentGroupCode, serviceCode: request.serviceCode, catalogItemCode: request.catalogItemCode, lifecycleState: request.statusKey, environmentKey: 'production' };
  const editable = can('request.update', recordScope) || can('request.update.own', recordScope);
  const canResolve = can('request.resolve', recordScope);

  const audit = async (changeType: string, fieldName: string, oldValue: string | undefined, newValue: string | undefined, reason: string) => createHistory.mutateAsync({ actorPersonID: actor, changedAt: new Date().toISOString(), changeType, fieldName, newValue, oldValue, reason, requestID: { id: request.id, requestNumber: request.requestNumber }, source: 'Unified Request Engine', workspaceID: { id: activeWorkspace.id, workspaceName: activeWorkspace.workspaceName } });
  const postActivity = async () => {
    if (!message.trim() || !editable) return;
    const activityTypeKey = visibility === 'internal' ? 'InternalNote' as const : 'CustomerCommunication' as const;
    await createActivity.mutateAsync({ requestActivityName: `${request.requestNumber} ${visibility} reply`, activityTypeKey, actor, body: message.trim(), occurredAt: new Date().toISOString(), request: { id: request.id, requestNumber: request.requestNumber }, workspace: { id: activeWorkspace.id, workspaceName: activeWorkspace.workspaceName } });
    await audit('Activity Added', 'activity', undefined, visibility === 'internal' ? 'Internal note' : 'Public reply', `${visibility === 'internal' ? 'Internal note' : 'Public reply'} added by ${actor.displayName}`);
    setMessage(''); toast.success('Activity saved');
  };
  const resolve = async () => {
    if (!canResolve || !summary.trim()) return;
    if (tasks.some((task) => task.statusIdKey !== 'Completed' && task.statusIdKey !== 'Cancelled')) { toast.error('Complete required work before resolving'); return; }
    if (approvals.some((approval) => approval.statusKey === 'Pending')) { toast.error('Pending approvals must be completed'); return; }
    const now = new Date().toISOString();
    await createResolution.mutateAsync({ requestResolutionName: `${request.requestNumber} resolution`, request: { id: request.id, requestNumber: request.requestNumber }, resolutionCodeKey: outcome as 'Fulfilled' | 'Fixed' | 'Workaround' | 'InformationProvided' | 'Duplicate' | 'Cancelled', resolvedAt: now, resolvedBy: actor, summary: `${summary.trim()}${rootCause.trim() ? ` | Internal root cause: ${rootCause.trim()}` : ''}`, workspace: { id: activeWorkspace.id, workspaceName: activeWorkspace.workspaceName } });
    await updateRequest.mutateAsync({ id: request.id, changedFields: { statusKey: outcome === 'Cancelled' ? 'Cancelled' : 'Resolved', resolvedAt: now, updatedAt: now, updatedBy: actor, versionNumber: request.versionNumber + 1 } });
    await audit('Status Changed', 'status', request.statusKey, outcome === 'Cancelled' ? 'Cancelled' : 'Resolved', `Resolution outcome: ${outcome}`);
    await queryClient.invalidateQueries(); toast.success('Resolution saved');
  };
  const decideApproval = async (approvalId: string, decision: 'Approved' | 'Rejected') => {
    const approval = approvals.find((item) => item.id === approvalId);
    if (!approval || approval.statusKey !== 'Pending') return;
    const now = new Date().toISOString();
    await createDecision.mutateAsync({ actingFor: approval.delegatedFromPerson, comments: `Decision from ${request.requestNumber}`, decidedAt: now, decidedBy: actor, decisionKey: decision, decisionName: `${approval.approvalName} ${decision.toLowerCase()}`, requestApproval: { id: approval.id, approvalName: approval.approvalName }, source: 'Approval Engine', targetRecordID: request.id, targetTypeKey: 'Request', workspace: { id: activeWorkspace.id, workspaceName: activeWorkspace.workspaceName } });
    await updateApproval.mutateAsync({ id: approval.id, changedFields: { statusKey: decision, decidedAt: now, comments: `Decision from request detail by ${actor.displayName}` } });
    await audit(`Approval ${decision}`, 'approvalStatus', approval.statusKey, decision, `${approval.approvalName} ${decision.toLowerCase()} by ${actor.displayName}`);
    toast.success(`Approval ${decision.toLowerCase()}`);
  };
  const dueTarget = [...targets].filter((target: RequestServiceTarget) => target.targetTypeKey === 'Resolution' || target.targetTypeKey === 'Fulfillment').sort((first: RequestServiceTarget, second: RequestServiceTarget) => new Date(first.dueAt).getTime() - new Date(second.dueAt).getTime())[0] ?? [...targets].sort((first: RequestServiceTarget, second: RequestServiceTarget) => new Date(first.dueAt).getTime() - new Date(second.dueAt).getTime())[0];
  const previousRequests = requesterRequests.filter((item: Request) => item.id !== request.id && new Date(item.createdAt).getTime() < new Date(request.createdAt).getTime());
  const linkCandidates = requesterRequests.filter((item: Request) => item.id !== request.id && !relationships.some((relationship: RequestRelationship) => relationship.relatedRequestId.id === item.id));
  const addTag = async () => {
    const value = tagDraft.trim();
    if (!editable || !value || requestTags.some((item: RequestTag) => item.value.toLowerCase() === value.toLowerCase())) return;
    try {
      await createTag.mutateAsync({ tagName: `${request.requestNumber} ${value}`, value, createdAt: new Date().toISOString(), createdBy: actor, request: { id: request.id, requestNumber: request.requestNumber }, workspace: { id: activeWorkspace.id, workspaceName: activeWorkspace.workspaceName } });
      await audit('Tag Added', 'tags', undefined, value, `Tag added by ${actor.displayName}`); setTagDraft(''); toast.success('Tag added.');
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Tag could not be added.'); }
  };
  const removeTag = async (tag: RequestTag) => {
    if (!editable) return;
    try { await deleteTag.mutateAsync(tag.id); await audit('Tag Removed', 'tags', tag.value, undefined, `Tag removed by ${actor.displayName}`); toast.success('Tag removed.'); }
    catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Tag could not be removed.'); }
  };
  const linkRequest = async () => {
    const related = linkCandidates.find((item: Request) => item.id === linkRequestId);
    if (!editable || !related) return;
    try {
      await createRelationship.mutateAsync({ relationshipName: `${request.requestNumber} related to ${related.requestNumber}`, relationshipTypeKey: 'Related', createdAt: new Date().toISOString(), createdBy: actor, requestId: { id: request.id, requestNumber: request.requestNumber }, relatedRequestId: { id: related.id, requestNumber: related.requestNumber }, workspaceId: { id: activeWorkspace.id, workspaceName: activeWorkspace.workspaceName } });
      await audit('Request Linked', 'relationships', undefined, related.requestNumber, `Request linked by ${actor.displayName}`); setLinkRequestId('none'); toast.success('Request linked.');
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Request could not be linked.'); }
  };
  const unlinkRequest = async (relationship: RequestRelationship) => {
    if (!editable) return;
    try { await deleteRelationship.mutateAsync(relationship.id); await audit('Request Unlinked', 'relationships', relationship.relatedRequestId.requestNumber, undefined, `Request unlinked by ${actor.displayName}`); toast.success('Request unlinked.'); }
    catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Request could not be unlinked.'); }
  };

  return <main className="flex-1 p-4 md:p-6"><div className="mx-auto max-w-[1600px] space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><Button variant="ghost" size="sm" asChild><Link to={`/w/${workspaceCode}/requests`}><ArrowLeft className="size-4" />Back to queue</Link></Button><div className="mt-2 flex items-center gap-2"><h1 className="text-xl font-semibold">{request.requestNumber}</h1><Badge variant="secondary">{request.statusKey}</Badge><Badge variant="outline">{request.priorityKey}</Badge></div><p className="mt-1 text-sm font-medium text-foreground">{request.title}</p></div><div className="text-right text-sm"><p className="font-medium">{request.assignee.displayName}</p><p className="text-muted-foreground">{request.assignmentGroupCode}</p></div></div>
    <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_22rem]">
      <Tabs defaultValue="activity" className="min-w-0"><TabsList className="w-full justify-start overflow-x-auto">{tabs.map((tab: typeof tabs[number]) => <TabsTrigger key={tab} value={tab}>{tab[0].toUpperCase() + tab.slice(1)}</TabsTrigger>)}</TabsList>
        <TabsContent value="activity" className="space-y-4"><Card><CardHeader><CardTitle className="text-base">Add activity</CardTitle><CardDescription>Public replies are requester-visible. Internal notes remain agent-only.</CardDescription></CardHeader><CardContent className="space-y-3"><Select value={visibility} onValueChange={setVisibility}><SelectTrigger className="w-48"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="public">Public reply</SelectItem>{canViewInternalActivity && <SelectItem value="internal">Internal note</SelectItem>}</SelectContent></Select><Textarea value={message} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setMessage(event.target.value)} placeholder={visibility === 'internal' ? 'Add an internal note' : 'Reply to the requester'} /><Button onClick={() => void postActivity()} disabled={!editable || !message.trim() || createActivity.isPending}><Send className="size-4" />Post activity</Button></CardContent></Card><Card><CardHeader className="gap-3 md:flex-row md:items-center md:justify-between"><CardTitle className="text-base">Timeline</CardTitle><div className="flex gap-2"><div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" placeholder="Search activity" value={activitySearch} onChange={(event: ChangeEvent<HTMLInputElement>) => setActivitySearch(event.target.value)} /></div><Select value={activityType} onValueChange={setActivityType}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All activity</SelectItem><SelectItem value="CustomerCommunication">Public replies</SelectItem>{canViewInternalActivity && <SelectItem value="InternalNote">Internal notes</SelectItem>}<SelectItem value="StatusChange">Status events</SelectItem><SelectItem value="Assignment">Assignment events</SelectItem></SelectContent></Select></div></CardHeader><CardContent className="space-y-3">{filteredActivities.map((activity: RequestActivity) => <div key={activity.id} className="rounded-lg border bg-card p-3 text-card-foreground"><div className="flex items-center justify-between gap-2"><div className="flex items-center gap-2"><Badge variant={activity.activityTypeKey === 'InternalNote' ? 'outline' : 'secondary'}>{activity.activityTypeKey === 'InternalNote' ? 'Internal' : activity.activityTypeKey === 'CustomerCommunication' ? 'Public' : activity.activityTypeKey}</Badge><span className="font-medium">{activity.actor.displayName}</span></div><span className="text-xs text-muted-foreground">{new Date(activity.occurredAt).toLocaleString()}</span></div><p className="mt-2 text-sm">{activity.body}</p></div>)}{attachments.length > 0 && <div className="border-t pt-3"><p className="mb-2 flex items-center gap-2 font-medium"><Paperclip className="size-4" />Attachments</p>{attachments.map((item) => <p key={item.id} className="text-sm">{item.fileName} · {Math.ceil(item.fileSizeBytes / 1024)} KB</p>)}</div>}</CardContent></Card></TabsContent>
        <TabsContent value="work"><div className="grid gap-4 lg:grid-cols-2">{tasks.length > 0 && <InfoCard title="Tasks" rows={tasks.map((task) => [task.title, task.statusIdKey])} />}{checklists.length > 0 && <InfoCard title="Checklists" rows={checklists.map((item) => [item.checklistName, item.statusKey])} />}{approvals.length > 0 && <Card><CardHeader><div className="flex items-center justify-between gap-3"><div><CardTitle className="text-base">Approvals</CardTitle><CardDescription>Stage-aware decisions are recorded in immutable request history.</CardDescription></div><Button variant="outline" size="sm" asChild><Link to={`/w/${workspaceCode}/approvals`}>Open queue</Link></Button></div></CardHeader><CardContent className="space-y-3">{approvals.map((item) => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 border-b pb-3"><div><p className="font-medium">{item.approvalName}</p><p className="text-sm text-muted-foreground">Stage {item.stageNumber} · {item.approverTypeKey} · {item.approverPersonId.displayName}</p></div><div className="flex items-center gap-2"><Badge variant={item.statusKey === 'Rejected' ? 'destructive' : item.statusKey === 'Pending' ? 'default' : 'secondary'}>{item.statusKey}</Badge>{item.statusKey === 'Pending' && <><Button size="sm" onClick={() => void decideApproval(item.id, 'Approved')} disabled={updateApproval.isPending}>Approve</Button><Button size="sm" variant="destructive" onClick={() => void decideApproval(item.id, 'Rejected')} disabled={updateApproval.isPending}>Reject</Button></>}</div></div>)}</CardContent></Card>}{worklogs.length > 0 && <InfoCard title="Time & effort" rows={worklogs.map((item) => [item.worklogName, `${item.duration} minutes`])} />}{reminders.length > 0 && <InfoCard title="Reminders" rows={reminders.map((item) => [item.reminderName, new Date(item.remindAt).toLocaleString()])} />}{tasks.length + checklists.length + approvals.length + worklogs.length + reminders.length === 0 && <Card><CardContent className="p-6 text-sm text-muted-foreground">No applicable work sections for this request.</CardContent></Card>}</div></TabsContent>
        <TabsContent value="resolution"><Card><CardHeader><CardTitle className="text-base">Resolution</CardTitle><CardDescription>Required work and pending approvals are validated before completion.</CardDescription></CardHeader><CardContent className="space-y-4"><div><Label>Outcome</Label><Select value={outcome} onValueChange={setOutcome}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{['Fulfilled','Fixed','Workaround','InformationProvided','Duplicate','Cancelled'].map((value: string) => <SelectItem key={value} value={value}>{value === 'InformationProvided' ? 'Information provided' : value}</SelectItem>)}</SelectContent></Select></div><div><Label>Customer-facing summary</Label><Textarea value={summary} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setSummary(event.target.value)} /></div><div><Label>Internal root cause</Label><Textarea value={rootCause} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setRootCause(event.target.value)} /></div><div className="flex items-center gap-2 text-sm"><ShieldCheck className="size-4" />{tasks.filter((task) => task.statusIdKey !== 'Completed' && task.statusIdKey !== 'Cancelled').length} incomplete tasks · {approvals.filter((approval) => approval.statusKey === 'Pending').length} pending approvals</div><Button onClick={() => void resolve()} disabled={!canResolve || !summary.trim() || createResolution.isPending}>Save outcome</Button>{resolutions.map((resolution) => <div key={resolution.id} className="rounded-lg border p-3 text-sm"><strong>{resolution.resolutionCodeKey}</strong><p>{resolution.summary}</p></div>)}</CardContent></Card></TabsContent>
        <TabsContent value="history"><Card><CardHeader><CardTitle className="text-base">Immutable history</CardTitle><CardDescription>Actor, timestamp, source, reason, and changed values are retained by the unified request engine.</CardDescription></CardHeader><CardContent className="space-y-3">{history.map((event: RequestHistory) => <div key={event.id} className="flex gap-3 border-b pb-3"><Clock className="mt-0.5 size-4" /><div><p className="font-medium">{event.changeType}</p><p className="text-sm">{event.fieldName}: {event.oldValue || '—'} → {event.newValue || '—'}</p>{event.reason && <p className="text-sm">{event.reason}</p>}<p className="text-xs text-muted-foreground">{event.actorPersonID.displayName} · {new Date(event.changedAt).toLocaleString()} · {event.source}</p></div></div>)}{history.length === 0 && <p className="text-sm text-muted-foreground">No history events recorded.</p>}</CardContent></Card></TabsContent>
      </Tabs>
      <aside className="space-y-4 xl:sticky xl:top-4" aria-label="Request information">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Request details</CardTitle>
            <CardDescription>Classification, assignment, SLA, tags, and related request details.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <InlineDetailSection title="Classification" rows={[
              { key: 'requestTypeId', label: 'Type', value: request.requestTypeId },
              { key: 'serviceCode', label: 'Service', value: request.serviceCode },
              { key: 'catalogItemCode', label: 'Catalog item', value: request.catalogItemCode },
              { key: 'formDefinitionId', label: 'Form', value: request.formDefinitionId },
              { key: 'priorityKey', label: 'Priority', value: request.priorityKey, choices: priorities },
              { key: 'impactId', label: 'Impact', value: request.impactId },
              { key: 'urgencyId', label: 'Urgency', value: request.urgencyId },
            ]} history={history} editable={editable} editingKey={editingDetailKey} draft={detailFieldDraft} onDraftChange={setDetailFieldDraft} onEdit={openDetailFieldEditor} onCancel={closeDetailFieldEditor} onSave={() => void saveDetailField()} saving={updateRequest.isPending} />
            <InlineDetailSection title="Assignment & location" rows={[
              { key: 'siteCode', label: 'Site', value: request.siteCode },
              { key: 'departmentCode', label: 'Department', value: request.departmentCode },
              { key: 'assignmentGroupCode', label: 'Assignment group', value: request.assignmentGroupCode },
            ]} history={history} editable={editable} editingKey={editingDetailKey} draft={detailFieldDraft} onDraftChange={setDetailFieldDraft} onEdit={openDetailFieldEditor} onCancel={closeDetailFieldEditor} onSave={() => void saveDetailField()} saving={updateRequest.isPending} />
            <RequestContextSections dueTarget={dueTarget} tags={requestTags} editable={editable} tagDraft={tagDraft} onTagDraftChange={setTagDraft} onAddTag={() => void addTag()} onRemoveTag={(tag: RequestTag) => void removeTag(tag)} addingTag={createTag.isPending} relationships={relationships} workspaceCode={workspaceCode} onUnlink={(relationship: RequestRelationship) => void unlinkRequest(relationship)} linkRequestId={linkRequestId} onLinkRequestChange={setLinkRequestId} linkCandidates={linkCandidates} onLink={() => void linkRequest()} linking={createRelationship.isPending} previousRequests={previousRequests} requesterName={request.requester.displayName} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Requester information</CardTitle>
            <CardDescription>People associated with this request.</CardDescription>
          </CardHeader>
          <CardContent>
            <InfoRows title="Request contacts" rows={[["Requester", request.requester.displayName], ["Requested for", request.requestedFor.displayName], ["Assigned person", request.assignee.displayName]]} />
          </CardContent>
        </Card>
        {fields.length > 0 && <Card><CardHeader><CardTitle className="text-base">Dynamic fields</CardTitle><CardDescription>Hover or focus a field to edit it independently or review its changes.</CardDescription></CardHeader><CardContent className="space-y-2">{fields.map((field: RequestFieldValue) => { const definition = definitionById.get(field.fieldDefinitionId); const options = optionsByFieldId.get(field.fieldDefinitionId) ?? []; const isEditing = editingDynamicFieldId === field.id; const canEditField = editable && !definition?.readOnly1; const fieldHistory = history.filter((event: RequestHistory) => event.fieldName === field.fieldLabel); return <div key={field.id} className="group rounded-md border-b p-2 transition-colors hover:bg-muted focus-within:bg-muted">{isEditing ? <div className="space-y-3"><DynamicFieldEditor field={field} definition={definition} options={options} value={dynamicFieldDraft} onChange={setDynamicFieldDraft} /><div className="flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={closeDynamicFieldEditor}>Cancel</Button><Button size="sm" onClick={() => void saveDynamicField(field)} disabled={updateFieldValue.isPending}>{updateFieldValue.isPending ? 'Saving…' : 'Save'}</Button></div></div> : <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-3 text-sm"><span className="text-muted-foreground">{field.fieldLabel}</span><span className="font-medium">{formatDynamicValue(field.value, options)}</span><div className="flex items-center"><FieldHistoryButton label={field.fieldLabel} events={fieldHistory} />{canEditField ? <Button variant="ghost" size="icon-sm" className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100" onClick={() => openDynamicFieldEditor(field)} aria-label={`Edit ${field.fieldLabel}`}><Pencil className="size-4" /></Button> : null}</div></div>}</div>; })}</CardContent></Card>}
        {targets.length > 0 && <Card><CardHeader><CardTitle className="text-base">Service targets</CardTitle><CardDescription>Response, resolution, fulfillment, and approval commitments.</CardDescription></CardHeader><CardContent className="space-y-3">{targets.map((target: RequestServiceTarget) => <ServiceTargetIndicator key={target.id} target={target} />)}</CardContent></Card>}
      </aside>
    </div>
  </div></main>;
}

function RequestContextSections({ dueTarget, tags, editable, tagDraft, onTagDraftChange, onAddTag, onRemoveTag, addingTag, relationships, workspaceCode, onUnlink, linkRequestId, onLinkRequestChange, linkCandidates, onLink, linking, previousRequests, requesterName }: { dueTarget?: RequestServiceTarget; tags: RequestTag[]; editable: boolean; tagDraft: string; onTagDraftChange: (value: string) => void; onAddTag: () => void; onRemoveTag: (tag: RequestTag) => void; addingTag: boolean; relationships: RequestRelationship[]; workspaceCode: string; onUnlink: (relationship: RequestRelationship) => void; linkRequestId: string; onLinkRequestChange: (value: string) => void; linkCandidates: Request[]; onLink: () => void; linking: boolean; previousRequests: Request[]; requesterName: string }) {
  return <div className="space-y-5 border-t pt-5">
    <section aria-label="SLA due by"><h3 className="mb-2 text-sm font-semibold">SLA due by</h3>{dueTarget ? <div className="flex items-start justify-between gap-3 rounded-md border p-3"><div><p className="font-semibold">{new Date(dueTarget.dueAt).toLocaleString()}</p><p className="mt-1 text-sm text-muted-foreground">{dueTarget.targetTypeKey} · {dueTarget.snapshotPolicyName}</p></div><Badge variant={dueTarget.statusKey === 'Breached' ? 'destructive' : dueTarget.statusKey === 'Warning' ? 'default' : 'secondary'}>{dueTarget.statusKey}</Badge></div> : <p className="text-sm text-muted-foreground">No SLA target is active for this request.</p>}</section>
    <section aria-label="Tags" className="border-t pt-4"><h3 className="mb-2 flex items-center gap-2 text-sm font-semibold"><Tag className="size-4" />Tags</h3><div className="space-y-3"><div className="flex flex-wrap gap-2">{tags.map((tag: RequestTag) => <Badge key={tag.id} variant="secondary" className="gap-1">{tag.value}{editable && <button type="button" onClick={() => onRemoveTag(tag)} aria-label={`Remove ${tag.value} tag`}><X className="size-3" /></button>}</Badge>)}{tags.length === 0 && <span className="text-sm text-muted-foreground">No tags added.</span>}</div>{editable && <div className="flex gap-2"><Input value={tagDraft} onChange={(event: ChangeEvent<HTMLInputElement>) => onTagDraftChange(event.target.value)} placeholder="Add a tag" onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => { if (event.key === 'Enter') onAddTag(); }} /><Button size="icon" onClick={onAddTag} disabled={!tagDraft.trim() || addingTag} aria-label="Add tag"><Plus className="size-4" /></Button></div>}</div></section>
    <section aria-label="Related requests" className="border-t pt-4"><h3 className="mb-1 flex items-center gap-2 text-sm font-semibold"><Link2 className="size-4" />Related requests</h3><p className="mb-3 text-sm text-muted-foreground">Linked records and earlier requests from the same requester.</p><div className="space-y-2">{relationships.map((relationship: RequestRelationship) => <div key={relationship.id} className="flex items-center justify-between gap-2 rounded-md border p-2 text-sm"><Button variant="link" className="h-auto p-0" asChild><Link to={`/w/${workspaceCode}/requests/${relationship.relatedRequestId.id}`}>{relationship.relatedRequestId.requestNumber}</Link></Button>{editable && <Button variant="ghost" size="icon-sm" onClick={() => onUnlink(relationship)} aria-label={`Unlink ${relationship.relatedRequestId.requestNumber}`}><X className="size-4" /></Button>}</div>)}{relationships.length === 0 && <p className="text-sm text-muted-foreground">No linked requests.</p>}</div>{editable && <div className="mt-3 flex gap-2"><Select value={linkRequestId} onValueChange={onLinkRequestChange}><SelectTrigger><SelectValue placeholder="Choose a request" /></SelectTrigger><SelectContent><SelectItem value="none">Choose a request</SelectItem>{linkCandidates.filter((item: Request) => Boolean(item.id)).map((item: Request) => <SelectItem key={item.id} value={item.id}>{item.requestNumber} · {item.title}</SelectItem>)}</SelectContent></Select><Button size="icon" onClick={onLink} disabled={linkRequestId === 'none' || linking} aria-label="Link request"><Plus className="size-4" /></Button></div>}<div className="mt-4 flex items-center justify-between gap-2 border-t pt-4"><div><h4 className="text-sm font-semibold">Previous requests</h4><p className="text-sm text-muted-foreground">{previousRequests.length} earlier from {requesterName}</p></div><Popover><PopoverTrigger asChild><Button variant="outline" size="sm">View all</Button></PopoverTrigger><PopoverContent align="end" className="w-96"><div className="space-y-3"><p className="font-semibold">Previous requests</p><div className="max-h-72 space-y-2 overflow-y-auto">{previousRequests.map((item: Request) => <Button key={item.id} variant="ghost" className="h-auto w-full justify-start p-2 text-left" asChild><Link to={`/w/${workspaceCode}/requests/${item.id}`}><span><span className="block font-medium">{item.requestNumber} · {item.title}</span><span className="block text-xs text-muted-foreground">{item.statusKey} · {new Date(item.createdAt).toLocaleDateString()}</span></span></Link></Button>)}{previousRequests.length === 0 && <p className="text-sm text-muted-foreground">No earlier requests found.</p>}</div></div></PopoverContent></Popover></div></section>
  </div>;
}

function parseMultipleChoiceValue(value: string): string[] {
  if (!value.trim()) return [];
  if (value.trim().startsWith('[')) {
    try {
      const parsed: unknown = JSON.parse(value);
      if (Array.isArray(parsed)) return parsed.filter((item: unknown): item is string => typeof item === 'string');
    } catch {
      return value.split(',').map((item: string) => item.trim()).filter(Boolean);
    }

  }
  return value.split(',').map((item: string) => item.trim()).filter(Boolean);
}

function DynamicFieldEditor({ field, definition, options, value, onChange }: { field: RequestFieldValue; definition?: FieldDefinition; options: FieldOption[]; value: string; onChange: (value: string) => void }) {
  const fieldType = definition?.fieldTypeKey ?? 'Text';
  const isReadOnly = definition?.readOnly1 ?? false;
  const label = `${field.fieldLabel}${definition?.required ? ' *' : ''}`;
  const listOptions = options.filter((option: FieldOption) => Boolean(option.value));
  if (isReadOnly) return <div className="space-y-2"><Label>{label}</Label><div className="rounded-md bg-muted px-3 py-2 text-sm text-muted-foreground">{formatDynamicValue(value, listOptions)}</div></div>;
  if (fieldType === 'MultipleChoice' && listOptions.length > 0) {
    const selectedValues = parseMultipleChoiceValue(value);
    const updateSelection = (optionValue: string, checked: boolean) => {
      const nextValues = checked ? [...selectedValues, optionValue] : selectedValues.filter((selectedValue: string) => selectedValue !== optionValue);
      onChange(listOptions.filter((option: FieldOption) => nextValues.includes(option.value)).map((option: FieldOption) => option.value).join(','));
    };
    return <fieldset className="space-y-2"><legend className="text-sm font-medium">{label}</legend><div className="space-y-2 rounded-md border p-3">{listOptions.map((option: FieldOption) => { const checkboxId = `dynamic-${field.id}-${option.id}`; return <div key={option.id} className="flex items-center gap-2"><Checkbox id={checkboxId} checked={selectedValues.includes(option.value)} onCheckedChange={(checked: boolean | 'indeterminate') => updateSelection(option.value, checked === true)} /><Label htmlFor={checkboxId} className="font-normal">{option.label}</Label></div>; })}</div></fieldset>;
  }
  if (listOptions.length > 0 || fieldType === 'YesOrNo') {
    const choices: Array<Pick<FieldOption, 'id' | 'label' | 'value'>> = listOptions.length > 0 ? listOptions : [{ id: 'yes', label: 'Yes', value: 'true' }, { id: 'no', label: 'No', value: 'false' }];
    return <div className="space-y-2"><Label>{label}</Label><Select value={value || 'none'} onValueChange={(nextValue: string) => onChange(nextValue === 'none' ? '' : nextValue)}><SelectTrigger><SelectValue placeholder={`Select ${field.fieldLabel.toLowerCase()}`} /></SelectTrigger><SelectContent>{!definition?.required && <SelectItem value="none">None</SelectItem>}{choices.filter((option: Pick<FieldOption, 'id' | 'label' | 'value'>) => Boolean(option.value)).map((option: Pick<FieldOption, 'id' | 'label' | 'value'>) => <SelectItem key={option.id} value={option.value}>{option.label}</SelectItem>)}</SelectContent></Select></div>;
  }
  if (fieldType === 'MultiLineText') return <div className="space-y-2"><Label htmlFor={`dynamic-${field.id}`}>{label}</Label><Textarea id={`dynamic-${field.id}`} value={value} placeholder={definition?.placeholder} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)} /></div>;
  return <DetailInput id={`dynamic-${field.id}`} label={label} value={value} onChange={onChange} required={false} />;
}

function formatDynamicValue(value: string, options: FieldOption[]) {
  if (!value) return '—';
  const selectedValues = parseMultipleChoiceValue(value);
  const labels = selectedValues.map((selectedValue: string) => options.find((option: FieldOption) => option.value === selectedValue)?.label ?? (selectedValue === 'true' ? 'Yes' : selectedValue === 'false' ? 'No' : selectedValue));
  return labels.join(', ');
}

function InfoCard({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return <Card><CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader><CardContent className="space-y-3">{rows.map((row: [string, string]) => <div key={`${title}-${row[0]}`} className="grid grid-cols-2 gap-3 border-b pb-2 text-sm"><span className="text-muted-foreground">{row[0]}</span><span className="font-medium">{row[1] || '—'}</span></div>)}</CardContent></Card>;
}

type InlineDetailRow = { key: keyof RequestDetailsDraft; label: string; value: string; choices?: string[] };

function InlineDetailSection({ title, rows, history, editable, editingKey, draft, onDraftChange, onEdit, onCancel, onSave, saving }: { title: string; rows: InlineDetailRow[]; history: RequestHistory[]; editable: boolean; editingKey: keyof RequestDetailsDraft | null; draft: string; onDraftChange: (value: string) => void; onEdit: (key: keyof RequestDetailsDraft, value: string) => void; onCancel: () => void; onSave: () => void; saving: boolean }) {
  return <section aria-label={title}><h3 className="mb-2 text-sm font-semibold">{title}</h3><div className="space-y-1">{rows.map((row: InlineDetailRow) => { const isEditing = editingKey === row.key; const fieldHistory = history.filter((event: RequestHistory) => event.fieldName === row.key); return <div key={row.key} className="group rounded-md border-b p-2 transition-colors hover:bg-muted focus-within:bg-muted">{isEditing ? <div className="space-y-2"><Label htmlFor={`inline-${row.key}`}>{row.label}</Label>{row.choices ? <Select value={draft} onValueChange={onDraftChange}><SelectTrigger id={`inline-${row.key}`}><SelectValue /></SelectTrigger><SelectContent>{row.choices.filter((choice: string) => Boolean(choice)).map((choice: string) => <SelectItem key={choice} value={choice}>{choice}</SelectItem>)}</SelectContent></Select> : <Input id={`inline-${row.key}`} value={draft} onChange={(event: ChangeEvent<HTMLInputElement>) => onDraftChange(event.target.value)} />}<div className="flex justify-end gap-2"><Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button><Button size="sm" onClick={onSave} disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button></div></div> : <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] items-center gap-3 text-sm"><span className="text-muted-foreground">{row.label}</span><span className="font-medium">{row.value || '—'}</span><div className="flex items-center"><FieldHistoryButton label={row.label} events={fieldHistory} />{editable ? <Button variant="ghost" size="icon-sm" className="opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100" onClick={() => onEdit(row.key, row.value)} aria-label={`Edit ${row.label}`}><Pencil className="size-4" /></Button> : null}</div></div>}</div>; })}</div></section>;
}
function FieldHistoryButton({ label, events }: { label: string; events: RequestHistory[] }) {
  if (events.length === 0) return null;
  return <Popover><PopoverTrigger asChild><Button variant="ghost" size="icon-sm" aria-label={`View ${label} change history`}><History className="size-4" /></Button></PopoverTrigger><PopoverContent align="end" className="w-80"><div className="space-y-3"><div><p className="font-semibold">{label} history</p><p className="text-sm text-muted-foreground">{events.length} recorded {events.length === 1 ? 'change' : 'changes'}</p></div><div className="max-h-72 space-y-3 overflow-y-auto">{events.map((event: RequestHistory) => <div key={event.id} className="border-l-2 border-l-primary pl-3 text-sm"><p><span className="font-medium">{event.oldValue || '—'}</span> → <span className="font-medium">{event.newValue || '—'}</span></p><p className="text-muted-foreground">{event.actorPersonID.displayName} · {new Date(event.changedAt).toLocaleString()}</p>{event.reason && <p className="mt-1">{event.reason}</p>}</div>)}</div></div></PopoverContent></Popover>;
}


function InfoRows({ title, rows }: { title: string; rows: Array<[string, string]> }) {
  return <section aria-label={title}><h3 className="mb-2 text-sm font-semibold">{title}</h3><div className="space-y-3">{rows.map((row: [string, string]) => <div key={`${title}-${row[0]}`} className="grid grid-cols-2 gap-3 border-b pb-2 text-sm"><span className="text-muted-foreground">{row[0]}</span><span className="font-medium">{row[1] || '—'}</span></div>)}</div></section>;
}

function DetailInput({ id, label, value, onChange, required = true }: { id: string; label: string; value: string; onChange: (value: string) => void; required?: boolean }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}{required ? ' *' : ''}</Label><Input id={id} value={value} onChange={(event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value)} required={required} /></div>;
}
