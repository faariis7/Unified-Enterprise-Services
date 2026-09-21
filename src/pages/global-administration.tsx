import { useEffect, useState } from 'react';
import { Globe2, Save, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { SettingValueField } from '@/components/setting-value-field';
import { StructuredSettingField, isSupportedStructuredSetting } from '@/components/structured-setting-field';
import { useCreateConfigurationAuditEvent } from '@/generated/hooks/use-configuration-audit-event';
import { useGlobalSettingList, useUpdateGlobalSetting } from '@/generated/hooks/use-global-setting';
import { usePersonList } from '@/generated/hooks/use-person';
import type { GlobalSetting } from '@/generated/models/global-setting-model';
import type { Person } from '@/generated/models/person-model';
import { useUser } from '@/hooks/use-user';
import { globalAdministrationSections, normalizeSettingInput } from '@/lib/administration';

export default function GlobalAdministrationPage() {
  const { data: settings = [], isLoading } = useGlobalSettingList();
  const { data: people = [] } = usePersonList();
  const { data: user } = useUser();
  const updateSetting = useUpdateGlobalSetting();
  const createAudit = useCreateConfigurationAuditEvent();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => setDrafts(Object.fromEntries(settings.map((setting: GlobalSetting) => [setting.id, setting.value]))), [settings]);
  const actor = people.find((person: Person) => person.id === user?.objectId);

  const saveSetting = async (setting: GlobalSetting) => {
    if (!actor) return toast.error('Your global person record could not be resolved.');
    const rawValue = drafts[setting.id] ?? setting.value;
    const nextValue = setting.valueTypeKey === 'JSON' && isSupportedStructuredSetting(setting.settingKey) ? (() => { try { JSON.parse(rawValue); return JSON.stringify(JSON.parse(rawValue)); } catch { return undefined; } })() : normalizeSettingInput(rawValue, setting.valueTypeKey);
    if (nextValue === undefined) return toast.error('Enter a valid value that matches the setting schema.');
    try {
      await updateSetting.mutateAsync({ id: setting.id, changedFields: { value: nextValue, updatedAt: new Date().toISOString(), updatedBy: { id: actor.id, displayName: actor.displayName } } });
      await createAudit.mutateAsync({ configurationAuditEventName: `${setting.settingKey} updated`, actionKey: 'Updated', actor: { id: actor.id, displayName: actor.displayName }, occurredAt: new Date().toISOString(), previousValue: setting.value, newValue: nextValue, scopeKey: 'Global', settingKey: setting.settingKey, sourceKey: 'GlobalDefault', targetRecordID: setting.id });
      toast.success('Global setting saved and audited.');
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Unable to save the setting.'); }
  };

  return (
    <main className="flex-1 bg-background p-5 text-foreground md:p-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4"><div><div className="mb-2 flex items-center gap-2"><Globe2 className="size-5" /><Badge>Global scope</Badge></div><h1 className="text-2xl font-semibold">Global Administration</h1><p className="mt-1 text-sm text-muted-foreground">Platform-wide configuration available only to authorized global roles.</p></div><Badge variant="outline"><ShieldCheck className="mr-1 size-3" />Role protected</Badge></header>
        <Card><CardHeader><CardTitle>Administration areas</CardTitle><CardDescription>These settings apply across every workspace unless an allowed lower-level override exists.</CardDescription></CardHeader><CardContent className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">{globalAdministrationSections.map((section: string) => <div key={section} className="rounded-md border border-border bg-card p-3 text-sm text-card-foreground">{section}</div>)}</CardContent></Card>
        <Card><CardHeader><CardTitle>Global defaults</CardTitle><CardDescription>Typed controls and registered structured editors prevent unrestricted configuration payloads.</CardDescription></CardHeader><CardContent className="space-y-4">{isLoading && <p className="text-sm text-muted-foreground">Loading settings…</p>}{settings.map((setting: GlobalSetting) => <div key={setting.id} className="grid gap-3 rounded-lg border border-border p-4 md:grid-cols-[1fr_1fr_auto] md:items-end"><div><Label htmlFor={`global-${setting.id}`}>{setting.settingKey}</Label><p className="mt-1 text-sm text-muted-foreground">{setting.description}</p></div>{setting.valueTypeKey === 'JSON' ? <StructuredSettingField id={`global-${setting.id}`} settingKey={setting.settingKey} value={drafts[setting.id] ?? setting.value} onChange={(value: string) => setDrafts((current: Record<string, string>) => ({ ...current, [setting.id]: value }))} /> : <SettingValueField id={`global-${setting.id}`} value={drafts[setting.id] ?? setting.value} valueType={setting.valueTypeKey} onChange={(value: string) => setDrafts((current: Record<string, string>) => ({ ...current, [setting.id]: value }))} />}<Button onClick={() => void saveSetting(setting)} disabled={updateSetting.isPending || createAudit.isPending || (setting.valueTypeKey === 'JSON' && !isSupportedStructuredSetting(setting.settingKey))}><Save className="size-4" />Save</Button></div>)}</CardContent></Card>
      </div>
    </main>
  );
}
