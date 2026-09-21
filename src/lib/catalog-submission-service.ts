import { initialize } from '@microsoft/power-apps/app';
import type { CatalogItem } from '@/generated/models/catalog-item-model';
import type { FieldDefinition } from '@/generated/models/field-definition-model';
import type { FormVersion } from '@/generated/models/form-version-model';
import type { Person } from '@/generated/models/person-model';
import type { Request } from '@/generated/models/request-model';
import type { RequestFieldValueValueTypeKey } from '@/generated/models/request-field-value-model';
import type { Workspace } from '@/generated/models/workspace-model';
import { RequestActivityService } from '@/generated/services/request-activity-service';
import { RequestApprovalService } from '@/generated/services/request-approval-service';
import { RequestFieldValueService } from '@/generated/services/request-field-value-service';
import { RequestServiceTargetService } from '@/generated/services/request-service-target-service';
import { ServiceTargetPolicyService } from '@/generated/services/service-target-policy-service';
import { ServiceTargetRuleService } from '@/generated/services/service-target-rule-service';
import { RequestTaskService } from '@/generated/services/request-task-service';
import { selectServiceTargetPolicy } from '@/lib/service-target-engine';
import { AuthorizedRequestService } from '@/lib/authorized-request-service';
import { assertAuthorized, type AuthorizationContext } from '@/lib/authorization';

export interface CatalogSubmissionInput {
  workspace: Workspace;
  catalogItem: CatalogItem;
  formVersion: FormVersion;
  fields: FieldDefinition[];
  values: Record<string, string>;
  title: string;
  description: string;
  actor: Pick<Person, 'id' | 'displayName'>;
  context: AuthorizationContext;
}
function serializeFieldValue(field: FieldDefinition, rawValue: string): {
  valueTypeKey: RequestFieldValueValueTypeKey;
  textValue?: string;
  numberValue?: number;
  dateValue?: string;
  booleanValue?: boolean;
  structuredValue?: string;
  displayValue: string;
} {
  if (field.fieldTypeKey === 'Number' || field.fieldTypeKey === 'Currency') {
    const numberValue = rawValue.trim() ? Number(rawValue) : undefined;
    return { valueTypeKey: field.fieldTypeKey === 'Currency' ? 'Currency' : 'Number', numberValue: Number.isFinite(numberValue) ? numberValue : undefined, displayValue: rawValue };
  }
  if (field.fieldTypeKey === 'Date' || field.fieldTypeKey === 'DateAndTime') return { valueTypeKey: field.fieldTypeKey === 'Date' ? 'Date' : 'DateTime', dateValue: rawValue || undefined, displayValue: rawValue };
  if (field.fieldTypeKey === 'YesOrNo') return { valueTypeKey: 'Boolean', booleanValue: rawValue === 'true', displayValue: rawValue === 'true' ? 'Yes' : 'No' };
  if (field.fieldTypeKey === 'MultipleChoice' || field.fieldTypeKey === 'CascadingChoice' || field.fieldTypeKey === 'RichText') return { valueTypeKey: field.fieldTypeKey === 'MultipleChoice' ? 'MultipleChoice' : 'Structured', structuredValue: rawValue, displayValue: rawValue };
  if (field.fieldTypeKey === 'SingleChoice') return { valueTypeKey: 'SingleChoice', textValue: rawValue, displayValue: rawValue };
  if (field.fieldTypeKey === 'Person') return { valueTypeKey: 'Person', textValue: rawValue, displayValue: rawValue };
  if (field.fieldTypeKey === 'Department' || field.fieldTypeKey === 'Site' || field.fieldTypeKey === 'Asset' || field.fieldTypeKey === 'BusinessUnit' || field.fieldTypeKey === 'Lookup') return { valueTypeKey: 'Lookup', textValue: rawValue, displayValue: rawValue };
  if (field.fieldTypeKey === 'Attachment') return { valueTypeKey: 'File', textValue: rawValue, displayValue: rawValue };
  return { valueTypeKey: 'Text', textValue: rawValue, displayValue: rawValue };
}

function validateSubmittedField(field: FieldDefinition, rawValue: string): void {
  const value = rawValue.trim();
  if (field.required && !value) throw new Error(`${field.label} is required.`);
  if (!value) return;
  if ((field.fieldTypeKey === 'Number' || field.fieldTypeKey === 'Currency') && !Number.isFinite(Number(value))) throw new Error(`${field.label} must be a valid number.`);
  if (field.fieldTypeKey === 'Email' && !/^\S+@\S+\.\S+$/.test(value)) throw new Error(`${field.label} must be a valid email address.`);
  if (field.fieldTypeKey === 'URL') {
    try {
      new URL(value);
    } catch {
      throw new Error(`${field.label} must be a valid URL.`);
    }
  }
  if (field.fieldTypeKey === 'Date' || field.fieldTypeKey === 'DateAndTime') {
    const timestamp = new Date(value).getTime();
    if (!Number.isFinite(timestamp)) throw new Error(`${field.label} must be a valid date.`);
  }
}


