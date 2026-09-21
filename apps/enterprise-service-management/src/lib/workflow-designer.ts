import type { AutomationAction } from '@/generated/models/automation-action-model';
import type { AutomationCondition } from '@/generated/models/automation-condition-model';
import type { AutomationRule } from '@/generated/models/automation-rule-model';
import type { AutomationTrigger } from '@/generated/models/automation-trigger-model';

export type WorkflowNodeType = 'Start' | 'Approval' | 'FulfilmentTask' | 'ChildRequest' | 'Condition' | 'Notification' | 'StatusTransition' | 'FieldUpdate' | 'IntegrationPlaceholder' | 'ParallelBranch' | 'Join' | 'WaitTimer' | 'End';
export type WorkflowPoint = { x: number; y: number };
export type WorkflowNode = { id: string; type: WorkflowNodeType; label: string; position: WorkflowPoint; configuration: Record<string, string>; actionId?: string; conditionId?: string };
export type WorkflowEdge = { id: string; source: string; target: string; outcome: string };
export type WorkflowDefinition = { version: 1; formVersionId?: string; nodes: WorkflowNode[]; edges: WorkflowEdge[] };
export type WorkflowFinding = { severity: 'error' | 'warning'; message: string; nodeId?: string };
export type WorkflowTestContext = { request: Record<string, string>; answers: Record<string, string> };
export type WorkflowTestStep = { nodeId: string; label: string; outcome: string };

const actionToNode: Record<AutomationAction['actionTypeKey'], WorkflowNodeType> = {
  Assign: 'FieldUpdate', UpdateField: 'FieldUpdate', ChangeStatus: 'StatusTransition', CreateTask: 'FulfilmentTask', StartApproval: 'Approval', SendNotification: 'Notification', AddComment: 'Notification', CallWebhook: 'IntegrationPlaceholder', SetTarget: 'FieldUpdate', Escalate: 'Notification',
};

export const workflowNodeLabels: Record<WorkflowNodeType, string> = {
  Start: 'Start', Approval: 'Approval', FulfilmentTask: 'Fulfilment task', ChildRequest: 'Create child request', Condition: 'Condition', Notification: 'Notification', StatusTransition: 'Status transition', FieldUpdate: 'Field update', IntegrationPlaceholder: 'Integration placeholder', ParallelBranch: 'Parallel branch', Join: 'Join', WaitTimer: 'Wait / timer', End: 'End',
};

export function createWorkflowNode(type: WorkflowNodeType, index: number): WorkflowNode {
  return { id: crypto.randomUUID(), type, label: workflowNodeLabels[type], position: { x: 80 + (index % 4) * 230, y: 80 + Math.floor(index / 4) * 150 }, configuration: {} };
}

export function parseWorkflowDefinition(trigger: AutomationTrigger | undefined, actions: AutomationAction[], conditions: AutomationCondition[]): WorkflowDefinition {
  if (trigger?.eventFilters?.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(trigger.eventFilters) as Partial<WorkflowDefinition>;
      if (parsed.version === 1 && Array.isArray(parsed.nodes) && Array.isArray(parsed.edges)) return parsed as WorkflowDefinition;
    } catch { /* Legacy event filters are adapted below. */ }
  }
  const ruleId = trigger?.automationRule.id;
  const nodes: WorkflowNode[] = [createWorkflowNode('Start', 0)];
  nodes[0].label = trigger?.triggerName ?? 'Start';
  conditions.filter((item: AutomationCondition) => item.automationRule.id === ruleId && item.active).forEach((item: AutomationCondition) => nodes.push({ ...createWorkflowNode('Condition', nodes.length), id: `condition-${item.id}`, label: item.conditionName, configuration: { field: item.fieldName, operator: item.operatorKey, value: item.comparisonValue }, conditionId: item.id }));
  actions.filter((item: AutomationAction) => item.automationRule.id === ruleId && item.statusKey === 'Active').sort((a: AutomationAction, b: AutomationAction) => a.sortOrder - b.sortOrder).forEach((item: AutomationAction) => nodes.push({ ...createWorkflowNode(actionToNode[item.actionTypeKey], nodes.length), id: `action-${item.id}`, label: item.actionName, configuration: { value: item.configuredValue ?? '', targetField: item.targetField ?? '' }, actionId: item.id }));
  nodes.push(createWorkflowNode('End', nodes.length));
  const edges = nodes.slice(0, -1).map((node: WorkflowNode, index: number) => ({ id: crypto.randomUUID(), source: node.id, target: nodes[index + 1].id, outcome: node.type === 'Condition' ? 'true' : 'next' }));
  return { version: 1, nodes, edges };
}

