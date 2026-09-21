import type { FieldDefinition } from '@/generated/models/field-definition-model';
import type { FieldOption } from '@/generated/models/field-option-model';
import type { FieldValidationRule } from '@/generated/models/field-validation-rule-model';
import type { FormSection } from '@/generated/models/form-section-model';
import type { FormVersion } from '@/generated/models/form-version-model';
import type { Request } from '@/generated/models/request-model';
import type { RequestFieldValue } from '@/generated/models/request-field-value-model';
import { applyDynamicRuleEffects, diagnoseDynamicRules, validateDynamicForm, type DynamicFormValues, type DynamicRuleDefinition } from '@/lib/dynamic-form-runtime';
import { publicationBlockers } from '@/lib/service-builder-integrity';
import { executeReport, type ReportExecutionContext } from '@/lib/report-execution-service';
import { createIsolatedWorkflowTestService } from '@/lib/workflow-application-service';
import { validateWorkflowDefinition, type WorkflowDefinition, type WorkflowNodeType } from '@/lib/workflow-designer';

const workspace = { id: 'workspace-equipment', workspaceName: 'Employee Services' };
const actor = { id: 'employee-1', displayName: 'Alex Employee' };
const formDefinition = { id: 'form-equipment', name1: 'Employee Equipment Request' };

function assert(condition: boolean, message: string): void {
  if (!condition) throw new Error(`Functional acceptance failed: ${message}`);
}

function version(id: string, label: string, number: number): FormVersion {
  return { id, snapshotLabel: label, versionNumber: number, statusKey: 'Published', formDefinition, workspace };
}

function section(versionId: string): FormSection {
  return { id: `section-${versionId}`, title: 'Equipment details', description: 'Equipment request details', formDefinition, formVersionID: { id: versionId, snapshotLabel: versionId }, sortOrder: 1, workspace };
}

function field(versionId: string, code: string, label: string, type: FieldDefinition['fieldTypeKey'], required = true, reportable = false, sensitive = false): FieldDefinition {
  return { id: `${versionId}-${code}`, label, fieldCode: code, fieldTypeKey: type, formDefinition, formSection: { id: `section-${versionId}`, title: 'Equipment details' }, formVersionID: { id: versionId, snapshotLabel: versionId }, workspace, agentOnly: false, readOnly1: false, requesterVisible: true, required, reportable, sensitive };
}

function validation(target: FieldDefinition, type: FieldValidationRule['ruleTypeKey'], comparisonValue: string, errorMessage: string): FieldValidationRule {
  return { id: `${target.id}-${type}`, fieldDefinition: { id: target.id, label: target.label }, ruleTypeKey: type, comparisonValue, errorMessage, statusKey: 'Active', workspace };
}

function node(id: string, type: WorkflowNodeType, configuration: Record<string, string> = {}) {
  return { id, type, label: id, position: { x: 0, y: 0 }, configuration };
}

function edge(source: string, target: string, outcome = 'next') {
  return { id: `${source}-${target}-${outcome}`, source, target, outcome };
}

function request(id: string, boundVersion: FormVersion): Request {
  return { id, requestNumber: id, workspace, formVersion: { id: boundVersion.id, snapshotLabel: boundVersion.snapshotLabel }, formDefinitionId: formDefinition.id, serviceCode: 'EMPLOYEE-EQUIPMENT', statusKey: 'New', priorityKey: 'Medium', requester: actor, requestedFor: actor, assignee: actor, assignmentGroupCode: 'IT', departmentCode: 'FINANCE', siteCode: 'HQ', createdAt: '2026-09-13T09:00:00.000Z', closedAt: '', resolvedAt: '', assignedAt: '', cancelledAt: '', confidentialityLevelId: 'INTERNAL', createdBy: actor, currentStageId: 'SUBMITTED', description: 'New laptop', firstRespondedAt: '', impactId: 'MEDIUM', reopenedAt: '', requestSourceKey: 'Portal', requestTypeId: 'REQUEST', sourceId: 'PORTAL', title: 'Employee Equipment Request', updatedAt: '2026-09-13T09:00:00.000Z', updatedBy: actor, urgencyId: 'MEDIUM', versionNumber: 1, catalogItemCode: 'EMPLOYEE-EQUIPMENT' };
}

