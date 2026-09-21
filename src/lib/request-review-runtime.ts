import type { FieldDefinition } from '@/generated/models/field-definition-model';
import type { FieldOption } from '@/generated/models/field-option-model';
import type { FormSection } from '@/generated/models/form-section-model';
import type { RequestAttachment } from '@/generated/models/request-attachment-model';
import type { RequestFieldValue } from '@/generated/models/request-field-value-model';
import { formatDynamicValue, getDynamicFieldState, isEmptyDynamicValue, type DynamicFileValue, type DynamicFormValues } from '@/lib/dynamic-form-runtime';
import type { FieldVisibilityRule } from '@/generated/models/field-visibility-rule-model';

export type ReviewItem = { id: string; label: string; value: string; missing: boolean };
export type ReviewSection = { id: string; title: string; description?: string; items: ReviewItem[] };
export type RequestReviewModel = {
  title: string;
  sections: ReviewSection[];
  attachments: Array<{ id: string; name: string; detail: string }>;
  warnings: string[];
  missing: string[];
  answeredCount: number;
  totalCount: number;
};

type DraftReviewInput = {
  title: string;
  sections: FormSection[];
  fields: FieldDefinition[];
  options: FieldOption[];
  visibilityRules: FieldVisibilityRule[];
  values: DynamicFormValues;
  validationErrors?: Record<string, string>;
};

export function buildDraftRequestReview(input: DraftReviewInput): RequestReviewModel {
  const orderedSections = [...input.sections].filter((section: FormSection) => !section.isDeleted).sort((first: FormSection, second: FormSection) => first.sortOrder - second.sortOrder);
  const sections = orderedSections.map((section: FormSection): ReviewSection => {
    const items = input.fields
      .filter((field: FieldDefinition) => field.formSection.id === section.id && !field.isDeleted)
      .filter((field: FieldDefinition) => getDynamicFieldState(field, input.visibilityRules, input.values).visible)
      .sort((first: FieldDefinition, second: FieldDefinition) => (first.sortOrder ?? 0) - (second.sortOrder ?? 0))
      .map((field: FieldDefinition): ReviewItem => {
        const value = input.values[field.id] ?? field.defaultValue ?? null;
        return { id: field.id, label: field.label, value: formatDynamicValue(field, value, input.options), missing: isEmptyDynamicValue(value) };
      });
    return { id: section.id, title: section.title, description: section.instructions || section.description, items };
  }).filter((section: ReviewSection) => section.items.length > 0);
  const items = sections.flatMap((section: ReviewSection) => section.items);
  const attachmentFields = input.fields.filter((field: FieldDefinition) => field.fieldTypeKey === 'Attachment' && !isEmptyDynamicValue(input.values[field.id]));
  const attachments = attachmentFields.flatMap((field: FieldDefinition) => { const value = input.values[field.id]; const files: DynamicFileValue[] = Array.isArray(value) ? value.filter((item): item is DynamicFileValue => Boolean(item && typeof item === 'object' && 'name' in item && 'sizeBytes' in item)) : value && typeof value === 'object' && 'name' in value && 'sizeBytes' in value ? [value as DynamicFileValue] : []; return files.map((file: DynamicFileValue) => ({ id: file.id, name: file.name, detail: `${field.label} · ${file.contentType} · ${file.sizeBytes} bytes` })); });
  return {
    title: input.title,
    sections,
    attachments,
    warnings: Object.values(input.validationErrors ?? {}),
    missing: items.filter((item: ReviewItem) => item.missing).map((item: ReviewItem) => item.label),
    answeredCount: items.filter((item: ReviewItem) => !item.missing).length,
    totalCount: items.length,
  };
}

type HistoricalReviewInput = {
  title: string;
  sections: FormSection[];
  fields: FieldDefinition[];
  values: RequestFieldValue[];
  attachments: RequestAttachment[];
};

export function buildHistoricalRequestReview(input: HistoricalReviewInput): RequestReviewModel {
  const fieldById = new Map(input.fields.map((field: FieldDefinition) => [field.id, field]));
  const sectionById = new Map(input.sections.map((section: FormSection) => [section.id, section]));
  const grouped = new Map<string, RequestFieldValue[]>();
  input.values.forEach((value: RequestFieldValue) => {
    const sectionId = fieldById.get(value.fieldDefinitionId)?.formSection.id ?? 'unsectioned';
    grouped.set(sectionId, [...(grouped.get(sectionId) ?? []), value]);
  });
  const sections = [...grouped.entries()].map(([sectionId, values]: [string, RequestFieldValue[]]): ReviewSection => {
    const section = sectionById.get(sectionId);
    const items = values.sort((first: RequestFieldValue, second: RequestFieldValue) => (fieldById.get(first.fieldDefinitionId)?.sortOrder ?? 0) - (fieldById.get(second.fieldDefinitionId)?.sortOrder ?? 0)).map((value: RequestFieldValue): ReviewItem => {
      const display = value.displayValue || (value.valueTypeKey === 'Boolean' ? value.booleanValue ? 'Yes' : 'No' : value.numberValue !== undefined ? String(value.numberValue) : value.dateValue ?? value.textValue ?? value.structuredValue ?? value.value) || 'Not provided';
      return { id: value.id, label: value.fieldLabel, value: display, missing: display === 'Not provided' };
    });
    return { id: sectionId, title: section?.title ?? 'Request information', description: section?.description, items };
  }).sort((first: ReviewSection, second: ReviewSection) => (sectionById.get(first.id)?.sortOrder ?? 0) - (sectionById.get(second.id)?.sortOrder ?? 0));
  const items = sections.flatMap((section: ReviewSection) => section.items);
  return {
    title: input.title,
    sections,
    attachments: input.attachments.map((attachment: RequestAttachment) => ({ id: attachment.id, name: attachment.fileName, detail: `${attachment.contentType} · ${attachment.fileSizeBytes} bytes` })),
    warnings: [],
    missing: items.filter((item: ReviewItem) => item.missing).map((item: ReviewItem) => item.label),
    answeredCount: items.filter((item: ReviewItem) => !item.missing).length,
    totalCount: items.length,
  };
}
