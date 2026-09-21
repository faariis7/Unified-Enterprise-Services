import { Navigate, Outlet, useParams } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { useWorkspaceContext } from '@/contexts/workspace-context';

export function WorkspaceRouteGuard() {
  const { workspaceCode = '' } = useParams();
  const { activeWorkspace, availableWorkspaces, isLoading, setActiveWorkspaceId } = useWorkspaceContext();
  const requested = availableWorkspaces.find((workspace) => workspace.workspaceKey.toLowerCase() === workspaceCode.toLowerCase());

  if (isLoading) {
    return <main className="flex flex-1 items-center justify-center p-6"><LoaderCircle className="size-6 animate-spin" aria-label="Loading workspace" /></main>;
  }

  if (!requested) {
    return activeWorkspace ? <Navigate to={`/w/${activeWorkspace.workspaceKey.toLowerCase()}`} replace /> : <Navigate to="/no-workspace-access" replace />;
  }

  if (activeWorkspace?.id !== requested.id) {
    setActiveWorkspaceId(requested.id);
    return <main className="flex flex-1 items-center justify-center p-6"><LoaderCircle className="size-6 animate-spin" aria-label="Switching workspace" /></main>;
  }

  return <Outlet />;
}
