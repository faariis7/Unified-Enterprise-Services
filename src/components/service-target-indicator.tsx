import { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Clock3, PauseCircle } from 'lucide-react';
import type { RequestServiceTarget } from '@/generated/models/request-service-target-model';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

function formatRemaining(minutes: number) {
  const absolute = Math.abs(minutes);
  const days = Math.floor(absolute / 1440);
  const hours = Math.floor((absolute % 1440) / 60);
  const mins = absolute % 60;
  const value = [days ? `${days}d` : '', hours ? `${hours}h` : '', `${mins}m`].filter(Boolean).join(' ');
  return minutes < 0 ? `${value} overdue` : `${value} remaining`;
}

export function ServiceTargetIndicator({ target, compact = false }: { target: RequestServiceTarget; compact?: boolean }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!['Active', 'Warning'].includes(target.statusKey)) return;
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, [target.statusKey]);

  const calculatedMinutes = target.statusKey === 'Paused' ? target.remainingMinutes : Math.ceil((new Date(target.dueAt).getTime() - now) / 60_000);
  const remaining = ['Met', 'Cancelled'].includes(target.statusKey) ? target.remainingMinutes : calculatedMinutes;
  const elapsedPercent = Math.max(0, Math.min(100, 100 - (remaining / target.snapshotDurationMinutes) * 100));
  const isBreached = target.statusKey === 'Breached' || remaining < 0;
  const isWarning = target.statusKey === 'Warning' || (!isBreached && elapsedPercent >= 75);
  const Icon = target.statusKey === 'Met' ? CheckCircle2 : target.statusKey === 'Paused' ? PauseCircle : isBreached || isWarning ? AlertTriangle : Clock3;
  const label = target.statusKey === 'Met' ? 'Met' : target.statusKey === 'Paused' ? 'Paused' : isBreached ? 'Breached' : isWarning ? 'At risk' : 'On track';

  if (compact) {
    return <div className={cn('rounded-md border-l-4 bg-card p-3 text-card-foreground', isBreached ? 'border-l-destructive' : isWarning ? 'border-l-accent-foreground' : 'border-l-primary')}><div className="flex items-center justify-between gap-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{target.snapshotPolicyName}</p><p className="text-xs text-muted-foreground">{target.targetTypeKey} · {formatRemaining(remaining)}</p></div><Badge variant={isBreached ? 'destructive' : 'secondary'}><Icon className="size-3" />{label}</Badge></div></div>;
  }

  return <div className={cn('rounded-lg border-l-4 bg-card p-4 text-card-foreground', isBreached ? 'border-l-destructive' : isWarning ? 'border-l-accent-foreground' : 'border-l-primary')}><div className="flex flex-wrap items-start justify-between gap-3"><div><p className="font-medium">{target.snapshotPolicyName}</p><p className="text-sm text-muted-foreground">{target.targetTypeKey} target · Due {new Date(target.dueAt).toLocaleString()}</p></div><Badge variant={isBreached ? 'destructive' : 'secondary'}><Icon className="size-3" />{label}</Badge></div><Progress value={elapsedPercent} className="mt-3" /><div className="mt-2 flex justify-between text-xs"><span>{formatRemaining(remaining)}</span><span>{Math.round(elapsedPercent)}% elapsed</span></div></div>;
}
