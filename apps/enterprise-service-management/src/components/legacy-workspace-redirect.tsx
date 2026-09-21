import { Navigate, useLocation } from 'react-router-dom';
import { useWorkspaceContext } from '@/contexts/workspace-context';

export function LegacyWorkspaceRedirect() {
  const location = useLocation();
  const { activeWorkspace, isLoading } = useWorkspaceContext();
  if (isLoading) return null;
  if (!activeWorkspace) return <Navigate to="/no-workspace-access" replace />;
  const suffix = location.pathname === '/' ? '' : location.pathname;
  return <Navigate to={`/w/${activeWorkspace.workspaceKey.toLowerCase()}${suffix}`} replace />;
}
