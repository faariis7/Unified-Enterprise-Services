import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ClipboardCheck, MailCheck, RotateCcw, Save, Settings2, Workflow } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { SettingValueField } from '@/components/setting-value-field';
import { StructuredSettingField, isSupportedStructuredSetting } from '@/components/structured-setting-field';
import { useCreateConfigurationAuditEvent } from '@/generated/hooks/use-configuration-audit-event';
import { useGlobalSettingList } from '@/generated/hooks/use-global-setting';
import { usePersonList } from '@/generated/hooks/use-person';
import { useCreateWorkspaceSettingOverride, useDeleteWorkspaceSettingOverride, useUpdateWorkspaceSettingOverride, useWorkspaceSettingOverrideList } from '@/generated/hooks/use-workspace-setting-override';
import type { Person } from '@/generated/models/person-model';
import { useUser } from '@/hooks/use-user';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { normalizeSettingInput, resolveWorkspaceSettings, workspaceAdministrationSections, type EffectiveSetting } from '@/lib/administration';

export default function WorkspaceAdministrationPage() {
  const { activeWorkspace, currentPerson } = useWorkspaceContext();
  const { data: globals = [] } = useGlobalSettingList();
  const { data: overrides = [] } = useWorkspaceSettingOverrideList({ filter: activeWorkspace ? `workspace/id eq '${activeWorkspace.id}'` : 'id eq null' });
  const { data: people = [] } = usePersonList();
  const { data: user } = useUser();
  const createOverride = useCreateWorkspaceSettingOverride();
  const updateOverride = useUpdateWorkspaceSettingOverride();
  const deleteOverride = useDeleteWorkspaceSettingOverride();
  const createAudit = useCreateConfigurationAuditEvent();
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const settings = useMemo(() => resolveWorkspaceSettings(globals, overrides, activeWorkspace?.id ?? ''), [activeWorkspace?.id, globals, overrides]);
  const actor = people.find((person: Person) => person.id === user?.objectId) ?? people.find((person: Person) => person.id === currentPerson?.id);

  const setOverride = async (setting: EffectiveSetting) => {
    if (!actor || !activeWorkspace) return toast.error('Workspace, person, or access context is unavailable.');
    const draftValue = drafts[setting.globalSetting.id] ?? setting.effectiveValue;
    const nextValue = setting.globalSetting.valueTypeKey === 'JSON' && isSupportedStructuredSetting(setting.globalSetting.settingKey) ? (() => { try { JSON.parse(draftValue); return JSON.stringify(JSON.parse(draftValue)); } catch { return undefined; } })() : normalizeSettingInput(draftValue, setting.globalSetting.valueTypeKey);
    if (nextValue === undefined) return toast.error('Enter a valid value that matches the setting schema.');
    try {
      const now = new Date().toISOString();
      if (setting.workspaceOverride) await updateOverride.mutateAsync({ id: setting.workspaceOverride.id, changedFields: { overrideValue: nextValue, active: true, updatedAt: now, updatedBy: { id: actor.id, displayName: actor.displayName } } });
      else await createOverride.mutateAsync({ workspaceSettingOverrideName: `${activeWorkspace.workspaceName} — ${setting.globalSetting.settingKey}`, active: true, globalSetting: { id: setting.globalSetting.id, settingKey: setting.globalSetting.settingKey }, overrideValue: nextValue, updatedAt: now, updatedBy: { id: actor.id, displayName: actor.displayName }, workspace: { id: activeWorkspace.id, workspaceName: activeWorkspace.workspaceName } });
      await createAudit.mutateAsync({ configurationAuditEventName: `${setting.globalSetting.settingKey} workspace override set`, actionKey: 'OverrideSet', actor: { id: actor.id, displayName: actor.displayName }, occurredAt: now, previousValue: setting.effectiveValue, newValue: nextValue, scopeKey: 'Workspace', settingKey: setting.globalSetting.settingKey, sourceKey: 'WorkspaceOverride', targetRecordID: activeWorkspace.id, workspace: { id: activeWorkspace.id, workspaceName: activeWorkspace.workspaceName } });
      setDrafts((current: Record<string, string>) => { const next = { ...current }; delete next[setting.globalSetting.id]; return next; });
      toast.success('Workspace override saved and audited.');
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Unable to save the override.'); }
  };

  const resetOverride = async (setting: EffectiveSetting) => {
    if (!actor || !activeWorkspace || !setting.workspaceOverride) return;
    try {
      await deleteOverride.mutateAsync(setting.workspaceOverride.id);
      await createAudit.mutateAsync({ configurationAuditEventName: `${setting.globalSetting.settingKey} workspace override reset`, actionKey: 'OverrideReset', actor: { id: actor.id, displayName: actor.displayName }, occurredAt: new Date().toISOString(), previousValue: setting.workspaceOverride.overrideValue, newValue: setting.globalSetting.value, scopeKey: 'Workspace', settingKey: setting.globalSetting.settingKey, sourceKey: 'GlobalDefault', targetRecordID: activeWorkspace.id, workspace: { id: activeWorkspace.id, workspaceName: activeWorkspace.workspaceName } });
      setDrafts((current: Record<string, string>) => ({ ...current, [setting.globalSetting.id]: setting.globalSetting.value }));
      toast.success('Override removed; the global default is effective.');
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Unable to reset the override.'); }
  };

  return (
    <main className="flex-1 bg-background p-5 text-foreground md:p-8"><div className="mx-auto max-w-6xl space-y-6">
      <header><div className="mb-2 flex items-center gap-2"><Settings2 className="size-5" /><Badge>Workspace scope</Badge></div><h1 className="text-2xl font-semibold">{activeWorkspace?.workspaceName} Administration</h1><p className="mt-1 text-sm text-muted-foreground">Changes are isolated to the active workspace and inherit global defaults when no override exists.</p></header>
      <Card><CardHeader><CardTitle>Workspace configuration</CardTitle><CardDescription>Only the active workspace can be managed here.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{workspaceAdministrationSections.map((section: string) => <Link key={section} to={`/w/${activeWorkspace?.workspaceKey.toLowerCase()}/settings/${section.toLowerCase().replaceAll(' ', '-')}`} className="rounded-md border border-border bg-card p-3 text-sm font-medium text-card-foreground transition hover:bg-muted">{section}</Link>)}</div><div className="grid gap-3 lg:grid-cols-3"><div className="flex flex-col gap-3 rounded-lg bg-secondary p-4 text-secondary-foreground sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><Workflow className="size-5" /><div><p className="font-medium">Automation Engine</p><p className="text-sm">Configure triggers, conditions, actions, and logs.</p></div></div><Button asChild><Link to={`/w/${activeWorkspace?.workspaceKey.toLowerCase()}/settings/automation`}>Open</Link></Button></div><div className="flex flex-col gap-3 rounded-lg bg-accent p-4 text-accent-foreground sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><MailCheck className="size-5" /><div><p className="font-medium">Email intake</p><p className="text-sm">Configure mailbox rules and monitor outcomes.</p></div></div><Button asChild variant="outline"><Link to={`/w/${activeWorkspace?.workspaceKey.toLowerCase()}/settings/email-intake`}>Configure</Link></Button></div><div className="flex flex-col gap-3 rounded-lg bg-primary p-4 text-primary-foreground sm:flex-row sm:items-center sm:justify-between"><div className="flex items-center gap-3"><ClipboardCheck className="size-5" /><div><p className="font-medium">Production readiness</p><p className="text-sm">Review governance and deployment dependencies.</p></div></div><Button asChild variant="secondary"><Link to={`/w/${activeWorkspace?.workspaceKey.toLowerCase()}/settings/readiness`}>Review</Link></Button></div></div></CardContent></Card>
      <Card><CardHeader><CardTitle>Inherited settings</CardTitle><CardDescription>Global default → workspace override → service or catalog item override → request-calculated value.</CardDescription></CardHeader><CardContent className="space-y-4">{settings.map((setting: EffectiveSetting) => <div key={setting.globalSetting.id} className="rounded-lg border border-border p-4"><div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end"><div><Label htmlFor={`workspace-${setting.globalSetting.id}`}>{setting.globalSetting.settingKey}</Label><p className="mt-1 text-sm text-muted-foreground">Effective value: <span className="font-medium text-foreground">{setting.effectiveValue}</span></p><div className="mt-2 flex gap-2"><Badge variant={setting.isOverridden ? 'default' : 'secondary'}>{setting.source}</Badge><Badge variant="outline">{setting.isOverridden ? 'Overridden' : 'Inherited'}</Badge></div></div>{setting.globalSetting.valueTypeKey === 'JSON' ? <StructuredSettingField id={`workspace-${setting.globalSetting.id}`} settingKey={setting.globalSetting.settingKey} value={drafts[setting.globalSetting.id] ?? setting.effectiveValue} onChange={(value: string) => setDrafts((current: Record<string, string>) => ({ ...current, [setting.globalSetting.id]: value }))} /> : <SettingValueField id={`workspace-${setting.globalSetting.id}`} value={drafts[setting.globalSetting.id] ?? setting.effectiveValue} valueType={setting.globalSetting.valueTypeKey} onChange={(value: string) => setDrafts((current: Record<string, string>) => ({ ...current, [setting.globalSetting.id]: value }))} />}<div className="flex gap-2"><Button onClick={() => void setOverride(setting)} disabled={setting.globalSetting.valueTypeKey === 'JSON' && !isSupportedStructuredSetting(setting.globalSetting.settingKey)}><Save className="size-4" />Override</Button>{setting.isOverridden && <Button variant="outline" onClick={() => void resetOverride(setting)}><RotateCcw className="size-4" />Reset</Button>}</div></div></div>)}</CardContent></Card>
    </div></main>
  );
}
