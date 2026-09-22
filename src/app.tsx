import { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { Provider as JotaiProvider } from 'jotai';
import { initialize } from '@microsoft/power-apps/app';
import { AdministrationAccessProvider } from '@/contexts/administration-access-context';
import { AppShell } from '@/components/app-shell';
import { GlobalAdministrationGuard, WorkspaceAdministrationGuard } from '@/components/administration-guard';
import { LegacyWorkspaceRedirect } from '@/components/legacy-workspace-redirect';
import { ModuleRouteGuard } from '@/components/module-route-guard';
import { WorkspaceRouteGuard } from '@/components/workspace-route-guard';
import { ReportingGuard } from '@/components/reporting-guard';
import { WorkspaceProvider } from '@/contexts/workspace-context';
import { queryClient } from '@/lib/query-client';
import { Toaster } from '@/components/ui/sonner';
import ErrorBoundary from '@/components/system/error-boundary';
import GlobalAdministrationPage from '@/pages/global-administration';
import NoWorkspaceAccessPage from '@/pages/no-workspace-access';
import NotFoundPage from '@/pages/not-found';
import WorkspaceAdministrationPage from '@/pages/workspace-administration';

import ServiceCatalogPage from '@/pages/service-catalog';
import LifecycleSimulatorPage from '@/pages/lifecycle-simulator';
import LifecycleBuilderPage from '@/pages/lifecycle-builder';
import ApprovalQueuePage from '@/pages/approval-queue';
import AutomationEnginePage from '@/pages/automation-engine';
import WorkflowBuilderPage from '@/pages/workflow-builder';
import RequesterPortalPage from '@/pages/requester-portal';
import RequesterRequestDetailPage from '@/pages/requester-request-detail';
import RequestQueuePage from '@/pages/request-queue';

import ReportingPage from '@/pages/reporting';
import ReportBuilderPage from '@/pages/report-builder';
import ReportDashboardsPage from '@/pages/report-dashboards';
import ReportFieldCatalogPage from '@/pages/report-field-catalog';
import ServiceHealthPage from '@/pages/service-health';
import KnowledgeCenterPage from '@/pages/knowledge-center';
import ServicesMarketplacePage from '@/pages/services-marketplace';
import AllServicesPage from '@/pages/all-services';
import RequesterServiceDetailPage from '@/pages/requester-service-detail';
import WorkspaceModuleAdministrationPage from '@/pages/workspace-module-administration';
import CatalogAdministrationPage from '@/pages/catalog-administration';
import ReadinessCenterPage from '@/pages/readiness-center';
import EmailIntakeAdministrationPage from '@/pages/email-intake-administration';
import ServiceBuilderPage from '@/pages/service-builder';
import GuidedServiceCreationPage from '@/pages/guided-service-creation';
import AiServiceDesignerPage from '@/pages/ai-service-designer';
import ServiceGovernancePage from '@/pages/service-governance';

import BusinessRulesCatalogPage from '@/pages/business-rules-catalog';
import MigrationAssistantPage from '@/pages/migration-assistant';
function App() {
  const [initializationState, setInitializationState] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let active = true;
    void initialize()
      .then(() => {
        if (active) setInitializationState('ready');
      })
      .catch(() => {
        if (active) setInitializationState('error');
      });
    return () => {
      active = false;
    };
  }, []);

  if (initializationState === 'loading') {
    return <main className="flex min-h-screen items-center justify-center bg-background text-foreground"><p>Loading your access…</p></main>;
  }

  if (initializationState === 'error') {
    return <main className="flex min-h-screen items-center justify-center bg-background p-6 text-foreground"><div className="max-w-md space-y-3 text-center"><h1 className="text-xl font-semibold">Unable to initialize</h1><p className="text-muted-foreground">The Power Apps identity context could not be loaded. Refresh the page and try again.</p><button type="button" className="rounded-md bg-primary px-4 py-2 text-primary-foreground" onClick={() => window.location.reload()}>Retry</button></div></main>;
  }
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary resetQueryCache>
        <JotaiProvider>
          <Toaster richColors />
          <Router>
            <WorkspaceProvider>
              <AdministrationAccessProvider>
                <Routes>
                  <Route path="/no-workspace-access" element={<NoWorkspaceAccessPage />} />
                  <Route path="/" element={<AppShell />}>
                    <Route path="services/:workspaceCode/:itemCode" element={<RequesterServiceDetailPage />} />
                    <Route index element={<ServicesMarketplacePage />} />
                    <Route path="requests" element={<LegacyWorkspaceRedirect />} />
                    <Route path="catalog" element={<AllServicesPage />} />
                    <Route path="knowledge" element={<LegacyWorkspaceRedirect />} />
                    <Route path="approvals" element={<LegacyWorkspaceRedirect />} />
                    <Route path="reports" element={<LegacyWorkspaceRedirect />} />
                    <Route path="settings" element={<LegacyWorkspaceRedirect />} />
                    <Route element={<GlobalAdministrationGuard />}>
                      <Route path="admin" element={<GlobalAdministrationPage />} />
                    </Route>
                    <Route path="w/:workspaceCode" element={<WorkspaceRouteGuard />}>
                      <Route index element={<ModuleRouteGuard />} />
                      <Route element={<ReportingGuard />}>
                        <Route path="reports" element={<ReportingPage />} />
                        <Route path="reports/builder" element={<ReportBuilderPage />} />
                        <Route path="reports/fields" element={<ReportFieldCatalogPage />} />
                        <Route path="reports/service-health" element={<ServiceHealthPage />} />
                        <Route path="reports/dashboards" element={<ReportDashboardsPage />} />
                      </Route>
                      <Route element={<WorkspaceAdministrationGuard />}>
                        <Route path="settings/email-intake" element={<EmailIntakeAdministrationPage />} />
                        <Route path="settings/service-governance" element={<ServiceGovernancePage />} />
                        <Route path="settings/service-builder/ai-design" element={<AiServiceDesignerPage />} />
                        <Route path="settings/service-builder/guided" element={<GuidedServiceCreationPage />} />
                        <Route path="settings/service-builder" element={<ServiceBuilderPage />} />
                        <Route path="settings/catalog" element={<CatalogAdministrationPage />} />
                        <Route path="settings" element={<WorkspaceAdministrationPage />} />
                        <Route path="settings/lifecycles" element={<LifecycleBuilderPage />} />
                        <Route path="settings/workflow-builder" element={<WorkflowBuilderPage />} />
                        <Route path="settings/business-rules" element={<BusinessRulesCatalogPage />} />
                        <Route path="settings/automation" element={<AutomationEnginePage />} />
                        <Route path="settings/lifecycles/simulator" element={<LifecycleSimulatorPage />} />
                        <Route path="settings/migration-assistant" element={<MigrationAssistantPage />} />
                        <Route path="settings/readiness" element={<ReadinessCenterPage />} />
                        <Route path="settings/:moduleRoute" element={<WorkspaceModuleAdministrationPage />} />
                      </Route>
                      <Route path="portal" element={<RequesterPortalPage />} />
                      <Route path="portal/:portalSection" element={<RequesterPortalPage />} />
                      <Route path="portal/request/:itemCode" element={<ServiceCatalogPage />} />
                      <Route path="knowledge" element={<KnowledgeCenterPage />} />
                      <Route path="portal/requests/:requestId" element={<RequesterRequestDetailPage />} />
                      <Route path="approvals" element={<ApprovalQueuePage />} />
                      <Route path="technician" element={<RequestQueuePage />} />
                      <Route path="requests/:requestId" element={<RequesterRequestDetailPage mode="technician" />} />
                      <Route path="catalog/:itemCode" element={<ServiceCatalogPage />} />

                      <Route path=":moduleRoute" element={<ModuleRouteGuard />} />
                    </Route>
                    <Route path="*" element={<NotFoundPage />} />
                  </Route>
                </Routes>
              </AdministrationAccessProvider>
            </WorkspaceProvider>
          </Router>
        </JotaiProvider>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;