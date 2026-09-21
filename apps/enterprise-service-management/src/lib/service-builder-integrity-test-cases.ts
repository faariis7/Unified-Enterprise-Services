import type { FieldOption } from '@/generated/models/field-option-model';
import type { FormVersion } from '@/generated/models/form-version-model';
import { appendHistory, assertDraftMutable, countVersionGraph, createIndependentCode, hasAutosaveConflict, planOptionSynchronization, publicationBlockers, type BuilderOperation, type VersionGraph } from '@/lib/service-builder-integrity';

const assert = (condition: boolean, message: string): void => { if (!condition) throw new Error(`Service Builder integrity test failed: ${message}`); };
const draft = { id: 'draft-id', statusKey: 'Draft' } as FormVersion;
const published = { id: 'published-id', statusKey: 'Published' } as FormVersion;

export function runServiceBuilderIntegrityTests(): void {
  assert(assertDraftMutable(draft).id === 'draft-id', 'drafts must be mutable');
  let immutable = false;
  try { assertDraftMutable(published); } catch { immutable = true; }
  assert(immutable, 'published versions must be immutable');

  const graph = { version: draft, sections: [{ id: 's1' }, { id: 's2' }], fields: [{ id: 'f1' }], options: [{ id: 'o1' }], presentations: [{ id: 'p1' }], validations: [{ id: 'v1' }], visibilityRules: [{ id: 'r1' }], dependencies: [{ id: 'd1' }] } as VersionGraph;
  const counts = countVersionGraph(graph);
  assert(counts.sections === 2 && counts.fields === 1 && counts.options === 1 && counts.presentations === 1 && counts.validations === 1 && counts.visibilityRules === 1 && counts.dependencies === 1, 'version clone counts must include every owned metadata type');

  const current = [{ id: 'a', label: 'Alpha', value: 'alpha', sortOrder: 1, isDeleted: false }, { id: 'b', label: 'Beta', value: 'beta', sortOrder: 2, isDeleted: false }] as FieldOption[];
  const optionPlan = planOptionSynchronization(current, [{ id: 'a', label: 'Alpha updated', value: 'alpha', sortOrder: 1 }, { label: 'Gamma', value: 'gamma', sortOrder: 2 }]);
  assert(optionPlan.update.length === 1 && optionPlan.create.length === 1 && optionPlan.removeIds[0] === 'b', 'option synchronization must create, update, and soft-delete');

  const operations: BuilderOperation[] = [];
  const noop: BuilderOperation = { id: '1', label: 'edit', apply: async () => undefined, revert: async () => undefined };
  assert(appendHistory(operations, noop).length === 1, 'undo history must retain operations');
  assert(hasAutosaveConflict('one', 'two'), 'autosave must detect stale records');
  assert(!hasAutosaveConflict('one', 'one'), 'autosave must accept the loaded revision');
  assert(createIndependentCode('ACCESS', ['ACCESS', 'ACCESS_COPY_123'], '123') === 'ACCESS_COPY_123_2', 'service clone codes must not collide');

  const blockers = publicationBlockers({ version: draft, readiness: 'Ready', changeReason: 'Reviewed', hasBreakingDependencies: false, makerCheckerRequired: true, hasApprovedCheckerDecision: false });
  assert(blockers.some((blocker: string) => blocker.includes('approval')), 'maker/checker publication must be blocked without approval');
  assert(publicationBlockers({ version: draft, readiness: 'Ready', changeReason: 'Reviewed', hasBreakingDependencies: false, makerCheckerRequired: false, hasApprovedCheckerDecision: false }).length === 0, 'ready drafts without maker/checker must pass the gate');
}
