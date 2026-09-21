import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useModule_1List } from '@/generated/hooks/use-module-1';
import { usePersonList } from '@/generated/hooks/use-person';
import { useWorkspaceList } from '@/generated/hooks/use-workspace';
import { useWorkspaceMembershipList } from '@/generated/hooks/use-workspace-membership';
import { useServiceMembershipList } from '@/generated/hooks/use-service-membership';
import { useWorkspaceModuleList } from '@/generated/hooks/use-workspace-module';
import type { Person } from '@/generated/models/person-model';
import type { Module_1 } from '@/generated/models/module-1-model';
import type { Workspace } from '@/generated/models/workspace-model';
import type { WorkspaceMembership } from '@/generated/models/workspace-membership-model';
import type { ServiceMembership } from '@/generated/models/service-membership-model';
import type { WorkspaceModule } from '@/generated/models/workspace-module-model';
import { authorizeOperation, type ProtectedOperation, type RecordScope } from '@/lib/authorization';
import { buildAuthorizedRequestFilter } from '@/lib/authorized-request-service';
import { useUser } from '@/hooks/use-user';

export interface EnabledWorkspaceModule {
  id: string;
  moduleCode: string;
  moduleName: string;
  description: string;
  route: string;
  icon: string;
  sortOrder: number;
  isCoreModule: boolean;
  requiredPermission?: string;
}

interface WorkspaceContextValue {
  activeWorkspace?: Workspace;
  currentPerson?: Person;
  demoPeople: Person[];
  availableWorkspaces: Workspace[];
  administeredWorkspaces: Workspace[];
  recentWorkspaces: Workspace[];
  favoriteWorkspaceIds: ReadonlySet<string>;
  enabledModules: EnabledWorkspaceModule[];
  grantedPermissions: ReadonlySet<string>;
  accessibleServiceCodes: ReadonlySet<string>;
  hasOperationsAccess: boolean;
  operationsWorkspacePath?: string;
  isLoading: boolean;
  setActiveWorkspaceId: (workspaceId: string) => void;
  setDemoPersonId: (personId: string) => void;
  toggleFavorite: (workspaceId: string) => void;
  getWorkspaceRole: (workspaceId: string) => string;
  getPersonRole: (personId: string, workspaceId?: string) => string;
  requestReadFilter: string;
  can: (operation: ProtectedOperation, record?: RecordScope) => boolean;
}

const WorkspaceContext = createContext<WorkspaceContextValue | undefined>(undefined);
const activeWorkspaceKey = 'esm.active-workspace-id';
const demoPersonKey = 'esm.demo-person-id';
const favoriteWorkspaceKey = 'esm.favorite-workspace-ids';
const recentWorkspaceKey = 'esm.recent-workspace-ids';

const roleGrants: Record<WorkspaceMembership['roleKey'], readonly ProtectedOperation[]> = {
  Owner: ['request.create', 'request.read', 'request.update', 'request.delete', 'request.assign', 'request.transition', 'request.resolve', 'request.reopen', 'request.export', 'request.administer', 'workspace.administer', 'search.global', 'report.workspace.read', 'report.definition.manage', 'report.dashboard.manage', 'report.export', 'attachment.download', 'attachment.upload', 'notification.send'],
  Administrator: ['request.create', 'request.read', 'request.update', 'request.delete', 'request.assign', 'request.transition', 'request.resolve', 'request.reopen', 'request.export', 'request.administer', 'workspace.administer', 'search.global', 'report.workspace.read', 'report.definition.manage', 'report.dashboard.manage', 'report.export', 'attachment.download', 'attachment.upload', 'notification.send'],
  Manager: ['request.create', 'request.read', 'request.update', 'request.assign', 'request.transition', 'request.resolve', 'request.reopen', 'request.export', 'search.global', 'report.workspace.read', 'report.definition.manage', 'report.dashboard.manage', 'report.export', 'attachment.download', 'attachment.upload', 'notification.send'],
  Agent: ['request.create', 'request.read', 'request.update', 'request.assign', 'request.transition', 'request.resolve', 'request.reopen', 'search.global', 'report.workspace.read', 'attachment.download', 'attachment.upload', 'notification.send'],
  Approver: ['request.read.assigned', 'request.transition', 'notification.send'],
  KnowledgePublisher: ['request.read', 'search.global'],
  Auditor: ['request.read', 'request.export', 'report.workspace.read', 'report.export'],
  Requester: ['request.create', 'request.read.own', 'request.read.requested_for', 'request.update.own', 'attachment.download', 'attachment.upload', 'notification.send'],
};