function referencedField(node: WorkflowNode): string | undefined {
  return node.type === 'Condition' || node.type === 'FieldUpdate' ? node.configuration.field || node.configuration.targetField : undefined;
}

export function validateWorkflowDefinition(definition: WorkflowDefinition, validFieldKeys: ReadonlySet<string> = new Set()): WorkflowFinding[] {
  const findings: WorkflowFinding[] = [];
  const ids = new Set(definition.nodes.map((node: WorkflowNode) => node.id));
  const starts = definition.nodes.filter((node: WorkflowNode) => node.type === 'Start');
  const ends = definition.nodes.filter((node: WorkflowNode) => node.type === 'End');
  if (starts.length !== 1) findings.push({ severity: 'error', message: 'Workflow must contain exactly one start node.' });
  if (!ends.length) findings.push({ severity: 'error', message: 'Workflow must contain an end node.' });
  definition.edges.forEach((edge: WorkflowEdge) => { if (!ids.has(edge.source) || !ids.has(edge.target)) findings.push({ severity: 'error', message: 'A connection references a missing node.' }); });
  definition.nodes.forEach((node: WorkflowNode) => {
    const incoming = definition.edges.filter((edge: WorkflowEdge) => edge.target === node.id);
    const outgoing = definition.edges.filter((edge: WorkflowEdge) => edge.source === node.id);
    if (node.type !== 'Start' && incoming.length === 0) findings.push({ severity: 'error', message: `${node.label} is disconnected.`, nodeId: node.id });
    if (node.type !== 'End' && outgoing.length === 0) findings.push({ severity: 'error', message: `${node.label} has no outcome.`, nodeId: node.id });
    if (node.type === 'Condition' && (!outgoing.some((edge: WorkflowEdge) => edge.outcome === 'true') || !outgoing.some((edge: WorkflowEdge) => edge.outcome === 'false'))) findings.push({ severity: 'error', message: `${node.label} requires true and false outcomes.`, nodeId: node.id });
    if (node.type === 'ParallelBranch' && outgoing.length < 2) findings.push({ severity: 'error', message: `${node.label} requires at least two branches.`, nodeId: node.id });
    const field = referencedField(node);
    if (field && validFieldKeys.size && !validFieldKeys.has(field)) findings.push({ severity: 'error', message: `${node.label} references unknown field “${field}”.`, nodeId: node.id });
    if (['Approval', 'FulfilmentTask'].includes(node.type) && !node.configuration.assignee?.trim()) findings.push({ severity: 'error', message: `${node.label} requires an assignee or team.`, nodeId: node.id });
    if (node.type === 'WaitTimer' && Number(node.configuration.minutes) <= 0) findings.push({ severity: 'error', message: `${node.label} requires a positive wait duration.`, nodeId: node.id });
    if (node.type === 'ChildRequest' && !node.configuration.serviceCode?.trim()) findings.push({ severity: 'error', message: `${node.label} requires a target service code.`, nodeId: node.id });
    if (node.type === 'ChildRequest' && !node.configuration.title?.trim()) findings.push({ severity: 'error', message: `${node.label} requires a child request title.`, nodeId: node.id });
  });
  const start = starts[0];
  const reachable = new Set<string>();
  const visiting = new Set<string>();
  let loop = false;
  const walk = (id: string): void => { if (visiting.has(id)) { loop = true; return; } if (reachable.has(id)) return; visiting.add(id); reachable.add(id); definition.edges.filter((edge: WorkflowEdge) => edge.source === id).forEach((edge: WorkflowEdge) => walk(edge.target)); visiting.delete(id); };
  if (start) walk(start.id);
  definition.nodes.filter((node: WorkflowNode) => !reachable.has(node.id)).forEach((node: WorkflowNode) => findings.push({ severity: 'error', message: `${node.label} is unreachable from start.`, nodeId: node.id }));
  if (loop && !definition.nodes.some((node: WorkflowNode) => node.type === 'WaitTimer')) findings.push({ severity: 'error', message: 'Workflow contains an uncontrolled loop without a wait/timer guard.' });
  const canReachEnd = (id: string, path = new Set<string>()): boolean => { if (path.has(id)) return false; const node = definition.nodes.find((item: WorkflowNode) => item.id === id); if (node?.type === 'End') return true; const nextPath = new Set(path).add(id); return definition.edges.filter((edge: WorkflowEdge) => edge.source === id).some((edge: WorkflowEdge) => canReachEnd(edge.target, nextPath)); };
  if (start && !canReachEnd(start.id)) findings.push({ severity: 'error', message: 'No complete path reaches an end node.' });
  return findings;
}

