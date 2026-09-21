import { Navigate, Outlet, useParams } from 'react-router-dom';
import { useWorkspaceContext } from '@/contexts/workspace-context';

export function ReportingGuard() {
  const { workspaceCode = '' } = useParams();
  const { can } = useWorkspaceContext();
  return can('report.workspace.read') ? <Outlet /> : <Navigate to={`/w/${workspaceCode.toLowerCase()}`} replace />;
}
