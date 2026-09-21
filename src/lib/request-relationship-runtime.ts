import type { Request } from '@/generated/models/request-model';
import type { RequestFieldValue } from '@/generated/models/request-field-value-model';
import type { RequestRelationship, RequestRelationshipRelationshipTypeKey } from '@/generated/models/request-relationship-model';

export const relationshipLabels: Record<RequestRelationshipRelationshipTypeKey, string> = {
  Parent: 'Parent request',
  Child: 'Child request',
  Related: 'Related request',
  Duplicate: 'Duplicate of',
  Blocks: 'Blocks',
  BlockedBy: 'Blocked by',
};

export const inverseRelationshipType: Record<RequestRelationshipRelationshipTypeKey, RequestRelationshipRelationshipTypeKey> = {
  Parent: 'Child',
  Child: 'Parent',
  Related: 'Related',
  Duplicate: 'Related',
  Blocks: 'BlockedBy',
  BlockedBy: 'Blocks',
};

export type FieldMapping = { sourceKey: string; targetKey: string };

export type RelationshipProgress = {
  total: number;
  completed: number;
  blocked: number;
  active: number;
  percent: number;
};

const completedStatuses = new Set<Request['statusKey']>(['Resolved', 'Closed']);

export function calculateRelationshipProgress(requests: readonly Request[]): RelationshipProgress {
  const completed = requests.filter((request: Request) => completedStatuses.has(request.statusKey)).length;
  const blocked = requests.filter((request: Request) => request.statusKey === 'Pending').length;
  return {
    total: requests.length,
    completed,
    blocked,
    active: Math.max(0, requests.length - completed),
    percent: requests.length ? Math.round((completed / requests.length) * 100) : 0,
  };
}

export function parseFieldMappings(value: string | undefined): FieldMapping[] {
  if (!value?.trim()) return [];
  return value.split(',').map((entry: string) => {
    const [sourceKey = '', targetKey = ''] = entry.split('->').map((part: string) => part.trim());
    return { sourceKey, targetKey };
  }).filter((mapping: FieldMapping) => Boolean(mapping.sourceKey && mapping.targetKey));
}

export function mapParentAnswers(values: readonly RequestFieldValue[], mappings: readonly FieldMapping[]): Array<Omit<RequestFieldValue, 'id' | 'requestId' | 'fieldDefinitionId' | 'formVersion' | 'workspaceId' | 'updatedAt' | 'updatedBy'>> {
  const byKey = new Map(values.filter((value: RequestFieldValue) => !value.isDeleted).map((value: RequestFieldValue) => [value.stableFieldKey, value]));
  return mappings.flatMap((mapping: FieldMapping) => {
    const source = byKey.get(mapping.sourceKey);
    if (!source) return [];
    return [{
      fieldLabel: source.fieldLabel,
      stableFieldKey: mapping.targetKey,
      value: source.value,
      valueTypeKey: source.valueTypeKey,
      textValue: source.textValue,
      numberValue: source.numberValue,
      dateValue: source.dateValue,
      booleanValue: source.booleanValue,
      structuredValue: source.structuredValue,
      displayValue: source.displayValue,
      createdAt: new Date().toISOString(),
      isDeleted: false,
    }];
  });
}

export function buildChildRequest(parent: Request, childNumber: string, serviceCode: string, title: string): Omit<Request, 'id'> {
  const now = new Date().toISOString();
  return {
    ...parent,
    requestNumber: childNumber,
    assignedAt: '',
    cancelledAt: '',
    closedAt: '',
    createdAt: now,
    currentStageId: '',
    description: `Coordinated child request for ${parent.requestNumber}. ${parent.description}`.trim(),
    firstRespondedAt: '',
    parentRequestId: { id: parent.id, requestNumber: parent.requestNumber },
    priorityKey: parent.priorityKey,
    reopenedAt: '',
    resolvedAt: '',
    serviceCode,
    statusKey: 'New',
    title,
    updatedAt: now,
    versionNumber: 1,
  };
}

export function relationshipExists(relationships: readonly RequestRelationship[], requestId: string, relatedRequestId: string, type: RequestRelationshipRelationshipTypeKey): boolean {
  return relationships.some((relationship: RequestRelationship) => relationship.requestId.id === requestId && relationship.relatedRequestId.id === relatedRequestId && relationship.relationshipTypeKey === type);
}
