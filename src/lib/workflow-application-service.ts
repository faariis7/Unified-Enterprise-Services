import type { Request } from '@/generated/models/request-model';
import type { RequestApproval } from '@/generated/models/request-approval-model';
import type { RequestTask } from '@/generated/models/request-task-model';
import type { RequestNotification } from '@/generated/models/request-notification-model';
import type { RequestRelationship } from '@/generated/models/request-relationship-model';
import type { RequestFieldValue } from '@/generated/models/request-field-value-model';
import type { Person } from '@/generated/models/person-model';
import type { Workspace } from '@/generated/models/workspace-model';
import type { WorkflowDefinition, WorkflowEdge, WorkflowNode } from '@/lib/workflow-designer';
import { buildChildRequest, parseFieldMappings } from '@/lib/request-relationship-runtime';

export type WorkflowInstanceStatus = 'Running' | 'WaitingForApproval' | 'WaitingForTask' | 'WaitingForTimer' | 'WaitingForIntegration' | 'ManualIntervention' | 'Completed' | 'Failed';
export type WorkflowStepStatus = 'Ready' | 'Running' | 'Waiting' | 'Completed' | 'Skipped' | 'Failed';
export type WorkflowBranchStatus = 'Running' | 'Waiting' | 'Completed' | 'Cancelled' | 'Failed';

export interface WorkflowSnapshot {
  id: string;
  formVersionId: string;
  definition: WorkflowDefinition;
  capturedAt: string;
}

export interface WorkflowBranchState {
  id: string;
  sourceNodeId: string;
  currentNodeId: string;
  status: WorkflowBranchStatus;
  joinNodeId?: string;
}

export interface WorkflowInstance {
  id: string;
  requestId: string;
  requestNumber: string;
  workspaceId: string;
  snapshotId: string;
  formVersionId: string;
  status: WorkflowInstanceStatus;
  currentNodeIds: string[];
  branches: WorkflowBranchState[];
  completedNodeIds: string[];
  idempotencyKeys: string[];
  stepCount: number;
  maximumSteps: number;
  failureMessage?: string;
  dueAt?: string;
  waitingRecordId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface WorkflowStepRecord {
  id: string;
  instanceId: string;
  nodeId: string;
  nodeType: WorkflowNode['type'];
  branchId: string;
  status: WorkflowStepStatus;
  idempotencyKey: string;
  outcome?: string;
  details: string;
  startedAt: string;
  completedAt?: string;
}

export interface WorkflowAuditRecord {
  id: string;
  instanceId: string;
  requestId: string;
  eventType: string;
  details: string;
  occurredAt: string;
  actorId: string;
}

export interface WorkflowState {
  requests: Request[];
  fieldValues: RequestFieldValue[];
  approvals: RequestApproval[];
  tasks: RequestTask[];
  notifications: RequestNotification[];
  relationships: RequestRelationship[];
  snapshots: WorkflowSnapshot[];
  instances: WorkflowInstance[];
  steps: WorkflowStepRecord[];
  audits: WorkflowAuditRecord[];
}

export interface WorkflowStateProvider {
  read(): WorkflowState;
  transact<T>(operation: (state: WorkflowState) => T): T;
}

export class InMemoryWorkflowStateProvider implements WorkflowStateProvider {
  private state: WorkflowState;

  constructor(seed?: Partial<WorkflowState>) {
    this.state = {
      requests: seed?.requests ? structuredClone(seed.requests) : [],
      fieldValues: seed?.fieldValues ? structuredClone(seed.fieldValues) : [],
      approvals: seed?.approvals ? structuredClone(seed.approvals) : [],
      tasks: seed?.tasks ? structuredClone(seed.tasks) : [],
      notifications: seed?.notifications ? structuredClone(seed.notifications) : [],
      relationships: seed?.relationships ? structuredClone(seed.relationships) : [],
      snapshots: seed?.snapshots ? structuredClone(seed.snapshots) : [],
      instances: seed?.instances ? structuredClone(seed.instances) : [],
      steps: seed?.steps ? structuredClone(seed.steps) : [],
      audits: seed?.audits ? structuredClone(seed.audits) : [],
    };
  }

  read(): WorkflowState { return structuredClone(this.state); }

