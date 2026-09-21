import { useMemo } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface StructuredSettingFieldProps {
  id: string;
  settingKey: string;
  value: string;
  onChange: (value: string) => void;
}

const supportedKeys = ['notification.channels', 'request.defaults', 'portal.preferences', 'automation.limits'];

export function StructuredSettingField({ id, settingKey, value, onChange }: StructuredSettingFieldProps) {
  const supported = supportedKeys.some((key: string) => settingKey.toLowerCase().includes(key.split('.')[0]));
  const validation = useMemo(() => {
    try {
      const parsed: unknown = JSON.parse(value);
      return parsed !== null && typeof parsed === 'object' ? '' : 'The value must be a JSON object or array.';
    } catch {
      return 'Enter valid JSON before saving.';
    }
  }, [value]);

  if (!supported) return <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground">This setting uses an unsupported schema and remains read-only.</div>;

  return <div className="space-y-2"><Label htmlFor={id}>Structured value</Label><Textarea id={id} rows={6} value={value} onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => onChange(event.target.value)} className="font-mono text-sm" aria-describedby={`${id}-status`} /><div id={`${id}-status`} className="flex items-center gap-2 text-sm">{validation ? <><AlertCircle className="size-4" /><span>{validation}</span></> : <><CheckCircle2 className="size-4" /><span>Valid structured value</span></>}</div></div>;
}

export function isSupportedStructuredSetting(settingKey: string) {
  return supportedKeys.some((key: string) => settingKey.toLowerCase().includes(key.split('.')[0]));
}
