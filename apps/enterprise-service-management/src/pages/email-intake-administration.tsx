import { useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { format } from 'date-fns';
import { Inbox, MailCheck, RefreshCw, Save, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InMemoryDataBanner } from '@/generated/components/in-memory-data-banner';
import { HAS_IN_MEMORY_TABLES } from '@/generated/hooks';
import { useCatalogItemList } from '@/generated/hooks/use-catalog-item';
import { useCreateEmailIntakeConfiguration, useEmailIntakeConfigurationList, useUpdateEmailIntakeConfiguration } from '@/generated/hooks/use-email-intake-configuration';
import { useEmailIntakeMessageList } from '@/generated/hooks/use-email-intake-message';
import { useServiceList } from '@/generated/hooks/use-service';
import type { CatalogItem } from '@/generated/models/catalog-item-model';

import type { EmailIntakeMessage, EmailIntakeMessageProcessingStatusKey } from '@/generated/models/email-intake-message-model';
import type { Service } from '@/generated/models/service-model';
import { useWorkspaceContext } from '@/contexts/workspace-context';

type ConfigurationDraft = {
  mailboxAddress: string;
  folderName: string;
  enabled: boolean;
  markAsRead: boolean;
  unknownSenderBehaviorKey: 'NeedsReview' | 'Reject';
  defaultServiceId: string;
  defaultCatalogItemId: string;
};

const emptyDraft: ConfigurationDraft = {
  mailboxAddress: '',
  folderName: 'Inbox',
  enabled: true,
  markAsRead: true,
  unknownSenderBehaviorKey: 'NeedsReview',
  defaultServiceId: 'none',
  defaultCatalogItemId: 'none',
};

function statusVariant(status: EmailIntakeMessageProcessingStatusKey): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'Processed') return 'default';
  if (status === 'Failed') return 'destructive';
  if (status === 'NeedsReview' || status === 'Duplicate') return 'secondary';
  return 'outline';
}

