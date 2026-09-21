import type { FieldDefinition } from '@/generated/models/field-definition-model';
import type { FormVersion } from '@/generated/models/form-version-model';
import type { Request } from '@/generated/models/request-model';
import type { RequestFieldValue } from '@/generated/models/request-field-value-model';
import { discoverReportDimensions, executeReport, type ReportDefinitionInput, type ReportExecutionContext } from '@/lib/report-execution-service';

function assert(condition: boolean, message: string): void { if (!condition) throw new Error(message); }
const workspace = { id: 'workspace-1', workspaceName: 'Operations' };
const version = (id: string, label: string): FormVersion => ({ id, snapshotLabel: label, formDefinition: { id: 'form-1', name1: 'Laptop' }, workspace, statusKey: 'Published', versionNumber: Number(label.replace(/\D/g, '')) || 1 });
const request = (id: string, versionId: string): Request => ({ id, requestNumber: id, workspace, formVersion: { id: versionId, snapshotLabel: versionId }, formDefinitionId: 'form-1', serviceCode: 'LAPTOP', statusKey: 'Closed', priorityKey: 'Medium', requester: { id: 'p1', displayName: 'Requester' }, requestedFor: { id: 'p1', displayName: 'Requester' }, assignee: { id: 'p2', displayName: 'Agent' }, assignmentGroupCode: 'IT', departmentCode: 'IT', siteCode: 'HQ', createdAt: '2026-01-01T00:00:00.000Z', closedAt: '2026-01-01T10:00:00.000Z', resolvedAt: '', assignedAt: '', cancelledAt: '', confidentialityLevelId: '', createdBy: { id: 'p1', displayName: 'Requester' }, currentStageId: '', description: '', firstRespondedAt: '', impactId: '', reopenedAt: '', requestSourceKey: 'Portal', requestTypeId: '', sourceId: '', title: id, updatedAt: '', updatedBy: { id: 'p1', displayName: 'Requester' }, urgencyId: '', versionNumber: 1, catalogItemCode: 'LAPTOP' });
const field = (id: string, versionId: string, code: string, type: FieldDefinition['fieldTypeKey'], sensitive = false): FieldDefinition => ({ id, label: `${code} label`, fieldCode: code, fieldTypeKey: type, formDefinition: { id: 'form-1', name1: 'Laptop' }, formSection: { id: 'section-1', title: 'Details' }, formVersionID: { id: versionId, snapshotLabel: versionId }, workspace, agentOnly: false, readOnly1: false, requesterVisible: true, required: false, sensitive, reportable: true });
const answer = (id: string, requestId: string, versionId: string, fieldId: string, code: string, valueTypeKey: RequestFieldValue['valueTypeKey'], values: Partial<RequestFieldValue>): RequestFieldValue => ({ id, fieldLabel: code, fieldDefinitionId: fieldId, formVersion: { id: versionId, snapshotLabel: versionId }, requestId: { id: requestId, requestNumber: requestId }, stableFieldKey: code, updatedAt: '', updatedBy: { id: 'p1', displayName: 'Requester' }, value: '', valueTypeKey, workspaceId: workspace, ...values });

export function runReportExecutionTestCases(): string[] {
  const requests = [request('R1', 'v1'), request('R2', 'v2')];
  const fields = [field('f1', 'v1', 'cost', 'Currency'), field('f2', 'v2', 'cost', 'Currency'), field('f3', 'v1', 'features', 'MultipleChoice'), field('f4', 'v1', 'secret', 'Text', true)];
  const answers = [answer('a1', 'R1', 'v1', 'f1', 'cost', 'Currency', { numberValue: 10 }), answer('a2', 'R2', 'v2', 'f2', 'cost', 'Currency', { numberValue: 30 }), answer('a3', 'R1', 'v1', 'f3', 'features', 'MultipleChoice', { structuredValue: JSON.stringify(['Dock, premium', 'Bag']) }), answer('a4', 'R1', 'v1', 'f4', 'secret', 'Text', { textValue: 'protected' })];
  const context: ReportExecutionContext = { workspaceId: workspace.id, requests, answers, fields, versions: [version('v1', '1'), version('v2', '2')], canReadRequest: () => true, canReadField: (item: FieldDefinition) => !item.sensitive };
  const dimensions = discoverReportDimensions(context);
  assert(dimensions.some((item) => item.key === 'field:v1:cost') && dimensions.some((item) => item.key === 'field:v2:cost'), 'Historical versions must be independently discoverable.');
  assert(!dimensions.some((item) => item.key.includes('secret')), 'Sensitive fields must be excluded before execution.');
  const definition = (dimensionKey: string, aggregation: ReportDefinitionInput['aggregation'], visualization: ReportDefinitionInput['visualization']): ReportDefinitionInput => ({ dimensionKey, aggregation, visualization, filters: [], sort: { by: 'label', direction: 'asc' }, page: 1, pageSize: 20 });
  const numeric = executeReport(definition('field:v1:cost', 'Sum', 'Summary'), context); assert(numeric.summaryValue === 10, 'Numeric sum must use typed values.');
  const median = executeReport(definition('completionHours', 'Median', 'Summary'), context); assert(median.summaryValue === 20, 'Duration median must aggregate group medians deterministically.');
  const choices = executeReport(definition('field:v1:features', 'DistinctCount', 'Donut'), context); assert(choices.rows.length === 2 && choices.rows.every((row) => row.value === 1), 'Typed multi-choice values must not split labels and must distinct-count requests.');
  (['Summary', 'Table', 'Bar', 'Line', 'Donut'] as const).forEach((visualization) => assert(executeReport(definition('statusKey', 'Count', visualization), context).visualization === visualization, `${visualization} model must be preserved.`));
  const drill = executeReport(definition('statusKey', 'DistinctCount', 'Table'), context); assert(drill.rows[0]?.requestIds.length === 2, 'Drill-through must retain authorized request identifiers.');
  const denied = executeReport(definition('statusKey', 'Count', 'Bar'), { ...context, canReadRequest: () => false }); assert(denied.status === 'empty', 'Unauthorized requests must not enter results.');
  return ['custom-field-discovery', 'historical-version-mapping', 'numeric-aggregation', 'multi-choice-distinct-count', 'median-duration', 'sensitive-field-exclusion', 'visualization-models', 'authorized-drill-through'];
}
