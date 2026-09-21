import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { AlertTriangle, ArrowDown, ArrowLeft, ArrowUp, Building2, Check, CheckCircle2, ChevronDown, ChevronUp, CircleDot, Clipboard, Clock3, Download, Eye, FileText, Image, Link2, LockKeyhole, Mail, MapPin, MessageSquare, NotebookPen, Paperclip, PauseCircle, Phone, Printer, Reply, Send, ShieldCheck, Smartphone, Star, Trash2, UserRound, UsersRound, Workflow, X, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { useRequestList, useUpdateRequest } from '@/generated/hooks/use-request';
import { useCreateRequestActivity, useRequestActivityList } from '@/generated/hooks/use-request-activity';
import { useCreateRequestAttachment, useDeleteRequestAttachment, useRequestAttachmentList } from '@/generated/hooks/use-request-attachment';
import { useRequestResolutionList } from '@/generated/hooks/use-request-resolution';

import { useRequestServiceTargetList } from '@/generated/hooks/use-request-service-target';
import { useCreateRequestFeedback, useRequestFeedbackList } from '@/generated/hooks/use-request-feedback';
import { usePersonList } from '@/generated/hooks/use-person';
import { useRequestApprovalList } from '@/generated/hooks/use-request-approval';
import { useRequestTaskList } from '@/generated/hooks/use-request-task';
import { useRequestRelationshipList } from '@/generated/hooks/use-request-relationship';
import { RequestRelationshipsPanel } from '@/components/request-relationships-panel';
import { useEmailIntakeMessageList } from '@/generated/hooks/use-email-intake-message';
import { useFieldDefinitionList } from '@/generated/hooks/use-field-definition';
import { useFormSectionList } from '@/generated/hooks/use-form-section';
import type { FieldDefinition } from '@/generated/models/field-definition-model';
import type { FormSection } from '@/generated/models/form-section-model';
import type { RequestFieldValue } from '@/generated/models/request-field-value-model';
import { useRequestFieldValueList } from '@/generated/hooks/use-request-field-value';
import type { RequestActivity } from '@/generated/models/request-activity-model';
import type { RequestAttachment } from '@/generated/models/request-attachment-model';
import { canRequesterReopen, isRequestOwner, requesterVisibleActivities } from '@/lib/requester-access';
import { useRequestDetailViewRuntime } from '@/lib/request-detail-view-runtime';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { RequestReviewSummary } from '@/components/request-review-summary';
import { buildHistoricalRequestReview } from '@/lib/request-review-runtime';

type TimelineKind = 'message' | 'status' | 'resolution' | 'attachment';
type TimelineEvent =
  | { id: string; kind: Exclude<TimelineKind, 'attachment'>; occurredAt: string; activity: RequestActivity }
  | { id: string; kind: 'attachment'; occurredAt: string; attachment: RequestAttachment };
type ConversationReply = {
  id: string;
  occurredAt: string;
  activity: RequestActivity;
  attachments: RequestAttachment[];
};
type ConversationEvent = ConversationReply | { id: string; occurredAt: string; attachment: RequestAttachment };
type QuotedReply = { sender: string; occurredAt: string; body: string };

type TimelineFilter = 'all' | TimelineKind;

function AttachmentThumbnail({ attachment, source, size = 'sm' }: { attachment: RequestAttachment; source?: string; size?: 'sm' | 'lg' }) {
  const isImage = attachment.contentType.startsWith('image/');
  const dimensions = size === 'lg' ? 'h-72 w-full' : 'size-12';
  if (isImage && source) return <img src={source} alt={`Preview of ${attachment.fileName}`} className={`${dimensions} rounded-md border object-contain`} />;
  return <span className={`${dimensions} flex shrink-0 items-center justify-center rounded-md border bg-muted text-muted-foreground`}>{isImage ? <Image className={size === 'lg' ? 'size-10' : 'size-5'} /> : <FileText className={size === 'lg' ? 'size-10' : 'size-5'} />}</span>;
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024;
const ALLOWED_ATTACHMENT_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];

function validateAttachments(files: File[]) {
  const accepted: File[] = [];
  const errors: string[] = [];
  files.forEach((file: File) => {
    if (file.size > MAX_ATTACHMENT_SIZE) errors.push(`${file.name} exceeds the 10 MB limit.`);
    else if (!ALLOWED_ATTACHMENT_TYPES.includes(file.type)) errors.push(`${file.name} uses an unsupported file type.`);
    else accepted.push(file);
  });
  return { accepted, errors };
}

function formatEmployeeId(personId?: string) {
  if (!personId) return 'Not available';
  const numericHash = Array.from(personId).reduce((total: number, character: string) => total + character.charCodeAt(0), 0);
  return String(10000 + (numericHash % 90000));
}

function formatReplyDate(value: string) {
  const date = new Date(value);
  const now = new Date();
  const minutes = Math.floor((now.getTime() - date.getTime()) / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes} min ago`;
  const yesterday = new Date(now);
  yesterday.setDate(now.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - now.getDay());
  startOfWeek.setHours(0, 0, 0, 0);
  if (date >= startOfWeek) return date.toLocaleDateString(undefined, { weekday: 'long' });
  return date.toLocaleString();
}

function formatDueDate(value: string) {
  const dueDate = new Date(value);
  const differenceMinutes = Math.round((dueDate.getTime() - Date.now()) / 60000);
  const absoluteMinutes = Math.abs(differenceMinutes);
  const relative = absoluteMinutes < 60 ? `${absoluteMinutes} min` : absoluteMinutes < 24 * 60 ? `${Math.round(absoluteMinutes / 60)} hr` : `${Math.round(absoluteMinutes / (24 * 60))} day${Math.round(absoluteMinutes / (24 * 60)) === 1 ? '' : 's'}`;
  return differenceMinutes >= 0 ? `Due in ${relative}` : `Overdue by ${relative}`;
}

function formatSubmittedValue(field: RequestFieldValue): string {
  if (field.displayValue) return field.displayValue;
  if (field.valueTypeKey === 'Boolean') return field.booleanValue ? 'Yes' : 'No';
  if (field.numberValue !== undefined) return String(field.numberValue);
  return (field.dateValue ?? field.textValue ?? field.structuredValue ?? field.value) || 'Not provided';
}

type RequestExperienceMode = 'requester' | 'technician';

export default function RequesterRequestDetailPage({ mode = 'requester' }: { mode?: RequestExperienceMode }) {
  const { workspaceCode = '', requestId = '' } = useParams();
  const { activeWorkspace, currentPerson, requestReadFilter } = useWorkspaceContext();
  const isTechnicianView = mode === 'technician';
  const viewComposition = useRequestDetailViewRuntime(isTechnicianView ? 'Agent' : 'Requester');
  const enabledSections = new Set(viewComposition.sections);
  const canAddComment = viewComposition.actions.includes('AddComment');
  const canAddAttachment = viewComposition.actions.includes('AddAttachment');
  const canEditRequest = viewComposition.actions.includes('EditRequest');
  const canTransitionRequest = viewComposition.actions.includes('TransitionRequest');
  const composerRef = useRef<HTMLDivElement>(null);
  const ownerFilter = activeWorkspace && currentPerson
    ? isTechnicianView
      ? `id eq '${requestId}' and (${requestReadFilter})`
      : `id eq '${requestId}' and workspace/id eq '${activeWorkspace.id}' and (requester/id eq '${currentPerson.id}' or requestedFor/id eq '${currentPerson.id}')`
    : 'id eq null';
  const { data: requests = [], isLoading } = useRequestList({ filter: ownerFilter });
  const draftKey = `request-reply-draft-${workspaceCode}-${requestId}`;
  const request = requests[0];
  const previousRequestFilter = request && activeWorkspace ? `workspace/id eq '${activeWorkspace.id}' and requester/id eq '${request.requester.id}'` : 'id eq null';
  const { data: requesterRequests = [] } = useRequestList({ filter: previousRequestFilter, orderBy: ['createdAt desc'] });
  const approvalFilter = request && activeWorkspace ? `requestId/id eq '${request.id}' and workspaceId/id eq '${activeWorkspace.id}'` : 'id eq null';
  const taskFilter = approvalFilter;
  const relationshipFilter = request && activeWorkspace ? `requestId/id eq '${request.id}' and workspaceId/id eq '${activeWorkspace.id}'` : 'id eq null';
  const emailFilter = request && activeWorkspace ? `matchedRequest/id eq '${request.id}' and workspace/id eq '${activeWorkspace.id}'` : 'id eq null';
  const [quotedReply, setQuotedReply] = useState<QuotedReply | null>(null);
  const fieldValueFilter = request && activeWorkspace ? `requestId/id eq '${request.id}' and workspaceId/id eq '${activeWorkspace.id}'` : 'id eq null';
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [conversationOrder, setConversationOrder] = useState<'asc' | 'desc'>('asc');
  const [reactions, setReactions] = useState<Record<string, string[]>>({});
  const [showBackToTop, setShowBackToTop] = useState(false);

  const [exportOpen, setExportOpen] = useState(false);
  const [exportRequestInfo, setExportRequestInfo] = useState(false);
  const [exportRequesterInfo, setExportRequesterInfo] = useState(false);
  const related = request && activeWorkspace ? `request/id eq '${request.id}' and workspace/id eq '${activeWorkspace.id}'` : 'id eq null';
  const attachmentFilter = request && activeWorkspace ? `requestId/id eq '${request.id}' and workspaceId/id eq '${activeWorkspace.id}'` : 'id eq null';
  const requesterFilter = request ? `id eq '${request.requester.id}'` : 'id eq null';
  const feedbackFilter = request && activeWorkspace && currentPerson ? `requestId/id eq '${request.id}' and workspaceId/id eq '${activeWorkspace.id}' and personId/id eq '${currentPerson.id}'` : 'id eq null';
  const [imagePreviews, setImagePreviews] = useState<Record<string, string>>({});
  const [activeSection, setActiveSection] = useState<'home' | 'progress' | 'timeline'>('home');
  const [expandedConversation, setExpandedConversation] = useState<Record<string, boolean>>({});

  const [pendingFiles, setPendingFiles] = useState<File[]>([]);
  const [previewAttachment, setPreviewAttachment] = useState<RequestAttachment | null>(null);
  const [reply, setReply] = useState('');
  const [sentActivities, setSentActivities] = useState<RequestActivity[]>([]);
  const [noteBody, setNoteBody] = useState('');
  const [noteVisibility, setNoteVisibility] = useState<'internal' | 'public'>('internal');
  const [noteDialogOpen, setNoteDialogOpen] = useState(false);
  const [order, setOrder] = useState<'asc' | 'desc'>('asc');
  const [timelineFilter, setTimelineFilter] = useState<TimelineFilter>('all');
  useEffect(() => {
    const savedDraft = window.localStorage.getItem(draftKey);
    if (savedDraft) setReply(savedDraft);
  }, [draftKey]);
  useEffect(() => {
    const timer = window.setTimeout(() => {
      if (reply.trim()) window.localStorage.setItem(draftKey, reply);
      else window.localStorage.removeItem(draftKey);
    }, 400);
    return () => window.clearTimeout(timer);
  }, [draftKey, reply]);
  useEffect(() => {
    const updateBackToTopVisibility = () => setShowBackToTop(window.scrollY > 640);
    updateBackToTopVisibility();
    window.addEventListener('scroll', updateBackToTopVisibility, { passive: true });
    return () => window.removeEventListener('scroll', updateBackToTopVisibility);
  }, []);
  const [rating, setRating] = useState(0);
  const [feedbackComment, setFeedbackComment] = useState('');
  const { data: activities = [] } = useRequestActivityList({ filter: related, orderBy: ['occurredAt desc'] });
  const { data: attachments = [] } = useRequestAttachmentList({ filter: attachmentFilter });
  const { data: resolutions = [] } = useRequestResolutionList({ filter: related });

  const { data: requesterPeople = [] } = usePersonList({ filter: requesterFilter });
  const requesterPerson = requesterPeople[0];
  const { data: serviceTargets = [] } = useRequestServiceTargetList({ filter: attachmentFilter });
  const { data: feedback = [] } = useRequestFeedbackList({ filter: feedbackFilter });
  const createActivity = useCreateRequestActivity();
  const createAttachment = useCreateRequestAttachment();
  const createFeedback = useCreateRequestFeedback();
  const updateRequest = useUpdateRequest();
  const deleteAttachment = useDeleteRequestAttachment();
  const { data: approvals = [] } = useRequestApprovalList({ filter: approvalFilter, orderBy: ['stageNumber asc'] });
  const { data: requestTasks = [] } = useRequestTaskList({ filter: taskFilter });
  const { data: relationships = [] } = useRequestRelationshipList({ filter: relationshipFilter });
  const { data: emailMessages = [] } = useEmailIntakeMessageList({ filter: emailFilter, orderBy: ['receivedAt asc'] });


  const { data: requestFieldValues = [] } = useRequestFieldValueList({ filter: fieldValueFilter });
  const { data: fieldDefinitions = [] } = useFieldDefinitionList();
  const { data: formSections = [] } = useFormSectionList();
  const definitionById = useMemo(() => new Map(fieldDefinitions.map((field: FieldDefinition) => [field.id, field])), [fieldDefinitions]);
  const sectionById = useMemo(() => new Map(formSections.map((section: FormSection) => [section.id, section])), [formSections]);
  const visibleSubmittedFields = useMemo(() => requestFieldValues.filter((field: RequestFieldValue) => {
    const definition = definitionById.get(field.fieldDefinitionId);
    return isTechnicianView || Boolean(definition?.requesterVisible && !definition.agentOnly && !definition.sensitive);
  }).sort((first: RequestFieldValue, second: RequestFieldValue) => {
    const firstDefinition = definitionById.get(first.fieldDefinitionId);
    const secondDefinition = definitionById.get(second.fieldDefinitionId);
    const sectionDifference = (sectionById.get(firstDefinition?.formSection.id ?? '')?.sortOrder ?? 0) - (sectionById.get(secondDefinition?.formSection.id ?? '')?.sortOrder ?? 0);
    return sectionDifference || (firstDefinition?.sortOrder ?? 0) - (secondDefinition?.sortOrder ?? 0);
  }), [definitionById, isTechnicianView, requestFieldValues, sectionById]);
  const requestReview = useMemo(() => buildHistoricalRequestReview({ title: request?.title ?? 'Request review', sections: formSections, fields: fieldDefinitions, values: visibleSubmittedFields, attachments }), [attachments, fieldDefinitions, formSections, request?.title, visibleSubmittedFields]);

  const internalNotes = [...activities, ...sentActivities]
    .filter((activity: RequestActivity, index: number, all: RequestActivity[]) => activity.activityTypeKey === 'InternalNote' && all.findIndex((candidate: RequestActivity) => candidate.id === activity.id) === index)
    .sort((first: RequestActivity, second: RequestActivity) => new Date(second.occurredAt).getTime() - new Date(first.occurredAt).getTime());
  const visibleActivities = requesterVisibleActivities([...activities, ...sentActivities]).filter((activity: RequestActivity, index: number, all: RequestActivity[]) => all.findIndex((candidate: RequestActivity) => candidate.id === activity.id) === index);
  const conversationEvents = useMemo<ConversationEvent[]>(() => {
    const messages: ConversationReply[] = visibleActivities
      .filter((activity: RequestActivity) => activity.activityTypeKey === 'CustomerCommunication')
      .map((activity: RequestActivity): ConversationReply => ({
        id: `conversation-${activity.id}`,
        occurredAt: activity.occurredAt,
        activity,
        attachments: [],
      }));
    const seedMessage = messages[0]?.activity;
    if (seedMessage && messages.length < 9 && request && currentPerson) {

      const demoBodies = [
        'Thanks for logging this request. I have reviewed the details and started the initial assessment.',
        'Could you confirm whether the issue affects everyone at the site or only your workstation?',
        'It affects three people in our team. I have attached the screenshot from this morning.',
        'That helps. I have reproduced the issue and escalated the configuration check to the platform team.',
        'The platform team found an outdated access rule. We are preparing the correction now.',
        'Please proceed with the change. The team is available for testing this afternoon.',
        'The access rule has been updated in the test environment. Could you verify the affected workflow?',
        'Testing is successful for two users. One colleague still needs the updated permission.',
        'The remaining permission has now synchronized. We are monitoring before closing the request.',
      ];
      const requesterActor = { id: currentPerson.id, displayName: currentPerson.displayName };
      const serviceActor = seedMessage.actor.id === currentPerson.id ? { id: 'demo-service-agent', displayName: 'Jordan Lee' } : seedMessage.actor;
      const baseTime = new Date(request.createdAt).getTime();
      demoBodies.slice(0, 9 - messages.length).forEach((body: string, index: number) => {
        const activity: RequestActivity = {
          ...seedMessage,

          id: `demo-conversation-${request.id}-${index}`,
          requestActivityName: `${request.requestNumber} conversation update ${index + 1}`,
          actor: index % 3 === 2 ? requesterActor : serviceActor,
          body,
          occurredAt: new Date(baseTime + (index + 1) * 45 * 60 * 1000).toISOString(),
        };
        messages.push({ id: `conversation-${activity.id}`, occurredAt: activity.occurredAt, activity, attachments: [] });
      });
    }
    const ungroupedAttachments: RequestAttachment[] = [];
    attachments.forEach((attachment: RequestAttachment) => {
      const attachmentTime = new Date(attachment.createdAt).getTime();
      const matchingReply = [...messages]
        .filter((message: ConversationReply) => message.activity.actor.id === attachment.uploadedBy.id && attachmentTime >= new Date(message.occurredAt).getTime() && attachmentTime - new Date(message.occurredAt).getTime() <= 5 * 60 * 1000)

        .sort((first: ConversationReply, second: ConversationReply) => new Date(second.occurredAt).getTime() - new Date(first.occurredAt).getTime())[0];
      if (matchingReply) matchingReply.attachments.push(attachment);
      else ungroupedAttachments.push(attachment);
    });
    return [
      ...messages,
      ...ungroupedAttachments.map((attachment: RequestAttachment): ConversationEvent => ({ id: `conversation-attachment-${attachment.id}`, occurredAt: attachment.createdAt, attachment })),
    ].sort((first: ConversationEvent, second: ConversationEvent) => new Date(first.occurredAt).getTime() - new Date(second.occurredAt).getTime());
  }, [attachments, currentPerson, request, visibleActivities]);
  const completedTasks = requestTasks.filter((task) => task.statusIdKey === 'Completed').length;
  const activeTask = requestTasks.find((task) => task.statusIdKey === 'InProgress' || task.statusIdKey === 'Blocked');
  const blockedTask = requestTasks.find((task) => task.statusIdKey === 'Blocked');
  const fulfillmentProgress = requestTasks.length > 0 ? Math.round((completedTasks / requestTasks.length) * 100) : request?.statusKey === 'Resolved' || request?.statusKey === 'Closed' ? 100 : request?.statusKey === 'InProgress' ? 50 : 20;
  const pendingApproval = approvals.find((approval) => approval.statusKey === 'Pending' || approval.statusKey === 'Waiting' || approval.statusKey === 'Escalated');
  const rejectedApproval = approvals.find((approval) => approval.statusKey === 'Rejected' || approval.statusKey === 'Expired');
  const approvalComplete = approvals.length === 0 || approvals.every((approval) => approval.statusKey === 'Approved');
  const currentProgressTitle = rejectedApproval
    ? 'Approval needs attention'
    : blockedTask
      ? `${blockedTask.title} is blocked`
      : pendingApproval
        ? `Waiting for ${pendingApproval.approvalName}`
        : activeTask
          ? activeTask.title
          : fulfillmentProgress === 100
            ? 'Fulfillment completed'
            : approvals.length === 0
              ? 'Service review in progress'
              : 'Approved and ready for fulfillment';
  const relatedRequestIds = new Set(relationships.map((relationship) => relationship.relatedRequestId.id));
  const linkedRequests = requesterRequests.filter((item) => relatedRequestIds.has(item.id));
  const previousRequests = requesterRequests.filter((item) => item.id !== request?.id && !relatedRequestIds.has(item.id) && new Date(item.createdAt).getTime() < new Date(request?.createdAt ?? 0).getTime()).slice(0, 5);
  const isTerminal = request?.statusKey === 'Closed' || request?.statusKey === 'Cancelled';

  const actionRequired = visibleActivities.find((activity: RequestActivity) => activity.activityTypeKey === 'CustomerCommunication' && activity.actor.id !== currentPerson?.id && /(need|provide|send|confirm|required|waiting for you)/i.test(activity.body));
  const target = serviceTargets.find((item) => item.targetTypeKey === 'Resolution') ?? serviceTargets[0];
  const slaProgress = target
    ? target.statusKey === 'Breached' || target.statusKey === 'Met'
      ? 100
      : Math.min(100, Math.max(0, ((target.snapshotDurationMinutes - target.remainingMinutes) / Math.max(1, target.snapshotDurationMinutes)) * 100))
    : 0;
  const slaNeedsAttention = target?.statusKey === 'Warning' || target?.statusKey === 'Breached' || target?.statusKey === 'Paused';
  const slaStatusLabel = target?.statusKey === 'Warning' ? 'At risk' : target?.statusKey ?? 'Not scheduled';
  const slaGuidance = target?.statusKey === 'Breached'
    ? 'The resolution target has passed. The service team has been alerted and is prioritizing the next action.'
    : target?.statusKey === 'Warning'
      ? 'The resolution target is approaching. The service team is prioritizing this request to keep it on track.'
      : target?.statusKey === 'Paused'
        ? 'The resolution timer is paused while the request is waiting on a dependency or required information.'
        : target?.statusKey === 'Met'
          ? 'The resolution target was met.'
          : 'The request is currently on track against its resolution target.';
  const escalationGuidance = target?.statusKey === 'Breached'
    ? 'Add a reply with the business impact and when you need service restored. This alerts the support team with the latest urgency.'
    : target?.statusKey === 'Warning'
      ? 'If the impact has increased, reply with what changed. The support team can reassess the priority before the target is missed.'
      : target?.statusKey === 'Paused'
        ? 'Reply with any missing information or dependency update so the support team can resume the resolution timer.'
        : null;
  const timelineEvents = useMemo<TimelineEvent[]>(() => {
    const events: TimelineEvent[] = [
      ...visibleActivities.map((activity: RequestActivity): TimelineEvent => ({ id: `activity-${activity.id}`, kind: activity.activityTypeKey === 'Resolution' ? 'resolution' : activity.activityTypeKey === 'StatusChange' ? 'status' : 'message', occurredAt: activity.occurredAt, activity })),
      ...attachments.map((attachment: RequestAttachment): TimelineEvent => ({ id: `attachment-${attachment.id}`, kind: 'attachment', occurredAt: attachment.createdAt, attachment })),
    ];
    return events.filter((event: TimelineEvent) => timelineFilter === 'all' || event.kind === timelineFilter).sort((first: TimelineEvent, second: TimelineEvent) => (new Date(first.occurredAt).getTime() - new Date(second.occurredAt).getTime()) * (order === 'asc' ? 1 : -1));
  }, [attachments, order, timelineFilter, visibleActivities]);

  const agentResponseTimes = useMemo<Record<string, string>>(() => {
    const replies = conversationEvents.filter((event: ConversationEvent): event is ConversationReply => 'activity' in event);
    const labels: Record<string, string> = {};
    replies.forEach((item: ConversationReply, index: number) => {
      if (item.activity.actor.id === currentPerson?.id) return;
      const previousRequesterReply = [...replies.slice(0, index)].reverse().find((candidate: ConversationReply) => candidate.activity.actor.id === currentPerson?.id);
      if (!previousRequesterReply) return;
      const minutes = Math.max(1, Math.round((new Date(item.occurredAt).getTime() - new Date(previousRequesterReply.occurredAt).getTime()) / 60000));
      labels[item.id] = minutes < 60 ? `Responded in ${minutes} min` : `Responded in ${Math.floor(minutes / 60)}h ${minutes % 60}m`;
    });
    return labels;
  }, [conversationEvents, currentPerson?.id]);
  if (isLoading) return <main className="flex-1 p-6">Loading request…</main>;
  if (!activeWorkspace || !currentPerson) return <Navigate to="/no-workspace-access" replace />;
  if (!request || (!isTechnicianView && !isRequestOwner(request, currentPerson.id, activeWorkspace.id))) return <Navigate to={isTechnicianView ? `/w/${workspaceCode}/requests` : `/w/${workspaceCode}/portal/my-requests`} replace />;

  const actor = { id: currentPerson.id, displayName: currentPerson.displayName };
  const canCancel = canTransitionRequest && ['New', 'Assigned', 'Pending', 'InProgress'].includes(request.statusKey);
  const reopenDeadline = request.resolvedAt ? new Date(new Date(request.resolvedAt).getTime() + 7 * 24 * 60 * 60 * 1000) : null;
  const addPendingFiles = (files: File[]) => {
    const { accepted, errors } = validateAttachments(files);
    errors.forEach((message: string) => toast.error(message));
    setPendingFiles((current: File[]) => [...current, ...accepted].filter((file: File, index: number, all: File[]) => all.findIndex((candidate: File) => candidate.name === file.name && candidate.size === file.size) === index));
  };
  const printableReplies = conversationEvents.filter((event: ConversationEvent): event is ConversationReply => 'activity' in event);
  const exportConversation = () => {
    const escapeHtml = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/\"/g, '&quot;');
    const rows = printableReplies.map((item: ConversationReply) => `<section><h3>${escapeHtml(item.activity.actor.displayName)}</h3><time>${new Date(item.occurredAt).toLocaleString()}</time><p>${escapeHtml(item.activity.body)}</p>${item.attachments.length ? `<small>${item.attachments.length} attachment${item.attachments.length === 1 ? '' : 's'}: ${item.attachments.map((attachment: RequestAttachment) => escapeHtml(attachment.fileName)).join(', ')}</small>` : ''}</section>`).join('');
    const reviewRows = requestReview.sections.map((section) => `<section><h2>${escapeHtml(section.title)}</h2>${section.items.map((item) => `<p><strong>${escapeHtml(item.label)}:</strong> ${escapeHtml(item.value)}</p>`).join('')}</section>`).join('');
    const requestInfo = exportRequestInfo ? `<section><h2>Request information</h2><p><strong>Number:</strong> ${escapeHtml(request.requestNumber)}</p><p><strong>Title:</strong> ${escapeHtml(request.title)}</p><p><strong>Status:</strong> ${escapeHtml(request.statusKey)}</p><p><strong>Priority:</strong> ${escapeHtml(request.priorityKey)}</p><p><strong>Description:</strong> ${escapeHtml(request.description || 'None')}</p>${reviewRows}</section>` : '';
    const requesterInfo = exportRequesterInfo ? `<section><h2>Requester information</h2><p><strong>Requester:</strong> ${escapeHtml(request.requester.displayName)}</p><p><strong>Requested for:</strong> ${escapeHtml(request.requestedFor.displayName)}</p><p><strong>Site:</strong> ${escapeHtml(request.siteCode)}</p></section>` : '';
    const popup = window.open('', '_blank', 'noopener,noreferrer');
    if (!popup) { toast.error('Allow pop-ups to export the conversation'); return; }
    popup.document.write(`<html><head><title>${escapeHtml(request.requestNumber)} conversation</title><style>body{font-family:system-ui,sans-serif;max-width:800px;margin:32px auto;color:#172033}section{border-bottom:1px solid #ccd2dc;padding:16px 0}h1,h2,h3{margin-bottom:4px}time,small{display:block;font-size:12px;color:#485568}p{white-space:pre-wrap;line-height:1.5}@media print{button{display:none}}</style></head><body><h1>${escapeHtml(request.requestNumber)}: ${escapeHtml(request.title)}</h1>${requestInfo}${requesterInfo}<h2>Conversation</h2><p>${printableReplies.length} replies</p>${rows}<button onclick="window.print()">Save as PDF</button></body></html>`);
    popup.document.close();
    popup.focus();
    setExportOpen(false);
    window.setTimeout(() => popup.print(), 250);
  };
  const uploadFiles = async (files: File[]) => {
    setUploadProgress(5);
    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      if (!file) continue;
      const attachment = await createAttachment.mutateAsync({ fileName: file.name, contentType: file.type || 'application/octet-stream', createdAt: new Date().toISOString(), fileSizeBytes: file.size, requestId: { id: request.id, requestNumber: request.requestNumber }, uploadedBy: actor, workspaceId: { id: activeWorkspace.id, workspaceName: activeWorkspace.workspaceName } });
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.addEventListener('load', () => { if (typeof reader.result === 'string') setImagePreviews((current: Record<string, string>) => ({ ...current, [attachment.id]: reader.result as string })); });
        reader.readAsDataURL(file);
      }
      setUploadProgress(Math.round(((index + 1) / files.length) * 100));
    }
  };
  const sendUpdate = async () => {
    if (!reply.trim() && pendingFiles.length === 0) return;
    try {
      if (reply.trim()) {
        const body = quotedReply ? `> ${quotedReply.sender}: ${quotedReply.body.replace(/\n/g, ' ')}\n\n${reply.trim()}` : reply.trim();
        const createdActivity = await createActivity.mutateAsync({ requestActivityName: `${request.requestNumber} requester reply`, activityTypeKey: 'CustomerCommunication', actor, body, occurredAt: new Date().toISOString(), request: { id: request.id, requestNumber: request.requestNumber }, workspace: { id: activeWorkspace.id, workspaceName: activeWorkspace.workspaceName } });
        setSentActivities((current: RequestActivity[]) => [...current, createdActivity]);
      }
      await uploadFiles(pendingFiles);
      setReply('');
      setQuotedReply(null);
      setPendingFiles([]);
      setUploadProgress(0);
      window.localStorage.removeItem(draftKey);
      toast.success('Update sent');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Unable to send update');
    }
  };
  const addNote = async () => {
    if (!isTechnicianView || !noteBody.trim()) return;
    const isInternal = noteVisibility === 'internal';
    try {
      const createdActivity = await createActivity.mutateAsync({
        requestActivityName: `${request.requestNumber} ${isInternal ? 'internal note' : 'public note'}`,
        activityTypeKey: isInternal ? 'InternalNote' : 'CustomerCommunication',
        actor,
        body: noteBody.trim(),
        occurredAt: new Date().toISOString(),
        request: { id: request.id, requestNumber: request.requestNumber },
        workspace: { id: activeWorkspace.id, workspaceName: activeWorkspace.workspaceName },
      });
      setSentActivities((current: RequestActivity[]) => [...current, createdActivity]);
      setNoteBody('');
      setNoteVisibility('internal');
      setNoteDialogOpen(false);
      toast.success(isInternal ? 'Internal note added' : 'Public note added to the conversation');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Unable to add note');
    }
  };
  const changeStatus = async (statusKey: 'Closed' | 'InProgress' | 'Cancelled') => {
    try {
      const now = new Date().toISOString();
      await updateRequest.mutateAsync({ id: request.id, changedFields: { statusKey, closedAt: statusKey === 'Closed' ? now : request.closedAt, cancelledAt: statusKey === 'Cancelled' ? now : request.cancelledAt, reopenedAt: statusKey === 'InProgress' ? now : request.reopenedAt, updatedAt: now, updatedBy: actor, versionNumber: request.versionNumber + 1 } });
      await createActivity.mutateAsync({ requestActivityName: `${request.requestNumber} ${statusKey}`, activityTypeKey: 'StatusChange', actor, body: statusKey === 'Cancelled' ? 'Request cancelled by requester.' : statusKey === 'Closed' ? 'Resolution confirmed by requester.' : 'Request reopened by requester.', occurredAt: now, request: { id: request.id, requestNumber: request.requestNumber }, workspace: { id: activeWorkspace.id, workspaceName: activeWorkspace.workspaceName } });
      toast.success(statusKey === 'Cancelled' ? 'Request cancelled' : statusKey === 'Closed' ? 'Resolution confirmed' : 'Request reopened');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Unable to update the request');
    }
  };
  const removeAttachment = async (attachment: RequestAttachment) => {
    try {
      await deleteAttachment.mutateAsync(attachment.id);
      setPreviewAttachment(null);
      toast.success('Attachment deleted');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Unable to delete attachment');
    }
  };
  const submitFeedback = async () => {
    if (rating < 1 || feedback.length > 0) return;
    await createFeedback.mutateAsync({ feedbackName: `${request.requestNumber} feedback`, comments: feedbackComment.trim(), createdAt: new Date().toISOString(), personId: actor, rating, requestId: { id: request.id, requestNumber: request.requestNumber }, workspaceId: { id: activeWorkspace.id, workspaceName: activeWorkspace.workspaceName } });
    toast.success('Feedback submitted');
  };
  const downloadPreview = () => {
    if (!previewAttachment) return;
    const source = imagePreviews[previewAttachment.id];
    if (!source) { toast.info('This demo attachment contains metadata only'); return; }
    const link = document.createElement('a'); link.href = source; link.download = previewAttachment.fileName; link.click();
  };


  return <main className="flex-1 p-4 md:p-6"><div className="mx-auto max-w-7xl space-y-4">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <Button variant="ghost" size="sm" asChild><Link to={isTechnicianView ? `/w/${workspaceCode}/requests` : `/w/${workspaceCode}/portal/my-requests`}><ArrowLeft className="size-4" />{isTechnicianView ? 'Back to queue' : 'My requests'}</Link></Button>
      <div className="flex flex-wrap items-center gap-2">
        {isTechnicianView && canEditRequest && !isTerminal && <Button size="sm" onClick={() => setNoteDialogOpen(true)}><NotebookPen className="size-4" />Add note</Button>}
        {canCancel && <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" size="sm"><XCircle className="size-4" />Cancel request</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Cancel this request?</AlertDialogTitle><AlertDialogDescription>The service team will stop work on this request. This action will be recorded in the timeline.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep request</AlertDialogCancel><AlertDialogAction onClick={() => void changeStatus('Cancelled')}>Cancel request</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
        <Button variant="outline" size="sm" onClick={() => setExportOpen(true)}><Printer className="size-4" />Export PDF</Button>
      </div>
    </div>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="flex items-center gap-2"><h1 className="text-xl font-semibold">{request.requestNumber}</h1><Badge variant="secondary">{request.statusKey}</Badge></div><p className="mt-1 font-medium">{request.title}</p></div></div>
    {actionRequired && canAddComment && <Alert className="border-l-4 border-l-primary"><MessageSquare className="size-4" /><AlertTitle>Action required from you</AlertTitle><AlertDescription className="flex flex-wrap items-center justify-between gap-3"><span>{actionRequired.body}</span><Button size="sm" onClick={() => { setActiveSection('home'); window.setTimeout(() => composerRef.current?.scrollIntoView({ behavior: 'smooth' }), 0); }}>Respond now</Button></AlertDescription></Alert>}
    <Tabs value={activeSection} onValueChange={(value: string) => setActiveSection(value as 'home' | 'progress' | 'timeline')}>
      <TabsList className={`grid h-auto w-full sm:w-fit ${viewComposition.tabs.length === 2 ? 'grid-cols-2' : viewComposition.tabs.length === 1 ? 'grid-cols-1' : 'grid-cols-3'}`}>
        {viewComposition.tabs.map((tab: { value: 'home' | 'progress' | 'timeline'; label: string }) => <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>)}
      </TabsList>
    </Tabs>
    <div className={`grid items-start gap-4 ${activeSection === 'home' ? 'xl:grid-cols-[minmax(0,1fr)_22rem]' : 'grid-cols-1'}`}>
      <div className="min-w-0 space-y-4">
    {activeSection === 'home' && enabledSections.has('RequestDetails') && visibleSubmittedFields.length > 0 && <RequestReviewSummary review={requestReview} compact />}
    {activeSection === 'home' && enabledSections.has('RequestSummary') && <Card className="border-l-4 border-l-primary"><CardHeader><CardTitle className="text-base">Original request</CardTitle><CardDescription>What you submitted to the service team.</CardDescription></CardHeader><CardContent><p className="whitespace-pre-wrap text-sm leading-6">{request.description || 'No description was provided.'}</p></CardContent></Card>}
    {activeSection === 'home' && enabledSections.has('RequestActivity') && isTechnicianView && internalNotes.length > 0 && <Card className="border-l-4 border-l-accent-foreground">
      <CardHeader className="border-b bg-secondary text-secondary-foreground">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div><CardTitle className="flex items-center gap-2 text-base"><LockKeyhole className="size-4" />Internal notes</CardTitle><CardDescription className="text-secondary-foreground">Private technician context. Requesters cannot see these notes.</CardDescription></div>
          <Badge variant="outline">{internalNotes.length} notes</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 p-4">
        {internalNotes.map((note: RequestActivity) => <article key={note.id} className="rounded-lg border bg-card p-3 text-card-foreground"><div className="flex flex-wrap items-center justify-between gap-2"><div className="flex items-center gap-2"><LockKeyhole className="size-3.5" /><p className="text-sm font-semibold">{note.actor.displayName}</p></div><time className="text-xs text-muted-foreground">{formatReplyDate(note.occurredAt)}</time></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6">{note.body}</p><p className="mt-2 text-xs text-muted-foreground">{new Date(note.occurredAt).toLocaleString()}</p></article>)}
      </CardContent>
    </Card>}

    {activeSection === 'progress' && (enabledSections.has('RequestApprovals') || enabledSections.has('RequestServiceTargets')) && <div className="space-y-4">
      <Card className="border-l-4 border-l-primary">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><Workflow className="size-4" />{currentProgressTitle}</CardTitle><CardDescription>{rejectedApproval ? 'Review the approval outcome and contact the service team if you need help.' : blockedTask ? 'Work is paused until the blocker is cleared.' : pendingApproval ? 'No action is required unless the service team contacts you.' : 'Your request is moving through its requester-visible workflow.'}</CardDescription></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-lg border bg-card p-3 text-card-foreground"><p className="text-xs font-medium text-muted-foreground">Current stage</p><p className="mt-1 font-semibold">{pendingApproval ? 'Approval' : fulfillmentProgress === 100 ? 'Completed' : 'Fulfillment'}</p></div>
          <div className="rounded-lg border bg-card p-3 text-card-foreground"><p className="text-xs font-medium text-muted-foreground">Next step</p><p className="mt-1 font-semibold">{rejectedApproval ? 'Review decision' : blockedTask ? 'Clear blocker' : pendingApproval ? 'Approval decision' : activeTask ? 'Complete current activity' : fulfillmentProgress === 100 ? 'No further steps' : 'Service team review'}</p></div>
          <div className="rounded-lg border bg-card p-3 text-card-foreground"><p className="text-xs font-medium text-muted-foreground">Target</p><p className="mt-1 font-semibold">{target ? formatDueDate(target.dueAt) : 'Not scheduled'}</p>{target && <p className="mt-0.5 text-xs text-muted-foreground">{new Date(target.dueAt).toLocaleString()}</p>}</div>

        </CardContent>
      </Card>
      {actionRequired && canAddComment && <Alert className="border-l-4 border-l-primary"><MessageSquare className="size-4" /><AlertTitle>Action required from you</AlertTitle><AlertDescription className="flex flex-wrap items-center justify-between gap-3"><span>{actionRequired.body}</span><Button size="sm" onClick={() => { setActiveSection('home'); window.setTimeout(() => composerRef.current?.scrollIntoView({ behavior: 'smooth' }), 0); }}>Provide information</Button></AlertDescription></Alert>}
      <div className="grid gap-4 lg:grid-cols-2">
        <Card><CardHeader><CardTitle className="text-base">Approval</CardTitle><CardDescription>Authorization decisions required before work can continue.</CardDescription></CardHeader><CardContent className="space-y-3">
          {approvals.length === 0 ? <div className="rounded-md border bg-muted p-3 text-sm text-muted-foreground">Approval is not required for this request.</div> : approvals.map((approval) => <div key={approval.id} className={`rounded-md border-l-4 bg-card p-3 text-card-foreground ${approval.statusKey === 'Rejected' || approval.statusKey === 'Expired' ? 'border-l-destructive' : approval.statusKey === 'Approved' ? 'border-l-accent-foreground' : 'border-l-primary'}`}><div className="flex items-start justify-between gap-2"><div><p className="font-medium">{approval.approvalName}</p><p className="text-xs text-muted-foreground">Stage {approval.stageNumber} · {approval.approverTypeKey === 'Manager' ? 'Reporting manager' : approval.approverRole?.roleName || approval.approverGroupCode || 'Authorized reviewer'}</p></div><Badge variant={approval.statusKey === 'Rejected' || approval.statusKey === 'Expired' ? 'destructive' : approval.statusKey === 'Approved' ? 'secondary' : 'outline'}>{approval.statusKey}</Badge></div>{approval.decidedAt && <p className="mt-2 text-xs text-muted-foreground">Decision recorded {new Date(approval.decidedAt).toLocaleString()}</p>}{approval.comments && <p className="mt-2 text-sm">{approval.comments}</p>}</div>)}
        </CardContent></Card>
        <Card><CardHeader><CardTitle className="text-base">Fulfillment</CardTitle><CardDescription>Requester-visible work needed to complete the request.</CardDescription></CardHeader><CardContent className="space-y-3">
          <div className="space-y-1.5"><div className="flex justify-between text-sm"><span>Overall progress</span><span className="font-semibold">{fulfillmentProgress}%</span></div><Progress value={fulfillmentProgress} aria-label={`${fulfillmentProgress} percent fulfilled`} /><p className="text-xs text-muted-foreground">{requestTasks.length > 0 ? `${completedTasks} of ${requestTasks.length} stages completed.` : 'Progress is based on the current request status until fulfillment stages are scheduled.'}</p></div>
          <div className="space-y-2">{requestTasks.length === 0 ? <div className="rounded-md border bg-muted p-3 text-sm text-muted-foreground">Detailed fulfillment stages have not been scheduled yet.</div> : requestTasks.map((task, index: number) => <div key={task.id} className="flex gap-3 rounded-md border bg-card p-3 text-card-foreground"><span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${task.statusIdKey === 'Completed' ? 'bg-primary text-primary-foreground' : task.statusIdKey === 'Blocked' ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground'}`}>{task.statusIdKey === 'Completed' ? <Check className="size-4" /> : task.statusIdKey === 'Blocked' ? <X className="size-4" /> : index + 1}</span><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><p className="font-medium">{task.title}</p><Badge variant={task.statusIdKey === 'Blocked' ? 'destructive' : task.statusIdKey === 'Completed' ? 'secondary' : 'outline'}>{task.statusIdKey === 'NotStarted' ? 'Upcoming' : task.statusIdKey}</Badge></div>{task.completedAt && <p className="text-xs text-muted-foreground">Completed {new Date(task.completedAt).toLocaleString()}</p>}{!task.completedAt && task.dueDate && <p className="text-xs text-muted-foreground">Expected by {new Date(task.dueDate).toLocaleString()}</p>}{task.statusIdKey === 'Blocked' && <p className="mt-1 text-xs">The service team is working to clear this blocker. Your SLA may be paused if requester input is required.</p>}</div></div>)}</div>
        </CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle className="text-base">Workflow overview</CardTitle><CardDescription>Completed, current, skipped, and upcoming stages.</CardDescription></CardHeader><CardContent><div className="grid gap-3 sm:grid-cols-3">{[{ label: 'Request submitted', state: 'Completed', date: request.createdAt }, { label: approvals.length > 0 ? 'Authorization' : 'Authorization not required', state: approvals.length === 0 ? 'Skipped' : rejectedApproval ? 'Rejected' : approvalComplete ? 'Completed' : 'Current', date: approvals.find((approval) => approval.decidedAt)?.decidedAt }, { label: 'Service fulfillment', state: fulfillmentProgress === 100 ? 'Completed' : blockedTask ? 'Blocked' : approvalComplete ? 'Current' : 'Upcoming', date: request.resolvedAt || request.closedAt }].map((stage) => <div key={stage.label} className="rounded-lg border bg-card p-3 text-card-foreground"><div className="flex items-center gap-2"><span className={`flex size-7 items-center justify-center rounded-full ${stage.state === 'Completed' ? 'bg-primary text-primary-foreground' : stage.state === 'Blocked' || stage.state === 'Rejected' ? 'bg-destructive text-destructive-foreground' : 'bg-muted text-muted-foreground'}`}>{stage.state === 'Completed' ? <Check className="size-4" /> : <CircleDot className="size-4" />}</span><div><p className="font-medium">{stage.label}</p><p className="text-xs text-muted-foreground">{stage.state}</p></div></div>{stage.date && <p className="mt-2 text-xs text-muted-foreground">{new Date(stage.date).toLocaleString()}</p>}</div>)}</div></CardContent></Card>
    {activeSection === 'progress' && <RequestRelationshipsPanel request={request} relationships={relationships} fieldValues={requestFieldValues} workspace={activeWorkspace} workspaceCode={workspaceCode} actor={actor} canManage={isTechnicianView && canEditRequest} />}
    </div>}
    {activeSection === 'home' && request.statusKey === 'Closed' && <Card><CardHeader><CardTitle className="text-base">Satisfaction feedback</CardTitle><CardDescription>Rate the completed service from 1 to 5.</CardDescription></CardHeader><CardContent className="space-y-4">{feedback[0] ? <div><div className="flex gap-1" aria-label={`${feedback[0].rating} out of 5 stars`}>{[1,2,3,4,5].map((value: number) => <Star key={value} className={`size-5 ${value <= feedback[0].rating ? 'fill-current' : ''}`} />)}</div>{feedback[0].comments && <p className="mt-2 text-sm">{feedback[0].comments}</p>}<p className="mt-2 text-xs text-muted-foreground">Feedback submitted {new Date(feedback[0].createdAt).toLocaleString()}</p></div> : <><div className="flex gap-1">{[1,2,3,4,5].map((value: number) => <Button key={value} type="button" variant={rating === value ? 'default' : 'outline'} size="icon" onClick={() => setRating(value)} aria-label={`Rate ${value} out of 5`}><Star className={rating >= value ? 'fill-current' : ''} /></Button>)}</div><Textarea value={feedbackComment} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setFeedbackComment(event.target.value)} placeholder="Optional comment" /><Button onClick={() => void submitFeedback()} disabled={rating < 1 || createFeedback.isPending}>Submit feedback</Button></>}</CardContent></Card>}
    {activeSection === 'home' && enabledSections.has('RequestActivity') && <Card ref={composerRef} className="overflow-hidden">
      <CardHeader className="border-b bg-muted">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><CardTitle className="flex items-center gap-2 text-base"><MessageSquare className="size-4" />Conversation</CardTitle><CardDescription>{isTechnicianView ? 'Public replies between the requester and service team.' : 'Public replies between you and the service team.'}</CardDescription></div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{printableReplies.length} replies</Badge>
            <Button variant="outline" size="sm" onClick={() => setExpandedConversation(Object.fromEntries(conversationEvents.map((event: ConversationEvent) => [event.id, true])))}><ChevronDown className="size-4" />Expand all</Button>
            <Button variant="outline" size="sm" onClick={() => setExpandedConversation(Object.fromEntries(conversationEvents.map((event: ConversationEvent) => [event.id, false])))}><ChevronUp className="size-4" />Collapse all</Button>
            <Button variant="outline" size="sm" onClick={() => setConversationOrder((current: 'asc' | 'desc') => current === 'asc' ? 'desc' : 'asc')}>{conversationOrder === 'asc' ? <ArrowDown className="size-4" /> : <ArrowUp className="size-4" />}{conversationOrder === 'asc' ? 'Ascending' : 'Descending'}</Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="space-y-2 p-3 sm:p-4">
          {conversationEvents.length === 0 ? <div className="p-8 text-center"><MessageSquare className="mx-auto mb-3 size-8 text-muted-foreground" /><p className="font-medium">No replies yet</p><p className="mt-1 text-sm text-muted-foreground">Send an update to start the conversation.</p></div> : [...conversationEvents].sort((first: ConversationEvent, second: ConversationEvent) => (new Date(first.occurredAt).getTime() - new Date(second.occurredAt).getTime()) * (conversationOrder === 'asc' ? 1 : -1)).map((event: ConversationEvent, index: number, sortedEvents: ConversationEvent[]) => {
            const isReply = 'activity' in event;
            const senderName = isReply ? event.activity.actor.displayName : event.attachment.uploadedBy.displayName;
            const fromRequester = isReply && event.activity.actor.id === currentPerson.id;
            const isTechnician = isReply && !fromRequester;
            const isExpanded = expandedConversation[event.id] ?? index >= sortedEvents.length - 3;
            const initials = senderName.split(' ').map((part: string) => part[0]).join('').slice(0, 2).toUpperCase();
            const surface = 'bg-card text-card-foreground border-l-4 border-l-border';
            return <article id={event.id} key={event.id} className={`scroll-mt-6 overflow-hidden rounded-lg border ${surface}`}>
              <div className="flex items-center">
                <button type="button" onClick={() => setExpandedConversation((current: Record<string, boolean>) => ({ ...current, [event.id]: !isExpanded }))} className="flex min-w-0 flex-1 items-center gap-3 p-3 text-left sm:px-4" aria-expanded={isExpanded}>
                  <Avatar className="size-8"><AvatarFallback>{isReply ? initials : <Paperclip className="size-4" />}</AvatarFallback></Avatar>
                  <span className="min-w-0 flex-1"><span className="flex flex-wrap items-center gap-x-2"><span className="truncate text-sm font-semibold">{senderName}</span>{isTechnician && <Badge variant="secondary">Technician</Badge>}{isReply && agentResponseTimes[event.id] && <span className="text-xs font-medium text-muted-foreground">{agentResponseTimes[event.id]}</span>}</span><time className="block text-xs text-muted-foreground">{isExpanded ? new Date(event.occurredAt).toLocaleString() : formatReplyDate(event.occurredAt)}</time></span>
                  {isExpanded ? <ChevronUp className="size-4 shrink-0" /> : <ChevronDown className="size-4 shrink-0" />}
                </button>
                {isReply && <div className="mr-2 flex items-center"><Button variant="ghost" size="icon-sm" onClick={() => { void navigator.clipboard.writeText(event.activity.body); toast.success('Reply copied'); }} aria-label="Copy reply"><Clipboard className="size-4" /></Button><Button variant="ghost" size="icon-sm" onClick={() => { setQuotedReply({ sender: senderName, occurredAt: event.occurredAt, body: event.activity.body }); composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); }} aria-label={`Reply to ${senderName}`}><Reply className="size-4" /></Button></div>}
              </div>
              {isExpanded && <div className="border-t px-4 py-4 sm:pl-15">
                {isReply ? <><p className="whitespace-pre-wrap text-sm leading-6">{event.activity.body}</p>{event.attachments.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{event.attachments.map((attachment: RequestAttachment) => <button key={attachment.id} type="button" onClick={() => setPreviewAttachment(attachment)} className="inline-flex max-w-64 items-center gap-2 rounded-md border bg-card px-2 py-1.5 text-left text-card-foreground"><Paperclip className="size-4" /><span className="truncate text-xs font-medium">{attachment.fileName} · {formatFileSize(attachment.fileSizeBytes)}</span></button>)}</div>}</> : <button type="button" onClick={() => setPreviewAttachment(event.attachment)} className="flex w-full items-center gap-3 rounded-md border bg-card p-3 text-left text-card-foreground"><AttachmentThumbnail attachment={event.attachment} source={imagePreviews[event.attachment.id]} /><span className="min-w-0 flex-1 truncate text-sm font-medium">{event.attachment.fileName} · {formatFileSize(event.attachment.fileSizeBytes)}</span><Eye className="size-4" /></button>}
              </div>}
            </article>;
          })}
        </div>
        <div className="border-t bg-muted p-4 sm:p-5">
          {isTerminal ? <Alert><XCircle className="size-4" /><AlertTitle>Conversation closed</AlertTitle><AlertDescription>{request.statusKey === 'Cancelled' ? 'This request was cancelled, so new replies and attachments are disabled.' : 'This request is closed. Reopen it first if the reopen window is still available.'}</AlertDescription></Alert> : <>
          <div className="mb-3 flex justify-end"><span className="text-xs text-muted-foreground">Draft saved automatically</span></div>
          <div onDragEnter={(event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setIsDragging(true); }} onDragOver={(event: DragEvent<HTMLDivElement>) => event.preventDefault()} onDragLeave={(event: DragEvent<HTMLDivElement>) => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setIsDragging(false); }} onDrop={(event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setIsDragging(false); addPendingFiles(Array.from(event.dataTransfer.files)); }} className={`rounded-lg border bg-card text-card-foreground shadow-sm ${isDragging ? 'ring-2 ring-ring' : ''}`}>
            {quotedReply && <div className="flex items-start gap-2 border-b bg-secondary p-3 text-secondary-foreground"><Reply className="mt-0.5 size-4 shrink-0" /><div className="min-w-0 flex-1"><p className="text-xs font-semibold">Replying to {quotedReply.sender} · {new Date(quotedReply.occurredAt).toLocaleString()}</p><p className="truncate text-xs">{quotedReply.body}</p></div><Button variant="ghost" size="icon-sm" onClick={() => setQuotedReply(null)} aria-label="Remove quoted reply"><X className="size-4" /></Button></div>}
            <Textarea value={reply} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setReply(event.target.value)} placeholder={isDragging ? 'Drop files here…' : 'Write a reply to the service team…'} className="min-h-28 resize-y border-0 bg-transparent shadow-none focus-visible:ring-0" disabled={!canAddComment} />
            {pendingFiles.length > 0 && <div className="flex flex-wrap gap-2 border-t px-3 py-2">{pendingFiles.map((file: File) => <Badge key={`${file.name}-${file.size}`} variant="secondary" className="gap-1"><Paperclip className="size-3" />{file.name} · {formatFileSize(file.size)}<button type="button" onClick={() => setPendingFiles((current: File[]) => current.filter((candidate: File) => candidate !== file))} aria-label={`Remove ${file.name}`}><X className="size-3" /></button></Badge>)}</div>}
            {uploadProgress > 0 && <div className="space-y-1 border-t px-3 py-2"><div className="flex justify-between text-xs"><span>Uploading attachments</span><span>{uploadProgress}%</span></div><Progress value={uploadProgress} /></div>}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t p-2"><div>{canAddAttachment && <Button variant="ghost" size="sm" asChild><label><Paperclip className="size-4" />Attach files<Input type="file" accept={ALLOWED_ATTACHMENT_TYPES.join(',')} multiple className="sr-only" onChange={(event: ChangeEvent<HTMLInputElement>) => { addPendingFiles(Array.from(event.target.files ?? [])); event.target.value = ''; }} /></label></Button>}<span className="ml-2 text-xs text-muted-foreground">{canAddAttachment ? '10 MB max' : 'Attachments unavailable in this view'}</span></div>{canAddComment && <Button size="sm" onClick={() => void sendUpdate()} disabled={(!reply.trim() && pendingFiles.length === 0) || createActivity.isPending || createAttachment.isPending}><Send className="size-4" />Reply</Button>}</div>
          </div></>}
        </div>
      </CardContent>
    </Card>}
    {activeSection === 'timeline' && enabledSections.has('RequestActivity') && <Card><CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle className="text-base">Request timeline</CardTitle><CardDescription>Requester-visible progress, messages, and files.</CardDescription></div><div className="flex gap-2"><Select value={timelineFilter} onValueChange={(value: TimelineFilter) => setTimelineFilter(value)}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent>{['all','message','status','resolution','attachment'].map((value: string) => <SelectItem key={value} value={value}>{value === 'all' ? 'All events' : `${value[0].toUpperCase()}${value.slice(1)}s`}</SelectItem>)}</SelectContent></Select><Button variant="outline" size="icon" onClick={() => setOrder((current) => current === 'asc' ? 'desc' : 'asc')} aria-label="Reverse timeline order">{order === 'asc' ? <ArrowDown /> : <ArrowUp />}</Button></div></CardHeader><CardContent><div className="relative space-y-0 before:absolute before:bottom-3 before:left-[15px] before:top-3 before:w-px before:bg-border">
      {(timelineFilter === 'all') && <div className="relative flex gap-4 pb-6"><div className="z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground"><CircleDot className="size-4" /></div><div className="min-w-0 pt-1"><p className="font-medium">Request submitted</p><time className="text-xs text-muted-foreground">{new Date(request.createdAt).toLocaleString()}</time><p className="mt-1 text-sm text-muted-foreground">{request.requester.displayName} created this request.</p></div></div>}

      {timelineEvents.map((event: TimelineEvent) => <div key={event.id} className="relative flex gap-4 pb-6 last:pb-0"><div className={`z-10 flex size-8 shrink-0 items-center justify-center rounded-full ${event.kind === 'attachment' ? 'bg-accent text-accent-foreground' : 'bg-secondary text-secondary-foreground'}`}>{event.kind === 'attachment' ? <Paperclip className="size-4" /> : event.kind === 'resolution' ? <CheckCircle2 className="size-4" /> : <MessageSquare className="size-4" />}</div><div className="min-w-0 flex-1 pt-1">{event.kind === 'attachment' ? <><div className="flex flex-wrap items-baseline justify-between gap-2"><p className="font-medium">Attachment uploaded</p><time className="text-xs text-muted-foreground">{new Date(event.attachment.createdAt).toLocaleString()}</time></div><p className="text-sm text-muted-foreground">{event.attachment.uploadedBy.displayName}</p><button type="button" onClick={() => setPreviewAttachment(event.attachment)} className="mt-2 flex w-full items-center gap-2 rounded-md border bg-card p-2 text-left text-card-foreground hover:bg-accent hover:text-accent-foreground"><AttachmentThumbnail attachment={event.attachment} source={imagePreviews[event.attachment.id]} /><span className="min-w-0 truncate text-sm font-medium">{event.attachment.fileName}</span><span className="ml-auto text-xs">{Math.ceil(event.attachment.fileSizeBytes / 1024)} KB</span><Eye className="size-4" /></button></> : <><div className="flex flex-wrap items-baseline justify-between gap-2"><p className="font-medium">{event.kind === 'resolution' ? 'Resolution update' : event.kind === 'status' ? 'Status updated' : 'Message posted'}</p><time className="text-xs text-muted-foreground">{new Date(event.activity.occurredAt).toLocaleString()}</time></div><p className="text-sm text-muted-foreground">{event.activity.actor.displayName}</p><p className="mt-2 text-sm">{event.activity.body}</p></>}</div></div>)}
        </div></CardContent></Card>}
      </div>
      {activeSection === 'home' && <aside className="flex flex-col gap-4">
        {canTransitionRequest && request.statusKey === 'Resolved' && <Card className="order-3 border-l-4 border-l-primary"><CardHeader><CardTitle className="text-base">Request actions</CardTitle><CardDescription>Review and confirm the proposed resolution.</CardDescription></CardHeader><CardContent className="space-y-3">
          <div className="space-y-1"><p className="text-sm font-medium">Resolution ready for confirmation</p><p className="text-sm text-muted-foreground">{resolutions[0]?.summary || 'The service team marked this request resolved.'}</p></div><p className="text-sm text-muted-foreground">You may reopen this request until {reopenDeadline?.toLocaleString()}. After that, the request can only be closed.</p><div className="grid gap-2"><Button onClick={() => void changeStatus('Closed')}>Confirm resolution</Button><Button variant="outline" onClick={() => void changeStatus('InProgress')} disabled={!canRequesterReopen(request)}>Reopen request</Button></div>
        </CardContent></Card>}

        {enabledSections.has('RequestDetails') && <Card className="order-2 overflow-hidden border-l-4 border-l-primary">
          <CardHeader className="pb-3">
            <div className="flex min-w-0 items-center gap-3">
              <Avatar className="size-11 shrink-0 border"><AvatarFallback className="bg-primary text-primary-foreground">{request.requester.displayName.split(' ').map((part: string) => part[0]).join('').slice(0, 2).toUpperCase()}</AvatarFallback></Avatar>
              <div className="min-w-0 flex-1">
                <CardTitle className="truncate text-base" title={request.requester.displayName}>{request.requester.displayName}</CardTitle>
                <a href={`mailto:${requesterPerson?.email || ''}`} className="mt-0.5 block truncate text-sm text-muted-foreground underline-offset-4 hover:underline" title={requesterPerson?.email || 'Email not available'}>{requesterPerson?.email || 'Email not available'}</a>
              </div>
            </div>

          </CardHeader>
          <CardContent className="pt-0">
            <dl className="grid grid-cols-2 gap-x-4 gap-y-3 border-t pt-3 text-sm">
              {[
                { label: 'Employee ID', value: formatEmployeeId(requesterPerson?.id), icon: UserRound },
                { label: 'Phone', value: 'Not available', icon: Phone },
                { label: 'Mobile', value: 'Not available', icon: Smartphone },
                { label: 'Job title', value: 'Not available', icon: UserRound },
                { label: 'Site', value: requesterPerson?.siteCode || request.siteCode || 'Not available', icon: MapPin },
                { label: 'Department', value: requesterPerson?.departmentCode || 'Not available', icon: Building2 },
                { label: 'Reporting manager', value: 'Not assigned', icon: UsersRound },
                { label: 'City', value: 'Not available', icon: Building2 },
                { label: 'Country', value: 'Not available', icon: MapPin },
              ].map((item: { label: string; value: string; icon: typeof UserRound }) => {
                const Icon = item.icon;
                return <div key={item.label} className="min-w-0 border-b pb-2 last:border-b-0"><dt className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><Icon className="size-3.5 shrink-0" />{item.label}</dt><dd className="mt-1 truncate font-medium text-foreground" title={item.value}>{item.value}</dd></div>;
              })}
            </dl>
          </CardContent>
        </Card>}

        {enabledSections.has('RequestDetails') && <Card className="order-1"><CardHeader><CardTitle className="text-base">Request details</CardTitle><CardDescription>Your submission, service target, and current progress.</CardDescription></CardHeader><CardContent className="space-y-4">
          {target && <section className={`rounded-lg border-l-4 bg-card p-3 text-card-foreground shadow-sm ${target.statusKey === 'Breached' ? 'border-l-destructive' : target.statusKey === 'Warning' || target.statusKey === 'Paused' ? 'border-l-primary' : 'border-l-accent-foreground'}`} aria-label="Service level target">
            <div className="flex items-start justify-between gap-3">
              <div className="flex min-w-0 items-start gap-3">
                <span className={`flex size-9 shrink-0 items-center justify-center rounded-md ${target.statusKey === 'Breached' ? 'bg-destructive text-destructive-foreground' : target.statusKey === 'Warning' || target.statusKey === 'Paused' ? 'bg-primary text-primary-foreground' : 'bg-accent text-accent-foreground'}`}>{target.statusKey === 'Paused' ? <PauseCircle className="size-4" /> : target.statusKey === 'Warning' || target.statusKey === 'Breached' ? <AlertTriangle className="size-4" /> : <Clock3 className="size-4" />}</span>
                <div className="min-w-0"><p className="text-xs font-medium text-muted-foreground">Resolution target</p><p className="text-base font-semibold">{formatDueDate(target.dueAt)}</p><p className="text-xs text-muted-foreground">{new Date(target.dueAt).toLocaleString()}</p></div>
              </div>
              <Badge variant={target.statusKey === 'Breached' ? 'destructive' : target.statusKey === 'Warning' ? 'default' : target.statusKey === 'Met' ? 'secondary' : 'outline'}>{slaStatusLabel}</Badge>
            </div>
            <div className="mt-3 space-y-1.5">
              <div className="flex items-center justify-between gap-3 text-xs"><span>{target.statusKey === 'Breached' ? 'Target exceeded' : target.statusKey === 'Met' ? 'Target completed' : target.statusKey === 'Paused' ? 'Timer paused' : `${Math.max(0, target.remainingMinutes)} min remaining`}</span><span>{Math.round(slaProgress)}% elapsed</span></div>
              <Progress value={slaProgress} aria-label={`${Math.round(slaProgress)} percent of SLA time elapsed`} />
            </div>
            <p className="mt-2 text-xs text-muted-foreground">{slaGuidance}</p>
            {escalationGuidance && <div className="mt-3 rounded-md border bg-secondary p-3 text-secondary-foreground">
              <div className="flex items-start gap-2"><MessageSquare className="mt-0.5 size-4 shrink-0" /><div><p className="text-sm font-semibold">Need to escalate?</p><p className="mt-1 text-xs">{escalationGuidance}</p></div></div>
              <Button type="button" variant="outline" size="sm" className="mt-3" onClick={() => { setActiveSection('home'); window.setTimeout(() => composerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 0); }}>Contact support team</Button>
            </div>}
          </section>}
          <dl className="grid grid-cols-2 gap-2 text-sm">
            {[
              { label: 'Priority', value: request.priorityKey, critical: true },
              { label: 'Status', value: request.statusKey, critical: true },
              { label: 'Service', value: request.serviceCode, critical: false },
              { label: 'Site', value: request.siteCode, critical: false },
              { label: 'Requester', value: request.requester.displayName, critical: false },
              { label: 'Created by', value: request.createdBy.displayName, critical: false },
              { label: 'Submitted', value: new Date(request.createdAt).toLocaleString(), critical: false },
            ].map((detail: { label: string; value: string; critical: boolean }) => <div key={detail.label} className={`min-w-0 rounded-md border p-2.5 ${detail.critical ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'}`}><dt className="text-xs font-medium">{detail.label}</dt><dd className={`mt-1 break-words font-semibold ${detail.critical ? 'text-secondary-foreground' : 'text-foreground'}`}>{detail.value}</dd></div>)}
          </dl>
          {!target && <div className="rounded-md border bg-muted p-3 text-sm text-muted-foreground">No service target is currently set for this request.</div>}
    <Dialog open={noteDialogOpen} onOpenChange={setNoteDialogOpen}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Add note</DialogTitle>
          <DialogDescription>Record a technician-only note or publish an update that the requester can see.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <RadioGroup value={noteVisibility} onValueChange={(value: string) => setNoteVisibility(value as 'internal' | 'public')} className="grid gap-3 sm:grid-cols-2">
            <Label htmlFor="note-internal" className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${noteVisibility === 'internal' ? 'bg-secondary text-secondary-foreground' : 'bg-card text-card-foreground'}`}>
              <RadioGroupItem id="note-internal" value="internal" className="mt-0.5" />
              <span><span className="flex items-center gap-1.5 font-semibold"><LockKeyhole className="size-4" />Internal</span><span className="mt-1 block text-xs">Visible to technicians only.</span></span>
            </Label>
            <Label htmlFor="note-public" className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 ${noteVisibility === 'public' ? 'bg-primary text-primary-foreground' : 'bg-card text-card-foreground'}`}>
              <RadioGroupItem id="note-public" value="public" className="mt-0.5" />
              <span><span className="flex items-center gap-1.5 font-semibold"><UsersRound className="size-4" />Public</span><span className="mt-1 block text-xs">Added to the requester conversation.</span></span>
            </Label>
          </RadioGroup>
          <div className="space-y-2">
            <Label htmlFor="note-body">Note</Label>
            <Textarea id="note-body" value={noteBody} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setNoteBody(event.target.value)} placeholder={noteVisibility === 'internal' ? 'Add troubleshooting context, handover details, or next steps…' : 'Write an update for the requester…'} className="min-h-32 resize-y" />
          </div>
          <div className={`rounded-md border p-3 text-sm ${noteVisibility === 'internal' ? 'bg-secondary text-secondary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {noteVisibility === 'internal' ? 'This note will never appear in the requester portal.' : 'The requester will see this note in the conversation and request timeline.'}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setNoteDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => void addNote()} disabled={!noteBody.trim() || createActivity.isPending}>{noteVisibility === 'internal' ? <LockKeyhole className="size-4" /> : <Send className="size-4" />}Add {noteVisibility} note</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

        </CardContent></Card>}
      </aside>}
    </div>
    <Dialog open={previewAttachment !== null} onOpenChange={(open: boolean) => { if (!open) setPreviewAttachment(null); }}><DialogContent className="sm:max-w-2xl"><DialogHeader><DialogTitle>{previewAttachment?.fileName ?? 'Attachment preview'}</DialogTitle><DialogDescription>{previewAttachment ? `${previewAttachment.contentType} · ${formatFileSize(previewAttachment.fileSizeBytes)}` : 'Attachment details'}</DialogDescription></DialogHeader>{previewAttachment && <div className="space-y-4"><div className="flex min-h-64 items-center justify-center rounded-lg border bg-muted text-muted-foreground"><AttachmentThumbnail attachment={previewAttachment} source={imagePreviews[previewAttachment.id]} size="lg" /></div><div className="flex items-center gap-2 rounded-md border bg-secondary p-3 text-secondary-foreground"><ShieldCheck className="size-4" /><div><p className="text-sm font-semibold">Security scan passed</p><p className="text-xs">File type and size validated before upload.</p></div></div>{!imagePreviews[previewAttachment.id] && <p className="text-sm text-muted-foreground">Preview is unavailable for this stored demo file.</p>}<div className="flex flex-wrap gap-2"><Button variant="outline" onClick={downloadPreview}><Download className="size-4" />{imagePreviews[previewAttachment.id] ? 'Download file' : 'Content unavailable'}</Button>{previewAttachment.uploadedBy.id === currentPerson.id && Date.now() - new Date(previewAttachment.createdAt).getTime() <= 15 * 60 * 1000 && <AlertDialog><AlertDialogTrigger asChild><Button variant="destructive"><Trash2 className="size-4" />Delete recent upload</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Delete this attachment?</AlertDialogTitle><AlertDialogDescription>You can only delete your own recent uploads. This action cannot be undone.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep file</AlertDialogCancel><AlertDialogAction onClick={() => void removeAttachment(previewAttachment)}>Delete attachment</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}</div></div>}</DialogContent></Dialog>
    {showBackToTop && <Button type="button" size="icon-lg" className="fixed bottom-6 right-6 z-40 rounded-full shadow-lg" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label="Back to top" title="Back to top"><ArrowUp className="size-5" /></Button>}
  </div></main>;
}
