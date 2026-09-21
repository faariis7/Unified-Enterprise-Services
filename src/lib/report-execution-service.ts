import type { FieldDefinition } from '@/generated/models/field-definition-model';
import type { FormVersion } from '@/generated/models/form-version-model';
import type { Request } from '@/generated/models/request-model';
import type { RequestFieldValue } from '@/generated/models/request-field-value-model';
import type { SavedReportConfiguration } from '@/generated/models/saved-report-configuration-model';
import type { SavedReportDefinition } from '@/generated/models/saved-report-definition-model';

export type ReportVisualization = 'Summary' | 'Table' | 'Bar' | 'Line' | 'Donut';
export type ReportAggregation = 'Count' | 'DistinctCount' | 'Sum' | 'Average' | 'Median' | 'Minimum' | 'Maximum' | 'TrueFalseDistribution';
export type ReportDimensionType = 'text' | 'number' | 'boolean' | 'date' | 'choice' | 'multi-choice';

export interface ReportDimension {
  key: string;
  label: string;
  type: ReportDimensionType;
  source: 'request' | 'custom';
  fieldDefinitionId?: string;
  formVersionId?: string;
  serviceCode?: string;
  sensitive: boolean;
}

export interface ReportDefinitionInput {
  dimensionKey: string;
  aggregation: ReportAggregation;
  visualization: ReportVisualization;
  serviceCode?: string;
  from?: string;
  to?: string;
  filters: Array<{ key: string; operator: 'equals' | 'notEquals' | 'contains' | 'isTrue' | 'isFalse'; value?: string }>;
  sort: { by: 'label' | 'value'; direction: 'asc' | 'desc' };
  page: number;
  pageSize: number;
}

export interface ReportExecutionContext {
  workspaceId: string;
  requests: readonly Request[];
  answers: readonly RequestFieldValue[];
  fields: readonly FieldDefinition[];
  versions: readonly FormVersion[];
  canReadRequest: (request: Request) => boolean;
  canReadField: (field: FieldDefinition) => boolean;
}

export interface ReportResultRow { label: string; value: number; requestIds: string[]; }
export interface ReportExecutionResult {
  status: 'ready' | 'empty' | 'invalid' | 'denied';
  message?: string;
  visualization: ReportVisualization;
  dimension?: ReportDimension;
  rows: ReportResultRow[];
  totalRows: number;
  page: number;
  pageSize: number;
  summaryValue: number;
  authorizedRequestCount: number;
}

const COMMON_DIMENSIONS: readonly ReportDimension[] = [
  { key: 'createdDate', label: 'Created date', type: 'date', source: 'request', sensitive: false },
  { key: 'statusKey', label: 'Status', type: 'choice', source: 'request', sensitive: false },
  { key: 'priorityKey', label: 'Priority', type: 'choice', source: 'request', sensitive: false },
  { key: 'serviceCode', label: 'Service', type: 'choice', source: 'request', sensitive: false },
  { key: 'assignee', label: 'Owner', type: 'text', source: 'request', sensitive: false },
  { key: 'departmentCode', label: 'Department', type: 'choice', source: 'request', sensitive: false },
  { key: 'siteCode', label: 'Site', type: 'choice', source: 'request', sensitive: false },
  { key: 'requester', label: 'Requester', type: 'text', source: 'request', sensitive: false },
  { key: 'requestedFor', label: 'Requested for', type: 'text', source: 'request', sensitive: false },
  { key: 'completionHours', label: 'Completion duration', type: 'number', source: 'request', sensitive: false },
];

function fieldType(field: FieldDefinition): ReportDimensionType {
  if (['Number', 'Currency'].includes(field.fieldTypeKey)) return 'number';
  if (field.fieldTypeKey === 'YesOrNo') return 'boolean';
  if (['Date', 'DateAndTime'].includes(field.fieldTypeKey)) return 'date';
  if (field.fieldTypeKey === 'MultipleChoice') return 'multi-choice';
  if (['SingleChoice', 'CascadingChoice'].includes(field.fieldTypeKey)) return 'choice';
  return 'text';
}

export function discoverReportDimensions(context: ReportExecutionContext, serviceCode?: string): ReportDimension[] {
  const requestVersions = new Map(context.requests.filter((request: Request) => request.workspace.id === context.workspaceId && (!serviceCode || request.serviceCode === serviceCode)).map((request: Request) => [request.formVersion.id, request.serviceCode]));
  const custom = context.fields
    .filter((field: FieldDefinition) => field.workspace.id === context.workspaceId && field.reportable && !field.isDeleted && !field.sensitive && context.canReadField(field) && requestVersions.has(field.formVersionID.id) && (!serviceCode || requestVersions.get(field.formVersionID.id) === serviceCode))
    .map((field: FieldDefinition): ReportDimension => ({ key: `field:${field.formVersionID.id}:${field.fieldCode}`, label: `${field.label} · ${field.formVersionID.snapshotLabel}`, type: fieldType(field), source: 'custom', fieldDefinitionId: field.id, formVersionId: field.formVersionID.id, serviceCode: requestVersions.get(field.formVersionID.id), sensitive: field.sensitive }));
  return [...COMMON_DIMENSIONS, ...custom].sort((a: ReportDimension, b: ReportDimension) => a.label.localeCompare(b.label));
}

