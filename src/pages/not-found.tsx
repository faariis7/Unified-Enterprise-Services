import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="flex flex-1 items-center justify-center bg-background p-4 text-foreground">
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold text-foreground">404</h1>
        <h2 className="mb-2 text-2xl font-semibold text-foreground">Page not found</h2>
        <p className="mb-8 max-w-md text-muted-foreground">
          The page does not exist, is disabled, or you do not have access.
        </p>
        <Button asChild><Link to="/">Return to workspace</Link></Button>
      </div>
    </div>
  );
}
