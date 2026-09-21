import { Navigate, Outlet, useParams } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { useAdministrationAccess } from '@/contexts/administration-access-context';
import { useWorkspaceContext } from '@/contexts/workspace-context';

export function GlobalAdministrationGuard() {
  const { canAdministerGlobal, isLoading } = useAdministrationAccess();
  if (isLoading) return <main className="flex flex-1 items-center justify-center p-6"><LoaderCircle className="size-6 animate-spin" aria-label="Checking global administration access" /></main>;
  return canAdministerGlobal ? <Outlet /> : <Navigate to="/no-workspace-access" replace />;
}

export function WorkspaceAdministrationGuard() {
  const { workspaceCode = '' } = useParams();
  const { activeWorkspace, administeredWorkspaces, isLoading } = useWorkspaceContext();
  if (isLoading) return <main className="flex flex-1 items-center justify-center p-6"><LoaderCircle className="size-6 animate-spin" aria-label="Checking workspace administration access" /></main>;
  const requestedWorkspace = administeredWorkspaces.find((workspace) => workspace.workspaceKey.toLowerCase() === workspaceCode.toLowerCase());
  if (requestedWorkspace && activeWorkspace?.id === requestedWorkspace.id) return <Outlet />;
  const fallbackWorkspace = administeredWorkspaces[0];
  return fallbackWorkspace ? <Navigate to={`/w/${fallbackWorkspace.workspaceKey.toLowerCase()}/settings`} replace /> : <Navigate to="/no-workspace-access" replace />;
}