export function validAggregations(dimension: ReportDimension): ReportAggregation[] {
  if (dimension.type === 'number') return ['Count', 'DistinctCount', 'Sum', 'Average', 'Median', 'Minimum', 'Maximum'];
  if (dimension.type === 'boolean') return ['Count', 'DistinctCount', 'TrueFalseDistribution'];
  return ['Count', 'DistinctCount'];
}

function requestValue(request: Request, key: string): string | number {
  if (key === 'createdDate') return request.createdAt.slice(0, 10);
  if (key === 'statusKey') return request.statusKey;
  if (key === 'priorityKey') return request.priorityKey;
  if (key === 'serviceCode') return request.serviceCode;
  if (key === 'assignee') return request.assignee.displayName || request.assignmentGroupCode || 'Unassigned';
  if (key === 'departmentCode') return request.departmentCode || 'Not assigned';
  if (key === 'siteCode') return request.siteCode || 'Not assigned';
  if (key === 'requester') return request.requester.displayName;
  if (key === 'requestedFor') return request.requestedFor.displayName;
  if (key === 'completionHours') { const end = request.closedAt || request.resolvedAt; return end ? Math.max(0, (new Date(end).getTime() - new Date(request.createdAt).getTime()) / 3_600_000) : 0; }
  return 'Unknown';
}

function choiceArray(answer: RequestFieldValue): string[] {
  if (answer.valueTypeKey !== 'MultipleChoice' || !answer.structuredValue) return [];
  try { const value: unknown = JSON.parse(answer.structuredValue); return Array.isArray(value) ? value.filter((item: unknown): item is string => typeof item === 'string' && item.trim().length > 0) : []; } catch { return []; }
}

function answerValues(answer: RequestFieldValue, type: ReportDimensionType): Array<string | number | boolean> {
  if (type === 'multi-choice') return choiceArray(answer);
  if (type === 'number') return typeof answer.numberValue === 'number' ? [answer.numberValue] : [];
  if (type === 'boolean') return typeof answer.booleanValue === 'boolean' ? [answer.booleanValue] : [];
  if (type === 'date') return answer.dateValue ? [answer.dateValue.slice(0, 10)] : [];
  return [answer.displayValue || answer.textValue || answer.value].filter((value: string) => value.length > 0);
}

function matches(value: string | number | boolean, filter: ReportDefinitionInput['filters'][number]): boolean {
  const actual = String(value).toLowerCase(); const expected = (filter.value ?? '').toLowerCase();
  if (filter.operator === 'isTrue') return value === true;
  if (filter.operator === 'isFalse') return value === false;
  if (filter.operator === 'notEquals') return actual !== expected;
  if (filter.operator === 'contains') return actual.includes(expected);
  return actual === expected;
}

