import { Navigate, useParams } from 'react-router-dom';
import { LoaderCircle } from 'lucide-react';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import OperationsHomePage from '@/pages/operations-home';
import RequestQueuePage from '@/pages/request-queue';
import ApprovalQueuePage from '@/pages/approval-queue';
import ReportingPage from '@/pages/reporting';
import KnowledgeCenterPage from '@/pages/knowledge-center';
import ContractsPage from '@/pages/contracts';
import WorkspaceModuleAdministrationPage from '@/pages/workspace-module-administration';

export function ModuleRouteGuard() {
  const { workspaceCode = '', moduleRoute = '' } = useParams();
  const { activeWorkspace, enabledModules, isLoading } = useWorkspaceContext();

  if (isLoading) {
    return <main className="flex flex-1 items-center justify-center p-6"><LoaderCircle className="size-6 animate-spin" aria-label="Loading module configuration" /></main>;
  }

  const homeModule = enabledModules.find((module) => module.moduleCode === 'home');
  const activeModule = moduleRoute ? enabledModules.find((module) => module.route === moduleRoute) : homeModule;
  if (!activeWorkspace || !activeModule) {
    const fallbackRoute = homeModule?.route ? `/w/${workspaceCode.toLowerCase()}/${homeModule.route}` : `/w/${workspaceCode.toLowerCase()}`;
    if (!moduleRoute && !homeModule) return <Navigate to="/no-workspace-access" replace />;
    return <Navigate to={fallbackRoute} replace />;
  }

  if (activeModule.moduleCode === 'home') return <OperationsHomePage />;
  if (activeModule.moduleCode === 'requests') return <RequestQueuePage />;
  if (activeModule.moduleCode === 'approvals') return <ApprovalQueuePage />;
  if (activeModule.moduleCode === 'reports') return <ReportingPage />;
  if (activeModule.moduleCode === 'contracts') return <ContractsPage />;
  if (activeModule.moduleCode === 'knowledge') return <KnowledgeCenterPage />;
  return <WorkspaceModuleAdministrationPage />;
}
