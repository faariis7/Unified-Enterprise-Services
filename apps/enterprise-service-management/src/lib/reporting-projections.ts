import type { ApprovalDecision } from '@/generated/models/approval-decision-model';
import type { AutomationExecution } from '@/generated/models/automation-execution-model';
import type { FieldDefinition } from '@/generated/models/field-definition-model';
import type { FieldDependency } from '@/generated/models/field-dependency-model';
import type { FormVersion } from '@/generated/models/form-version-model';
import type { Request } from '@/generated/models/request-model';
import type { RequestApproval } from '@/generated/models/request-approval-model';
import type { RequestFieldValue } from '@/generated/models/request-field-value-model';
import type { RequestServiceTarget } from '@/generated/models/request-service-target-model';
import type { RequestTask } from '@/generated/models/request-task-model';
import type { Service } from '@/generated/models/service-model';

export interface RequestReportingRow {
  requestId: string;
  requestNumber: string;
  workspaceId: string;
  serviceCode: string;
  formVersionId: string;
  status: string;
  priority: string;
  requester: string;
  requestedFor: string;
  department: string;
  site: string;
  owner: string;
  createdAt: string;
  resolvedAt?: string;
  closedAt?: string;
}

export interface TypedAnswerReportingRow {
  requestId: string;
  requestNumber: string;
  workspaceId: string;
  serviceCode: string;
  formVersionId: string;
  fieldDefinitionId: string;
  stableFieldKey: string;
  historicalLabel: string;
  valueType: string;
  textValue?: string;
  numberValue?: number;
  dateValue?: string;
  booleanValue?: boolean;
  personOrLookupId?: string;
  displayValue: string;
  normalizedChoice?: string;
}

export interface ApprovalReportingRow {
  requestId: string;
  approvalId: string;
  status: string;
  approver: string;
  createdAt: string;
  decidedAt?: string;
  durationHours?: number;
  decisionCount: number;
}

export interface SlaReportingRow {
  requestId: string;
  targetId: string;
  targetType: string;
  status: string;
  startedAt: string;
  dueAt: string;
  targetMinutes: number;
  pausedMinutes: number;
}

export interface WorkflowReportingRow {
  requestId: string;
  executionId: string;
  trigger: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  durationMinutes?: number;
  taskCount: number;
  completedTaskCount: number;
}

export interface ReportingFieldCatalogRow {
  id: string;
  workspaceId: string;
  serviceName: string;
  serviceCode: string;
  versionLabel: string;
  label: string;
  stableKey: string;
  type: string;
  reportable: boolean;
  sensitive: boolean;
  dependencies: string[];
  usageCount: number;
}

function hoursBetween(start: string, end: string): number | undefined {
  const duration = new Date(end).getTime() - new Date(start).getTime();
  return Number.isFinite(duration) && duration >= 0 ? Math.round((duration / 3_600_000) * 10) / 10 : undefined;
}

function parseMultiChoice(answer: RequestFieldValue): string[] {
  if (answer.valueTypeKey !== 'MultipleChoice') return [];
  if (answer.structuredValue) {
    try {
      const parsed: unknown = JSON.parse(answer.structuredValue);
      if (Array.isArray(parsed)) return parsed.filter((item: unknown): item is string => typeof item === 'string' && item.length > 0);
    } catch {
      // Fall through to the display-safe delimiter representation.
    }
  }
  return (answer.displayValue || answer.textValue || answer.value).split(/[,;|]/).map((item: string) => item.trim()).filter(Boolean);
}

export function projectRequests(requests: readonly Request[]): RequestReportingRow[] {
  return requests.map((request: Request) => ({
    requestId: request.id,
    requestNumber: request.requestNumber,
    workspaceId: request.workspace.id,
    serviceCode: request.serviceCode,
    formVersionId: request.formVersion.id,
    status: request.statusKey,
    priority: request.priorityKey,
    requester: request.requester.displayName,
    requestedFor: request.requestedFor.displayName,
    department: request.departmentCode,
    site: request.siteCode,
    owner: request.assignee.displayName || request.assignmentGroupCode || 'Unassigned',
    createdAt: request.createdAt,
    resolvedAt: request.resolvedAt || undefined,
    closedAt: request.closedAt || undefined,
  }));
}

