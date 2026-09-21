import { useMemo, useState, type ChangeEvent, type ComponentType } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  ChevronsUpDown,
  Headphones,
  Landmark,
  LifeBuoy,
  Megaphone,
  Monitor,
  Plane,
  Search,
  Star,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import type { Workspace } from '@/generated/models/workspace-model';

const iconMap: Record<string, ComponentType<{ className?: string }>> = {
  building: Building2,
  headset: Headphones,
  landmark: Landmark,
  'life-buoy': LifeBuoy,
  megaphone: Megaphone,
  monitor: Monitor,
  plane: Plane,
};

function workspacePath(workspaceCode: string) {
  return `/w/${workspaceCode.toLowerCase()}`;
}

interface WorkspaceSelectorProps {
  administrationOnly?: boolean;
}

export function WorkspaceSelector({ administrationOnly = false }: WorkspaceSelectorProps) {
  const navigate = useNavigate();
  const {
    activeWorkspace,
    availableWorkspaces,
    administeredWorkspaces,
    favoriteWorkspaceIds,
    recentWorkspaces,
    setActiveWorkspaceId,
    toggleFavorite,
    getWorkspaceRole,
  } = useWorkspaceContext();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const selectableWorkspaces = administrationOnly ? administeredWorkspaces : availableWorkspaces;
  const selectableIds = useMemo(() => new Set(selectableWorkspaces.map((workspace: Workspace) => workspace.id)), [selectableWorkspaces]);
  const visibleRecentWorkspaces = useMemo(() => recentWorkspaces.filter((workspace: Workspace) => selectableIds.has(workspace.id)), [recentWorkspaces, selectableIds]);
  const results = useMemo(
    () => selectableWorkspaces.filter((workspace: Workspace) =>
      `${workspace.workspaceName} ${workspace.workspaceKey}`.toLowerCase().includes(search.trim().toLowerCase()),
    ),
    [search, selectableWorkspaces],
  );


  if (selectableWorkspaces.length <= 1) {
    const workspace = selectableWorkspaces[0] ?? activeWorkspace;
    const StaticIcon = workspace ? iconMap[workspace.icon] ?? Building2 : Building2;
    const roleLabel = workspace ? getWorkspaceRole(workspace.id) : undefined;
    return (
      <div className="flex min-h-14 w-full items-center gap-3 rounded-md bg-sidebar-accent px-3 py-2 text-sidebar-accent-foreground" aria-label={workspace ? `Active workspace: ${workspace.workspaceName}, role: ${roleLabel}` : 'No administered workspace'}>
        <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground"><StaticIcon className="size-4" /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-xs font-medium">Workspace</span>
          <span className="block truncate text-sm font-semibold">{workspace?.workspaceName ?? 'No administered workspace'}</span>
          {roleLabel && <span className="block truncate text-xs font-medium">{roleLabel}</span>}
        </span>
      </div>
    );
  }
  const selectWorkspace = (workspace: Workspace) => {
    setActiveWorkspaceId(workspace.id);
    setOpen(false);
    setSearch('');
    navigate(workspacePath(workspace.workspaceKey));
  };

  const ActiveIcon = activeWorkspace ? iconMap[activeWorkspace.icon] ?? Building2 : Building2;
  const activeRoleLabel = activeWorkspace ? getWorkspaceRole(activeWorkspace.id) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" className="h-auto min-h-14 w-full justify-between gap-2 border-sidebar-border bg-sidebar-accent px-3 py-2 text-left text-sidebar-accent-foreground hover:bg-sidebar-primary hover:text-sidebar-primary-foreground">
          <span className="flex min-w-0 flex-1 items-center gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <ActiveIcon className="size-4" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-medium text-sidebar-accent-foreground">Active workspace</span>
              <span className="block truncate font-semibold text-sidebar-accent-foreground">{activeWorkspace?.workspaceName ?? 'Select workspace'}</span>
              {activeRoleLabel && <span className="block truncate text-xs font-medium text-sidebar-accent-foreground">{activeRoleLabel}</span>}
            </span>
          </span>
          <ChevronsUpDown className="size-4 shrink-0" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[22rem] p-0">
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)} placeholder="Search workspaces" className="pl-9" />
          </div>
        </div>
        <ScrollArea className="h-80">
          <div className="space-y-1 p-2">
            {!search && visibleRecentWorkspaces.length > 0 && (
              <p className="px-2 pb-1 pt-2 text-xs font-medium text-muted-foreground">Recent</p>
            )}
            {!search && visibleRecentWorkspaces.map((workspace: Workspace) => {
              const Icon = iconMap[workspace.icon] ?? Building2;
              return (
                <button key={`recent-${workspace.id}`} type="button" onClick={() => selectWorkspace(workspace)} className="flex w-full items-center gap-3 rounded-md px-2 py-2 text-left hover:bg-accent hover:text-accent-foreground">
                  <Icon className="size-4" />
                  <span className="min-w-0 flex-1 truncate text-sm font-medium">{workspace.workspaceName}</span>
                  <Badge variant="outline">{getWorkspaceRole(workspace.id)}</Badge>
                </button>
              );
            })}
            <p className="px-2 pb-1 pt-2 text-xs font-medium text-muted-foreground">{administrationOnly ? 'Administered workspaces' : 'Authorized workspaces'}</p>
            {results.map((workspace: Workspace) => {
              const Icon = iconMap[workspace.icon] ?? Building2;
              const favorite = favoriteWorkspaceIds.has(workspace.id);
              return (
                <div key={workspace.id} className={cn('flex items-center gap-1 rounded-md', activeWorkspace?.id === workspace.id && 'bg-accent text-accent-foreground')}>
                  <button type="button" onClick={() => selectWorkspace(workspace)} className="flex min-w-0 flex-1 items-center gap-3 px-2 py-2 text-left">
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground"><Icon className="size-4" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{workspace.workspaceName}</span>
                      <span className={cn('flex items-center gap-2 text-xs', activeWorkspace?.id === workspace.id ? 'text-accent-foreground' : 'text-muted-foreground')}><span>{workspace.active}</span><span>·</span><span>{getWorkspaceRole(workspace.id)}</span></span>
                    </span>
                  </button>
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={favorite ? `Unfavorite ${workspace.workspaceName}` : `Favorite ${workspace.workspaceName}`} onClick={() => toggleFavorite(workspace.id)}>
                    <Star className={cn('size-4', favorite && 'fill-current')} />
                  </Button>
                </div>
              );
            })}
            {results.length === 0 && <p className="px-3 py-8 text-center text-sm text-muted-foreground">No {administrationOnly ? 'administered' : 'authorized'} workspaces found.</p>}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