const roleLabels: Record<WorkspaceMembership['roleKey'], string> = {
  Owner: 'Workspace owner',
  Administrator: 'Workspace administrator',
  Manager: 'Workspace manager',
  Agent: 'Agent',
  Approver: 'Approver',
  KnowledgePublisher: 'Knowledge publisher',
  Auditor: 'Auditor',
  Requester: 'Requester',
};

function isProtectedOperation(value: string): value is ProtectedOperation {
  return Object.values(roleGrants).some((operations: readonly ProtectedOperation[]) => operations.includes(value as ProtectedOperation));
}

function readIds(key: string) {
  try {
    const stored = JSON.parse(window.localStorage.getItem(key) ?? '[]') as unknown;
    return Array.isArray(stored) ? stored.filter((value: unknown): value is string => typeof value === 'string') : [];
  } catch {
    return [];
  }
}



export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { data: user, isLoading: userLoading } = useUser();
  const { data: people = [], isLoading: personLoading } = usePersonList();
  const { data: workspaces = [], isLoading: workspaceLoading } = useWorkspaceList();
  const { data: memberships = [], isLoading: membershipLoading } = useWorkspaceMembershipList();
  const { data: modules = [], isLoading: moduleDefinitionLoading } = useModule_1List();
  const { data: workspaceModules = [], isLoading: moduleLoading } = useWorkspaceModuleList();
  const { data: serviceMemberships = [], isLoading: serviceMembershipLoading } = useServiceMembershipList();
  const [demoPersonId, setDemoPersonIdState] = useState(() => window.localStorage.getItem(demoPersonKey) ?? '');
  const [activeWorkspaceId, setActiveWorkspaceIdState] = useState(() => window.localStorage.getItem(activeWorkspaceKey) ?? '');
  const [favoriteIds, setFavoriteIds] = useState<string[]>(() => readIds(favoriteWorkspaceKey));
  const [recentIds, setRecentIds] = useState<string[]>(() => readIds(recentWorkspaceKey));

  const normalizedUserPrincipalName = user?.userPrincipalName?.trim().toLowerCase();
  const matchedPerson = useMemo(() => people.find((person: Person) => person.active && person.statusKey === 'Active' && (person.externalObjectID === user?.objectId || person.email.trim().toLowerCase() === normalizedUserPrincipalName)), [normalizedUserPrincipalName, people, user?.objectId]);
  const demoDirectory = useMemo(() => people.length > 0 && people.every((person: Person) => person.email.trim().toLowerCase().endsWith('@example.com')), [people]);
  const demoPeople = useMemo(() => demoDirectory ? people.filter((person: Person) => person.active && person.statusKey === 'Active') : [], [demoDirectory, people]);
  const selectedDemoPerson = useMemo(() => demoPeople.find((person: Person) => person.id === demoPersonId) ?? demoPeople.find((person: Person) => person.departmentCode === 'IT'), [demoPeople, demoPersonId]);
  const currentPerson = matchedPerson ?? selectedDemoPerson;
  const setDemoPersonId = useCallback((personId: string) => {
    if (!demoPeople.some((person: Person) => person.id === personId)) return;
    setDemoPersonIdState(personId);
    window.localStorage.setItem(demoPersonKey, personId);
    window.localStorage.removeItem(activeWorkspaceKey);
    setActiveWorkspaceIdState('');
  }, [demoPeople]);
  const activeMemberships = useMemo(() => memberships.filter((membership: WorkspaceMembership) => membership.active === 'Active' && membership.person.id === currentPerson?.id), [currentPerson?.id, memberships]);
  const memberWorkspaceIds = useMemo(() => new Set(activeMemberships.map((membership: WorkspaceMembership) => membership.workspace.id)), [activeMemberships]);
  const availableWorkspaces = useMemo(() => workspaces.filter((workspace: Workspace) => workspace.active === 'Active' && memberWorkspaceIds.has(workspace.id)), [memberWorkspaceIds, workspaces]);
  const administeredWorkspaceIds = useMemo(() => new Set(activeMemberships.filter((membership: WorkspaceMembership) => membership.roleKey === 'Owner' || membership.roleKey === 'Administrator').map((membership: WorkspaceMembership) => membership.workspace.id)), [activeMemberships]);
  const administeredWorkspaces = useMemo(() => availableWorkspaces.filter((workspace: Workspace) => administeredWorkspaceIds.has(workspace.id)), [administeredWorkspaceIds, availableWorkspaces]);
  const defaultMembership = activeMemberships.find((membership: WorkspaceMembership) => membership.isDefaultWorkspace);
  const fallbackWorkspace = availableWorkspaces.find((workspace: Workspace) => workspace.id === defaultMembership?.workspace.id) ?? availableWorkspaces[0];

  useEffect(() => {
    if (workspaceLoading || membershipLoading || personLoading || userLoading) return;
    if (!availableWorkspaces.some((workspace: Workspace) => workspace.id === activeWorkspaceId)) {
      const fallbackId = fallbackWorkspace?.id ?? '';
      setActiveWorkspaceIdState(fallbackId);
      if (fallbackId) window.localStorage.setItem(activeWorkspaceKey, fallbackId);
      else window.localStorage.removeItem(activeWorkspaceKey);
    }
  }, [activeWorkspaceId, availableWorkspaces, fallbackWorkspace?.id, membershipLoading, personLoading, userLoading, workspaceLoading]);

  const setActiveWorkspaceId = useCallback((workspaceId: string) => {
    if (!availableWorkspaces.some((workspace: Workspace) => workspace.id === workspaceId)) return;
    setActiveWorkspaceIdState(workspaceId);
    window.localStorage.setItem(activeWorkspaceKey, workspaceId);
    setRecentIds((current: string[]) => {
      const next = [workspaceId, ...current.filter((id: string) => id !== workspaceId)].slice(0, 5);
      window.localStorage.setItem(recentWorkspaceKey, JSON.stringify(next));
      return next;
    });
    queryClient.removeQueries({ predicate: (query) => query.queryKey.some((part: unknown) => typeof part === 'string' && part.startsWith('workspace-scope:')) });
  }, [availableWorkspaces, queryClient]);

  const toggleFavorite = useCallback((workspaceId: string) => {
    if (!availableWorkspaces.some((workspace: Workspace) => workspace.id === workspaceId)) return;
    setFavoriteIds((current: string[]) => {
      const next = current.includes(workspaceId) ? current.filter((id: string) => id !== workspaceId) : [...current, workspaceId];
      window.localStorage.setItem(favoriteWorkspaceKey, JSON.stringify(next));
      return next;
    });
  }, [availableWorkspaces]);

  const operationalServiceRoles: ReadonlySet<ServiceMembership['roleKey']> = new Set(['Agent', 'ServiceManager', 'ServiceAdministrator']);
  const operationalServiceMemberships = serviceMemberships.filter((membership: ServiceMembership) => membership.person.id === currentPerson?.id && membership.statusKey === 'Active' && operationalServiceRoles.has(membership.roleKey) && (!membership.endDate || new Date(membership.endDate) >= new Date()));
  const operationalWorkspaceIds = new Set([
    ...operationalServiceMemberships.map((membership: ServiceMembership) => membership.workspace.id),
    ...activeMemberships.filter((membership: WorkspaceMembership) => ['Owner', 'Administrator'].includes(membership.roleKey)).map((membership: WorkspaceMembership) => membership.workspace.id),
  ]);
  const operationsWorkspace = availableWorkspaces.find((workspace: Workspace) => workspace.id === activeWorkspaceId && operationalWorkspaceIds.has(workspace.id))
    ?? availableWorkspaces.find((workspace: Workspace) => workspace.id === defaultMembership?.workspace.id && operationalWorkspaceIds.has(workspace.id))
    ?? availableWorkspaces.find((workspace: Workspace) => operationalWorkspaceIds.has(workspace.id));

  const activeWorkspace = availableWorkspaces.find((workspace: Workspace) => workspace.id === activeWorkspaceId);
  const activeRoles = activeMemberships.filter((membership: WorkspaceMembership) => membership.workspace.id === activeWorkspaceId).map((membership: WorkspaceMembership) => membership.roleKey);
  const workspaceRolePermissions = useMemo(() => new Set(activeRoles.flatMap((roleKey: WorkspaceMembership['roleKey']) => roleGrants[roleKey] ?? [])), [activeRoles]);
  const activeServiceMemberships = useMemo(() => serviceMemberships.filter((membership: ServiceMembership) => membership.workspace.id === activeWorkspaceId && membership.person.id === currentPerson?.id && membership.statusKey === 'Active' && (!membership.endDate || new Date(membership.endDate) >= new Date())), [activeWorkspaceId, currentPerson?.id, serviceMemberships]);
  const accessibleServiceCodes = useMemo(() => new Set(activeServiceMemberships.map((membership: ServiceMembership) => membership.serviceCode)), [activeServiceMemberships]);
  const serviceRolePermissions = useMemo(() => new Set(activeServiceMemberships.flatMap((membership: ServiceMembership): ProtectedOperation[] => membership.roleKey === 'ServiceAdministrator' || membership.roleKey === 'ServiceManager' ? ['request.read', 'request.update', 'request.assign', 'request.transition', 'request.resolve', 'report.workspace.read', 'report.definition.manage', 'report.dashboard.manage', 'report.export'] : membership.roleKey === 'Agent' ? ['request.read', 'request.update', 'request.assign', 'request.transition', 'request.resolve', 'report.workspace.read'] : membership.roleKey === 'Approver' ? ['request.read.assigned', 'request.transition'] : ['request.read', 'report.workspace.read', 'report.export'])), [activeServiceMemberships]);
  const grantedPermissions = useMemo(() => new Set([...workspaceRolePermissions, ...serviceRolePermissions]), [serviceRolePermissions, workspaceRolePermissions]);
  const moduleById = useMemo(() => new Map(modules.map((module: Module_1) => [module.id, module])), [modules]);
  const retiredModuleCodes = useMemo(() => new Set(['problems', 'changes']), []);
  const implementedModuleCodes = useMemo(() => new Set(['home', 'requests', 'approvals', 'reports', 'contracts', 'knowledge']), []);
  const enabledModules = useMemo(() => workspaceModules
    .filter((configuration: WorkspaceModule) => configuration.enabled && configuration.configurationStatusKey === 'Configured' && configuration.workspace.id === activeWorkspaceId)
    .map((configuration: WorkspaceModule): EnabledWorkspaceModule | undefined => {
      const module = moduleById.get(configuration.moduleDefinition.id);
      if (!module || module.globalStatusKey !== 'Active' || retiredModuleCodes.has(module.moduleCode.trim().toLowerCase()) || !implementedModuleCodes.has(module.moduleCode.trim().toLowerCase())) return undefined;
      if (module.requiredPermission && (!isProtectedOperation(module.requiredPermission) || !grantedPermissions.has(module.requiredPermission))) return undefined;
      return {
        id: module.id,
        moduleCode: module.moduleCode,
        moduleName: configuration.displayNameOverride?.trim() || module.moduleName,
        description: module.description,
        route: module.moduleCode === 'home' ? '' : module.route,
        icon: module.icon,
        sortOrder: configuration.sortOrder ?? module.sortOrder,
        isCoreModule: module.isCoreModule,
        requiredPermission: module.requiredPermission,
      };
    })
    .filter((module: EnabledWorkspaceModule | undefined): module is EnabledWorkspaceModule => Boolean(module))
    .sort((first: EnabledWorkspaceModule, second: EnabledWorkspaceModule) => first.sortOrder - second.sortOrder), [activeWorkspaceId, grantedPermissions, implementedModuleCodes, moduleById, retiredModuleCodes, workspaceModules]);
  const favoriteWorkspaceIds = useMemo(() => new Set(favoriteIds.filter((id: string) => availableWorkspaces.some((workspace: Workspace) => workspace.id === id))), [availableWorkspaces, favoriteIds]);
  const recentWorkspaces = recentIds.map((id: string) => availableWorkspaces.find((workspace: Workspace) => workspace.id === id)).filter((workspace: Workspace | undefined): workspace is Workspace => Boolean(workspace));

  const authorizationContext = {
    identity: currentPerson ? { objectId: user?.objectId ?? currentPerson.externalObjectID, personId: currentPerson.id, personActive: currentPerson.active && currentPerson.statusKey === 'Active', departmentCode: currentPerson.departmentCode, siteCode: currentPerson.siteCode, assignmentGroupCodes: Array.from(accessibleServiceCodes) } : undefined,
    activeWorkspaceId,
    membershipActive: activeMemberships.some((membership: WorkspaceMembership) => membership.workspace.id === activeWorkspaceId),
    grantedPermissions,
  };
  const value: WorkspaceContextValue = {
    administeredWorkspaces,
    currentPerson,
    demoPeople,
    activeWorkspace,
    availableWorkspaces,
    recentWorkspaces,
    favoriteWorkspaceIds,
    enabledModules,
    grantedPermissions,
    accessibleServiceCodes,
    hasOperationsAccess: Boolean(operationsWorkspace),
    operationsWorkspacePath: operationsWorkspace ? `/w/${operationsWorkspace.workspaceKey.toLowerCase()}` : undefined,
    requestReadFilter: buildAuthorizedRequestFilter(authorizationContext),
    isLoading: userLoading || personLoading || workspaceLoading || membershipLoading || moduleDefinitionLoading || moduleLoading || serviceMembershipLoading,
    setActiveWorkspaceId,
    setDemoPersonId,
    toggleFavorite,
    getWorkspaceRole: (workspaceId: string) => {
      const membership = activeMemberships.find((item: WorkspaceMembership) => item.workspace.id === workspaceId);
      return membership ? roleLabels[membership.roleKey] : 'Member';
    },
    getPersonRole: (personId: string, workspaceId?: string) => {
      const personMemberships = memberships.filter((membership: WorkspaceMembership) => membership.active === 'Active' && membership.person.id === personId && (!workspaceId || membership.workspace.id === workspaceId));
      const preferredMembership = personMemberships.find((membership: WorkspaceMembership) => membership.isDefaultWorkspace) ?? personMemberships[0];
      return preferredMembership ? roleLabels[preferredMembership.roleKey] : 'Member';
    },
    can: (operation: ProtectedOperation, record?: RecordScope) => authorizeOperation(operation, authorizationContext, record),
  };

  return <WorkspaceContext.Provider value={value} key={activeWorkspaceId || 'no-workspace'}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspaceContext() {
  const context = useContext(WorkspaceContext);
  if (!context) throw new Error('useWorkspaceContext must be used within WorkspaceProvider');
  return context;
}