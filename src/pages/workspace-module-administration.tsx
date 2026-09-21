import { Link, useParams } from 'react-router-dom';
import { ArrowRight, CheckCircle2, Settings2, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkspaceContext } from '@/contexts/workspace-context';

const moduleGuidance: Record<string, { title: string; description: string; capabilities: string[]; route?: string }> = {
  catalog: { title: 'Catalog administration', description: 'Manage the service portfolio and requester offerings.', capabilities: ['Publication readiness', 'Services and categories', 'Catalog items and audiences', 'Form and approval assignments'], route: 'settings/catalog' },
  forms: { title: 'Dynamic forms', description: 'Govern reusable forms without changing the request engine.', capabilities: ['Definitions and versions', 'Sections, fields, and options', 'Dependencies and visibility', 'Validation and field permissions'] },
  lifecycles: { title: 'Lifecycle administration', description: 'Configure governed request stages and transitions.', capabilities: ['Definitions and stages', 'Statuses and transitions', 'Permissions and required fields', 'Simulation and consistency checks'], route: 'settings/lifecycles/simulator' },
  approvals: { title: 'Approval administration', description: 'Configure reusable approval plans and delegations.', capabilities: ['Definitions and ordered stages', 'Any/all approver rules', 'Escalation and expiration', 'Delegation and runtime validation'], route: 'approvals' },
  targets: { title: 'Service targets', description: 'Manage response, fulfillment, resolution, and approval commitments.', capabilities: ['Policies and matching rules', 'Business calendars', 'Warning and breach thresholds', 'Pause and recalculation rules'] },
  automation: { title: 'Automation Engine', description: 'Create safe event-driven operational rules.', capabilities: ['Triggers and ordered conditions', 'Ordered actions', 'Loop and execution limits', 'Immutable execution review'], route: 'settings/automation' },
  knowledge: { title: 'Knowledge administration', description: 'Manage categories, publication workflow, versions, and feedback.', capabilities: ['Categories and ownership', 'Draft and review workflow', 'Publishing and archiving', 'Version and feedback review'], route: 'knowledge' },
  members: { title: 'Membership and assignment', description: 'Control workspace and service-specific operational access.', capabilities: ['Workspace memberships', 'Service roles', 'Assignment eligibility', 'Owners, managers, agents, and approvers'] },
  modules: { title: 'Workspace modules', description: 'Manage the enabled operational capabilities and navigation order.', capabilities: ['Enabled state', 'Display labels', 'Navigation order', 'Configuration readiness'] },
  notifications: { title: 'Notifications', description: 'Review workspace notification configuration and delivery controls.', capabilities: ['Templates and channels', 'Audience rules', 'Request notifications', 'Delivery audit'] },
};

export default function WorkspaceModuleAdministrationPage() {
  const { moduleRoute = '' } = useParams();
  const { activeWorkspace, can } = useWorkspaceContext();
  const configuration = moduleGuidance[moduleRoute] ?? { title: 'Workspace configuration', description: 'Manage this enabled workspace capability.', capabilities: ['Workspace-scoped configuration', 'Validated changes', 'Permission enforcement', 'Audit feedback'] };
  const base = `/w/${activeWorkspace?.workspaceKey.toLowerCase() ?? 'facility'}`;
  if (!can('workspace.administer')) return <main className="flex flex-1 items-center justify-center p-6"><Card className="max-w-lg"><CardHeader><CardTitle>Administration access required</CardTitle><CardDescription>This capability is restricted to active workspace owners and administrators.</CardDescription></CardHeader></Card></main>;
  return <main className="flex-1 p-5 md:p-8"><div className="mx-auto max-w-6xl space-y-6"><header className="flex flex-col gap-4 border-b border-border pb-6 md:flex-row md:items-end md:justify-between"><div><div className="mb-2 flex items-center gap-2"><Settings2 className="size-5" /><Badge variant="secondary">{activeWorkspace?.workspaceName}</Badge></div><h1 className="text-2xl font-semibold">{configuration.title}</h1><p className="mt-2 text-muted-foreground">{configuration.description}</p></div>{configuration.route && <Button asChild><Link to={`${base}/${configuration.route}`}>Open workspace <ArrowRight className="size-4" /></Link></Button>}</header><section className="grid gap-4 md:grid-cols-2">{configuration.capabilities.map((capability: string) => <Card key={capability}><CardContent className="flex items-start gap-3 p-5"><CheckCircle2 className="mt-0.5 size-5" /><div><p className="font-medium">{capability}</p><p className="mt-1 text-sm text-muted-foreground">Configured through existing shared entities and restricted to the active workspace.</p></div></CardContent></Card>)}</section><Card><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-5" />Governance boundary</CardTitle><CardDescription>Reads, edits, direct routes, and destructive actions are permission checked and workspace scoped. Production persistence remains a deployment prerequisite.</CardDescription></CardHeader></Card></div></main>;
}