  transact<T>(operation: (state: WorkflowState) => T): T {
    const working = structuredClone(this.state);
    const result = operation(working);
    this.state = working;
    return result;
  }
}

export interface StartWorkflowInput {
  request: Request;
  definition: WorkflowDefinition;
  actor: Pick<Person, 'id' | 'displayName'>;
  now?: Date;
  maximumSteps?: number;
}

export interface ResumeWorkflowInput {
  instanceId: string;
  actor: Pick<Person, 'id' | 'displayName'>;
  now?: Date;
}

type ExecutionResult = { instance: WorkflowInstance; created: { approvals: number; tasks: number; notifications: number; childRequests: number } };

const terminalStatuses = new Set<WorkflowInstanceStatus>(['Completed', 'Failed']);
const cloneDefinition = (definition: WorkflowDefinition): WorkflowDefinition => structuredClone(definition);
const nextId = (): string => crypto.randomUUID();
const iso = (date: Date): string => date.toISOString();

function edgeFor(definition: WorkflowDefinition, nodeId: string, outcome: string): WorkflowEdge | undefined {
  return definition.edges.find((edge: WorkflowEdge) => edge.source === nodeId && edge.outcome === outcome)
    ?? definition.edges.find((edge: WorkflowEdge) => edge.source === nodeId && edge.outcome === 'next');
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

function evaluateExpression(expression: unknown, values: Readonly<Record<string, string>>): boolean {
  if (!expression || typeof expression !== 'object') return false;
  const candidate = expression as { operator?: string; conditions?: unknown[]; field?: string; comparator?: string; value?: string };
  if (candidate.conditions) {
    const results = candidate.conditions.map((condition: unknown) => evaluateExpression(condition, values));
    return candidate.operator === 'OR' ? results.some(Boolean) : results.every(Boolean);
  }
  return compare(values[candidate.field ?? ''] ?? '', candidate.comparator ?? 'Equals', candidate.value ?? '');
}

function requestValues(request: Request, fieldValues: RequestFieldValue[]): Record<string, string> {
  const common = Object.fromEntries(Object.entries(request).filter((entry: [string, unknown]) => typeof entry[1] === 'string')) as Record<string, string>;
  fieldValues.filter((value: RequestFieldValue) => value.requestId.id === request.id && !value.isDeleted).forEach((value: RequestFieldValue) => { common[value.stableFieldKey] = value.value; });
  return common;
}

function conditionOutcome(node: WorkflowNode, request: Request, fieldValues: RequestFieldValue[]): string {
  const values = requestValues(request, fieldValues);
  if (node.configuration.expression?.trim().startsWith('{')) {
    try { return evaluateExpression(JSON.parse(node.configuration.expression) as unknown, values) ? 'true' : 'false'; } catch { throw new Error(`${node.label} contains an invalid typed expression.`); }
  }
  return compare(values[node.configuration.field ?? ''] ?? '', node.configuration.operator ?? 'Equals', node.configuration.value ?? '') ? 'true' : 'false';
}

function audit(state: WorkflowState, instance: WorkflowInstance, actor: Pick<Person, 'id' | 'displayName'>, eventType: string, details: string, now: Date): void {
  state.audits.push({ id: nextId(), instanceId: instance.id, requestId: instance.requestId, eventType, details, occurredAt: iso(now), actorId: actor.id });
}

function step(state: WorkflowState, instance: WorkflowInstance, node: WorkflowNode, branchId: string, status: WorkflowStepStatus, details: string, now: Date, outcome?: string): void {
  const key = `${instance.id}:${branchId}:${node.id}`;
  const existing = state.steps.find((item: WorkflowStepRecord) => item.idempotencyKey === key);
  if (existing) {
    existing.status = status;
    existing.details = details;
    existing.outcome = outcome;
    if (status === 'Completed' || status === 'Failed' || status === 'Skipped') existing.completedAt = iso(now);
    return;
  }
  state.steps.push({ id: nextId(), instanceId: instance.id, nodeId: node.id, nodeType: node.type, branchId, status, idempotencyKey: key, details, outcome, startedAt: iso(now), completedAt: status === 'Completed' || status === 'Failed' || status === 'Skipped' ? iso(now) : undefined });
}

function resolveAssignee(request: Request, node: WorkflowNode): Pick<Person, 'id' | 'displayName'> {
  const id = node.configuration.assignee?.trim();
  if (!id || id === 'requester') return request.requester;
  if (id === 'requestedFor') return request.requestedFor;
  if (id === 'assignee') return request.assignee;
  return { id, displayName: node.configuration.assigneeName || id };
}

export class WorkflowApplicationService {
  private readonly provider: WorkflowStateProvider;

  constructor(provider: WorkflowStateProvider) { this.provider = provider; }

  start(input: StartWorkflowInput): ExecutionResult {
    return this.provider.transact((state: WorkflowState) => {
      if (input.definition.formVersionId !== input.request.formVersion.id) throw new Error('Workflow version does not match the request form version.');
      const existing = state.instances.find((item: WorkflowInstance) => item.requestId === input.request.id && item.formVersionId === input.request.formVersion.id);
      if (existing) return { instance: existing, created: { approvals: 0, tasks: 0, notifications: 0, childRequests: 0 } };
      const start = input.definition.nodes.find((node: WorkflowNode) => node.type === 'Start');
      if (!start) throw new Error('Workflow requires a start node.');
      const now = input.now ?? new Date();
      const snapshot: WorkflowSnapshot = { id: nextId(), formVersionId: input.request.formVersion.id, definition: cloneDefinition(input.definition), capturedAt: iso(now) };
      state.snapshots.push(snapshot);
      if (!state.requests.some((request: Request) => request.id === input.request.id)) state.requests.push(structuredClone(input.request));
      const instance: WorkflowInstance = { id: nextId(), requestId: input.request.id, requestNumber: input.request.requestNumber, workspaceId: input.request.workspace.id, snapshotId: snapshot.id, formVersionId: input.request.formVersion.id, status: 'Running', currentNodeIds: [start.id], branches: [{ id: 'main', sourceNodeId: start.id, currentNodeId: start.id, status: 'Running' }], completedNodeIds: [], idempotencyKeys: [], stepCount: 0, maximumSteps: input.maximumSteps ?? 200, createdAt: iso(now), updatedAt: iso(now) };
      state.instances.push(instance);
      audit(state, instance, input.actor, 'WorkflowStarted', `Bound to workflow snapshot ${snapshot.id} and form version ${snapshot.formVersionId}.`, now);
      return this.execute(state, instance, input.actor, now);
    });
  }

  resume(input: ResumeWorkflowInput): ExecutionResult {
    return this.provider.transact((state: WorkflowState) => {
      const instance = state.instances.find((item: WorkflowInstance) => item.id === input.instanceId);
      if (!instance) throw new Error('Workflow instance was not found.');
      if (terminalStatuses.has(instance.status)) return { instance, created: { approvals: 0, tasks: 0, notifications: 0, childRequests: 0 } };
      const now = input.now ?? new Date();
      if (instance.status === 'WaitingForTimer' && instance.dueAt && new Date(instance.dueAt) > now) return { instance, created: { approvals: 0, tasks: 0, notifications: 0, childRequests: 0 } };
      if (instance.status === 'WaitingForApproval') {
        const approval = state.approvals.find((item: RequestApproval) => item.id === instance.waitingRecordId);
        if (!approval || (approval.statusKey !== 'Approved' && approval.statusKey !== 'Rejected')) return { instance, created: { approvals: 0, tasks: 0, notifications: 0, childRequests: 0 } };
        this.completeWaitingNode(state, instance, approval.statusKey === 'Approved' ? 'approved' : 'rejected', input.actor, now);
      } else if (instance.status === 'WaitingForTask') {
        const taskRecord = state.tasks.find((item: RequestTask) => item.id === instance.waitingRecordId);
        if (!taskRecord || taskRecord.statusIdKey !== 'Completed') return { instance, created: { approvals: 0, tasks: 0, notifications: 0, childRequests: 0 } };
        this.completeWaitingNode(state, instance, 'completed', input.actor, now);
      } else if (instance.status === 'WaitingForTimer') {
        this.completeWaitingNode(state, instance, 'elapsed', input.actor, now);
      } else if (instance.status === 'WaitingForIntegration' || instance.status === 'ManualIntervention') {
        return { instance, created: { approvals: 0, tasks: 0, notifications: 0, childRequests: 0 } };
      }
      return this.execute(state, instance, input.actor, now);
    });
  }

  resumeManual(instanceId: string, actor: Pick<Person, 'id' | 'displayName'>, outcome: 'completed' | 'failed', now = new Date()): ExecutionResult {
    return this.provider.transact((state: WorkflowState) => {
      const instance = state.instances.find((item: WorkflowInstance) => item.id === instanceId);
      if (!instance) throw new Error('Workflow instance was not found.');
      if (instance.status !== 'WaitingForIntegration' && instance.status !== 'ManualIntervention') return { instance, created: { approvals: 0, tasks: 0, notifications: 0, childRequests: 0 } };
      if (outcome === 'failed') {
        instance.status = 'Failed'; instance.failureMessage = 'Integration/manual step was failed by an administrator.'; instance.updatedAt = iso(now);
        audit(state, instance, actor, 'WorkflowFailed', instance.failureMessage, now);
        return { instance, created: { approvals: 0, tasks: 0, notifications: 0, childRequests: 0 } };
      }
      this.completeWaitingNode(state, instance, 'completed', actor, now);
      return this.execute(state, instance, actor, now);
    });
  }

  retry(instanceId: string, actor: Pick<Person, 'id' | 'displayName'>, now = new Date()): ExecutionResult {
    return this.provider.transact((state: WorkflowState) => {
      const instance = state.instances.find((item: WorkflowInstance) => item.id === instanceId);
      if (!instance) throw new Error('Workflow instance was not found.');
      if (instance.status !== 'Failed') return { instance, created: { approvals: 0, tasks: 0, notifications: 0, childRequests: 0 } };
      instance.status = 'Running'; instance.failureMessage = undefined; instance.updatedAt = iso(now);
      audit(state, instance, actor, 'WorkflowRetried', 'Administrator retried the failed workflow.', now);
      return this.execute(state, instance, actor, now);
    });
  }

  processDue(actor: Pick<Person, 'id' | 'displayName'>, now = new Date()): ExecutionResult[] {
    const due = this.provider.read().instances.filter((instance: WorkflowInstance) => instance.status === 'WaitingForTimer' && Boolean(instance.dueAt) && new Date(instance.dueAt ?? 0) <= now);
    return due.map((instance: WorkflowInstance) => this.resume({ instanceId: instance.id, actor, now }));
  }

  private completeWaitingNode(state: WorkflowState, instance: WorkflowInstance, outcome: string, actor: Pick<Person, 'id' | 'displayName'>, now: Date): void {
    const snapshot = state.snapshots.find((item: WorkflowSnapshot) => item.id === instance.snapshotId);
    const currentId = instance.currentNodeIds[0];
    const node = snapshot?.definition.nodes.find((item: WorkflowNode) => item.id === currentId);
    if (!snapshot || !node) throw new Error('The bound workflow snapshot is invalid.');
    step(state, instance, node, 'main', 'Completed', `${node.label} resumed with ${outcome}.`, now, outcome);
    if (!instance.completedNodeIds.includes(node.id)) instance.completedNodeIds.push(node.id);
    const edge = edgeFor(snapshot.definition, node.id, outcome);
    instance.currentNodeIds = edge ? [edge.target] : [];
    const main = instance.branches.find((branch: WorkflowBranchState) => branch.id === 'main');
    if (main && edge) { main.currentNodeId = edge.target; main.status = 'Running'; }
    instance.status = 'Running'; instance.waitingRecordId = undefined; instance.dueAt = undefined; instance.updatedAt = iso(now);
    audit(state, instance, actor, 'WorkflowResumed', `${node.label} resumed with ${outcome}.`, now);
  }

  private execute(state: WorkflowState, instance: WorkflowInstance, actor: Pick<Person, 'id' | 'displayName'>, now: Date): ExecutionResult {
    const created = { approvals: 0, tasks: 0, notifications: 0, childRequests: 0 };
    const snapshot = state.snapshots.find((item: WorkflowSnapshot) => item.id === instance.snapshotId);
    const request = state.requests.find((item: Request) => item.id === instance.requestId);
    if (!snapshot || !request) throw new Error('Workflow snapshot or request is missing.');
    try {
      while (instance.status === 'Running' && instance.currentNodeIds.length) {
        if (instance.stepCount >= instance.maximumSteps) throw new Error('Maximum workflow step limit reached.');
        const nodeId = instance.currentNodeIds[0];
        const node = snapshot.definition.nodes.find((item: WorkflowNode) => item.id === nodeId);
        if (!node) throw new Error(`Workflow node ${nodeId} is missing from the bound snapshot.`);
        const key = `${instance.id}:main:${node.id}`;
        if (instance.idempotencyKeys.includes(key) && node.type !== 'Join') throw new Error(`Loop guard blocked repeated execution of ${node.label}.`);
        instance.stepCount += 1;
        instance.idempotencyKeys.push(key);
        step(state, instance, node, 'main', 'Running', `Executing ${node.label}.`, now);
        const proceed = (outcome = 'next'): void => {
          step(state, instance, node, 'main', 'Completed', `${node.label} completed.`, now, outcome);
          if (!instance.completedNodeIds.includes(node.id)) instance.completedNodeIds.push(node.id);
          const edge = edgeFor(snapshot.definition, node.id, outcome);
          instance.currentNodeIds = edge ? [edge.target] : [];
          const main = instance.branches.find((branch: WorkflowBranchState) => branch.id === 'main');
          if (main && edge) main.currentNodeId = edge.target;
        };
        if (node.type === 'Start') proceed();
        else if (node.type === 'Condition') proceed(conditionOutcome(node, request, state.fieldValues));
        else if (node.type === 'Approval') {
          const approval: RequestApproval = { id: nextId(), approvalName: node.label, approverPersonId: resolveAssignee(request, node), approverTypeKey: 'Person', comments: '', createdAt: iso(now), decidedAt: '', requestId: { id: request.id, requestNumber: request.requestNumber }, stageNumber: Number(node.configuration.stage || 1), statusKey: 'Pending', workspaceId: { id: request.workspace.id, workspaceName: request.workspace.workspaceName } };
          state.approvals.push(approval); created.approvals += 1; instance.status = 'WaitingForApproval'; instance.waitingRecordId = approval.id; step(state, instance, node, 'main', 'Waiting', 'Waiting for approval decision.', now); audit(state, instance, actor, 'ApprovalCreated', approval.id, now);
        } else if (node.type === 'FulfilmentTask') {
          const taskRecord: RequestTask = { id: nextId(), title: node.configuration.title || node.label, assignedPersonId: resolveAssignee(request, node), dueDate: node.configuration.dueMinutes ? iso(new Date(now.getTime() + Number(node.configuration.dueMinutes) * 60_000)) : undefined, requestId: { id: request.id, requestNumber: request.requestNumber }, statusIdKey: 'NotStarted', workspaceId: { id: request.workspace.id, workspaceName: request.workspace.workspaceName } };
          state.tasks.push(taskRecord); created.tasks += 1; instance.status = 'WaitingForTask'; instance.waitingRecordId = taskRecord.id; step(state, instance, node, 'main', 'Waiting', 'Waiting for fulfilment task completion.', now); audit(state, instance, actor, 'TaskCreated', taskRecord.id, now);
        } else if (node.type === 'Notification') {
          state.notifications.push({ id: nextId(), notificationName: node.label, channelKey: 'InApp', message: node.configuration.message || node.label, recipientPersonId: resolveAssignee(request, node), requestId: { id: request.id, requestNumber: request.requestNumber }, sentAt: '', statusKey: 'Queued', workspaceId: { id: request.workspace.id, workspaceName: request.workspace.workspaceName } }); created.notifications += 1; proceed();
        } else if (node.type === 'StatusTransition') {
          const status = node.configuration.status as Request['statusKey'];
          if (!status) throw new Error(`${node.label} requires a status.`);
          request.statusKey = status; request.updatedAt = iso(now); request.updatedBy = actor; proceed(status);
        } else if (node.type === 'FieldUpdate') {
          const field = node.configuration.targetField || node.configuration.field;
          if (!field) throw new Error(`${node.label} requires a target field.`);
          if (field in request && typeof request[field as keyof Request] === 'string') (request as unknown as Record<string, unknown>)[field] = node.configuration.value ?? '';
          else {
            const existing = state.fieldValues.find((value: RequestFieldValue) => value.requestId.id === request.id && value.stableFieldKey === field && !value.isDeleted);
            if (existing) { existing.value = node.configuration.value ?? ''; existing.displayValue = node.configuration.value ?? ''; existing.updatedAt = iso(now); existing.updatedBy = actor; }
            else state.fieldValues.push({ id: nextId(), fieldLabel: field, fieldDefinitionId: node.configuration.fieldDefinitionId || field, formVersion: request.formVersion, requestId: { id: request.id, requestNumber: request.requestNumber }, stableFieldKey: field, value: node.configuration.value ?? '', valueTypeKey: 'Text', textValue: node.configuration.value ?? '', displayValue: node.configuration.value ?? '', updatedAt: iso(now), updatedBy: actor, workspaceId: { id: request.workspace.id, workspaceName: request.workspace.workspaceName } });
          }
          proceed();
        } else if (node.type === 'ChildRequest') {
          const child = { ...buildChildRequest(request, `${request.requestNumber}-C${state.requests.filter((item: Request) => item.parentRequestId?.id === request.id).length + 1}`, node.configuration.serviceCode, node.configuration.title), id: nextId() };
          state.requests.push(child);
          const mappings = parseFieldMappings(node.configuration.fieldMappings);
          mappings.forEach((mapping) => {
            const source = state.fieldValues.find((value: RequestFieldValue) => value.requestId.id === request.id && value.stableFieldKey === mapping.sourceKey && !value.isDeleted);
            if (source) state.fieldValues.push({ ...structuredClone(source), id: nextId(), requestId: { id: child.id, requestNumber: child.requestNumber }, stableFieldKey: mapping.targetKey, updatedAt: iso(now), updatedBy: actor });
          });
          state.relationships.push({ id: nextId(), relationshipName: `${request.requestNumber} parent of ${child.requestNumber}`, createdAt: iso(now), createdBy: actor, relatedRequestId: { id: child.id, requestNumber: child.requestNumber }, relationshipTypeKey: 'Child', requestId: { id: request.id, requestNumber: request.requestNumber }, workspaceId: { id: request.workspace.id, workspaceName: request.workspace.workspaceName } }); created.childRequests += 1; proceed();
        } else if (node.type === 'ParallelBranch') {
          const outgoing = snapshot.definition.edges.filter((edge: WorkflowEdge) => edge.source === node.id);
          if (outgoing.length < 2) throw new Error(`${node.label} requires at least two branches.`);
          step(state, instance, node, 'main', 'Completed', 'Parallel branches started.', now, 'parallel');
          instance.completedNodeIds.push(node.id);
          instance.branches = outgoing.map((edge: WorkflowEdge, index: number) => ({ id: `branch-${node.id}-${index}`, sourceNodeId: node.id, currentNodeId: edge.target, status: 'Running' as const }));
          this.executeBranches(state, instance, snapshot.definition, request, actor, now, created);
        } else if (node.type === 'Join') proceed();
        else if (node.type === 'WaitTimer') {
          const minutes = Number(node.configuration.minutes);
          if (!Number.isFinite(minutes) || minutes <= 0) throw new Error(`${node.label} requires positive wait minutes.`);
          instance.status = 'WaitingForTimer'; instance.dueAt = iso(new Date(now.getTime() + minutes * 60_000)); step(state, instance, node, 'main', 'Waiting', `Deferred until ${instance.dueAt}.`, now); audit(state, instance, actor, 'TimerDeferred', instance.dueAt, now);
        } else if (node.type === 'IntegrationPlaceholder') {
          instance.status = node.configuration.manual === 'true' ? 'ManualIntervention' : 'WaitingForIntegration'; step(state, instance, node, 'main', 'Waiting', 'External execution is unsupported locally. Administrator resume or fail is required.', now); audit(state, instance, actor, instance.status, 'External execution was not attempted.', now);
        } else if (node.type === 'End') {
          step(state, instance, node, 'main', 'Completed', 'Workflow completed.', now, 'end'); instance.completedNodeIds.push(node.id); instance.currentNodeIds = []; instance.status = 'Completed'; audit(state, instance, actor, 'WorkflowCompleted', 'The bound workflow reached an end node.', now);
        }
      }
      instance.updatedAt = iso(now);
      return { instance, created };
    } catch (error: unknown) {
      instance.status = 'Failed'; instance.failureMessage = error instanceof Error ? error.message : 'Unknown workflow failure.'; instance.updatedAt = iso(now);
      audit(state, instance, actor, 'WorkflowFailed', instance.failureMessage, now);
      return { instance, created };
    }
  }

  private executeBranches(state: WorkflowState, instance: WorkflowInstance, definition: WorkflowDefinition, request: Request, actor: Pick<Person, 'id' | 'displayName'>, now: Date, created: ExecutionResult['created']): void {
    let joinId = '';
    instance.branches.forEach((branch: WorkflowBranchState) => {
      const visited = new Set<string>();
      while (branch.status === 'Running') {
        if (instance.stepCount >= instance.maximumSteps) throw new Error('Maximum workflow step limit reached.');
        if (visited.has(branch.currentNodeId)) throw new Error('Parallel branch loop guard was reached.');
        visited.add(branch.currentNodeId); instance.stepCount += 1;
        const node = definition.nodes.find((item: WorkflowNode) => item.id === branch.currentNodeId);
        if (!node) throw new Error(`Parallel branch node ${branch.currentNodeId} is missing.`);
        const key = `${instance.id}:${branch.id}:${node.id}`;
        if (instance.idempotencyKeys.includes(key)) throw new Error(`Duplicate parallel node execution blocked for ${node.label}.`);
        instance.idempotencyKeys.push(key);
        if (node.type === 'Join') { branch.status = 'Completed'; branch.joinNodeId = node.id; joinId = node.id; step(state, instance, node, branch.id, 'Completed', 'Branch reached join.', now, 'join'); break; }
        if (node.type === 'Notification') { state.notifications.push({ id: nextId(), notificationName: node.label, channelKey: 'InApp', message: node.configuration.message || node.label, recipientPersonId: resolveAssignee(request, node), requestId: { id: request.id, requestNumber: request.requestNumber }, sentAt: '', statusKey: 'Queued', workspaceId: { id: request.workspace.id, workspaceName: request.workspace.workspaceName } }); created.notifications += 1; }
        else if (node.type === 'FieldUpdate') { const field = node.configuration.targetField; if (!field) throw new Error(`${node.label} requires a target field.`); (request as unknown as Record<string, unknown>)[field] = node.configuration.value ?? ''; }
        else if (node.type === 'Condition') { const outcome = conditionOutcome(node, request, state.fieldValues); const conditional = edgeFor(definition, node.id, outcome); if (!conditional) throw new Error(`${node.label} has no ${outcome} outcome.`); step(state, instance, node, branch.id, 'Completed', `Condition was ${outcome}.`, now, outcome); branch.currentNodeId = conditional.target; continue; }
        else if (node.type !== 'Start') throw new Error(`${node.type} cannot pause inside the current local parallel runner.`);
        step(state, instance, node, branch.id, 'Completed', `${node.label} completed in branch.`, now, 'next');
        const edge = edgeFor(definition, node.id, 'next');
        if (!edge) throw new Error(`${node.label} has no next outcome.`);
        branch.currentNodeId = edge.target;
      }
    });
    if (!joinId || instance.branches.some((branch: WorkflowBranchState) => branch.joinNodeId !== joinId)) throw new Error('Parallel branches must converge on the same join.');
    const join = definition.nodes.find((node: WorkflowNode) => node.id === joinId);
    if (!join) throw new Error('Join node is missing.');
    const mode = join.configuration.mode === 'any' ? 'any' : 'all';
    const satisfied = mode === 'any' ? instance.branches.some((branch: WorkflowBranchState) => branch.status === 'Completed') : instance.branches.every((branch: WorkflowBranchState) => branch.status === 'Completed');
    if (!satisfied) { instance.status = 'Running'; return; }
    if (mode === 'any') instance.branches.filter((branch: WorkflowBranchState) => branch.status !== 'Completed').forEach((branch: WorkflowBranchState) => { branch.status = 'Cancelled'; });
    const edge = edgeFor(definition, join.id, 'next');
    instance.currentNodeIds = edge ? [edge.target] : [];
    instance.branches = [{ id: 'main', sourceNodeId: join.id, currentNodeId: edge?.target ?? join.id, status: 'Running' }];
    if (!instance.completedNodeIds.includes(join.id)) instance.completedNodeIds.push(join.id);
  }
}

export function createIsolatedWorkflowTestService(request: Request): { service: WorkflowApplicationService; provider: InMemoryWorkflowStateProvider } {
  const provider = new InMemoryWorkflowStateProvider({ requests: [request] });
  return { service: new WorkflowApplicationService(provider), provider };
}

export type WorkflowActor = Pick<Person, 'id' | 'displayName'>;
export type WorkflowWorkspace = Pick<Workspace, 'id' | 'workspaceName'>;
