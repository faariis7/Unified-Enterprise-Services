import type { Request } from '@/generated/models/request-model';
import { assertSameWorkspace, buildAutomationPlans } from '@/lib/request-orchestration';

export function runOrchestrationPolicyTests(request: Request): void {
  let blocked = false;
  try {
    assertSameWorkspace(request, 'another-workspace');
  } catch {
    blocked = true;
  }
  if (!blocked) throw new Error('Cross-workspace orchestration test failed');

  const plans = buildAutomationPlans({
    request,
    trigger: 'RequestUpdated',
    rules: [],
    triggers: [],
    actions: [],
    priorRuleExecutions: {},
    priorActionKeys: new Set<string>(),
    depth: 5,
  });
  if (plans.length !== 0) throw new Error('Empty automation plan test failed');
}