export function projectTypedAnswers(answers: readonly RequestFieldValue[], requests: readonly Request[]): TypedAnswerReportingRow[] {
  const requestById = new Map(requests.map((request: Request) => [request.id, request]));
  return answers.flatMap((answer: RequestFieldValue) => {
    if (answer.isDeleted) return [];
    const request = requestById.get(answer.requestId.id);
    if (!request) return [];
    const base: TypedAnswerReportingRow = {
      requestId: request.id,
      requestNumber: request.requestNumber,
      workspaceId: request.workspace.id,
      serviceCode: request.serviceCode,
      formVersionId: answer.formVersion.id,
      fieldDefinitionId: answer.fieldDefinitionId,
      stableFieldKey: answer.stableFieldKey,
      historicalLabel: answer.fieldLabel,
      valueType: answer.valueTypeKey ?? 'Text',
      textValue: answer.textValue,
      numberValue: answer.numberValue,
      dateValue: answer.dateValue,
      booleanValue: answer.booleanValue,
      personOrLookupId: ['Person', 'Lookup'].includes(answer.valueTypeKey ?? '') ? answer.value : undefined,
      displayValue: answer.displayValue || answer.textValue || answer.value || 'Not answered',
    };
    const choices = parseMultiChoice(answer);
    return choices.length ? choices.map((choice: string) => ({ ...base, normalizedChoice: choice, displayValue: choice })) : [base];
  });
}

export function projectApprovals(approvals: readonly RequestApproval[], decisions: readonly ApprovalDecision[]): ApprovalReportingRow[] {
  return approvals.map((approval: RequestApproval) => ({
    requestId: approval.requestId.id,
    approvalId: approval.id,
    status: approval.statusKey,
    approver: approval.approverPersonId.displayName || approval.approverGroupCode || approval.approverRole?.roleName || 'Unresolved',
    createdAt: approval.createdAt,
    decidedAt: approval.decidedAt || undefined,
    durationHours: approval.decidedAt ? hoursBetween(approval.createdAt, approval.decidedAt) : undefined,
    decisionCount: decisions.filter((decision: ApprovalDecision) => decision.requestApproval.id === approval.id).length,
  }));
}

export function projectSla(targets: readonly RequestServiceTarget[]): SlaReportingRow[] {
  return targets.map((target: RequestServiceTarget) => ({ requestId: target.requestId.id, targetId: target.id, targetType: target.targetTypeKey, status: target.statusKey, startedAt: target.startedAt, dueAt: target.dueAt, targetMinutes: target.snapshotDurationMinutes, pausedMinutes: target.accumulatedPausedMinutes }));
}

export function projectWorkflow(executions: readonly AutomationExecution[], tasks: readonly RequestTask[]): WorkflowReportingRow[] {
  return executions.map((execution: AutomationExecution) => {
    const relatedTasks = tasks.filter((task: RequestTask) => task.requestId.id === execution.request.id);
    return { requestId: execution.request.id, executionId: execution.id, trigger: execution.triggerKey, status: execution.statusKey, startedAt: execution.startedAt, completedAt: execution.completedAt || undefined, durationMinutes: execution.completedAt ? (hoursBetween(execution.startedAt, execution.completedAt) ?? 0) * 60 : undefined, taskCount: relatedTasks.length, completedTaskCount: relatedTasks.filter((task: RequestTask) => task.statusIdKey === 'Completed').length };
  });
}

export function buildFieldCatalog(fields: readonly FieldDefinition[], services: readonly Service[], versions: readonly FormVersion[], dependencies: readonly FieldDependency[], answers: readonly RequestFieldValue[]): ReportingFieldCatalogRow[] {
  const serviceByVersion = new Map<string, Service>();
  services.forEach((service: Service) => { if (service.currentPublishedFormVersion?.id) serviceByVersion.set(service.currentPublishedFormVersion.id, service); });
  return fields.filter((field: FieldDefinition) => !field.isDeleted).map((field: FieldDefinition) => {
    const version = versions.find((item: FormVersion) => item.id === field.formVersionID.id);
    const service = serviceByVersion.get(field.formVersionID.id);
    const linked = dependencies.filter((dependency: FieldDependency) => dependency.statusKey === 'Active' && (dependency.sourceFieldDefinition.id === field.id || dependency.targetFieldDefinition.id === field.id));
    return { id: field.id, workspaceId: field.workspace.id, serviceName: service?.serviceName ?? field.formDefinition.name1, serviceCode: service?.serviceCode ?? 'Unassigned', versionLabel: version?.snapshotLabel ?? field.formVersionID.snapshotLabel, label: field.label, stableKey: field.fieldCode, type: field.fieldTypeKey, reportable: Boolean(field.reportable), sensitive: field.sensitive, dependencies: linked.map((dependency: FieldDependency) => dependency.dependencyName), usageCount: answers.filter((answer: RequestFieldValue) => answer.fieldDefinitionId === field.id && !answer.isDeleted).length };
  });
}
