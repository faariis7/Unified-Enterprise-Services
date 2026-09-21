import type { FieldDefinition } from '@/generated/models/field-definition-model';
import type { FieldValidationRule } from '@/generated/models/field-validation-rule-model';
import type { FieldVisibilityRule } from '@/generated/models/field-visibility-rule-model';
import type { FieldImpact } from '@/lib/service-version-impact';

export type DependencyKind = 'Field' | 'Rule' | 'Component' | 'Workflow' | 'Lifecycle' | 'SLA' | 'Report' | 'Dashboard' | 'Template';
export type ImpactSeverity = 'safe' | 'warning' | 'breaking';
export type DependencyNode = { id: string; kind: DependencyKind; label: string; detail: string; fieldKey?: string };
export type DependencyEdge = { id: string; source: string; target: string; relation: string };
export type DependencyImpact = { id: string; severity: ImpactSeverity; title: string; detail: string; affectedNodeIds: string[] };
export type DependencyMap = { nodes: DependencyNode[]; edges: DependencyEdge[]; impacts: DependencyImpact[] };

type NamedConfiguration = { id: string; label: string; configuration?: string };
type DependencyMapInput = {
  fields: FieldDefinition[];
  validationRules: FieldValidationRule[];
  visibilityRules: FieldVisibilityRule[];
  fieldImpacts: FieldImpact[];
  workflow?: NamedConfiguration;
  lifecycle?: NamedConfiguration;
  sla?: NamedConfiguration;
  reports?: NamedConfiguration[];
  dashboards?: NamedConfiguration[];
  templates?: NamedConfiguration[];
};

const parseConfiguration = (value?: string): unknown => {
  if (!value) return undefined;
  try { return JSON.parse(value) as unknown; } catch { return value; }
};

const containsKey = (configuration: unknown, key: string): boolean => JSON.stringify(configuration ?? '').toLowerCase().includes(key.toLowerCase());

export function buildDependencyMap(input: DependencyMapInput): DependencyMap {
  const nodes: DependencyNode[] = [];
  const edges: DependencyEdge[] = [];
  const impacts: DependencyImpact[] = [];
  const addNode = (node: DependencyNode) => { if (!nodes.some((item: DependencyNode) => item.id === node.id)) nodes.push(node); };
  const addEdge = (source: string, target: string, relation: string) => edges.push({ id: `${source}:${target}:${relation}`, source, target, relation });

  input.fields.filter((field: FieldDefinition) => !field.isDeleted).forEach((field: FieldDefinition) => {
    addNode({ id: `field:${field.id}`, kind: 'Field', label: field.label, detail: `${field.fieldCode} · ${field.fieldTypeKey}`, fieldKey: field.fieldCode });
    const configuration = parseConfiguration(field.configuration);
    if (containsKey(configuration, 'reusableComponent')) {
      const componentKey = typeof configuration === 'object' && configuration !== null && 'reusableComponent' in configuration ? String((configuration as { reusableComponent: unknown }).reusableComponent) : 'Reusable component';
      addNode({ id: `component:${componentKey}`, kind: 'Component', label: componentKey.replaceAll('-', ' '), detail: 'Reusable metadata component' });
      addEdge(`component:${componentKey}`, `field:${field.id}`, 'expands to');
    }
  });

  input.validationRules.filter((rule: FieldValidationRule) => !rule.isDeleted).forEach((rule: FieldValidationRule) => {
    const id = `validation:${rule.id}`;
    addNode({ id, kind: 'Rule', label: rule.errorMessage, detail: `Validation · ${rule.ruleTypeKey}` });
    addEdge(id, `field:${rule.fieldDefinition.id}`, 'validates');
  });
  input.visibilityRules.filter((rule: FieldVisibilityRule) => !rule.isDeleted).forEach((rule: FieldVisibilityRule) => {
    const id = `visibility:${rule.id}`;
    addNode({ id, kind: 'Rule', label: rule.ruleName, detail: `Conditional · ${rule.effectKey}` });
    addEdge(id, `field:${rule.fieldDefinition.id}`, 'controls');
    if (rule.dependentFieldDefinition?.id) addEdge(`field:${rule.dependentFieldDefinition.id}`, id, 'drives');
  });

  const configurations: Array<{ kind: DependencyKind; item: NamedConfiguration }> = [
    ...(input.workflow ? [{ kind: 'Workflow' as const, item: input.workflow }] : []),
    ...(input.lifecycle ? [{ kind: 'Lifecycle' as const, item: input.lifecycle }] : []),
    ...(input.sla ? [{ kind: 'SLA' as const, item: input.sla }] : []),
    ...(input.reports ?? []).map((item: NamedConfiguration) => ({ kind: 'Report' as const, item })),
    ...(input.dashboards ?? []).map((item: NamedConfiguration) => ({ kind: 'Dashboard' as const, item })),
    ...(input.templates ?? []).map((item: NamedConfiguration) => ({ kind: 'Template' as const, item })),
  ];
  configurations.forEach(({ kind, item }) => {
    const nodeId = `${kind.toLowerCase()}:${item.id}`;
    addNode({ id: nodeId, kind, label: item.label, detail: `${kind} configuration` });
    const parsed = parseConfiguration(item.configuration);
    input.fields.forEach((field: FieldDefinition) => { if (containsKey(parsed, field.fieldCode)) addEdge(nodeId, `field:${field.id}`, 'references'); });
  });

  input.fieldImpacts.forEach((impact: FieldImpact) => {
    const field = input.fields.find((item: FieldDefinition) => item.fieldCode === impact.key);
    const affected = nodes.filter((node: DependencyNode) => node.fieldKey === impact.key || edges.some((edge: DependencyEdge) => edge.target === `field:${field?.id}` && edge.source === node.id));
    const severity: ImpactSeverity = impact.kind === 'removed' ? 'breaking' : impact.kind === 'renamed' || impact.kind === 'changed' ? 'warning' : 'safe';
    impacts.push({ id: `${impact.kind}:${impact.key}`, severity, title: `${impact.kind[0].toUpperCase()}${impact.kind.slice(1)}: ${impact.label}`, detail: affected.length ? `${affected.length} mapped dependencies require review: ${affected.map((node: DependencyNode) => node.label).join(', ')}.` : severity === 'safe' ? 'No dependent configuration is affected.' : 'No explicit dependency was found; verify external integrations before publishing.', affectedNodeIds: affected.map((node: DependencyNode) => node.id) });
  });

  return { nodes, edges, impacts };
}
