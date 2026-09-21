import { AlertTriangle, CheckCircle2, FileText, Paperclip } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import type { RequestReviewModel, ReviewSection } from '@/lib/request-review-runtime';

export function RequestReviewSummary({ review, compact = false }: { review: RequestReviewModel; compact?: boolean }) {
  const hasWarnings = review.warnings.length > 0 || review.missing.length > 0;
  return <div className="space-y-4" aria-label={`Review for ${review.title}`}>
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-card p-4 text-card-foreground">
      <div><p className="font-semibold">{review.title}</p><p className="text-sm text-muted-foreground">{review.answeredCount} of {review.totalCount} fields answered</p></div>
      <Badge variant={hasWarnings ? 'outline' : 'secondary'}>{hasWarnings ? 'Needs review' : 'Ready to submit'}</Badge>
    </div>
    {review.warnings.length > 0 && <Alert className="border-l-4 border-l-destructive"><AlertTriangle className="size-4" /><AlertTitle>Validation warnings</AlertTitle><AlertDescription><ul className="list-disc space-y-1 pl-5">{review.warnings.map((warning: string) => <li key={warning}>{warning}</li>)}</ul></AlertDescription></Alert>}
    {review.missing.length > 0 && <Alert className="border-l-4 border-l-primary"><AlertTriangle className="size-4" /><AlertTitle>Missing information</AlertTitle><AlertDescription>{review.missing.join(', ')}</AlertDescription></Alert>}
    {!hasWarnings && <Alert className="border-l-4 border-l-accent-foreground"><CheckCircle2 className="size-4" /><AlertTitle>Request is complete</AlertTitle><AlertDescription>Review the information below, then confirm submission.</AlertDescription></Alert>}
    <div className={compact ? 'space-y-3' : 'grid gap-4 lg:grid-cols-2'}>{review.sections.map((section: ReviewSection) => <Card key={section.id} className="break-inside-avoid"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><FileText className="size-4" />{section.title}</CardTitle>{section.description && <CardDescription>{section.description}</CardDescription>}</CardHeader><CardContent><dl className="space-y-3">{section.items.map((item) => <div key={item.id} className="grid gap-1 border-b border-border pb-3 last:border-0 last:pb-0"><dt className="text-xs font-medium text-muted-foreground">{item.label}</dt><dd className="whitespace-pre-wrap break-words text-sm font-medium">{item.value}</dd></div>)}</dl></CardContent></Card>)}</div>
    <Card className="break-inside-avoid"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base"><Paperclip className="size-4" />Attachments</CardTitle><CardDescription>{review.attachments.length} file{review.attachments.length === 1 ? '' : 's'} included</CardDescription></CardHeader>{review.attachments.length > 0 && <CardContent className="space-y-2">{review.attachments.map((attachment) => <div key={attachment.id} className="rounded-md border border-border p-3"><p className="text-sm font-medium">{attachment.name}</p><p className="text-xs text-muted-foreground">{attachment.detail}</p></div>)}</CardContent>}</Card>
  </div>;
}
