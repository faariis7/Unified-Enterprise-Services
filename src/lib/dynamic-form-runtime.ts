import type { FieldDefinition } from '@/generated/models/field-definition-model';
import type { FieldDependency } from '@/generated/models/field-dependency-model';
import type { FieldOption } from '@/generated/models/field-option-model';
import type { FieldValidationRule } from '@/generated/models/field-validation-rule-model';
import type { FieldVisibilityRule } from '@/generated/models/field-visibility-rule-model';
import type { FormSection } from '@/generated/models/form-section-model';

export type DynamicReferenceValue = { id: string; label: string; secondaryLabel?: string; type?: string };
export type DynamicFileValue = { id: string; name: string; contentType: string; sizeBytes: number; status?: 'selected' | 'uploaded' | 'failed' };
export type DynamicStructuredValue = { type: string; data: Record<string, unknown> | unknown[] };
export type DynamicFormValue = string | number | boolean | string[] | DynamicReferenceValue | DynamicReferenceValue[] | DynamicFileValue | DynamicFileValue[] | DynamicStructuredValue | null;
export type DynamicFormValues = Record<string, DynamicFormValue>;
export type LegacyDynamicFormValues = Record<string, string>;
export type DynamicRuleMessage = { id: string; tone: 'information' | 'warning'; text: string };
export type DynamicFieldState = { visible: boolean; required: boolean; disabled: boolean; readOnly: boolean; authorized: boolean; retainWhenHidden: boolean; messages: DynamicRuleMessage[]; allowedOptionValues?: Set<string> };
export type DynamicSectionState = { visible: boolean; disabled: boolean; messages: DynamicRuleMessage[] };
export type DynamicRuleIssue = { type: 'broken-reference' | 'circular-dependency' | 'conflict'; message: string; ruleIds: string[] };
export type DynamicCondition = { kind: 'condition'; fieldId: string; operator: string; value?: DynamicFormValue };
export type DynamicConditionGroup = { kind: 'group'; logic: 'AND' | 'OR'; children: Array<DynamicCondition | DynamicConditionGroup> };
export type DynamicRuleAction = { type: 'Show' | 'Hide' | 'Require' | 'Optional' | 'Enable' | 'Disable' | 'SetValue' | 'ClearValue' | 'FilterOptions' | 'Information' | 'Warning'; targetType?: 'field' | 'section'; targetId?: string; value?: DynamicFormValue; message?: string; optionValues?: string[]; retainWhenHidden?: boolean };
export type DynamicRuleDefinition = { id: string; name: string; condition: DynamicConditionGroup; actions: DynamicRuleAction[]; active: boolean };
export type DynamicValidationIssue = { fieldId: string; message: string; ruleId?: string };
export type DynamicLookupQuery = { field: FieldDefinition; search: string; values: DynamicFormValues };
export interface DynamicLookupProvider { readonly key: string; search(query: DynamicLookupQuery): Promise<DynamicReferenceValue[]>; }
export interface DynamicUniquenessProvider { isUnique(field: FieldDefinition, value: DynamicFormValue, values: DynamicFormValues): Promise<boolean>; }
export class InMemoryLookupProvider implements DynamicLookupProvider {
  readonly key: string;
  private readonly records: DynamicReferenceValue[];
  constructor(key: string, records: DynamicReferenceValue[]) { this.key = key; this.records = records; }
  async search(query: DynamicLookupQuery): Promise<DynamicReferenceValue[]> { const term = query.search.trim().toLowerCase(); return this.records.filter((record: DynamicReferenceValue) => !term || `${record.label} ${record.secondaryLabel ?? ''}`.toLowerCase().includes(term)); }
}
export class InMemoryUniquenessProvider implements DynamicUniquenessProvider {
  private readonly existing: Map<string, Set<string>>;
  constructor(existing: Record<string, DynamicFormValue[]> = {}) { this.existing = new Map(Object.entries(existing).map(([key, values]: [string, DynamicFormValue[]]) => [key, new Set(values.map(valueIdentity))])); }
  async isUnique(field: FieldDefinition, value: DynamicFormValue): Promise<boolean> { return !this.existing.get(field.fieldCode)?.has(valueIdentity(value)); }
}