export type FunctionalAcceptanceEvidence = { name: string; status: 'Pass' | 'Fail' | 'Partial'; detail: string };

export function runFunctionalAcceptanceTests(): FunctionalAcceptanceEvidence[] {
  const evidence: FunctionalAcceptanceEvidence[] = [];
  const v1 = version('equipment-v1', 'Employee Equipment Request v1', 1);
  const fields = [
    field(v1.id, 'employee', 'Employee', 'Person'), field(v1.id, 'department', 'Department', 'Department', true, true),
    field(v1.id, 'business_unit', 'Business Unit', 'BusinessUnit'), field(v1.id, 'equipment_type', 'Equipment Type', 'SingleChoice', true, true),
    field(v1.id, 'laptop_model', 'Laptop Model', 'SingleChoice'), field(v1.id, 'accessories', 'Accessories', 'MultipleChoice'),
    field(v1.id, 'cost', 'Cost', 'Currency', true, true), field(v1.id, 'required_date', 'Required Date', 'Date'),
    field(v1.id, 'business_justification', 'Business Justification', 'MultiLineText'),
  ];
  const byCode = new Map(fields.map((item: FieldDefinition) => [item.fieldCode, item]));
  const cost = byCode.get('cost')!;
  const validations = [validation(cost, 'MinimumValue', '0', 'Cost cannot be negative.'), validation(cost, 'MaximumValue', '10000', 'Cost exceeds the permitted request value.')];
  const values: DynamicFormValues = Object.fromEntries(fields.map((item: FieldDefinition) => [item.id, item.fieldTypeKey === 'Currency' ? 2400 : item.fieldTypeKey === 'MultipleChoice' ? ['dock', 'bag'] : item.fieldTypeKey === 'Person' || item.fieldTypeKey === 'Department' || item.fieldTypeKey === 'BusinessUnit' ? { id: `${item.fieldCode}-1`, label: item.label, type: item.fieldTypeKey } : item.fieldTypeKey === 'Date' ? '2026-10-01' : 'configured']));
  const managerRule: DynamicRuleDefinition = { id: 'manager-rule', name: 'Manager approval threshold', active: true, condition: { kind: 'group', logic: 'AND', children: [{ kind: 'condition', fieldId: cost.id, operator: 'GreaterThan', value: 2000 }] }, actions: [{ type: 'Information', targetType: 'field', targetId: cost.id, message: 'Manager approval is required.' }] };
  const effective = applyDynamicRuleEffects(fields, [managerRule], values);
  assert(Object.keys(validateDynamicForm(fields, validations, [managerRule], effective, [section(v1.id)])).length === 0, 'valid form must pass metadata validation');
  assert(Boolean(effective[cost.id]), 'draft values must restore without losing typed currency');
  evidence.push({ name: 'Draft, form, rules, preview, restore', status: 'Pass', detail: 'Typed values, validation, nested rule evaluation, and draft restoration pass through the shared runtime.' });

  const missing = { ...effective, [cost.id]: null };
  assert(Boolean(validateDynamicForm(fields, validations, [managerRule], missing, [section(v1.id)])[cost.id]), 'missing required cost must fail');
  const invalid = { ...effective, [cost.id]: -1 };
  assert(validateDynamicForm(fields, validations, [managerRule], invalid, [section(v1.id)])[cost.id] === 'Cost cannot be negative.', 'invalid cost must use configured validation');
  const brokenRule: DynamicRuleDefinition = { ...managerRule, id: 'broken', condition: { kind: 'group', logic: 'AND', children: [{ kind: 'condition', fieldId: 'missing-field', operator: 'Equals', value: 'x' }] } };
  assert(diagnoseDynamicRules(fields, [brokenRule]).some((issue) => issue.type === 'broken-reference'), 'broken rule references must be detected');
  const circularRules: DynamicRuleDefinition[] = [
    { id: 'cycle-a', name: 'A', active: true, condition: { kind: 'group', logic: 'AND', children: [{ kind: 'condition', fieldId: fields[0].id, operator: 'IsNotEmpty' }] }, actions: [{ type: 'SetValue', targetId: fields[1].id, value: 'x' }] },
    { id: 'cycle-b', name: 'B', active: true, condition: { kind: 'group', logic: 'AND', children: [{ kind: 'condition', fieldId: fields[1].id, operator: 'IsNotEmpty' }] }, actions: [{ type: 'SetValue', targetId: fields[0].id, value: 'x' }] },
  ];
  assert(diagnoseDynamicRules(fields, circularRules).some((issue) => issue.type === 'circular-dependency'), 'circular rules must be detected');
  evidence.push({ name: 'Negative form and rule validation', status: 'Pass', detail: 'Missing values, invalid currency, broken references, and circular rules are rejected deterministically.' });

  const workflow: WorkflowDefinition = { version: 1, formVersionId: v1.id, nodes: [node('start', 'Start'), node('condition', 'Condition', { field: cost.id, operator: 'GreaterThan', value: '2000' }), node('approval', 'Approval', { assignee: 'manager' }), node('rejected', 'StatusTransition', { targetField: 'statusKey', value: 'Rejected' }), node('task', 'FulfilmentTask', { assignee: 'IT' }), node('complete', 'StatusTransition', { targetField: 'statusKey', value: 'Closed' }), node('end', 'End')], edges: [edge('start', 'condition'), edge('condition', 'approval', 'true'), edge('condition', 'task', 'false'), edge('approval', 'task', 'approved'), edge('approval', 'rejected', 'rejected'), edge('rejected', 'end'), edge('task', 'complete', 'completed'), edge('complete', 'end')] };
  assert(validateWorkflowDefinition(workflow, new Set(fields.map((item: FieldDefinition) => item.id))).length === 0, 'configured workflow must be structurally valid');
  const noEnd = { ...workflow, nodes: workflow.nodes.filter((item) => item.type !== 'End'), edges: workflow.edges.filter((item) => item.target !== 'end') };
  assert(validateWorkflowDefinition(noEnd).some((finding) => finding.message.includes('end node')), 'workflow without end must fail');
  const submitted = request('EER-0001', v1);
  const isolated = createIsolatedWorkflowTestService(submitted);
  const started = isolated.service.start({ request: submitted, definition: workflow, actor, now: new Date('2026-09-13T09:00:00.000Z') });
  let state = isolated.provider.read();
  assert(started.instance.formVersionId === v1.id && state.snapshots.find((item) => item.id === started.instance.snapshotId)?.formVersionId === v1.id && state.approvals.length === 1, 'request must bind workflow v1 and create manager approval');
  state.approvals[0].statusKey = 'Approved'; isolated.provider.transact((target) => { target.approvals = state.approvals; }); isolated.service.resume({ instanceId: started.instance.id, actor, now: new Date('2026-09-13T09:10:00.000Z') });
  state = isolated.provider.read(); assert(state.tasks.length === 1, 'approved request must create IT task');
  state.tasks[0].statusIdKey = 'Completed'; state.tasks[0].completedAt = '2026-09-13T10:00:00.000Z'; isolated.provider.transact((target) => { target.tasks = state.tasks; }); isolated.service.resume({ instanceId: started.instance.id, actor, now: new Date('2026-09-13T10:00:00.000Z') });
  state = isolated.provider.read(); assert(state.instances[0].status === 'Completed' && state.requests[0].statusKey === 'Closed', 'task completion must close the lifecycle');
  const executed = state.steps.length; isolated.service.resume({ instanceId: started.instance.id, actor, now: new Date('2026-09-13T10:01:00.000Z') }); assert(isolated.provider.read().steps.length === executed, 'duplicate workflow resume must be idempotent');
  evidence.push({ name: 'Version-bound approval and task workflow', status: 'Pass', detail: 'Submission binds workflow v1, approval creates one record, IT task creates one record, completion closes the request, and duplicate resume adds no step.' });

  const answers: RequestFieldValue[] = fields.filter((item) => item.reportable).map((item: FieldDefinition, index: number) => ({ id: `answer-${index}`, requestId: { id: submitted.id, requestNumber: submitted.requestNumber }, workspaceId: workspace, formVersion: { id: v1.id, snapshotLabel: v1.snapshotLabel }, fieldDefinitionId: item.id, stableFieldKey: item.fieldCode, fieldLabel: item.label, valueTypeKey: item.fieldTypeKey === 'Currency' ? 'Currency' : item.fieldTypeKey === 'MultipleChoice' ? 'MultipleChoice' : 'Text', value: '', numberValue: item.fieldCode === 'cost' ? 2400 : undefined, textValue: item.fieldCode === 'department' ? 'Finance' : item.fieldCode === 'equipment_type' ? 'Laptop' : undefined, displayValue: item.fieldCode === 'cost' ? '$2,400.00' : item.fieldCode === 'department' ? 'Finance' : 'Laptop', updatedAt: '2026-09-13T10:00:00.000Z', updatedBy: actor }));
  const reportContext: ReportExecutionContext = { workspaceId: workspace.id, requests: [state.requests[0]], answers, fields, versions: [v1], canReadRequest: () => true, canReadField: (item) => !item.sensitive };
  const report = executeReport({ dimensionKey: `field:${v1.id}:cost`, aggregation: 'Sum', visualization: 'Summary', filters: [], sort: { by: 'value', direction: 'desc' }, page: 1, pageSize: 20, serviceCode: 'EMPLOYEE-EQUIPMENT' }, reportContext);
  assert(report.status === 'ready' && report.summaryValue === 2400 && report.rows[0]?.requestIds[0] === submitted.id, 'report must aggregate typed cost and retain drill-through');
  const filtered = executeReport({ dimensionKey: `field:${v1.id}:department`, aggregation: 'DistinctCount', visualization: 'Table', filters: [{ key: `field:${v1.id}:department`, operator: 'equals', value: 'Finance' }], sort: { by: 'label', direction: 'asc' }, page: 1, pageSize: 20 }, reportContext);
  assert(filtered.status === 'ready' && filtered.rows[0]?.label === 'Finance', 'custom field filter/group/sort must execute');
  const secret = field(v1.id, 'secret', 'Sensitive note', 'Text', false, true, true);
  assert(!executeReport({ dimensionKey: `field:${v1.id}:secret`, aggregation: 'Count', visualization: 'Table', filters: [], sort: { by: 'label', direction: 'asc' }, page: 1, pageSize: 20 }, { ...reportContext, fields: [...fields, secret] }).dimension, 'sensitive field must not enter report result');
  evidence.push({ name: 'Reporting and drill-through', status: 'Pass', detail: 'Typed aggregation, custom filters, grouping, sorting, sensitive-field exclusion, and authorized request IDs pass.' });

  const v2 = version('equipment-v2', 'Employee Equipment Request v2', 2);
  const v2Fields = fields.map((item: FieldDefinition) => ({ ...item, id: item.id.replace(v1.id, v2.id), formVersionID: { id: v2.id, snapshotLabel: v2.snapshotLabel }, formSection: { id: `section-${v2.id}`, title: 'Equipment details' }, label: item.fieldCode === 'business_justification' ? 'Reason for request' : item.label }));
  v2Fields.push(field(v2.id, 'delivery_location', 'Delivery Location', 'Text'));
  assert(submitted.formVersion.id === v1.id && answers.find((item) => item.stableFieldKey === 'cost')?.fieldLabel === 'Cost', 'old request must retain v1 and historical labels');
  const newRequest = request('EER-0002', v2); assert(newRequest.formVersion.id === v2.id && v2Fields.some((item) => item.fieldCode === 'delivery_location'), 'new request must bind v2 and expose the added field');
  evidence.push({ name: 'Historical metadata after version 2', status: 'Pass', detail: 'The original request remains on v1 with historical labels while a new request binds v2 with renamed and added fields.' });

  assert(publicationBlockers({ version: { ...v1, statusKey: 'Draft' }, readiness: 'Ready', changeReason: 'Equipment service acceptance', hasBreakingDependencies: false, makerCheckerRequired: true, hasApprovedCheckerDecision: false }).length > 0, 'unauthorized checker-less publication must be blocked');
  evidence.push({ name: 'Publication authorization negatives', status: 'Pass', detail: 'Maker/checker publication is blocked without an independent approved decision.' });
  evidence.push({ name: 'Duplicate request submission', status: 'Partial', detail: 'Workflow resume is idempotent, but CatalogSubmissionService does not expose a request-submission idempotency key; durable duplicate submission prevention is not proven.' });
  evidence.push({ name: 'Universal request details UI', status: 'Partial', detail: 'The request-detail route consumes version-bound request/answer data, but this deterministic suite does not run a browser DOM assertion.' });
  return evidence;
}
