import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { useGlobalRoleAssignmentList } from '@/generated/hooks/use-global-role-assignment';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import type { GlobalRoleAssignment } from '@/generated/models/global-role-assignment-model';

interface AdministrationAccessValue {
  canAdministerGlobal: boolean;
  isLoading: boolean;
  globalRoleNames: string[];
}

const AdministrationAccessContext = createContext<AdministrationAccessValue | undefined>(undefined);

export function AdministrationAccessProvider({ children }: { children: ReactNode }) {
  const { currentPerson, demoPeople } = useWorkspaceContext();
  const demoMode = demoPeople.length > 0;
  const personId = currentPerson?.id;
  const { data: assignments = [], isLoading: assignmentsLoading } = useGlobalRoleAssignmentList({
    filter: personId ? `person/id eq '${personId}' and statusKey eq 'Active'` : `id eq '00000000-0000-0000-0000-000000000000'`,
  });
  const activeAssignments = useMemo(() => assignments.filter((assignment: GlobalRoleAssignment) => {
    const today = new Date().toISOString();
    return assignment.person.id === personId && assignment.statusKey === 'Active' && assignment.startDate <= today && (!assignment.endDate || assignment.endDate >= today);
  }), [assignments, personId]);
  const globalRoleNames = activeAssignments.map((assignment: GlobalRoleAssignment) => assignment.roleDefinition.roleName);
  const canAdministerGlobal = activeAssignments.some((assignment: GlobalRoleAssignment) => ['PlatformOwner', 'GlobalAdministrator'].includes(assignment.roleDefinition.roleName.replaceAll(' ', '')));

  return <AdministrationAccessContext.Provider value={{ canAdministerGlobal, isLoading: assignmentsLoading || (!demoMode && !currentPerson), globalRoleNames }}>{children}</AdministrationAccessContext.Provider>;
}

export function useAdministrationAccess() {
  const context = useContext(AdministrationAccessContext);
  if (!context) throw new Error('useAdministrationAccess must be used within AdministrationAccessProvider');
  return context;
}