function isReference(value: DynamicFormValue | undefined): value is DynamicReferenceValue { return Boolean(value && !Array.isArray(value) && typeof value === 'object' && 'id' in value && 'label' in value); }
function isFile(value: DynamicFormValue | undefined): value is DynamicFileValue { return Boolean(value && !Array.isArray(value) && typeof value === 'object' && 'name' in value && 'sizeBytes' in value); }
export function isEmptyDynamicValue(value: DynamicFormValue | undefined): boolean { return value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0); }
export function valueIdentity(value: DynamicFormValue | undefined): string {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return value.map((item: string | DynamicReferenceValue | DynamicFileValue) => typeof item === 'string' ? item : 'label' in item ? item.id : item.name).join('|');
  if (typeof value === 'object') return isReference(value) ? value.id : isFile(value) ? `${value.name}:${value.sizeBytes}` : JSON.stringify(value);
  return String(value);
}
export function dynamicValueToLegacyString(value: DynamicFormValue | undefined): string {
  if (value === undefined || value === null) return '';
  if (Array.isArray(value)) return JSON.stringify(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}
export function dynamicValuesToLegacy(values: DynamicFormValues): LegacyDynamicFormValues { return Object.fromEntries(Object.entries(values).map(([key, value]: [string, DynamicFormValue]) => [key, dynamicValueToLegacyString(value)])); }
function safeJson(value: string): unknown { try { return JSON.parse(value) as unknown; } catch { return undefined; } }
export function parseDynamicValue(field: FieldDefinition, raw: DynamicFormValue | undefined): DynamicFormValue {
  if (raw === undefined || raw === null || raw === '') return null;
  if (typeof raw !== 'string') return raw;
  if (field.fieldTypeKey === 'Number' || field.fieldTypeKey === 'Currency') { const number = Number(raw); return Number.isFinite(number) ? number : raw; }
  if (field.fieldTypeKey === 'YesOrNo') return raw === 'true';
  if (field.fieldTypeKey === 'MultipleChoice') { const parsed = safeJson(raw); return Array.isArray(parsed) ? parsed.filter((item: unknown): item is string => typeof item === 'string') : raw.split(',').map((item: string) => item.trim()).filter(Boolean); }
  if (['Person', 'Department', 'BusinessUnit', 'Site', 'Asset', 'Lookup', 'CascadingChoice'].includes(field.fieldTypeKey)) { const parsed = safeJson(raw); return parsed && typeof parsed === 'object' && 'id' in parsed ? parsed as DynamicReferenceValue : { id: raw, label: raw, type: field.fieldTypeKey }; }
  if (field.fieldTypeKey === 'Attachment') { const parsed = safeJson(raw); if (Array.isArray(parsed)) return parsed as DynamicFileValue[]; if (parsed && typeof parsed === 'object') return parsed as DynamicFileValue; return { id: raw, name: raw, contentType: 'application/octet-stream', sizeBytes: 0, status: 'uploaded' }; }
  if (field.fieldTypeKey === 'RichText' && raw.trim().startsWith('{')) { const parsed = safeJson(raw); if (parsed && typeof parsed === 'object' && 'type' in parsed) return parsed as DynamicStructuredValue; }
  return raw;
}
export function normalizeDynamicValues(fields: FieldDefinition[], values: DynamicFormValues | LegacyDynamicFormValues): DynamicFormValues { const entries: Array<[string, DynamicFormValue]> = fields.map((field: FieldDefinition): [string, DynamicFormValue] => [field.id, parseDynamicValue(field, values[field.id] ?? field.defaultValue)]); return Object.fromEntries(entries.filter((entry: [string, DynamicFormValue]) => entry[1] !== null)); }

function comparable(value: DynamicFormValue | undefined): string[] { if (Array.isArray(value)) return value.map((item) => typeof item === 'string' ? item : 'label' in item ? item.id : item.name); if (isReference(value)) return [value.id, value.label]; return [valueIdentity(value)]; }
function compare(value: DynamicFormValue | undefined, operator: string, expected?: DynamicFormValue): boolean {
  const actual = comparable(value); const target = comparable(expected);
  if (operator === 'Equals') return actual.some((item: string) => target.includes(item));
  if (operator === 'NotEquals') return !actual.some((item: string) => target.includes(item));
  if (operator === 'Contains') return actual.some((item: string) => target.some((candidate: string) => item.includes(candidate)));
  if (operator === 'IsEmpty') return isEmptyDynamicValue(value);
  if (operator === 'IsNotEmpty') return !isEmptyDynamicValue(value);
  if (operator === 'GreaterThan') return Number(actual[0]) > Number(target[0]);
  if (operator === 'LessThan') return Number(actual[0]) < Number(target[0]);
  return false;
}
export function evaluateDynamicCondition(node: DynamicCondition | DynamicConditionGroup, values: DynamicFormValues): boolean { if (node.kind === 'condition') return compare(values[node.fieldId], node.operator, node.value); const results = node.children.map((child: DynamicCondition | DynamicConditionGroup) => evaluateDynamicCondition(child, values)); return node.logic === 'OR' ? results.some(Boolean) : results.every(Boolean); }

type LegacyRuleConfiguration = { group?: { logic: 'AND' | 'OR'; conditions: Array<{ fieldId: string; operator: string; value?: string } | LegacyRuleConfiguration['group']> }; action?: DynamicRuleAction['type']; value?: DynamicFormValue; message?: string; optionValues?: string[]; targetType?: 'field' | 'section'; targetId?: string; retainWhenHidden?: boolean };
function convertLegacyGroup(group: NonNullable<LegacyRuleConfiguration['group']>): DynamicConditionGroup { return { kind: 'group', logic: group.logic, children: group.conditions.filter(Boolean).map((condition) => condition && 'conditions' in condition ? convertLegacyGroup(condition) : { kind: 'condition', fieldId: condition?.fieldId ?? '', operator: condition?.operator ?? 'Equals', value: condition?.value }) }; }
export function visibilityRuleToDefinition(rule: FieldVisibilityRule): DynamicRuleDefinition {
  const parsed = rule.comparisonValue?.trim().startsWith('{') ? safeJson(rule.comparisonValue) as LegacyRuleConfiguration | undefined : undefined;
  const condition = parsed?.group ? convertLegacyGroup(parsed.group) : { kind: 'group' as const, logic: 'AND' as const, children: rule.dependentFieldDefinition ? [{ kind: 'condition' as const, fieldId: rule.dependentFieldDefinition.id, operator: rule.operatorKey, value: rule.comparisonValue }] : [] };
  return { id: rule.id, name: rule.ruleName, active: rule.statusKey === 'Active' && !rule.isDeleted, condition, actions: [{ type: parsed?.action ?? (rule.effectKey === 'ReadOnly' ? 'Disable' : rule.effectKey), targetType: parsed?.targetType ?? 'field', targetId: parsed?.targetId ?? rule.fieldDefinition.id, value: parsed?.value, message: parsed?.message, optionValues: parsed?.optionValues, retainWhenHidden: parsed?.retainWhenHidden }] };
}
export function normalizeDynamicRules(rules: FieldVisibilityRule[] | DynamicRuleDefinition[]): DynamicRuleDefinition[] { return rules.map((rule) => 'condition' in rule ? rule : visibilityRuleToDefinition(rule)); }
export function ruleMatches(rule: FieldVisibilityRule | DynamicRuleDefinition, values: DynamicFormValues): boolean { const definition = 'condition' in rule ? rule : visibilityRuleToDefinition(rule); return definition.active && evaluateDynamicCondition(definition.condition, values); }
function matchingActions(rules: DynamicRuleDefinition[], values: DynamicFormValues, targetType: 'field' | 'section', targetId: string): Array<{ rule: DynamicRuleDefinition; action: DynamicRuleAction }> { return rules.filter((rule: DynamicRuleDefinition) => rule.active && evaluateDynamicCondition(rule.condition, values)).flatMap((rule: DynamicRuleDefinition) => rule.actions.filter((action: DynamicRuleAction) => (action.targetType ?? 'field') === targetType && action.targetId === targetId).map((action: DynamicRuleAction) => ({ rule, action }))); }
export function getDynamicFieldState(field: FieldDefinition, rules: FieldVisibilityRule[] | DynamicRuleDefinition[], values: DynamicFormValues, authorized = true): DynamicFieldState {
  const definitions = normalizeDynamicRules(rules); const matched = matchingActions(definitions, values, 'field', field.id); const types = matched.map(({ action }) => action.type); const hasShowRules = definitions.some((rule: DynamicRuleDefinition) => rule.actions.some((action: DynamicRuleAction) => action.targetId === field.id && action.type === 'Show'));
  return { visible: authorized && !types.includes('Hide') && (!hasShowRules || types.includes('Show')), required: !types.includes('Optional') && (field.required || types.includes('Require')), disabled: types.includes('Disable') && !types.includes('Enable'), readOnly: field.readOnly1, authorized, retainWhenHidden: matched.some(({ action }) => action.retainWhenHidden === true), messages: matched.filter(({ action }) => action.type === 'Information' || action.type === 'Warning').map(({ rule, action }) => ({ id: rule.id, tone: action.type === 'Warning' ? 'warning' : 'information', text: action.message || rule.name })), allowedOptionValues: matched.find(({ action }) => action.type === 'FilterOptions')?.action.optionValues ? new Set(matched.find(({ action }) => action.type === 'FilterOptions')?.action.optionValues) : undefined };
}
export function getDynamicSectionState(section: FormSection, rules: FieldVisibilityRule[] | DynamicRuleDefinition[], values: DynamicFormValues): DynamicSectionState { const matched = matchingActions(normalizeDynamicRules(rules), values, 'section', section.id); const types = matched.map(({ action }) => action.type); return { visible: !types.includes('Hide'), disabled: types.includes('Disable') && !types.includes('Enable'), messages: matched.filter(({ action }) => action.type === 'Information' || action.type === 'Warning').map(({ rule, action }) => ({ id: rule.id, tone: action.type === 'Warning' ? 'warning' : 'information', text: action.message || rule.name })) }; }
export function applyDynamicRuleEffects(fields: FieldDefinition[], rules: FieldVisibilityRule[] | DynamicRuleDefinition[], values: DynamicFormValues, authorizedFieldIds?: Set<string>): DynamicFormValues {
  const definitions = normalizeDynamicRules(rules); let next = normalizeDynamicValues(fields, values); const seen = new Set<string>();
  for (let iteration = 0; iteration < Math.max(2, fields.length * 2); iteration += 1) {
    const signature = JSON.stringify(next); if (seen.has(signature)) break; seen.add(signature); const updated = { ...next };
    definitions.filter((rule: DynamicRuleDefinition) => rule.active && evaluateDynamicCondition(rule.condition, updated)).forEach((rule: DynamicRuleDefinition) => rule.actions.forEach((action: DynamicRuleAction) => { if ((action.targetType ?? 'field') !== 'field' || !action.targetId) return; if (action.type === 'SetValue') updated[action.targetId] = action.value ?? null; if (action.type === 'ClearValue') updated[action.targetId] = null; }));
    fields.forEach((field: FieldDefinition) => { const authorized = !authorizedFieldIds || authorizedFieldIds.has(field.id); const state = getDynamicFieldState(field, definitions, updated, authorized); if (!authorized || (!state.visible && !state.retainWhenHidden)) delete updated[field.id]; else if (updated[field.id] === undefined && field.defaultValue !== undefined) updated[field.id] = parseDynamicValue(field, field.defaultValue); });
    if (JSON.stringify(updated) === signature) return updated; next = updated;
  }
  return next;
}
function configuration(field: FieldDefinition): Record<string, unknown> { const parsed = field.configuration ? safeJson(field.configuration) : undefined; return parsed && typeof parsed === 'object' ? parsed as Record<string, unknown> : {}; }
function customError(field: FieldDefinition, fallback: string): string { const configured = configuration(field).customError; return typeof configured === 'string' && configured.trim() ? configured : fallback; }
function dateValue(value: DynamicFormValue | undefined): number { const raw = valueIdentity(value); return raw ? new Date(raw).getTime() : Number.NaN; }
export async function validateDynamicFormAsync(fields: FieldDefinition[], rules: FieldValidationRule[], visibilityRules: FieldVisibilityRule[] | DynamicRuleDefinition[], values: DynamicFormValues, uniquenessProvider: DynamicUniquenessProvider = new InMemoryUniquenessProvider(), sections: FormSection[] = []): Promise<Record<string, string>> {
  const errors = validateDynamicForm(fields, rules, visibilityRules, values, sections); const active = fields.filter((field: FieldDefinition) => !errors[field.id] && !isEmptyDynamicValue(values[field.id]));
  await Promise.all(active.map(async (field: FieldDefinition) => { const uniqueRule = rules.find((rule: FieldValidationRule) => rule.fieldDefinition.id === field.id && rule.statusKey === 'Active' && !rule.isDeleted && rule.ruleTypeKey === 'Pattern' && rule.comparisonValue === '__unique__'); if (uniqueRule && !(await uniquenessProvider.isUnique(field, values[field.id], values))) errors[field.id] = uniqueRule.errorMessage; })); return errors;
}
export function validateDynamicForm(fields: FieldDefinition[], rules: FieldValidationRule[], visibilityRules: FieldVisibilityRule[] | DynamicRuleDefinition[], values: DynamicFormValues, sections: FormSection[] = []): Record<string, string> {
  const effective = applyDynamicRuleEffects(fields, visibilityRules, values); const errors: Record<string, string> = {};
  fields.forEach((field: FieldDefinition) => { const section = sections.find((item: FormSection) => item.id === field.formSection.id); if (section && !getDynamicSectionState(section, visibilityRules, effective).visible) return; const state = getDynamicFieldState(field, visibilityRules, effective); if (!state.visible || state.disabled || state.readOnly || !state.authorized) return; const value = effective[field.id]; if (state.required && isEmptyDynamicValue(value)) { errors[field.id] = customError(field, `${field.label} is required.`); return; }
    rules.filter((rule: FieldValidationRule) => rule.fieldDefinition.id === field.id && rule.statusKey === 'Active' && !rule.isDeleted).some((rule: FieldValidationRule) => { if (isEmptyDynamicValue(value) || (rule.ruleTypeKey === 'Pattern' && rule.comparisonValue === '__unique__')) return false; const raw = valueIdentity(value); const amount = Number(rule.comparisonValue); let invalid = false;
      if (rule.ruleTypeKey === 'MinimumLength') invalid = raw.length < amount;
      if (rule.ruleTypeKey === 'MaximumLength') invalid = raw.length > amount;
      if (rule.ruleTypeKey === 'MinimumValue') invalid = Number(raw) < amount;
      if (rule.ruleTypeKey === 'MaximumValue') invalid = Number(raw) > amount;
      if (rule.ruleTypeKey === 'Email') invalid = !/^\S+@\S+\.\S+$/.test(raw);
      if (rule.ruleTypeKey === 'Phone') invalid = !/^[+\d][\d\s().-]{6,}$/.test(raw);
      if (rule.ruleTypeKey === 'URL') { try { new URL(raw); } catch { invalid = true; } }
      if (rule.ruleTypeKey === 'Pattern') { try { invalid = !new RegExp(rule.comparisonValue).test(raw); } catch { invalid = true; } }
      if (invalid) errors[field.id] = rule.errorMessage || customError(field, `${field.label} is invalid.`); return invalid;
    });
    const config = configuration(field); const timestamp = dateValue(value); if (!errors[field.id] && Number.isFinite(timestamp)) { if (config.dateConstraint === 'past' && timestamp >= Date.now()) errors[field.id] = customError(field, `${field.label} must be in the past.`); if (config.dateConstraint === 'future' && timestamp <= Date.now()) errors[field.id] = customError(field, `${field.label} must be in the future.`); const minimumDate = typeof config.minimumDate === 'string' ? new Date(config.minimumDate).getTime() : Number.NaN; const maximumDate = typeof config.maximumDate === 'string' ? new Date(config.maximumDate).getTime() : Number.NaN; if (Number.isFinite(minimumDate) && timestamp < minimumDate) errors[field.id] = customError(field, `${field.label} is before the earliest allowed date.`); if (Number.isFinite(maximumDate) && timestamp > maximumDate) errors[field.id] = customError(field, `${field.label} is after the latest allowed date.`); }
    const afterFieldId = typeof config.afterFieldId === 'string' ? config.afterFieldId : undefined; if (!errors[field.id] && afterFieldId && Number.isFinite(timestamp) && Number.isFinite(dateValue(effective[afterFieldId])) && timestamp <= dateValue(effective[afterFieldId])) errors[field.id] = customError(field, `${field.label} must be after ${fields.find((candidate: FieldDefinition) => candidate.id === afterFieldId)?.label ?? 'the start date'}.`);
    const files: DynamicFileValue[] = Array.isArray(value) ? value.filter((item): item is DynamicFileValue => Boolean(item && typeof item === 'object' && 'sizeBytes' in item)) : isFile(value) ? [value] : []; const allowed = typeof config.allowedFileTypes === 'string' ? config.allowedFileTypes.split(',').map((item: string) => item.trim().toLowerCase()).filter(Boolean) : []; const maximum = Number(config.maximumFileSize ?? 0); if (files.some((file: DynamicFileValue) => allowed.length > 0 && !allowed.includes(file.contentType.toLowerCase()) && !allowed.some((type: string) => file.name.toLowerCase().endsWith(type)))) errors[field.id] = customError(field, `${field.label} contains an unsupported file type.`); if (files.some((file: DynamicFileValue) => maximum > 0 && file.sizeBytes > maximum)) errors[field.id] = customError(field, `${field.label} exceeds the maximum file size.`);
  }); return errors;
}
export function formatDynamicValue(field: FieldDefinition, value: DynamicFormValue | undefined, options: FieldOption[]): string { if (isEmptyDynamicValue(value)) return 'Not answered'; if (typeof value === 'boolean') return value ? 'Yes' : 'No'; if (typeof value === 'number') return field.fieldTypeKey === 'Currency' ? new Intl.NumberFormat(undefined, { style: 'currency', currency: String(configuration(field).currencyCode ?? 'USD') }).format(value) : new Intl.NumberFormat().format(value); if (isReference(value)) return value.label; if (isFile(value)) return `${value.name} · ${value.sizeBytes} bytes`; if (Array.isArray(value)) return value.map((item: string | DynamicReferenceValue | DynamicFileValue) => typeof item === 'string' ? options.find((option: FieldOption) => option.fieldDefinition.id === field.id && option.value === item)?.label ?? item : 'label' in item ? item.label : item.name).join(', '); if (value && typeof value === 'object') return 'data' in value ? JSON.stringify(value.data) : JSON.stringify(value); const raw = String(value); if (field.fieldTypeKey === 'Date' || field.fieldTypeKey === 'DateAndTime') { const date = new Date(raw); return Number.isNaN(date.getTime()) ? raw : field.fieldTypeKey === 'Date' ? date.toLocaleDateString() : date.toLocaleString(); } return options.find((option: FieldOption) => option.fieldDefinition.id === field.id && option.value === raw)?.label ?? raw; }
function referencedFieldIds(condition: DynamicCondition | DynamicConditionGroup): string[] { return condition.kind === 'condition' ? [condition.fieldId] : condition.children.flatMap(referencedFieldIds); }
export function diagnoseDynamicRules(fields: FieldDefinition[], rules: FieldVisibilityRule[] | DynamicRuleDefinition[], dependencies: FieldDependency[] = [], sections: FormSection[] = []): DynamicRuleIssue[] { const definitions = normalizeDynamicRules(rules); const issues: DynamicRuleIssue[] = []; const fieldIds = new Set(fields.map((field: FieldDefinition) => field.id)); const sectionIds = new Set(sections.map((section: FormSection) => section.id)); const edges = new Map<string, Array<{ target: string; ruleId: string }>>();
  definitions.filter((rule: DynamicRuleDefinition) => rule.active).forEach((rule: DynamicRuleDefinition) => { const sources = referencedFieldIds(rule.condition); const targets = rule.actions.filter((action: DynamicRuleAction) => (action.targetType ?? 'field') === 'field').map((action: DynamicRuleAction) => action.targetId).filter((id): id is string => Boolean(id)); if (sources.some((id: string) => !fieldIds.has(id)) || targets.some((id: string) => !fieldIds.has(id)) || rule.actions.some((action: DynamicRuleAction) => action.targetType === 'section' && (!action.targetId || !sectionIds.has(action.targetId)))) issues.push({ type: 'broken-reference', message: `${rule.name} references an item outside this version.`, ruleIds: [rule.id] }); sources.forEach((source: string) => targets.forEach((target: string) => edges.set(source, [...(edges.get(source) ?? []), { target, ruleId: rule.id }]))); const grouped = new Map<string, Set<string>>(); rule.actions.forEach((action: DynamicRuleAction) => { if (!action.targetId) return; grouped.set(action.targetId, new Set([...(grouped.get(action.targetId) ?? []), action.type])); }); grouped.forEach((types: Set<string>, target: string) => { if ((types.has('Show') && types.has('Hide')) || (types.has('Require') && types.has('Optional')) || (types.has('Enable') && types.has('Disable')) || (types.has('SetValue') && types.has('ClearValue'))) issues.push({ type: 'conflict', message: `${rule.name} contains opposing actions for ${target}.`, ruleIds: [rule.id] }); }); });
  dependencies.filter((dependency: FieldDependency) => dependency.statusKey === 'Active').forEach((dependency: FieldDependency) => edges.set(dependency.sourceFieldDefinition.id, [...(edges.get(dependency.sourceFieldDefinition.id) ?? []), { target: dependency.targetFieldDefinition.id, ruleId: dependency.id }])); const visiting = new Set<string>(); const visited = new Set<string>(); const path: string[] = []; const visit = (id: string): void => { if (visiting.has(id)) { const cycle = path.slice(path.indexOf(id)); issues.push({ type: 'circular-dependency', message: `Circular dependency detected: ${[...cycle, id].join(' → ')}.`, ruleIds: cycle.flatMap((source: string) => (edges.get(source) ?? []).map((edge) => edge.ruleId)) }); return; } if (visited.has(id)) return; visiting.add(id); path.push(id); (edges.get(id) ?? []).forEach((edge) => visit(edge.target)); path.pop(); visiting.delete(id); visited.add(id); }; fields.forEach((field: FieldDefinition) => visit(field.id)); return issues.filter((issue: DynamicRuleIssue, index: number, all: DynamicRuleIssue[]) => all.findIndex((candidate: DynamicRuleIssue) => candidate.type === issue.type && candidate.message === issue.message) === index); }
