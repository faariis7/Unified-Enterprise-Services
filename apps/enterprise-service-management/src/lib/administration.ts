import type { GlobalSetting } from '@/generated/models/global-setting-model';
import type { WorkspaceSettingOverride } from '@/generated/models/workspace-setting-override-model';

export const globalAdministrationSections = [
  'Workspaces',
  'Global people',
  'Global roles and permissions',
  'Sites and departments',
  'Shared calendars and holidays',
  'Global notification defaults',
  'Integration registry',
  'Environment configuration',
  'Data retention',
  'Global audit',
  'System health',
  'Module registry',
] as const;

export const workspaceAdministrationSections = [
  'Workspace identity and branding',
  'Members and roles',
  'Enabled modules',
  'Request types',
  'Services',
  'Categories and subcategories',
  'Catalog items',
  'Forms and fields',
  'Status lifecycles',
  'Priorities',
  'Assignment groups',
  'Service targets',
  'Approvals',
  'Assignment and automation rules',
  'Notifications',
  'Mail intake',
  'Knowledge settings',
  'Portal settings',
  'Reports',
  'Workspace audit',
] as const;

export type SettingSource = 'Global default' | 'Workspace override' | 'Service override' | 'Catalog item override' | 'Request-calculated value';

export interface EffectiveSetting {
  globalSetting: GlobalSetting;
  effectiveValue: string;
  source: SettingSource;
  isOverridden: boolean;
  workspaceOverride?: WorkspaceSettingOverride;
}

export function resolveWorkspaceSettings(
  globalSettings: GlobalSetting[],
  workspaceOverrides: WorkspaceSettingOverride[],
  workspaceId: string,
): EffectiveSetting[] {
  const overrideBySettingId = new Map(
    workspaceOverrides
      .filter((override: WorkspaceSettingOverride) => override.active && override.workspace.id === workspaceId)
      .map((override: WorkspaceSettingOverride) => [override.globalSetting.id, override]),
  );

  return globalSettings.map((globalSetting: GlobalSetting) => {
    const workspaceOverride = overrideBySettingId.get(globalSetting.id);
    return {
      globalSetting,
      effectiveValue: workspaceOverride?.overrideValue ?? globalSetting.value,
      source: workspaceOverride ? 'Workspace override' : 'Global default',
      isOverridden: Boolean(workspaceOverride),
      workspaceOverride,
    };
  });
}

export function normalizeSettingInput(value: string, valueType: GlobalSetting['valueTypeKey']): string | undefined {
  const normalized = value.trim();
  if (valueType === 'YesNo') return normalized === 'true' || normalized === 'false' ? normalized : undefined;
  if (valueType === 'WholeNumber') return /^-?\d+$/.test(normalized) ? normalized : undefined;
  if (valueType === 'Decimal') return /^-?\d+(\.\d+)?$/.test(normalized) ? normalized : undefined;
  if (valueType === 'JSON') return undefined;
  return normalized || undefined;
}