function compare(actual: string, operator: string, expected: string): boolean {
  if (operator === 'Equals') return actual === expected;
  if (operator === 'NotEquals') return actual !== expected;
  if (operator === 'Contains') return actual.includes(expected);
  if (operator === 'IsEmpty') return !actual;
  if (operator === 'IsNotEmpty') return Boolean(actual);
  if (operator === 'GreaterThan') return Number(actual) > Number(expected);
  if (operator === 'GreaterThanOrEquals') return Number(actual) >= Number(expected);
  if (operator === 'LessThan') return Number(actual) < Number(expected);
  if (operator === 'LessThanOrEquals') return Number(actual) <= Number(expected);
  return false;
}

export function previewWorkflow(definition: WorkflowDefinition, context: WorkflowTestContext): WorkflowTestStep[] {
  const start = definition.nodes.find((node: WorkflowNode) => node.type === 'Start');
  if (!start) return [];
  const steps: WorkflowTestStep[] = [];
  const visited = new Set<string>();
  let current: WorkflowNode | undefined = start;
  while (current && !visited.has(current.id) && steps.length < 100) {
    visited.add(current.id);
    let outcome = 'next';
    if (current.type === 'Condition') { const actual = context.answers[current.configuration.field] ?? context.request[current.configuration.field] ?? ''; outcome = compare(actual, current.configuration.operator ?? 'Equals', current.configuration.value ?? '') ? 'true' : 'false'; }
    if (current.type === 'ParallelBranch') outcome = 'all branches';
    steps.push({ nodeId: current.id, label: current.label, outcome });
    const edge = definition.edges.find((item: WorkflowEdge) => item.source === current?.id && (item.outcome === outcome || item.outcome === 'next' || outcome === 'all branches'));
    current = edge ? definition.nodes.find((node: WorkflowNode) => node.id === edge.target) : undefined;
  }
  return steps;
}

export function validateWorkflow(rule: AutomationRule, triggers: AutomationTrigger[], conditions: AutomationCondition[], actions: AutomationAction[]): WorkflowFinding[] {
  const trigger = triggers.find((item: AutomationTrigger) => item.automationRule.id === rule.id && item.active);
  const definition = parseWorkflowDefinition(trigger, actions, conditions);
  const findings = validateWorkflowDefinition(definition);
  if (rule.maximumChainDepth < 1 || rule.maximumExecutionsPerRequest < 1) findings.push({ severity: 'error', message: 'Retry and loop limits must be greater than zero.' });
  return findings;
}