export class CatalogSubmissionService {
  static async submit(input: CatalogSubmissionInput): Promise<Request> {
    const { workspace, catalogItem, formVersion, fields, values, actor, context } = input;
    if (workspace.active !== 'Active' || !workspace.requesterPortalEnabled) throw new Error('This workspace is not accepting portal requests.');
    if (catalogItem.workspace.id !== workspace.id || catalogItem.statusKey !== 'Published' || !catalogItem.requesterEligible) throw new Error('This catalog item is not available to this requester.');
    if (formVersion.workspace.id !== workspace.id || formVersion.formDefinition.id !== catalogItem.formDefinition.id || formVersion.statusKey !== 'Published') throw new Error('No published form version is available.');
    if (!context.identity || actor.id !== context.identity.personId) throw new Error('The signed-in account is not linked to an active person record.');
    assertAuthorized('request.create', context, { workspaceId: workspace.id, requesterId: actor.id, requestedForId: actor.id, serviceCode: catalogItem.service.id, catalogItemCode: catalogItem.itemCode });
    const submittedFields = fields.filter((field: FieldDefinition) => field.formVersionID.id === formVersion.id && !field.isDeleted && field.fieldTypeKey !== 'Information');
    submittedFields.forEach((field: FieldDefinition) => validateSubmittedField(field, values[field.id] ?? ''));
    await initialize();
    const emptyDate = '1900-01-01T00:00:00.000Z';
    const now = new Date().toISOString();
    const request = await AuthorizedRequestService.create({
      requestTypeId: catalogItem.requestTypeCode,
      serviceCode: catalogItem.service.id,
      catalogItemCode: catalogItem.itemCode,
      formDefinitionId: catalogItem.formDefinition.id,
      formVersion: { id: formVersion.id, snapshotLabel: formVersion.snapshotLabel },
      requester: actor,
      requestedFor: actor,
      title: input.title,
      description: input.description,
      statusKey: 'New',
      priorityKey: catalogItem.defaultPriorityKey,
      impactId: 'MEDIUM', urgencyId: 'MEDIUM', siteCode: workspace.defaultSiteId ?? 'UNSPECIFIED', departmentCode: 'UNSPECIFIED', sourceId: 'PORTAL',
      requestSourceKey: 'Portal',
      assignmentGroupCode: 'UNASSIGNED', assignee: actor, confidentialityLevelId: 'INTERNAL', currentStageId: 'SUBMITTED',
      createdBy: actor, updatedBy: actor, assignedAt: emptyDate, firstRespondedAt: emptyDate, resolvedAt: emptyDate, closedAt: emptyDate, cancelledAt: emptyDate, reopenedAt: emptyDate,
    }, workspace, context);
    const requestRef = { id: request.id, requestNumber: request.requestNumber };
    const workspaceRef = { id: workspace.id, workspaceName: workspace.workspaceName };
    await Promise.all(submittedFields.filter((field: FieldDefinition) => values[field.id] !== undefined).map((field: FieldDefinition) => {
      const rawValue = values[field.id] ?? '';
      return RequestFieldValueService.create({
        requestId: requestRef, workspaceId: workspaceRef, formVersion: { id: formVersion.id, snapshotLabel: formVersion.snapshotLabel }, fieldDefinitionId: field.id, stableFieldKey: field.fieldCode, fieldLabel: field.label, value: rawValue, ...serializeFieldValue(field, rawValue), updatedAt: now, updatedBy: actor,
      });
    }));
    await RequestActivityService.create({ requestActivityName: 'Catalog request submitted', workspace: workspaceRef, request: requestRef, actor, activityTypeKey: 'CustomerCommunication', body: `Submitted from ${catalogItem.itemName}.`, occurredAt: now });
    const [policies, rules] = await Promise.all([ServiceTargetPolicyService.getAll({ filter: `workspace/id eq '${workspace.id}'` }), ServiceTargetRuleService.getAll({ filter: `workspace/id eq '${workspace.id}'` })]);
    const selectedTarget = selectServiceTargetPolicy(request, policies, rules);
    if (selectedTarget) {
      const { policy, rule } = selectedTarget;
      const dueAt = new Date(Date.now() + policy.durationMinutes * 60_000).toISOString();
      const warningAt = new Date(Date.now() + policy.durationMinutes * (policy.warningThresholdPercent / 100) * 60_000).toISOString();
      await RequestServiceTargetService.create({ snapshotPolicyName: policy.name1, accumulatedPausedMinutes: 0, dueAt, lastEvaluatedAt: now, remainingMinutes: policy.durationMinutes, requestId: requestRef, serviceTargetDefinition: { id: policy.id, name1: policy.name1 }, serviceTargetRule: { id: rule.id, ruleName: rule.ruleName }, snapshotDurationMinutes: policy.durationMinutes, startedAt: now, statusKey: 'Active', targetTypeKey: policy.targetTypeKey, warningAt, workspaceId: workspaceRef });
    }
    return request;
  }
}
