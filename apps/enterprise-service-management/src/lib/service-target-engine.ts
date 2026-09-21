import type { Request } from '@/generated/models/request-model';
import type { ServiceTargetPolicy } from '@/generated/models/service-target-policy-model';
import type { ServiceTargetRule } from '@/generated/models/service-target-rule-model';

export function selectServiceTargetPolicy(request: Request, policies: ServiceTargetPolicy[], rules: ServiceTargetRule[]) {
  const matchingRule = rules
    .filter((rule: ServiceTargetRule) => rule.active && rule.workspace.id === request.workspace.id)
    .sort((first: ServiceTargetRule, second: ServiceTargetRule) => first.sortOrder - second.sortOrder)
    .find((rule: ServiceTargetRule) => (!rule.serviceCode || rule.serviceCode === request.serviceCode)
      && (!rule.catalogItemCode || rule.catalogItemCode === request.catalogItemCode)
      && (!rule.requestTypeCode || rule.requestTypeCode === request.requestTypeId)
      && (!rule.priorityKey || rule.priorityKey === request.priorityKey)
      && (!rule.impact || rule.impact === request.impactId)
      && (!rule.urgency || rule.urgency === request.urgencyId));
  const policy = policies.find((item: ServiceTargetPolicy) => item.active && item.id === matchingRule?.serviceTargetPolicy.id);
  return policy && matchingRule ? { policy, rule: matchingRule } : undefined;
}
