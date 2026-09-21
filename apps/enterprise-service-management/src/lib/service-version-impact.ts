import type { FieldDefinition } from '@/generated/models/field-definition-model';

export type FieldImpact = {
  key: string;
  label: string;
  kind: 'added' | 'changed' | 'removed' | 'renamed';
  impacts: string[];
};

const operationalImpacts = (field: FieldDefinition): string[] => {
  const impacts: string[] = ['Form'];
  if (field.reportable) impacts.push('Reporting');
  if (field.required) impacts.push('Lifecycle');
  if (field.searchable) impacts.push('Search');
  return impacts;
};

export function compareServiceVersions(draftFields: FieldDefinition[], publishedFields: FieldDefinition[]): FieldImpact[] {
  const draftByKey = new Map(draftFields.filter((field: FieldDefinition) => !field.isDeleted).map((field: FieldDefinition) => [field.fieldCode, field]));
  const publishedByKey = new Map(publishedFields.filter((field: FieldDefinition) => !field.isDeleted).map((field: FieldDefinition) => [field.fieldCode, field]));
  const impacts: FieldImpact[] = [];

  draftByKey.forEach((field: FieldDefinition, key: string) => {
    const previous = publishedByKey.get(key);
    if (!previous) {
      impacts.push({ key, label: field.label, kind: 'added', impacts: operationalImpacts(field) });
      return;
    }
    if (previous.label !== field.label) {
      impacts.push({ key, label: `${previous.label} → ${field.label}`, kind: 'renamed', impacts: ['Form', 'Rules', 'Reporting'] });
    }
    const changed = previous.fieldTypeKey !== field.fieldTypeKey || previous.required !== field.required || previous.reportable !== field.reportable || previous.searchable !== field.searchable || previous.sensitive !== field.sensitive || previous.formSection.id !== field.formSection.id;
    if (changed) impacts.push({ key, label: field.label, kind: 'changed', impacts: operationalImpacts(field) });
  });

  publishedByKey.forEach((field: FieldDefinition, key: string) => {
    if (!draftByKey.has(key)) impacts.push({ key, label: field.label, kind: 'removed', impacts: ['Rules', 'Workflow', 'Reporting', 'Lifecycle'] });
  });

  return impacts;
}
