import { UsersRound } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useWorkspaceContext } from '@/contexts/workspace-context';

export function DemoPersonaSelector() {
  const { currentPerson, demoPeople, getPersonRole, setDemoPersonId } = useWorkspaceContext();
  if (demoPeople.length === 0) return null;
  return (
    <div className="rounded-lg border border-sidebar-border bg-sidebar-accent p-3 text-sidebar-accent-foreground">
      <Label className="mb-2 flex items-center gap-2 text-xs font-semibold"><UsersRound className="size-4" />Demo role</Label>
      <Select value={currentPerson?.id ?? 'none'} onValueChange={(value: string) => setDemoPersonId(value === 'none' ? '' : value)}>
        <SelectTrigger className="w-full bg-sidebar text-sidebar-foreground"><SelectValue placeholder="Choose role" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="none">No demo role</SelectItem>
          {demoPeople.filter((person) => person.id).map((person) => <SelectItem key={person.id} value={person.id}>{getPersonRole(person.id)}</SelectItem>)}
        </SelectContent>
      </Select>
      <p className="mt-2 text-xs">Testing only. Access and workspace membership update immediately.</p>
    </div>
  );
}