export default function EmailIntakeAdministrationPage() {
  const { activeWorkspace, currentPerson } = useWorkspaceContext();
  const workspaceFilter = activeWorkspace ? `workspace/id eq '${activeWorkspace.id}'` : 'id eq null';
  const { data: configurations = [] } = useEmailIntakeConfigurationList({ filter: workspaceFilter });
  const { data: messages = [], refetch: refetchMessages, isFetching } = useEmailIntakeMessageList({ filter: workspaceFilter, orderBy: ['receivedAt desc'] });
  const { data: services = [] } = useServiceList();
  const { data: catalogItems = [] } = useCatalogItemList();
  const createConfiguration = useCreateEmailIntakeConfiguration();
  const updateConfiguration = useUpdateEmailIntakeConfiguration();
  const configuration = configurations[0];
  const [draft, setDraft] = useState<ConfigurationDraft>(emptyDraft);
  const [loadedConfigurationId, setLoadedConfigurationId] = useState('');

  useEffect(() => {
    if (!configuration || loadedConfigurationId === configuration.id) return;
    setLoadedConfigurationId(configuration.id);
    setDraft({
      mailboxAddress: configuration.mailboxAddress,
      folderName: configuration.folderName,
      enabled: configuration.enabled,
      markAsRead: configuration.markAsRead,
      unknownSenderBehaviorKey: configuration.unknownSenderBehaviorKey,
      defaultServiceId: configuration.defaultService?.id ?? 'none',
      defaultCatalogItemId: configuration.defaultCatalogItem?.id ?? 'none',
    });
  }, [configuration, loadedConfigurationId]);

  const workspaceServices = useMemo(() => services.filter((service: Service) => service.workspace.id === activeWorkspace?.id && service.statusKey === 'Active'), [activeWorkspace?.id, services]);
  const workspaceCatalogItems = useMemo(() => catalogItems.filter((item: CatalogItem) => item.workspace.id === activeWorkspace?.id && item.statusKey !== 'Retired'), [activeWorkspace?.id, catalogItems]);
  const counts = useMemo(() => ({
    processed: messages.filter((message: EmailIntakeMessage) => message.processingStatusKey === 'Processed').length,
    review: messages.filter((message: EmailIntakeMessage) => message.processingStatusKey === 'NeedsReview').length,
    failed: messages.filter((message: EmailIntakeMessage) => message.processingStatusKey === 'Failed').length,
  }), [messages]);

  const saveConfiguration = async () => {
    if (!activeWorkspace || !currentPerson) return toast.error('Workspace or administrator context is unavailable.');
    if (!draft.mailboxAddress.trim() || !draft.folderName.trim()) return toast.error('Mailbox address and folder are required.');
    const service = workspaceServices.find((item: Service) => item.id === draft.defaultServiceId);
    const catalogItem = workspaceCatalogItems.find((item: CatalogItem) => item.id === draft.defaultCatalogItemId);
    const shared = {
      mailboxAddress: draft.mailboxAddress.trim(),
      folderName: draft.folderName.trim(),
      enabled: draft.enabled,
      markAsRead: draft.markAsRead,
      unknownSenderBehaviorKey: draft.unknownSenderBehaviorKey,
      lastSyncAt: configuration?.lastSyncAt ?? new Date(0).toISOString(),
      updatedBy: { id: currentPerson.id, displayName: currentPerson.displayName },
      workspace: { id: activeWorkspace.id, workspaceName: activeWorkspace.workspaceName },
      defaultService: service ? { id: service.id, serviceName: service.serviceName } : undefined,
      defaultCatalogItem: catalogItem ? { id: catalogItem.id, itemName: catalogItem.itemName } : undefined,
    };
    try {
      if (configuration) await updateConfiguration.mutateAsync({ id: configuration.id, changedFields: shared });
      else await createConfiguration.mutateAsync({ configurationName: `${activeWorkspace.workspaceName} email intake`, ...shared });
      toast.success('Email intake configuration saved.');
    } catch (error: unknown) {
      toast.error(error instanceof Error ? error.message : 'Unable to save email intake configuration.');
    }
  };

  const refreshMonitor = async () => {
    await refetchMessages();
    toast.success('Processing monitor refreshed.');
  };

  return (
    <main className="flex-1 bg-background p-5 text-foreground md:p-8">
      <InMemoryDataBanner show={HAS_IN_MEMORY_TABLES} message="This app uses draft tables for testing. Data entered won't be saved. Contact the app owner to enable storage." className="border-border bg-secondary text-secondary-foreground" />
      <div className="mx-auto mt-5 max-w-6xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div><div className="mb-2 flex items-center gap-2"><Inbox className="size-5" /><Badge>Workspace scope</Badge></div><h1 className="text-2xl font-semibold">Email request intake</h1><p className="mt-1 text-sm text-muted-foreground">Configure a monitored mailbox and review the idempotent request processing trail for {activeWorkspace?.workspaceName}.</p></div>
          <Button variant="outline" onClick={() => void refreshMonitor()} disabled={isFetching}><RefreshCw className="size-4" />Refresh monitor</Button>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <Card><CardHeader className="pb-2"><CardDescription>Processed</CardDescription><CardTitle className="text-2xl">{counts.processed}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Requests or replies created</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Needs review</CardDescription><CardTitle className="text-2xl">{counts.review}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Unknown senders or incomplete matches</p></CardContent></Card>
          <Card><CardHeader className="pb-2"><CardDescription>Failed</CardDescription><CardTitle className="text-2xl">{counts.failed}</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">Safe to retry after correction</p></CardContent></Card>
        </div>

        <Tabs defaultValue="configuration">
          <TabsList><TabsTrigger value="configuration">Configuration</TabsTrigger><TabsTrigger value="monitor">Processing monitor</TabsTrigger></TabsList>
          <TabsContent value="configuration" className="mt-4">
            <Card><CardHeader><CardTitle>Mailbox connection policy</CardTitle><CardDescription>One active intake configuration is supported per workspace. Microsoft message ID is retained as the deduplication key.</CardDescription></CardHeader><CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2"><div className="space-y-2"><Label htmlFor="mailbox-address">Mailbox address</Label><Input id="mailbox-address" type="email" value={draft.mailboxAddress} placeholder="support@example.com" onChange={(event: ChangeEvent<HTMLInputElement>) => setDraft((current: ConfigurationDraft) => ({ ...current, mailboxAddress: event.target.value }))} /></div><div className="space-y-2"><Label htmlFor="folder-name">Folder</Label><Input id="folder-name" value={draft.folderName} onChange={(event: ChangeEvent<HTMLInputElement>) => setDraft((current: ConfigurationDraft) => ({ ...current, folderName: event.target.value }))} /></div></div>
              <div className="grid gap-4 md:grid-cols-3"><div className="space-y-2"><Label>Default service</Label><Select value={draft.defaultServiceId} onValueChange={(value: string) => setDraft((current: ConfigurationDraft) => ({ ...current, defaultServiceId: value }))}><SelectTrigger><SelectValue placeholder="No default" /></SelectTrigger><SelectContent><SelectItem value="none">No default</SelectItem>{workspaceServices.filter((item: Service) => item.id).map((item: Service) => <SelectItem key={item.id} value={item.id}>{item.serviceName}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Default catalog item</Label><Select value={draft.defaultCatalogItemId} onValueChange={(value: string) => setDraft((current: ConfigurationDraft) => ({ ...current, defaultCatalogItemId: value }))}><SelectTrigger><SelectValue placeholder="No default" /></SelectTrigger><SelectContent><SelectItem value="none">No default</SelectItem>{workspaceCatalogItems.filter((item: CatalogItem) => item.id).map((item: CatalogItem) => <SelectItem key={item.id} value={item.id}>{item.itemName}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Unknown sender</Label><Select value={draft.unknownSenderBehaviorKey} onValueChange={(value: 'NeedsReview' | 'Reject') => setDraft((current: ConfigurationDraft) => ({ ...current, unknownSenderBehaviorKey: value }))}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="NeedsReview">Route to review</SelectItem><SelectItem value="Reject">Reject</SelectItem></SelectContent></Select></div></div>
              <div className="grid gap-3 md:grid-cols-2"><div className="flex items-center justify-between rounded-lg border border-border p-4"><div><p className="font-medium">Enable intake</p><p className="text-sm text-muted-foreground">Allow scheduled processing for this mailbox.</p></div><Switch checked={draft.enabled} onCheckedChange={(checked: boolean) => setDraft((current: ConfigurationDraft) => ({ ...current, enabled: checked }))} /></div><div className="flex items-center justify-between rounded-lg border border-border p-4"><div><p className="font-medium">Mark processed mail as read</p><p className="text-sm text-muted-foreground">Apply after the processing outcome is recorded.</p></div><Switch checked={draft.markAsRead} onCheckedChange={(checked: boolean) => setDraft((current: ConfigurationDraft) => ({ ...current, markAsRead: checked }))} /></div></div>
              <div className="flex flex-col gap-3 rounded-lg bg-secondary p-4 text-secondary-foreground sm:flex-row sm:items-center sm:justify-between"><div className="flex items-start gap-3"><ShieldAlert className="mt-0.5 size-5" /><div><p className="font-medium">Safe processing contract</p><p className="text-sm">Duplicates never create a second request; replies match by conversation ID and every outcome is auditable.</p></div></div><Button onClick={() => void saveConfiguration()} disabled={createConfiguration.isPending || updateConfiguration.isPending}><Save className="size-4" />Save configuration</Button></div>
            </CardContent></Card>
          </TabsContent>
          <TabsContent value="monitor" className="mt-4">
            <Card><CardHeader><CardTitle>Recent email processing</CardTitle><CardDescription>Operational outcomes are recorded before mailbox state changes.</CardDescription></CardHeader><CardContent><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Received</TableHead><TableHead>Sender</TableHead><TableHead>Subject</TableHead><TableHead>Status</TableHead><TableHead>Request</TableHead><TableHead>Attempts</TableHead></TableRow></TableHeader><TableBody>{messages.map((message: EmailIntakeMessage) => <TableRow key={message.id}><TableCell className="whitespace-nowrap">{format(new Date(message.receivedAt), 'dd MMM, HH:mm')}</TableCell><TableCell><p className="font-medium">{message.senderName}</p><p className="text-xs text-muted-foreground">{message.senderEmail}</p></TableCell><TableCell className="max-w-xs"><p className="truncate font-medium">{message.subject}</p><p className="truncate text-xs text-muted-foreground">{message.outcomeDetail}</p></TableCell><TableCell><Badge variant={statusVariant(message.processingStatusKey)}>{message.processingStatusKey}</Badge></TableCell><TableCell>{message.matchedRequest?.requestNumber ?? '—'}</TableCell><TableCell>{message.attemptCount}</TableCell></TableRow>)}</TableBody></Table></div>{messages.length === 0 && <div className="flex flex-col items-center gap-2 py-12 text-center"><MailCheck className="size-8" /><p className="font-medium">No messages processed</p><p className="text-sm text-muted-foreground">Processing records will appear after the mailbox workflow runs.</p></div>}</CardContent></Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}
