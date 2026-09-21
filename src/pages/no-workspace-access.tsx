import { Link, useNavigate } from 'react-router-dom';
import { Globe2, RefreshCw, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdministrationAccess } from '@/contexts/administration-access-context';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { useUser } from '@/hooks/use-user';

export default function NoWorkspaceAccessPage() {
  const navigate = useNavigate();
  const { canAdministerGlobal, isLoading: administrationLoading } = useAdministrationAccess();
  const { activeWorkspace, availableWorkspaces, isLoading: workspaceLoading } = useWorkspaceContext();
  const { data: user } = useUser();
  const isLoading = administrationLoading || workspaceLoading;

  const retryAccess = () => {
    if (activeWorkspace) {
      navigate(`/w/${activeWorkspace.workspaceKey.toLowerCase()}`, { replace: true });
      return;
    }
    window.location.reload();
  };
  return (
    <main className="flex flex-1 items-center justify-center bg-background p-6 text-foreground">
      <Card className="w-full max-w-lg">
        <CardHeader><div className="mb-3 flex size-10 items-center justify-center rounded-lg bg-destructive text-destructive-foreground"><ShieldAlert className="size-5" /></div><CardTitle>No workspace access</CardTitle></CardHeader>
        <CardContent className="space-y-4 text-sm text-muted-foreground">
          {isLoading ? <p>Checking your identity and workspace memberships…</p> : availableWorkspaces.length > 0 ? <p>Your access is available. Continue to your workspace.</p> : <p>Access is granted through an active workspace membership. Ask a platform administrator or workspace owner to add the signed-in account below, then retry.</p>}
          {user?.userPrincipalName && <div className="rounded-md bg-muted p-3 text-muted-foreground"><span className="font-medium text-foreground">Signed-in account</span><br />{user.userPrincipalName}</div>}
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={retryAccess} disabled={isLoading}><RefreshCw className="size-4" />{availableWorkspaces.length > 0 ? 'Continue to workspace' : 'Retry access check'}</Button>
            {!isLoading && canAdministerGlobal && <Button variant="outline" asChild><Link to="/admin"><Globe2 className="size-4" />Open Global Administration</Link></Button>}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
