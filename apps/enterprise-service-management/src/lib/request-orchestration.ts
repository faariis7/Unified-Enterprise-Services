import type { Request } from '@/generated/models/request-model';
import type { StatusTransition } from '@/generated/models/status-transition-model';
import type { LifecycleTransitionRequiredField } from '@/generated/models/lifecycle-transition-required-field-model';
import type { RequestTask } from '@/generated/models/request-task-model';
import type { RequestApproval } from '@/generated/models/request-approval-model';
import type { RequestResolution } from '@/generated/models/request-resolution-model';
import type { AutomationRule } from '@/generated/models/automation-rule-model';
import type { AutomationTrigger, AutomationTriggerTriggerTypeKey } from '@/generated/models/automation-trigger-model';
import type { AutomationAction } from '@/generated/models/automation-action-model';
import { assertAuthorized, requestToRecordScope, type AuthorizationContext } from '@/lib/authorization';

export interface TransitionInput {
  request: Request;
  destinationStatus: string;
  comment?: string;
  actorId: string;
  source: string;
  context: AuthorizationContext;
  transitions: readonly StatusTransition[];
  requiredFields: readonly LifecycleTransitionRequiredField[];
  tasks: readonly RequestTask[];
  approvals: readonly RequestApproval[];
  resolutions: readonly RequestResolution[];
  fieldValues: Readonly<Record<string, string>>;
}

export interface TransitionDecision {
  allowed: boolean;
  transition?: StatusTransition;
  failures: string[];
}

export function evaluateTransition(input: TransitionInput): TransitionDecision {
  const transition = input.transitions.find((item: StatusTransition) =>
    item.statusKey === 'Active' && item.workspaceID.id === input.request.workspace.id &&
    item.sourceStatusDefinitionID.statusName.replaceAll(' ', '') === input.request.statusKey && item.destinationStatusDefinitionID.statusName.replaceAll(' ', '') === input.destinationStatus,
  );
  if (!transition) return { allowed: false, failures: ['No active transition is configured for this status change.'] };
  const failures: string[] = [];
  try {
    assertAuthorized('request.transition', input.context, requestToRecordScope(input.request), ['statusKey']);
  } catch {
    failures.push('Missing permission: request.transition');
  }
  input.requiredFields
    .filter((field: LifecycleTransitionRequiredField) => field.statusKey === 'Active' && field.transition.id === transition.id)
    .forEach((field: LifecycleTransitionRequiredField) => {
      const requestValue = input.request[field.fieldName as keyof Request];
      if ((!requestValue || requestValue === '') && !input.fieldValues[field.fieldName]?.trim()) failures.push(`${field.fieldLabel} is required.`);
    });
  return { allowed: failures.length === 0, transition, failures };
}

export interface AutomationCandidateInput {
  request: Request;
  trigger: AutomationTriggerTriggerTypeKey;
  rules: readonly AutomationRule[];
  triggers: readonly AutomationTrigger[];
  actions: readonly AutomationAction[];
  priorRuleExecutions: Readonly<Record<string, number>>;
  priorActionKeys: ReadonlySet<string>;
  depth: number;
}

export interface AutomationPlan {
  rule: AutomationRule;
  actions: Array<{ action: AutomationAction; idempotencyKey: string }>;
  skippedReason?: string;
}

export function buildAutomationPlans(input: AutomationCandidateInput): AutomationPlan[] {
  return input.rules
    .filter((rule: AutomationRule) => rule.statusKey === 'Active' && rule.workspace.id === input.request.workspace.id && input.triggers.some((trigger: AutomationTrigger) => trigger.active && trigger.automationRule.id === rule.id && trigger.triggerTypeKey === input.trigger))
    .filter((rule: AutomationRule) => !rule.serviceCode || rule.serviceCode === input.request.serviceCode)
    .filter((rule: AutomationRule) => !rule.catalogItemCode || rule.catalogItemCode === input.request.catalogItemCode)
    .map((rule: AutomationRule) => {
      const count = input.priorRuleExecutions[rule.id] ?? 0;
      if (input.depth >= rule.maximumChainDepth) return { rule, actions: [], skippedReason: 'Maximum automation depth reached.' };
      if (count >= rule.maximumExecutionsPerRequest) return { rule, actions: [], skippedReason: 'Maximum rule executions reached.' };
      const actions = input.actions
        .filter((action: AutomationAction) => action.statusKey === 'Active' && action.workspace.id === input.request.workspace.id && action.automationRule.id === rule.id)
        .sort((left: AutomationAction, right: AutomationAction) => left.sortOrder - right.sortOrder)
        .map((action: AutomationAction) => ({ action, idempotencyKey: `${input.request.id}:${rule.id}:${action.id}:${input.trigger}` }))
        .filter((entry: { action: AutomationAction; idempotencyKey: string }) => !input.priorActionKeys.has(entry.idempotencyKey));
      return { rule, actions };
    });
}

export function assertSameWorkspace(request: Request, workspaceId: string): void {
  if (request.workspace.id !== workspaceId) throw new Error('Cross-workspace orchestration is blocked.');
}
