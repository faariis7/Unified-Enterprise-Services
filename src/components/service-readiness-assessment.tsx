import { AlertTriangle, CheckCircle2, CircleX, ExternalLink, ShieldCheck } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { ReadinessFinding, ReadinessStatus, ServiceReadinessAssessment as Assessment } from '@/lib/service-readiness-assessment';

const statusVariant = (status: ReadinessStatus): 'default' | 'secondary' | 'destructive' => status === 'Ready' ? 'default' : status === 'Ready With Warnings' ? 'secondary' : 'destructive';

export function ServiceReadinessAssessment({ assessment, onNavigate }: { assessment: Assessment; onNavigate: (target: string) => void }) {
  const errors = assessment.findings.filter((finding: ReadinessFinding) => finding.severity === 'error').length;
  const warnings = assessment.findings.filter((finding: ReadinessFinding) => finding.severity === 'warning').length;
  return <div className="space-y-4">
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="border-l-4 border-l-primary"><CardHeader><CardTitle>Readiness</CardTitle><CardDescription>All publication domains</CardDescription></CardHeader><CardContent><div className="mb-3 flex items-center justify-between"><Badge variant={statusVariant(assessment.status)}>{assessment.status}</Badge><span className="text-2xl font-semibold">{assessment.score}%</span></div><Progress value={assessment.score} aria-label={`${assessment.score}% service readiness`} /></CardContent></Card>
      <Card className="border-l-4 border-l-destructive"><CardHeader><CardTitle>Blocking findings</CardTitle><CardDescription>Must be remediated</CardDescription></CardHeader><CardContent className="text-3xl font-semibold">{errors}</CardContent></Card>
      <Card className="border-l-4 border-l-accent-foreground"><CardHeader><CardTitle>Warnings</CardTitle><CardDescription>Require informed review</CardDescription></CardHeader><CardContent className="text-3xl font-semibold">{warnings}</CardContent></Card>
    </div>
    <div className="grid gap-4 lg:grid-cols-2">{assessment.areas.map((result) => <Card key={result.area} className={`border-l-4 ${result.status === 'Not Ready' ? 'border-l-destructive' : result.status === 'Ready With Warnings' ? 'border-l-primary' : 'border-l-accent-foreground'}`}><CardHeader><div className="flex items-center justify-between gap-3"><CardTitle className="flex items-center gap-2 text-base">{result.status === 'Ready' ? <CheckCircle2 className="size-4" /> : result.status === 'Not Ready' ? <CircleX className="size-4" /> : <AlertTriangle className="size-4" />}{result.area}</CardTitle><Badge variant={statusVariant(result.status)}>{result.status}</Badge></div></CardHeader><CardContent className="space-y-3">{result.findings.map((finding: ReadinessFinding) => <div key={finding.id} className={finding.severity === 'error' ? 'rounded-md bg-destructive p-3 text-destructive-foreground' : finding.severity === 'warning' ? 'rounded-md bg-accent p-3 text-accent-foreground' : 'rounded-md bg-secondary p-3 text-secondary-foreground'}><div className="flex items-start gap-2"><ShieldCheck className="mt-0.5 size-4 shrink-0" /><div className="min-w-0 flex-1"><p className="font-medium">{finding.title}</p><p className="mt-1 text-sm">{finding.detail}</p><p className="mt-2 text-sm font-medium">Remediation: {finding.remediation}</p>{finding.target && finding.severity !== 'pass' && <Button variant="outline" size="sm" className="mt-3" onClick={() => onNavigate(finding.target!)}>Open configuration<ExternalLink className="size-4" /></Button>}</div></div></div>)}</CardContent></Card>)}</div>
  </div>;
}
