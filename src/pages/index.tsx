import { ArrowRight, Boxes, Database, LockKeyhole, Network, Settings2 } from 'lucide-react';
import { motion } from 'motion/react';
import { InMemoryDataBanner } from '@/generated/components/in-memory-data-banner';
import { HAS_IN_MEMORY_TABLES } from '@/generated/hooks';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { requestTabs } from '@/config/request-tabs';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const foundationCards = [
  { title: 'Shared data contract', description: 'One Request entity with workspace ownership across every operational child record.', icon: Database },
  { title: 'Policy enforcement', description: 'Protected operations default to deny and verify workspace scope at the data boundary.', icon: LockKeyhole },
  { title: 'Configurable modules', description: 'Specialist capabilities remain optional without fragmenting the application.', icon: Boxes },
  { title: 'Settings resolution', description: 'Global defaults resolve through explicit workspace-level overrides.', icon: Settings2 },
] as const;

export default function HomePage() {
  const { activeWorkspace, availableWorkspaces, grantedPermissions } = useWorkspaceContext();

  return (
    <main className="flex flex-1 flex-col gap-6 p-6 lg:p-8">
      <InMemoryDataBanner show={HAS_IN_MEMORY_TABLES} message="This app uses draft tables for testing. Data entered won't be saved. Contact the app owner to enable storage." className="border border-border bg-secondary text-secondary-foreground" />
      <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: 'easeOut' as const }} className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2">
            <Badge variant="secondary">Foundation active</Badge>
            <span className="text-sm text-muted-foreground">{availableWorkspaces.length} authorized workspaces</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight">{activeWorkspace?.workspaceName ?? 'Workspace access required'}</h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{activeWorkspace?.description ?? 'Select an authorized workspace to continue.'}</p>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-3 text-card-foreground">
          <Network className="size-5" />
          <div>
            <p className="text-sm font-medium">One application shell</p>
            <p className="text-xs text-muted-foreground">Configuration-driven by workspace</p>
          </div>
        </div>
      </motion.header>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {foundationCards.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="border-t-4 border-t-primary">
            <CardHeader className="pb-3">
              <div className="mb-2 flex size-9 items-center justify-center rounded-lg bg-primary text-primary-foreground"><Icon className="size-4" /></div>
              <CardTitle className="text-base">{title}</CardTitle>
            </CardHeader>
            <CardContent><CardDescription>{description}</CardDescription></CardContent>
          </Card>
        ))}
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Request experience contract</CardTitle>
            <CardDescription>Every request detail view must retain exactly these five tabs in this order.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {requestTabs.map((tab, index) => (
                <div key={tab} className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 text-sm font-medium text-card-foreground">
                  <span className="flex size-5 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">{index + 1}</span>{tab}
                  {index < requestTabs.length - 1 && <ArrowRight className="size-3 text-muted-foreground" />}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Authorization context</CardTitle>
            <CardDescription>Effective grants for the selected workspace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between border-b border-border pb-2"><span className="text-sm text-muted-foreground">Workspace</span><span className="text-sm font-medium">{activeWorkspace?.workspaceName ?? 'None'}</span></div>
            <div className="flex items-center justify-between"><span className="text-sm text-muted-foreground">Explicit grants</span><Badge variant="outline">{grantedPermissions.size}</Badge></div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
