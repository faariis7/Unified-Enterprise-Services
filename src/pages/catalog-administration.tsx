import { useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { ExternalLink, Pencil, Plus, Search, Settings2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCatalogItemList, useCreateCatalogItem, useUpdateCatalogItem } from '@/generated/hooks/use-catalog-item';
import { useCatalogItemAudienceList } from '@/generated/hooks/use-catalog-item-audience';
import { useCatalogItemFormAssignmentList } from '@/generated/hooks/use-catalog-item-form-assignment';
import { useFormDefinitionList } from '@/generated/hooks/use-form-definition';
import type { FormDefinition } from '@/generated/models/form-definition-model';
import { useServiceList } from '@/generated/hooks/use-service';
import type { CatalogItem, CatalogItemDefaultPriorityKey, CatalogItemStatusKey } from '@/generated/models/catalog-item-model';
import type { CatalogItemAudience } from '@/generated/models/catalog-item-audience-model';
import type { CatalogItemFormAssignment } from '@/generated/models/catalog-item-form-assignment-model';
import type { Service } from '@/generated/models/service-model';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';

const statuses: CatalogItemStatusKey[] = ['Draft', 'Published', 'Retired'];
const priorities: CatalogItemDefaultPriorityKey[] = ['Low', 'Medium', 'High', 'Critical'];

type EditDraft = {
  itemName: string;
  itemCode: string;
  shortDescription: string;
  formDefinitionId: string;
  requestTypeCode: string;
  serviceId: string;
  defaultPriorityKey: CatalogItemDefaultPriorityKey;
  serviceTargetHours: string;
  initialTaskTitle: string;
  requesterEligible: boolean;
  approvalRequired: boolean;
};

export default function CatalogAdministrationPage() {
  const { workspaceCode = '' } = useParams();
  const { activeWorkspace, can } = useWorkspaceContext();
  const { data: items = [], isLoading } = useCatalogItemList();
  const createItem = useCreateCatalogItem();
  const { data: forms = [] } = useFormDefinitionList();
  const { data: services = [] } = useServiceList();
  const { data: audiences = [] } = useCatalogItemAudienceList();
  const { data: assignments = [] } = useCatalogItemFormAssignmentList();
  const [isCreating, setIsCreating] = useState(false);
  const updateItem = useUpdateCatalogItem();
  const [search, setSearch] = useState('');
  const workspaceForms = useMemo(() => forms.filter((form: FormDefinition) => form.workspace.id === activeWorkspace?.id && form.statusKey !== 'Retired'), [activeWorkspace?.id, forms]);
  const formById = useMemo(() => new Map(workspaceForms.map((form: FormDefinition) => [form.id, form])), [workspaceForms]);
  const [status, setStatus] = useState('all');
  const [editingItem, setEditingItem] = useState<CatalogItem | null>(null);
  const [draft, setDraft] = useState<EditDraft | null>(null);

  const workspaceServices = useMemo(() => services.filter((service: Service) => service.workspace.id === activeWorkspace?.id), [activeWorkspace?.id, services]);
  const serviceById = useMemo(() => new Map(workspaceServices.map((service: Service) => [service.id, service])), [workspaceServices]);
  const readinessByItem = useMemo(() => new Map(items.map((item: CatalogItem) => {
    const hasAudience = audiences.some((audience: CatalogItemAudience) => audience.catalogItem.id === item.id && audience.workspace.id === activeWorkspace?.id && audience.statusKey === 'Active' && audience.isEligible);
    const hasForm = assignments.some((assignment: CatalogItemFormAssignment) => assignment.catalogItem.id === item.id && assignment.workspace.id === activeWorkspace?.id && assignment.statusKey === 'Active' && assignment.isDefault);
    const service = serviceById.get(item.service.id);
    return [item.id, { hasAudience, hasForm, serviceReady: Boolean(service?.requesterEligible && service.statusKey === 'Active') }];
  })), [activeWorkspace?.id, assignments, audiences, items, serviceById]);
  const visible = items.filter((item: CatalogItem) => item.workspace.id === activeWorkspace?.id).filter((item: CatalogItem) => status === 'all' || item.statusKey === status).filter((item: CatalogItem) => `${item.itemName} ${item.itemCode} ${item.shortDescription}`.toLowerCase().includes(search.toLowerCase()));

  if (!activeWorkspace) return <Navigate to="/no-workspace-access" replace />;
  if (!can('workspace.administer')) return <Navigate to={`/w/${workspaceCode}`} replace />;

  const openCreator = () => {
    setEditingItem(null);
    setIsCreating(true);
    setDraft({ itemName: '', itemCode: '', shortDescription: '', requestTypeCode: '', serviceId: workspaceServices[0]?.id ?? '', formDefinitionId: workspaceForms[0]?.id ?? '', defaultPriorityKey: 'Medium', serviceTargetHours: '24', initialTaskTitle: '', requesterEligible: false, approvalRequired: false });
  };

  const closeEditor = () => {
    setEditingItem(null);
    setIsCreating(false);
    setDraft(null);
  };

  const openEditor = (item: CatalogItem) => {
    setIsCreating(false);
    setEditingItem(item);
    setDraft({ itemName: item.itemName, itemCode: item.itemCode, shortDescription: item.shortDescription, requestTypeCode: item.requestTypeCode, serviceId: item.service.id, formDefinitionId: item.formDefinition.id, defaultPriorityKey: item.defaultPriorityKey, serviceTargetHours: String(item.serviceTargetHours), initialTaskTitle: item.initialTaskTitle ?? '', requesterEligible: item.requesterEligible, approvalRequired: item.approvalRequired });
  };

  const changeStatus = async (item: CatalogItem, nextStatus: CatalogItemStatusKey) => {
    const readiness = readinessByItem.get(item.id);
    if (nextStatus === 'Published' && (!readiness?.hasAudience || !readiness.hasForm || !readiness.serviceReady)) {
      toast.error('Add an active audience, default published form, and requester-eligible service before publishing.');
      return;
    }
    await updateItem.mutateAsync({ id: item.id, changedFields: { statusKey: nextStatus } });
    toast.success(`${item.itemName} is now ${nextStatus.toLowerCase()}.`);
  };

  const saveItem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!draft) return;
    const service = serviceById.get(draft.serviceId);
    const formDefinition = formById.get(draft.formDefinitionId);
    const targetHours = Number(draft.serviceTargetHours);
    if (!draft.itemName.trim() || !draft.itemCode.trim() || !draft.shortDescription.trim() || !draft.requestTypeCode.trim() || !service || !formDefinition) {
      toast.error('Complete all required catalog item fields.');
      return;
    }
    if (!Number.isFinite(targetHours) || targetHours <= 0) {
      toast.error('Service target hours must be greater than zero.');
      return;
    }
    const duplicateCode = items.some((item: CatalogItem) => item.workspace.id === activeWorkspace.id && item.itemCode.toLowerCase() === draft.itemCode.trim().toLowerCase() && item.id !== editingItem?.id);
    if (duplicateCode) {
      toast.error('Item code must be unique in this workspace.');
      return;
    }
    const itemData = { itemName: draft.itemName.trim(), itemCode: draft.itemCode.trim(), shortDescription: draft.shortDescription.trim(), requestTypeCode: draft.requestTypeCode.trim(), service: { id: service.id, serviceName: service.serviceName }, formDefinition: { id: formDefinition.id, name1: formDefinition.name1 }, defaultPriorityKey: draft.defaultPriorityKey, serviceTargetHours: targetHours, initialTaskTitle: draft.initialTaskTitle.trim() || undefined, requesterEligible: draft.requesterEligible, approvalRequired: draft.approvalRequired };
    if (editingItem) {
      await updateItem.mutateAsync({ id: editingItem.id, changedFields: itemData });
      toast.success(`${draft.itemName.trim()} was updated.`);
    } else {
      await createItem.mutateAsync({ ...itemData, statusKey: 'Draft', workspace: { id: activeWorkspace.id, workspaceName: activeWorkspace.workspaceName } });
      toast.success(`${draft.itemName.trim()} was created as a draft.`);
    }
    closeEditor();
  };

  return <main className="flex-1 p-4 md:p-6"><div className="mx-auto max-w-7xl space-y-5">
    <header className="flex flex-wrap items-end justify-between gap-4"><div><div className="flex items-center gap-2"><Settings2 className="size-5" /><Badge variant="secondary">{activeWorkspace.workspaceName}</Badge></div><h1 className="mt-2 text-2xl font-semibold">Catalog administration</h1><p className="text-sm text-muted-foreground">Create and edit item details, review publication readiness, and control requester availability.</p></div><div className="flex gap-2"><Button variant="outline" asChild><Link to={`/w/${workspaceCode}/settings/service-builder`}>Service builder</Link></Button><Button variant="outline" asChild><Link to={`/w/${workspaceCode}/catalog`}>Open catalog<ExternalLink className="size-4" /></Link></Button><Button onClick={openCreator} disabled={workspaceServices.length === 0 || workspaceForms.length === 0}><Plus className="size-4" />New item</Button></div></header>
    <Card><CardHeader className="gap-3 border-b md:flex-row md:items-center md:justify-between"><div><CardTitle className="text-base">Catalog items</CardTitle><CardDescription>Publishing is blocked until every required configuration is ready.</CardDescription></div><div className="flex w-full gap-2 md:w-auto"><div className="relative flex-1 md:w-72"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)} placeholder="Search items" /></div><Select value={status} onValueChange={setStatus}><SelectTrigger className="w-40"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{statuses.filter((value: CatalogItemStatusKey) => Boolean(value)).map((value: CatalogItemStatusKey) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div></CardHeader>
      <CardContent className="p-0"><Table><TableHeader><TableRow><TableHead>Item</TableHead><TableHead>Service</TableHead><TableHead>Readiness</TableHead><TableHead>Requester</TableHead><TableHead className="w-44">Status</TableHead><TableHead className="w-16"><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader><TableBody>{isLoading ? <TableRow><TableCell colSpan={6}>Loading catalog configuration…</TableCell></TableRow> : visible.length === 0 ? <TableRow><TableCell colSpan={6}>No matching catalog items.</TableCell></TableRow> : visible.map((item: CatalogItem) => { const readiness = readinessByItem.get(item.id); const readyCount = [readiness?.hasAudience, readiness?.hasForm, readiness?.serviceReady].filter(Boolean).length; return <TableRow key={item.id}><TableCell><p className="font-medium">{item.itemName}</p><p className="text-sm text-muted-foreground">{item.itemCode} · {item.shortDescription}</p></TableCell><TableCell>{serviceById.get(item.service.id)?.serviceName ?? 'Unavailable'}</TableCell><TableCell><Badge variant={readyCount === 3 ? 'default' : 'outline'}>{readyCount}/3 ready</Badge><p className="mt-1 text-xs text-muted-foreground">Audience · form · service</p></TableCell><TableCell>{item.requesterEligible ? 'Eligible' : 'Hidden'}</TableCell><TableCell><Select value={item.statusKey} onValueChange={(value: CatalogItemStatusKey) => void changeStatus(item, value)} disabled={updateItem.isPending}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{statuses.filter((value: CatalogItemStatusKey) => Boolean(value)).map((value: CatalogItemStatusKey) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></TableCell><TableCell><Button variant="ghost" size="icon-sm" onClick={() => openEditor(item)} aria-label={`Edit ${item.itemName}`}><Pencil className="size-4" /></Button></TableCell></TableRow>; })}</TableBody></Table></CardContent>
    </Card>
    <Dialog open={Boolean(editingItem) || isCreating} onOpenChange={(open: boolean) => { if (!open) closeEditor(); }}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{isCreating ? 'Create catalog item' : 'Edit catalog item'}</DialogTitle><DialogDescription>{isCreating ? 'Create a draft item. Configure its audience and form assignment before publishing.' : 'Update requester-facing details and fulfillment defaults. Publication readiness is managed separately.'}</DialogDescription></DialogHeader>
        {draft && <form className="space-y-5" onSubmit={(event: FormEvent<HTMLFormElement>) => void saveItem(event)}>
          <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="item-name">Item name</Label><Input id="item-name" value={draft.itemName} onChange={(event: ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, itemName: event.target.value })} required /></div><div className="space-y-2"><Label htmlFor="item-code">Item code</Label><Input id="item-code" value={draft.itemCode} onChange={(event: ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, itemCode: event.target.value })} required /></div></div>
          <div className="space-y-2"><Label htmlFor="item-description">Short description</Label><Textarea id="item-description" value={draft.shortDescription} onChange={(event: ChangeEvent<HTMLTextAreaElement>) => setDraft({ ...draft, shortDescription: event.target.value })} required /></div>
          <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Service</Label><Select value={draft.serviceId} onValueChange={(value: string) => setDraft({ ...draft, serviceId: value })}><SelectTrigger><SelectValue placeholder="Select service" /></SelectTrigger><SelectContent>{workspaceServices.filter((service: Service) => Boolean(service.id)).map((service: Service) => <SelectItem key={service.id} value={service.id}>{service.serviceName}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Form definition</Label><Select value={draft.formDefinitionId} onValueChange={(value: string) => setDraft({ ...draft, formDefinitionId: value })}><SelectTrigger><SelectValue placeholder="Select form" /></SelectTrigger><SelectContent>{workspaceForms.filter((form: FormDefinition) => Boolean(form.id)).map((form: FormDefinition) => <SelectItem key={form.id} value={form.id}>{form.name1}</SelectItem>)}</SelectContent></Select></div></div>
          <div className="space-y-2"><Label htmlFor="request-type">Request type code</Label><Input id="request-type" value={draft.requestTypeCode} onChange={(event: ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, requestTypeCode: event.target.value })} required /></div>
          <div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Default priority</Label><Select value={draft.defaultPriorityKey} onValueChange={(value: CatalogItemDefaultPriorityKey) => setDraft({ ...draft, defaultPriorityKey: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{priorities.filter((value: CatalogItemDefaultPriorityKey) => Boolean(value)).map((value: CatalogItemDefaultPriorityKey) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="target-hours">Service target hours</Label><Input id="target-hours" type="number" min="1" step="1" value={draft.serviceTargetHours} onChange={(event: ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, serviceTargetHours: event.target.value })} required /></div></div>
          <div className="space-y-2"><Label htmlFor="task-title">Initial task title</Label><Input id="task-title" value={draft.initialTaskTitle} onChange={(event: ChangeEvent<HTMLInputElement>) => setDraft({ ...draft, initialTaskTitle: event.target.value })} placeholder="Optional fulfillment task" /></div>
          <div className="grid gap-3 sm:grid-cols-2"><div className="flex items-center justify-between rounded-lg border p-3"><div><Label htmlFor="requester-eligible">Requester eligible</Label><p className="text-xs text-muted-foreground">Show this item to eligible requesters.</p></div><Switch id="requester-eligible" checked={draft.requesterEligible} onCheckedChange={(checked: boolean) => setDraft({ ...draft, requesterEligible: checked })} /></div><div className="flex items-center justify-between rounded-lg border p-3"><div><Label htmlFor="approval-required">Approval required</Label><p className="text-xs text-muted-foreground">Route submissions through approval.</p></div><Switch id="approval-required" checked={draft.approvalRequired} onCheckedChange={(checked: boolean) => setDraft({ ...draft, approvalRequired: checked })} /></div></div>
          <DialogFooter><Button type="button" variant="outline" onClick={closeEditor}>Cancel</Button><Button type="submit" disabled={updateItem.isPending || createItem.isPending}>{updateItem.isPending || createItem.isPending ? 'Saving…' : isCreating ? 'Create draft' : 'Save changes'}</Button></DialogFooter>
        </form>}
      </DialogContent>
    </Dialog>
  </div></main>;
}
