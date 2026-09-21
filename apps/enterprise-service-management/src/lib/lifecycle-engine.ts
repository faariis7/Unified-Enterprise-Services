import type { LifecycleDefinition } from '@/generated/models/lifecycle-definition-model';
import type { StatusDefinition } from '@/generated/models/status-definition-model';
import type { StatusTransition } from '@/generated/models/status-transition-model';
import type { TransitionPermission } from '@/generated/models/transition-permission-model';
import type { TransitionValidation } from '@/generated/models/transition-validation-model';

export interface LifecycleValidationIssue {
  severity: 'error' | 'warning';
  message: string;
}

export interface LifecycleValidationReport {
  valid: boolean;
  issues: LifecycleValidationIssue[];
  initialStatus?: StatusDefinition;
  reachableStatusIds: ReadonlySet<string>;
}

export interface TransitionContext {
  workspaceId: string;
  lifecycleId: string;
  fieldValues: Readonly<Record<string, string | undefined>>;
  incompleteTaskCount: number;
  pendingApprovalCount: number;
  hasResolution: boolean;
  comment: string;
  grantedPermissions: ReadonlySet<string>;
}

export interface TransitionCheck {
  allowed: boolean;
  errors: string[];
}

export function getAvailableTransitions(workspaceId: string, lifecycleId: string, sourceStatusId: string, transitions: readonly StatusTransition[]): StatusTransition[] {
  return transitions
    .filter((transition: StatusTransition) => transition.statusKey === 'Active' && transition.workspaceID.id === workspaceId && transition.lifecycleDefinitionID.id === lifecycleId && transition.sourceStatusDefinitionID.id === sourceStatusId)
    .sort((left: StatusTransition, right: StatusTransition) => left.sortOrder - right.sortOrder);
}

export function checkTransition(
  transition: StatusTransition,
  validations: readonly TransitionValidation[],
  permissions: readonly TransitionPermission[],
  context: TransitionContext,
): TransitionCheck {
  const errors: string[] = [];
  if (transition.workspaceID.id !== context.workspaceId || transition.lifecycleDefinitionID.id !== context.lifecycleId || transition.statusKey !== 'Active') {
    errors.push('This transition is not active in the request workspace and lifecycle.');
    return { allowed: false, errors };
  }
  permissions
    .filter((permission: TransitionPermission) => permission.statusKey === 'Active' && permission.workspaceID.id === context.workspaceId && permission.statusTransitionID.id === transition.id)
    .forEach((permission: TransitionPermission) => {
      if (!context.grantedPermissions.has(permission.permissionCode)) errors.push(`Missing permission: ${permission.permissionCode}.`);
    });
  validations
    .filter((validation: TransitionValidation) => validation.statusKey === 'Active' && validation.workspaceID.id === context.workspaceId && validation.statusTransitionID.id === transition.id)
    .sort((left: TransitionValidation, right: TransitionValidation) => left.sortOrder - right.sortOrder)
    .forEach((validation: TransitionValidation) => {
      const value = validation.fieldCode ? context.fieldValues[validation.fieldCode] : undefined;
      const failed = validation.validationTypeKey === 'FieldRequired' ? !value?.trim()
        : validation.validationTypeKey === 'ExpectedValue' ? value !== validation.expectedValue
          : validation.validationTypeKey === 'CompletedTasks' ? context.incompleteTaskCount > 0
            : validation.validationTypeKey === 'ApprovalsComplete' ? context.pendingApprovalCount > 0
              : validation.validationTypeKey === 'ResolutionRequired' ? !context.hasResolution
                : validation.validationTypeKey === 'MandatoryComment' ? !context.comment.trim()
                  : false;
      if (failed) errors.push(validation.errorMessage);
    });
  return { allowed: errors.length === 0, errors };
}

export function validateLifecycle(lifecycle: LifecycleDefinition, statuses: readonly StatusDefinition[], transitions: readonly StatusTransition[]): LifecycleValidationReport {
  const lifecycleStatuses = statuses
    .filter((status: StatusDefinition) => status.statusKey === 'Active' && status.workspaceID.id === lifecycle.workspace.id && status.lifecycleDefinitionID.id === lifecycle.id)
    .sort((left: StatusDefinition, right: StatusDefinition) => left.sortOrder - right.sortOrder);
  const lifecycleTransitions = transitions.filter((transition: StatusTransition) => transition.statusKey === 'Active' && transition.workspaceID.id === lifecycle.workspace.id && transition.lifecycleDefinitionID.id === lifecycle.id);
  const issues: LifecycleValidationIssue[] = [];
  const initialStatuses = lifecycleStatuses.filter((status: StatusDefinition) => status.isInitial);
  const initialStatus = initialStatuses[0];
  if (!initialStatus) issues.push({ severity: 'error', message: 'No initial status is configured.' });
  if (initialStatuses.length > 1) issues.push({ severity: 'error', message: 'More than one initial status is configured.' });
  if (!lifecycleStatuses.some((status: StatusDefinition) => status.isTerminal)) issues.push({ severity: 'error', message: 'No terminal status is configured.' });
  const statusIds = new Set(lifecycleStatuses.map((status: StatusDefinition) => status.id));
  lifecycleTransitions.forEach((transition: StatusTransition) => {
    if (!statusIds.has(transition.sourceStatusDefinitionID.id) || !statusIds.has(transition.destinationStatusDefinitionID.id)) issues.push({ severity: 'error', message: `${transition.transitionName} references a status outside this lifecycle.` });
  });
  const reachableStatusIds = new Set<string>();
  if (initialStatus) {
    const pending = [initialStatus.id];
    while (pending.length) {
      const statusId = pending.shift();
      if (!statusId || reachableStatusIds.has(statusId)) continue;
      reachableStatusIds.add(statusId);
      lifecycleTransitions.filter((transition: StatusTransition) => transition.sourceStatusDefinitionID.id === statusId).forEach((transition: StatusTransition) => pending.push(transition.destinationStatusDefinitionID.id));
    }
  }
  lifecycleStatuses.forEach((status: StatusDefinition) => {
    if (!reachableStatusIds.has(status.id)) issues.push({ severity: 'warning', message: `${status.statusName} is unreachable from the initial status.` });
    if (!status.isTerminal && !lifecycleTransitions.some((transition: StatusTransition) => transition.sourceStatusDefinitionID.id === status.id)) issues.push({ severity: 'error', message: `${status.statusName} is non-terminal but has no outgoing transition.` });
  });
  return { valid: !issues.some((issue: LifecycleValidationIssue) => issue.severity === 'error'), issues, initialStatus, reachableStatusIds };
}
