import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowLeft, BookOpen, Building2, CheckCircle2, CircleUserRound, ClipboardList, Globe2, Home, LayoutGrid, ShieldCheck, Wrench } from 'lucide-react';
import { WorkspaceSelector } from '@/components/workspace-selector';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarHeader, SidebarInset, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider } from '@/components/ui/sidebar';
import { useAdministrationAccess } from '@/contexts/administration-access-context';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { getModuleIcon } from '@/lib/module-icons';

const requesterLinks = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'Services', to: '/catalog', icon: LayoutGrid },
  { label: 'My Requests', to: '/w/it-services/requests', icon: ClipboardList },
  { label: 'My Approvals', to: '/w/it-services/approvals', icon: CheckCircle2 },
  { label: 'Knowledge', to: '/w/it-services/knowledge', icon: BookOpen },
  { label: 'Profile', suffix: 'profile', icon: CircleUserRound },
  { label: 'Technician Portal', to: '/technician', icon: Wrench },
] as const;

export function AppShell() {
  const location = useLocation();
  const { activeWorkspace, administeredWorkspaces, currentPerson, demoPeople, enabledModules, getPersonRole, hasOperationsAccess, operationsWorkspacePath, isLoading, setDemoPersonId } = useWorkspaceContext();
  const { canAdministerGlobal } = useAdministrationAccess();
  const workspaceBase = activeWorkspace ? `/w/${activeWorkspace.workspaceKey.toLowerCase()}` : '';
  const requesterMode = location.pathname === '/' || location.pathname === '/catalog' || location.pathname.startsWith('/services/') || location.pathname.includes('/portal');
  const administrationContext = location.pathname.includes('/settings') && administeredWorkspaces.length > 0;

  if (requesterMode) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b border-border bg-card/95 text-card-foreground backdrop-blur">
          <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-5 py-5 md:px-10">
            <NavLink to="/" className="flex items-center gap-4" aria-label="Rawabi Services home">
              <span className="flex h-10 w-11 items-center justify-center rounded-sm bg-primary text-base font-bold text-primary-foreground">R</span>
              <span className="leading-none"><span className="block text-base font-bold tracking-[0.16em]">RAWABI</span><span className="mt-1.5 hidden text-[0.65rem] font-semibold text-muted-foreground sm:block">EMPLOYEE SERVICES</span></span>
            </NavLink>
            <div className="flex items-center gap-5">
              <nav className="hidden items-center gap-6 md:flex" aria-label="Requester navigation">
                {requesterLinks.map((item) => { const Icon = item.icon; const to = 'to' in item ? item.to : `${workspaceBase}/portal/${item.suffix}`; return <NavLink key={item.label} to={to} end={item.label === 'Home'} className={({ isActive }: { isActive: boolean }) => `flex items-center gap-2 border-b-2 px-1 py-2 text-sm font-semibold transition-colors ${isActive ? 'border-accent text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'}`}><Icon className="size-4" />{item.label}</NavLink>; })}
              </nav>
              {demoPeople.length > 1 && <label className="hidden items-center gap-2 text-xs font-semibold text-muted-foreground lg:flex"><span>Demo role</span><select aria-label="Demo role" className="rounded-md border border-input bg-background px-2 py-2 text-foreground" value={currentPerson?.id ?? ''} onChange={(event: React.ChangeEvent<HTMLSelectElement>) => setDemoPersonId(event.target.value)}>{demoPeople.filter((person) => person.id).map((person) => <option key={person.id} value={person.id}>{getPersonRole(person.id, activeWorkspace?.id)}</option>)}</select></label>}
              {!isLoading && hasOperationsAccess && operationsWorkspacePath && <NavLink to={operationsWorkspacePath} className="inline-flex min-h-10 items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"><Building2 className="size-4" /><span className="hidden sm:inline">Open Operations</span><span className="sm:hidden">Operations</span></NavLink>}
            </div>
          </div>
          <nav className="flex gap-2 overflow-x-auto border-t border-border px-4 py-2 md:hidden" aria-label="Mobile requester navigation">
            {requesterLinks.slice(0, 6).map((item) => { const Icon = item.icon; const to = 'to' in item ? item.to : `${workspaceBase}/portal/${item.suffix}`; return <NavLink key={item.label} to={to} end={item.label === 'Home'} className={({ isActive }: { isActive: boolean }) => `flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2 text-sm font-semibold ${isActive ? 'border-accent text-foreground' : 'border-transparent text-muted-foreground'}`}><Icon className="size-4" />{item.label}</NavLink>; })}
          </nav>
        </header>
        <Outlet />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader className="border-b border-sidebar-border p-4"><div className="flex items-center gap-3"><div className="flex size-10 items-center justify-center rounded-sm bg-sidebar-primary text-lg font-bold text-sidebar-primary-foreground">R</div><div><p className="text-base font-bold tracking-tight text-sidebar-foreground">RAWABI</p><p className="text-xs font-semibold text-sidebar-foreground">Enterprise Services</p></div></div><SidebarMenu className="mt-3"><SidebarMenuItem><SidebarMenuButton asChild><NavLink to="/"><ArrowLeft className="size-4" /><span>Service Marketplace</span></NavLink></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarHeader>
        <SidebarContent><SidebarGroup><SidebarGroupLabel>Workspace</SidebarGroupLabel><SidebarGroupContent><div className="mb-3"><WorkspaceSelector administrationOnly={administrationContext} /></div><SidebarMenu>{enabledModules.map((module) => { const Icon = getModuleIcon(module.icon); const path = module.route ? `${workspaceBase}/${module.route}` : workspaceBase; return <SidebarMenuItem key={module.id}><SidebarMenuButton asChild><NavLink to={path} end={!module.route} className={({ isActive }: { isActive: boolean }) => isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}><Icon className="size-4" /><span>{module.moduleName}</span></NavLink></SidebarMenuButton></SidebarMenuItem>; })}</SidebarMenu>{canAdministerGlobal && <SidebarGroup><SidebarGroupLabel>Platform</SidebarGroupLabel><SidebarGroupContent><SidebarMenu><SidebarMenuItem><SidebarMenuButton asChild><NavLink to="/admin" className={({ isActive }: { isActive: boolean }) => isActive ? 'bg-sidebar-accent text-sidebar-accent-foreground' : ''}><Globe2 className="size-4" /><span>Global Administration</span></NavLink></SidebarMenuButton></SidebarMenuItem></SidebarMenu></SidebarGroupContent></SidebarGroup>}</SidebarGroupContent></SidebarGroup></SidebarContent>
      </Sidebar>
      <SidebarInset className="min-h-screen"><div className="border-b border-border bg-background p-3 md:hidden"><div className="mb-3 flex items-center gap-2"><NavLink to="/" className="inline-flex shrink-0 items-center gap-2 rounded-md bg-secondary px-3 py-2 text-sm font-semibold text-secondary-foreground"><ArrowLeft className="size-4" />Marketplace</NavLink><div className="min-w-0 flex-1"><WorkspaceSelector administrationOnly={administrationContext} /></div></div><nav className="flex gap-1 overflow-x-auto" aria-label="Mobile workspace modules">{enabledModules.map((module) => { const Icon = getModuleIcon(module.icon); const path = module.route ? `${workspaceBase}/${module.route}` : workspaceBase; return <NavLink key={module.id} to={path} end={!module.route} className={({ isActive }: { isActive: boolean }) => `flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium ${isActive ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'}`}><Icon className="size-4" />{module.moduleName}</NavLink>; })}</nav></div><Outlet /></SidebarInset>
    </SidebarProvider>
  );
}
