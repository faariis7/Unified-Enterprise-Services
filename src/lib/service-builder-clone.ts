import { initialize } from '@microsoft/power-apps/app';
import { CatalogItemAudienceService } from '@/generated/services/catalog-item-audience-service';
import { CatalogItemFormAssignmentService } from '@/generated/services/catalog-item-form-assignment-service';
import { CatalogItemService } from '@/generated/services/catalog-item-service';
import { FieldDefinitionPresentationService } from '@/generated/services/field-definition-presentation-service';
import { FieldDefinitionService } from '@/generated/services/field-definition-service';
import { FieldDependencyService } from '@/generated/services/field-dependency-service';
import { FieldOptionService } from '@/generated/services/field-option-service';
import { FieldValidationRuleService } from '@/generated/services/field-validation-rule-service';
import { FieldVisibilityRuleService } from '@/generated/services/field-visibility-rule-service';
import { FormDefinitionService } from '@/generated/services/form-definition-service';
import { FormSectionService } from '@/generated/services/form-section-service';
import { FormVersionService } from '@/generated/services/form-version-service';
import { ServicePermissionService } from '@/generated/services/service-permission-service';
import { ServiceService } from '@/generated/services/service-service';
import type { CatalogItem } from '@/generated/models/catalog-item-model';
import type { FieldDefinition } from '@/generated/models/field-definition-model';
import type { FieldDefinitionPresentation } from '@/generated/models/field-definition-presentation-model';
import type { FieldDependency } from '@/generated/models/field-dependency-model';
import type { FieldOption } from '@/generated/models/field-option-model';
import type { FieldValidationRule } from '@/generated/models/field-validation-rule-model';
import type { FieldVisibilityRule } from '@/generated/models/field-visibility-rule-model';
import type { FormDefinition } from '@/generated/models/form-definition-model';
import type { FormSection } from '@/generated/models/form-section-model';
import type { FormVersion } from '@/generated/models/form-version-model';
import type { Service } from '@/generated/models/service-model';
import { createIndependentCode, type CloneCounts } from '@/lib/service-builder-integrity';

export type CloneData = {
  sections: FormSection[];
  fields: FieldDefinition[];
  options: FieldOption[];
  presentations: FieldDefinitionPresentation[];
  validations: FieldValidationRule[];
  visibilityRules: FieldVisibilityRule[];
  dependencies: FieldDependency[];
};

export type VersionCloneResult = { version: FormVersion; counts: CloneCounts; sectionIds: Map<string, string>; fieldIds: Map<string, string> };

const withoutId = <T extends { id: string }>(record: T): Omit<T, 'id'> => {
  const { id: _id, ...data } = record;
  void _id;
  return data;
};

  await initialize();
export async function cloneVersionGraph(source: FormVersion, targetForm: FormDefinition, versionNumber: number, data: CloneData): Promise<VersionCloneResult> {
  const now = new Date().toISOString();
  const version = await FormVersionService.create({ snapshotLabel: `${targetForm.name1} v${versionNumber}`, configurationSnapshot: source.configurationSnapshot, formDefinition: { id: targetForm.id, name1: targetForm.name1 }, statusKey: 'Draft', versionNumber, workspace: source.workspace, createdAt: now, updatedAt: now, isDeleted: false });
  const sectionIds = new Map<string, string>();
  const fieldIds = new Map<string, string>();
  let optionCount = 0; let presentationCount = 0; let validationCount = 0; let visibilityCount = 0; let dependencyCount = 0;
  for (const sourceSection of data.sections.filter((section: FormSection) => section.formVersionID.id === source.id && !section.isDeleted).sort((a: FormSection, b: FormSection) => a.sortOrder - b.sortOrder)) {
    const section = await FormSectionService.create({ ...withoutId(sourceSection), formDefinition: { id: targetForm.id, name1: targetForm.name1 }, formVersionID: { id: version.id, snapshotLabel: version.snapshotLabel }, createdAt: now, updatedAt: now, isDeleted: false });
    sectionIds.set(sourceSection.id, section.id);
  }
  for (const sourceField of data.fields.filter((field: FieldDefinition) => field.formVersionID.id === source.id && !field.isDeleted)) {
    const sectionId = sectionIds.get(sourceField.formSection.id);
    if (!sectionId) continue;
    const section = data.sections.find((candidate: FormSection) => candidate.id === sourceField.formSection.id);
    const field = await FieldDefinitionService.create({ ...withoutId(sourceField), formDefinition: { id: targetForm.id, name1: targetForm.name1 }, formSection: { id: sectionId, title: section?.title ?? sourceField.formSection.title }, formVersionID: { id: version.id, snapshotLabel: version.snapshotLabel }, createdAt: now, updatedAt: now, isDeleted: false });
    fieldIds.set(sourceField.id, field.id);
  }
  for (const option of data.options.filter((item: FieldOption) => fieldIds.has(item.fieldDefinition.id) && !item.isDeleted)) {
    const targetField = fieldIds.get(option.fieldDefinition.id)!;
    const parentId = option.parentOption?.id ? undefined : undefined;
    await FieldOptionService.create({ ...withoutId(option), fieldDefinition: { id: targetField, label: option.fieldDefinition.label }, parentOption: parentId ? { id: parentId, label: option.parentOption?.label ?? '' } : undefined, createdAt: now, updatedAt: now, isDeleted: false }); optionCount += 1;
  }
  for (const presentation of data.presentations.filter((item: FieldDefinitionPresentation) => fieldIds.has(item.fieldDefinition.id))) {
    await FieldDefinitionPresentationService.create({ ...withoutId(presentation), fieldDefinition: { id: fieldIds.get(presentation.fieldDefinition.id)!, label: presentation.fieldDefinition.label } }); presentationCount += 1;
  }
  for (const rule of data.validations.filter((item: FieldValidationRule) => fieldIds.has(item.fieldDefinition.id) && !item.isDeleted)) {
    await FieldValidationRuleService.create({ ...withoutId(rule), fieldDefinition: { id: fieldIds.get(rule.fieldDefinition.id)!, label: rule.fieldDefinition.label }, createdAt: now, updatedAt: now, isDeleted: false }); validationCount += 1;
  }
  for (const rule of data.visibilityRules.filter((item: FieldVisibilityRule) => fieldIds.has(item.fieldDefinition.id) && !item.isDeleted)) {
    await FieldVisibilityRuleService.create({ ...withoutId(rule), fieldDefinition: { id: fieldIds.get(rule.fieldDefinition.id)!, label: rule.fieldDefinition.label }, dependentFieldDefinition: rule.dependentFieldDefinition && fieldIds.has(rule.dependentFieldDefinition.id) ? { id: fieldIds.get(rule.dependentFieldDefinition.id)!, label: rule.dependentFieldDefinition.label } : undefined, createdAt: now, updatedAt: now, isDeleted: false }); visibilityCount += 1;
  }
  for (const dependency of data.dependencies.filter((item: FieldDependency) => fieldIds.has(item.sourceFieldDefinition.id) && fieldIds.has(item.targetFieldDefinition.id))) {
    await FieldDependencyService.create({ ...withoutId(dependency), sourceFieldDefinition: { id: fieldIds.get(dependency.sourceFieldDefinition.id)!, label: dependency.sourceFieldDefinition.label }, targetFieldDefinition: { id: fieldIds.get(dependency.targetFieldDefinition.id)!, label: dependency.targetFieldDefinition.label } }); dependencyCount += 1;
  }
  return { version, sectionIds, fieldIds, counts: { sections: sectionIds.size, fields: fieldIds.size, options: optionCount, presentations: presentationCount, validations: validationCount, visibilityRules: visibilityCount, dependencies: dependencyCount } };
}

