import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { GlobalSetting } from '@/generated/models/global-setting-model';

interface SettingValueFieldProps {
  id: string;
  value: string;
  valueType: GlobalSetting['valueTypeKey'];
  onChange: (value: string) => void;
  disabled?: boolean;
}

export function SettingValueField({ id, value, valueType, onChange, disabled }: SettingValueFieldProps) {
  if (valueType === 'YesNo') {
    return (
      <Select value={value || 'false'} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id={id}><SelectValue /></SelectTrigger>
        <SelectContent><SelectItem value="true">Enabled</SelectItem><SelectItem value="false">Disabled</SelectItem></SelectContent>
      </Select>
    );
  }
  const type = valueType === 'WholeNumber' || valueType === 'Decimal' ? 'number' : 'text';
  const step = valueType === 'Decimal' ? 'any' : undefined;
  return <Input id={id} type={type} step={step} value={value} onChange={(event: React.ChangeEvent<HTMLInputElement>) => onChange(event.target.value)} disabled={disabled || valueType === 'JSON'} />;
}
