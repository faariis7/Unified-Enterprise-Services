import { useMemo, useState } from 'react';
import { GitBranch, Link2, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateRequest, useRequestList } from '@/generated/hooks/use-request';
import { useCreateRequestFieldValue } from '@/generated/hooks/use-request-field-value';
import { useCreateRequestRelationship, useDeleteRequestRelationship } from '@/generated/hooks/use-request-relationship';
import type { Request } from '@/generated/models/request-model';
import type { RequestFieldValue } from '@/generated/models/request-field-value-model';
import type { RequestRelationship, RequestRelationshipRelationshipTypeKey } from '@/generated/models/request-relationship-model';
import type { Workspace } from '@/generated/models/workspace-model';
import { buildChildRequest, calculateRelationshipProgress, inverseRelationshipType, mapParentAnswers, parseFieldMappings, relationshipExists, relationshipLabels } from '@/lib/request-relationship-runtime';

type Props = {
  request: Request;
  relationships: RequestRelationship[];
  fieldValues: RequestFieldValue[];
  workspace: Workspace;
  workspaceCode: string;
  actor: { id: string; displayName: string };
  canManage: boolean;
};

const relationshipTypes: RequestRelationshipRelationshipTypeKey[] = ['Related', 'Duplicate', 'Blocks', 'BlockedBy', 'Parent', 'Child'];

