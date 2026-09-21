import { Navigate, useLocation, useParams } from 'react-router-dom';
import { Construction, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkspaceContext } from '@/contexts/workspace-context';

export default function FoundationPlaceholderPage() {
  const { workspaceCode = '', moduleRoute = '' } = useParams();
  const location = useLocation();
  const { activeWorkspace, enabledModules } = useWorkspaceContext();
  const routeSegment = moduleRoute || location.pathname.split('/').filter(Boolean)[2] || '';
  const activeModule = enabledModules.find((module) => module.route === routeSegment);

  if (!activeWorkspace) return null;
  if (!activeModule) return <Navigate to={`/w/${workspaceCode.toLowerCase()}`} replace />;

  return (
    <main className="flex-1 p-4 md:p-6">
      <div className="mx-auto max-w-5xl space-y-6">
        <div><p className="text-sm font-medium text-foreground">{activeWorkspace.workspaceName}</p><h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{activeModule.moduleName}</h1><p className="mt-1 text-sm text-muted-foreground">{activeModule.description}</p></div>
        <Card>
          <CardHeader><div className="flex items-center gap-3"><div className="rounded-lg bg-primary p-2 text-primary-foreground"><Construction className="size-5" /></div><div><CardTitle>Module registered</CardTitle><CardDescription>This module is enabled for the active workspace. Its full workflow is intentionally outside this foundation phase.</CardDescription></div></div></CardHeader>
          <CardContent className="flex items-center gap-2 text-sm text-foreground"><ShieldCheck className="size-4" />Visibility and direct access are enforced by workspace configuration.</CardContent>
        </Card>
      </div>
    </main>
  );
}