export type ServiceCloneInput = CloneData & { sourceService: Service; sourceForm: FormDefinition; sourceVersion: FormVersion; services: Service[]; catalogItems: CatalogItem[]; audiences: Awaited<ReturnType<typeof CatalogItemAudienceService.getAll>>; assignments: Awaited<ReturnType<typeof CatalogItemFormAssignmentService.getAll>>; permissions: Awaited<ReturnType<typeof ServicePermissionService.getAll>> };
  await initialize();

export async function cloneServiceGraph(input: ServiceCloneInput): Promise<{ service: Service; form: FormDefinition; version: FormVersion; counts: CloneCounts }> {
  const now = new Date().toISOString(); const suffix = Date.now().toString().slice(-6);
  const serviceCode = createIndependentCode(input.sourceService.serviceCode, input.services.map((service: Service) => service.serviceCode), suffix);
  const form = await FormDefinitionService.create({ name1: `${input.sourceForm.name1} copy`, description: input.sourceForm.description, currentVersionNumber: 1, statusKey: 'Draft', workspace: input.sourceForm.workspace });
  const cloned = await cloneVersionGraph(input.sourceVersion, form, 1, input);
  const service = await ServiceService.create({ ...withoutId(input.sourceService), serviceName: `${input.sourceService.serviceName} copy`, serviceCode, currentPublishedFormVersion: undefined, lifecycleStateKey: 'Draft', statusKey: 'Inactive', availabilityConfiguration: input.sourceService.availabilityConfiguration, audienceConfiguration: input.sourceService.audienceConfiguration, reportingConfiguration: input.sourceService.reportingConfiguration, createdAt: now, updatedAt: now, isDeleted: false, sortOrder: Math.max(0, ...input.services.map((item: Service) => item.sortOrder ?? 0)) + 1 });
  const sourceItems = input.catalogItems.filter((item: CatalogItem) => item.service.id === input.sourceService.id && item.statusKey !== 'Retired');
  for (const sourceItem of sourceItems) {
    const itemCode = createIndependentCode(sourceItem.itemCode, input.catalogItems.map((item: CatalogItem) => item.itemCode), suffix);
    const catalogItem = await CatalogItemService.create({ ...withoutId(sourceItem), itemName: `${sourceItem.itemName} copy`, itemCode, formDefinition: { id: form.id, name1: form.name1 }, service: { id: service.id, serviceName: service.serviceName }, statusKey: 'Draft', requesterEligible: false });
    for (const audience of input.audiences.filter((item) => item.catalogItem.id === sourceItem.id)) await CatalogItemAudienceService.create({ ...withoutId(audience), audienceName: `${audience.audienceName} copy`, catalogItem: { id: catalogItem.id, itemName: catalogItem.itemName }, statusKey: 'Inactive' });
    await CatalogItemFormAssignmentService.create({ assignmentName: `${catalogItem.itemName} draft assignment`, catalogItem: { id: catalogItem.id, itemName: catalogItem.itemName }, effectiveFrom: now, formDefinition: { id: form.id, name1: form.name1 }, formVersion: { id: cloned.version.id, snapshotLabel: cloned.version.snapshotLabel }, isDefault: true, statusKey: 'Inactive', workspace: sourceItem.workspace });
  }
  for (const permission of input.permissions.filter((item) => item.serviceCode === input.sourceService.serviceCode)) await ServicePermissionService.create({ ...withoutId(permission), servicePermissionName: `${permission.servicePermissionName} copy`, serviceCode, catalogItemCode: undefined, statusKey: 'Inactive' });
  return { service, form, version: cloned.version, counts: cloned.counts };
}