export function RequestRelationshipsPanel({ request, relationships, fieldValues, workspace, workspaceCode, actor, canManage }: Props) {
  const [open, setOpen] = useState(false);
  const [targetId, setTargetId] = useState('');
  const [type, setType] = useState<RequestRelationshipRelationshipTypeKey>('Related');
  const [childMode, setChildMode] = useState(false);
  const [childTitle, setChildTitle] = useState('');
  const [childService, setChildService] = useState('');
  const [fieldMapping, setFieldMapping] = useState('');
  const { data: workspaceRequests = [] } = useRequestList({ filter: `workspace/id eq '${workspace.id}'`, orderBy: ['createdAt desc'] });
  const createRelationship = useCreateRequestRelationship();
  const deleteRelationship = useDeleteRequestRelationship();
  const createRequest = useCreateRequest();
  const createFieldValue = useCreateRequestFieldValue();
  const relatedById = useMemo(() => new Map(workspaceRequests.map((item: Request) => [item.id, item])), [workspaceRequests]);
  const linked = relationships.map((relationship: RequestRelationship) => ({ relationship, request: relatedById.get(relationship.relatedRequestId.id) })).filter((entry: { relationship: RequestRelationship; request: Request | undefined }): entry is { relationship: RequestRelationship; request: Request } => Boolean(entry.request));
  const children = linked.filter((entry: { relationship: RequestRelationship; request: Request }) => entry.relationship.relationshipTypeKey === 'Child').map((entry: { relationship: RequestRelationship; request: Request }) => entry.request);
  const progress = calculateRelationshipProgress(children);
  const candidates = workspaceRequests.filter((item: Request) => item.id !== request.id && !relationships.some((relationship: RequestRelationship) => relationship.relatedRequestId.id === item.id));

  const addRelationship = async () => {
    const target = relatedById.get(targetId);
    if (!target || relationshipExists(relationships, request.id, target.id, type)) return;
    try {
      const now = new Date().toISOString();
      await createRelationship.mutateAsync({ relationshipName: `${request.requestNumber} ${type} ${target.requestNumber}`, createdAt: now, createdBy: actor, relatedRequestId: { id: target.id, requestNumber: target.requestNumber }, relationshipTypeKey: type, requestId: { id: request.id, requestNumber: request.requestNumber }, workspaceId: { id: workspace.id, workspaceName: workspace.workspaceName } });
      await createRelationship.mutateAsync({ relationshipName: `${target.requestNumber} ${inverseRelationshipType[type]} ${request.requestNumber}`, createdAt: now, createdBy: actor, relatedRequestId: { id: request.id, requestNumber: request.requestNumber }, relationshipTypeKey: inverseRelationshipType[type], requestId: { id: target.id, requestNumber: target.requestNumber }, workspaceId: { id: workspace.id, workspaceName: workspace.workspaceName } });
      setTargetId(''); setOpen(false); toast.success('Request relationship added');
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Unable to add relationship'); }
  };

  const createChild = async () => {
    if (!childTitle.trim() || !childService.trim()) return;
    try {
      const childNumber = `${request.requestNumber}-C${children.length + 1}`;
      const child = await createRequest.mutateAsync(buildChildRequest(request, childNumber, childService.trim(), childTitle.trim()));
      const now = new Date().toISOString();
      await createRelationship.mutateAsync({ relationshipName: `${request.requestNumber} Child ${child.requestNumber}`, createdAt: now, createdBy: actor, relatedRequestId: { id: child.id, requestNumber: child.requestNumber }, relationshipTypeKey: 'Child', requestId: { id: request.id, requestNumber: request.requestNumber }, workspaceId: { id: workspace.id, workspaceName: workspace.workspaceName } });
      await createRelationship.mutateAsync({ relationshipName: `${child.requestNumber} Parent ${request.requestNumber}`, createdAt: now, createdBy: actor, relatedRequestId: { id: request.id, requestNumber: request.requestNumber }, relationshipTypeKey: 'Parent', requestId: { id: child.id, requestNumber: child.requestNumber }, workspaceId: { id: workspace.id, workspaceName: workspace.workspaceName } });
      const mapped = mapParentAnswers(fieldValues, parseFieldMappings(fieldMapping));
      for (const value of mapped) {
        const source = fieldValues.find((item: RequestFieldValue) => item.stableFieldKey === parseFieldMappings(fieldMapping).find((mapping) => mapping.targetKey === value.stableFieldKey)?.sourceKey);
        if (!source) continue;
        await createFieldValue.mutateAsync({ ...value, requestId: { id: child.id, requestNumber: child.requestNumber }, fieldDefinitionId: source.fieldDefinitionId, formVersion: child.formVersion, workspaceId: { id: workspace.id, workspaceName: workspace.workspaceName }, updatedAt: now, updatedBy: actor });
      }
      setChildTitle(''); setChildService(''); setFieldMapping(''); setOpen(false); toast.success(`Child request ${child.requestNumber} created`);
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Unable to create child request'); }
  };

  return <Card className="border-l-4 border-l-primary"><CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between"><div><CardTitle className="flex items-center gap-2 text-base"><GitBranch className="size-4" />Coordinated requests</CardTitle><CardDescription>Dependencies and cross-department work linked to this request.</CardDescription></div>{canManage && <Button size="sm" variant="outline" onClick={() => setOpen(true)}><Plus className="size-4" />Add relationship</Button>}</CardHeader><CardContent className="space-y-4">
    {children.length > 0 && <div className="rounded-lg border bg-card p-3 text-card-foreground"><div className="flex items-center justify-between text-sm"><span className="font-medium">Child request progress</span><span>{progress.completed} of {progress.total} complete</span></div><Progress className="mt-2" value={progress.percent} aria-label={`${progress.percent} percent of child requests complete`} /><div className="mt-2 flex gap-2"><Badge variant="secondary">{progress.active} active</Badge>{progress.blocked > 0 && <Badge variant="destructive">{progress.blocked} blocked</Badge>}</div></div>}
    {linked.length === 0 ? <div className="rounded-md bg-muted p-4 text-sm text-muted-foreground">No request relationships have been added.</div> : <div className="space-y-2">{linked.map(({ relationship, request: linkedRequest }: { relationship: RequestRelationship; request: Request }) => <div key={relationship.id} className="flex items-center gap-3 rounded-md border bg-card p-3 text-card-foreground"><Link2 className="size-4 shrink-0" /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><Link className="font-medium underline-offset-4 hover:underline" to={`/w/${workspaceCode}/${canManage ? 'requests' : 'portal/requests'}/${linkedRequest.id}`}>{linkedRequest.requestNumber}</Link><Badge variant="outline">{relationshipLabels[relationship.relationshipTypeKey]}</Badge><Badge variant={linkedRequest.statusKey === 'Closed' || linkedRequest.statusKey === 'Resolved' ? 'secondary' : 'outline'}>{linkedRequest.statusKey}</Badge></div><p className="truncate text-sm text-muted-foreground">{linkedRequest.title}</p></div>{canManage && <Button size="icon-sm" variant="ghost" aria-label={`Remove relationship to ${linkedRequest.requestNumber}`} onClick={() => void deleteRelationship.mutateAsync(relationship.id).then(() => toast.success('Relationship removed'))}><Trash2 className="size-4" /></Button>}</div>)}</div>}
    <Dialog open={open} onOpenChange={setOpen}><DialogContent className="sm:max-w-xl"><DialogHeader><DialogTitle>{childMode ? 'Create child request' : 'Link request'}</DialogTitle><DialogDescription>{childMode ? 'Create coordinated work and optionally map typed answers from the parent.' : 'Connect an existing request using a governed relationship type.'}</DialogDescription></DialogHeader><div className="space-y-4"><div className="flex gap-2"><Button variant={childMode ? 'outline' : 'default'} onClick={() => setChildMode(false)}>Link existing</Button><Button variant={childMode ? 'default' : 'outline'} onClick={() => setChildMode(true)}>Create child</Button></div>{childMode ? <><div className="space-y-2"><Label htmlFor="child-title">Child request title</Label><Input id="child-title" value={childTitle} onChange={(event) => setChildTitle(event.target.value)} /></div><div className="space-y-2"><Label htmlFor="child-service">Service code</Label><Input id="child-service" value={childService} onChange={(event) => setChildService(event.target.value)} placeholder="HR-ONBOARDING" /></div><div className="space-y-2"><Label htmlFor="field-map">Field mapping</Label><Input id="field-map" value={fieldMapping} onChange={(event) => setFieldMapping(event.target.value)} placeholder="employee_name->employee_name, start_date->start_date" /><p className="text-xs text-muted-foreground">Use comma-separated stable field keys in source-&gt;target format.</p></div><Button onClick={() => void createChild()} disabled={!childTitle.trim() || !childService.trim() || createRequest.isPending}>Create child request</Button></> : <><div className="space-y-2"><Label>Relationship</Label><Select value={type} onValueChange={(value: RequestRelationshipRelationshipTypeKey) => setType(value)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{relationshipTypes.map((value: RequestRelationshipRelationshipTypeKey) => <SelectItem key={value} value={value}>{relationshipLabels[value]}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Request</Label><Select value={targetId || 'none'} onValueChange={(value: string) => setTargetId(value === 'none' ? '' : value)}><SelectTrigger><SelectValue placeholder="Select request" /></SelectTrigger><SelectContent><SelectItem value="none">Select request</SelectItem>{candidates.filter((item: Request) => Boolean(item.id)).map((item: Request) => <SelectItem key={item.id} value={item.id}>{item.requestNumber} · {item.title}</SelectItem>)}</SelectContent></Select></div><Button onClick={() => void addRelationship()} disabled={!targetId || createRelationship.isPending}>Add relationship</Button></>}</div></DialogContent></Dialog>
  </CardContent></Card>;
}
