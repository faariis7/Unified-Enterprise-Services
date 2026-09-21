import type { FieldDefinition } from '@/generated/models/field-definition-model';
import type { FieldDefinitionPresentation } from '@/generated/models/field-definition-presentation-model';
import type { FieldDependency } from '@/generated/models/field-dependency-model';
import type { FieldOption } from '@/generated/models/field-option-model';
import type { FieldValidationRule } from '@/generated/models/field-validation-rule-model';
import type { FieldVisibilityRule } from '@/generated/models/field-visibility-rule-model';
import type { FormSection } from '@/generated/models/form-section-model';
import type { FormVersion } from '@/generated/models/form-version-model';

export type VersionGraph = {
  version: FormVersion;
  sections: FormSection[];
  fields: FieldDefinition[];
  options: FieldOption[];
  presentations: FieldDefinitionPresentation[];
  validations: FieldValidationRule[];
  visibilityRules: FieldVisibilityRule[];
  dependencies: FieldDependency[];
};

export type CloneCounts = Record<'sections' | 'fields' | 'options' | 'presentations' | 'validations' | 'visibilityRules' | 'dependencies', number>;

export const countVersionGraph = (graph: VersionGraph): CloneCounts => ({
  sections: graph.sections.length,
  fields: graph.fields.length,
  options: graph.options.length,
  presentations: graph.presentations.length,
  validations: graph.validations.length,
  visibilityRules: graph.visibilityRules.length,
  dependencies: graph.dependencies.length,
});

export const assertDraftMutable = (version?: FormVersion): FormVersion => {
  if (!version || version.statusKey !== 'Draft') throw new Error('Only draft versions can be changed. Published versions are immutable.');
  return version;
};

export type BuilderOperation = {
  id: string;
  label: string;
  apply: () => Promise<void>;
  revert: () => Promise<void>;
};

export const appendHistory = (history: BuilderOperation[], operation: BuilderOperation, maximum = 100): BuilderOperation[] =>
  [...history, operation].slice(-maximum);

export type OptionDraft = { id?: string; label: string; value: string; sortOrder: number; parentOptionId?: string };
export type OptionSyncPlan = { create: OptionDraft[]; update: OptionDraft[]; removeIds: string[] };

export const planOptionSynchronization = (current: FieldOption[], drafts: OptionDraft[]): OptionSyncPlan => {
  const active = current.filter((option: FieldOption) => !option.isDeleted);
  const draftIds = new Set(drafts.flatMap((draft: OptionDraft) => draft.id ? [draft.id] : []));
  return {
    create: drafts.filter((draft: OptionDraft) => !draft.id),
    update: drafts.filter((draft: OptionDraft) => Boolean(draft.id)).filter((draft: OptionDraft) => {
      const source = active.find((option: FieldOption) => option.id === draft.id);
      return Boolean(source && (source.label !== draft.label || source.value !== draft.value || source.sortOrder !== draft.sortOrder || source.parentOption?.id !== draft.parentOptionId));
    }),
    removeIds: active.filter((option: FieldOption) => !draftIds.has(option.id)).map((option: FieldOption) => option.id),
  };
};

export type PublicationGateInput = {
  version?: FormVersion;
  readiness: 'Ready' | 'Ready With Warnings' | 'Not Ready';
  changeReason: string;
  hasBreakingDependencies: boolean;
  makerCheckerRequired: boolean;
  hasApprovedCheckerDecision: boolean;
};

export const publicationBlockers = (input: PublicationGateInput): string[] => {
  const blockers: string[] = [];
  if (!input.version || input.version.statusKey !== 'Draft') blockers.push('A mutable draft version is required.');
  if (input.readiness === 'Not Ready') blockers.push('Readiness assessment contains blocking findings.');
  if (input.hasBreakingDependencies) blockers.push('Breaking dependency impacts must be resolved.');
  if (!input.changeReason.trim()) blockers.push('A change reason is required.');
  if (input.makerCheckerRequired && !input.hasApprovedCheckerDecision) blockers.push('Independent publication approval is required.');
  return blockers;
};

export type AutosaveState = 'idle' | 'saving' | 'saved' | 'failed' | 'conflict';

export const hasAutosaveConflict = (loadedUpdatedAt: string | undefined, currentUpdatedAt: string | undefined): boolean =>
  Boolean(loadedUpdatedAt && currentUpdatedAt && loadedUpdatedAt !== currentUpdatedAt);

export const createIndependentCode = (sourceCode: string, existingCodes: Iterable<string>, suffix: string): string => {
  const normalized = `${sourceCode}_COPY_${suffix}`.replace(/[^A-Z0-9_]/gi, '_').toUpperCase();
  const existing = new Set(Array.from(existingCodes, (code: string) => code.toUpperCase()));
  if (!existing.has(normalized)) return normalized;
  let index = 2;
  while (existing.has(`${normalized}_${index}`)) index += 1;
  return `${normalized}_${index}`;
};