function aggregate(values: number[], requestIds: Set<string>, aggregation: ReportAggregation): number {
  if (aggregation === 'DistinctCount') return requestIds.size;
  if (aggregation === 'Count' || aggregation === 'TrueFalseDistribution') return values.length;
  if (!values.length) return 0;
  if (aggregation === 'Sum') return values.reduce((sum: number, value: number) => sum + value, 0);
  if (aggregation === 'Average') return values.reduce((sum: number, value: number) => sum + value, 0) / values.length;
  if (aggregation === 'Minimum') return Math.min(...values);
  if (aggregation === 'Maximum') return Math.max(...values);
  const sorted = [...values].sort((a: number, b: number) => a - b); const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function executeReport(definition: ReportDefinitionInput, context: ReportExecutionContext): ReportExecutionResult {
  if (definition.page < 1 || definition.pageSize < 1 || definition.pageSize > 100) return { status: 'invalid', message: 'Pagination is invalid.', visualization: definition.visualization, rows: [], totalRows: 0, page: definition.page, pageSize: definition.pageSize, summaryValue: 0, authorizedRequestCount: 0 };
  const dimensions = discoverReportDimensions(context, definition.serviceCode);
  const dimension = dimensions.find((item: ReportDimension) => item.key === definition.dimensionKey);
  if (!dimension || dimension.sensitive || !validAggregations(dimension).includes(definition.aggregation)) return { status: 'invalid', message: 'The report definition references an unavailable dimension or invalid measure.', visualization: definition.visualization, rows: [], totalRows: 0, page: definition.page, pageSize: definition.pageSize, summaryValue: 0, authorizedRequestCount: 0 };
  const requests = context.requests.filter((request: Request) => request.workspace.id === context.workspaceId && context.canReadRequest(request) && (!definition.serviceCode || request.serviceCode === definition.serviceCode) && (!definition.from || request.createdAt >= definition.from) && (!definition.to || request.createdAt <= definition.to));
  const requestById = new Map(requests.map((request: Request) => [request.id, request]));
  const buckets = new Map<string, { values: number[]; requestIds: Set<string> }>();
  const add = (label: string, numeric: number, requestId: string) => { const bucket = buckets.get(label) ?? { values: [], requestIds: new Set<string>() }; bucket.values.push(numeric); bucket.requestIds.add(requestId); buckets.set(label, bucket); };
  if (dimension.source === 'request') requests.forEach((request: Request) => { const value = requestValue(request, dimension.key); if (definition.filters.every((filter) => filter.key !== dimension.key || matches(value, filter))) add(String(value), typeof value === 'number' ? value : 1, request.id); });
  else context.answers.filter((answer: RequestFieldValue) => !answer.isDeleted && answer.formVersion.id === dimension.formVersionId && answer.stableFieldKey === dimension.key.split(':').slice(2).join(':') && requestById.has(answer.requestId.id)).forEach((answer: RequestFieldValue) => answerValues(answer, dimension.type).forEach((value: string | number | boolean) => { if (definition.filters.every((filter) => filter.key !== dimension.key || matches(value, filter))) add(String(value), typeof value === 'number' ? value : 1, answer.requestId.id); }));
  let rows = [...buckets.entries()].map(([label, bucket]): ReportResultRow => ({ label, value: Math.round(aggregate(bucket.values, bucket.requestIds, definition.aggregation) * 100) / 100, requestIds: [...bucket.requestIds] }));
  rows.sort((a: ReportResultRow, b: ReportResultRow) => { const result = definition.sort.by === 'label' ? a.label.localeCompare(b.label) : a.value - b.value; return definition.sort.direction === 'asc' ? result : -result; });
  const totalRows = rows.length; const summaryValue = definition.aggregation === 'DistinctCount' ? new Set(rows.flatMap((row: ReportResultRow) => row.requestIds)).size : rows.reduce((sum: number, row: ReportResultRow) => sum + row.value, 0);
  rows = rows.slice((definition.page - 1) * definition.pageSize, definition.page * definition.pageSize);
  return { status: rows.length ? 'ready' : 'empty', visualization: definition.visualization, dimension, rows, totalRows, page: definition.page, pageSize: definition.pageSize, summaryValue: Math.round(summaryValue * 100) / 100, authorizedRequestCount: requests.length };
}

function safeJson<T>(value: string, fallback: T): T { try { return JSON.parse(value) as T; } catch { return fallback; } }

export function definitionFromSaved(configuration: SavedReportConfiguration, definition: SavedReportDefinition): ReportDefinitionInput {
  const filters = safeJson<{ serviceCode?: string; from?: string; to?: string; value?: string }>(configuration.filtersJSON, {});
  const sorting = safeJson<Array<{ field: string; direction: 'asc' | 'desc' }>>(configuration.sortingJSON, []);
  const aggregation = configuration.aggregationKey === 'None' ? 'Count' : configuration.aggregationKey;
  return { dimensionKey: configuration.customFieldDefinition ? `field:${configuration.dimensionKey.includes(':') ? configuration.dimensionKey : ''}` : configuration.dimensionKey, aggregation, visualization: configuration.visualizationKey, serviceCode: definition.serviceCode || filters.serviceCode, from: filters.from, to: filters.to, filters: filters.value ? [{ key: configuration.dimensionKey, operator: 'equals', value: filters.value }] : [], sort: { by: 'value', direction: sorting[0]?.direction ?? 'desc' }, page: 1, pageSize: 20 };
}

export function executeSavedReport(definition: SavedReportDefinition, configuration: SavedReportConfiguration, context: ReportExecutionContext): ReportExecutionResult {
  if (definition.isDeleted || definition.statusKey !== 'Active' || definition.workspace.id !== context.workspaceId) return { status: 'denied', message: 'This saved report is unavailable.', visualization: configuration.visualizationKey, rows: [], totalRows: 0, page: 1, pageSize: 20, summaryValue: 0, authorizedRequestCount: 0 };
  const parsed = definitionFromSaved(configuration, definition);
  if (configuration.customFieldDefinition) {
    const field = context.fields.find((item: FieldDefinition) => item.id === configuration.customFieldDefinition?.id);
    if (field) parsed.dimensionKey = `field:${field.formVersionID.id}:${field.fieldCode}`;
  }
  return executeReport(parsed, context);
}
