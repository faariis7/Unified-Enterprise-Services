import { useMemo, useState, type FormEvent } from 'react';
import { BookOpen, Check, Clock3, FilePlus2, Search, Send, ThumbsDown, ThumbsUp } from 'lucide-react';
import { toast } from 'sonner';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { HAS_IN_MEMORY_TABLES } from '@/generated/hooks';
import { useKnowledgeArticleList, useCreateKnowledgeArticle, useUpdateKnowledgeArticle } from '@/generated/hooks/use-knowledge-article';
import { useKnowledgeCategoryList } from '@/generated/hooks/use-knowledge-category';
import { useCreateKnowledgeFeedback, useKnowledgeFeedbackList } from '@/generated/hooks/use-knowledge-feedback';
import { useCreateKnowledgeVersion, useKnowledgeVersionList, useUpdateKnowledgeVersion } from '@/generated/hooks/use-knowledge-version';
import type { KnowledgeArticle, KnowledgeArticleAudienceKey } from '@/generated/models/knowledge-article-model';
import type { KnowledgeCategory } from '@/generated/models/knowledge-category-model';
import type { KnowledgeVersion } from '@/generated/models/knowledge-version-model';
import { InMemoryDataBanner } from '@/generated/components/in-memory-data-banner';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';

interface KnowledgeCenterProps { requesterMode?: boolean }
interface ArticleDraft { title: string; summary: string; body: string; categoryId: string; audience: KnowledgeArticleAudienceKey; tags: string }
const emptyDraft: ArticleDraft = { title: '', summary: '', body: '', categoryId: '', audience: 'AllMembers', tags: '' };

function splitMeta(value: string) {
  try { return JSON.parse(value) as Record<string, string | number>; } catch { return {}; }
}

export default function KnowledgeCenterPage({ requesterMode = false }: KnowledgeCenterProps) {
  const { activeWorkspace, currentPerson, getWorkspaceRole } = useWorkspaceContext();
  const [query, setQuery] = useState('');
  const [categoryId, setCategoryId] = useState('all');
  const [selectedId, setSelectedId] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [draft, setDraft] = useState<ArticleDraft>(emptyDraft);
  const [feedbackComment, setFeedbackComment] = useState('');
  const workspaceId = activeWorkspace?.id ?? '';
  const articleFilter = workspaceId ? `workspace/id eq '${workspaceId}'` : 'id eq null';
  const { data: articles = [], isLoading } = useKnowledgeArticleList({ filter: articleFilter, orderBy: ['title asc'] });
  const { data: categories = [] } = useKnowledgeCategoryList({ filter: workspaceId ? `workspace/id eq '${workspaceId}' and active eq true` : 'id eq null', orderBy: ['sortOrder asc'] });
  const { data: versions = [] } = useKnowledgeVersionList({ filter: workspaceId ? `workspace/id eq '${workspaceId}'` : 'id eq null', orderBy: ['versionNumber desc'] });
  const { data: feedback = [] } = useKnowledgeFeedbackList({ filter: workspaceId ? `workspace/id eq '${workspaceId}'` : 'id eq null' });
  const createArticle = useCreateKnowledgeArticle();
  const updateArticle = useUpdateKnowledgeArticle();
  const createVersion = useCreateKnowledgeVersion();
  const updateVersion = useUpdateKnowledgeVersion();
  const createFeedback = useCreateKnowledgeFeedback();
  const role = activeWorkspace ? getWorkspaceRole(activeWorkspace.id) : 'Member';
  const canPublish = !requesterMode && ['Workspace owner', 'Workspace administrator', 'Workspace manager', 'Knowledge publisher'].includes(role);

  const visibleArticles = useMemo(() => articles.filter((article: KnowledgeArticle) => {
    if (requesterMode && (article.stateKey !== 'Published' || !['Requesters', 'AllMembers'].includes(article.audienceKey))) return false;
    const matchesQuery = `${article.title} ${article.summary} ${article.tags}`.toLowerCase().includes(query.toLowerCase());
    return matchesQuery && (categoryId === 'all' || article.knowledgeCategory.id === categoryId);
  }), [articles, categoryId, query, requesterMode]);
  const selected = visibleArticles.find((article: KnowledgeArticle) => article.id === selectedId) ?? visibleArticles[0];
  const articleVersions = versions.filter((version: KnowledgeVersion) => version.knowledgeArticle.id === selected?.id);
  const currentVersion = articleVersions.find((version: KnowledgeVersion) => version.versionNumber === selected?.currentVersionNumber) ?? articleVersions[0];
  const articleFeedback = feedback.filter((item) => item.knowledgeArticle.id === selected?.id);

  const submitArticle = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const category = categories.find((item: KnowledgeCategory) => item.id === draft.categoryId);
    if (!activeWorkspace || !currentPerson || !category) return;
    const now = new Date().toISOString();
    try {
      const article = await createArticle.mutateAsync({ articleNumber: `KB-${Date.now().toString().slice(-6)}`, audienceKey: draft.audience, createdAndUpdatedAuditFields: JSON.stringify({ createdAt: now, updatedAt: now }), currentVersionNumber: 1, knowledgeCategory: { id: category.id, name1: category.name1 }, ownerPerson: { id: currentPerson.id, displayName: currentPerson.displayName }, publishedAndReviewDates: JSON.stringify({}), stateKey: 'Draft', summary: draft.summary, tags: draft.tags, title: draft.title, viewAndFeedbackCounts: JSON.stringify({ views: 0, helpful: 0, notHelpful: 0 }), workspace: { id: activeWorkspace.id, workspaceName: activeWorkspace.workspaceName } });
      await createVersion.mutateAsync({ immutableSnapshotLabel: `${article.articleNumber}-v1`, author: { id: currentPerson.id, displayName: currentPerson.displayName }, bodyContent: draft.body, changeNotes: 'Initial draft', knowledgeArticle: { id: article.id, articleNumber: article.articleNumber }, reviewComments: '', reviewer: { id: currentPerson.id, displayName: currentPerson.displayName }, stateKey: 'Draft', submittedReviewedAndPublishedTimestamps: JSON.stringify({}), summary: draft.summary, title: draft.title, versionNumber: 1, workspace: { id: activeWorkspace.id, workspaceName: activeWorkspace.workspaceName } });
      setDraft(emptyDraft); setCreateOpen(false); setSelectedId(article.id); toast.success('Knowledge draft created');
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Unable to create knowledge draft'); }
  };

  const transition = async (next: 'Review' | 'Published') => {
    if (!selected || !currentVersion || !currentPerson) return;
    if (next === 'Published' && !canPublish) { toast.error('Publishing requires a knowledge publisher or workspace manager role'); return; }
    const now = new Date().toISOString();
    const timestamps = splitMeta(currentVersion.submittedReviewedAndPublishedTimestamps);
    if (next === 'Review') timestamps.submittedAt = now;
    else { timestamps.reviewedAt = now; timestamps.publishedAt = now; }
    try {
      await updateVersion.mutateAsync({ id: currentVersion.id, changedFields: { stateKey: next, reviewer: { id: currentPerson.id, displayName: currentPerson.displayName }, submittedReviewedAndPublishedTimestamps: JSON.stringify(timestamps) } });
      await updateArticle.mutateAsync({ id: selected.id, changedFields: { stateKey: next, publishedAndReviewDates: JSON.stringify(next === 'Published' ? { reviewedAt: now, publishedAt: now } : { submittedAt: now }) } });
      toast.success(next === 'Review' ? 'Draft submitted for review' : 'Reviewed version published');
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Unable to update article'); }
  };

  const sendFeedback = async (helpful: boolean) => {
    if (!selected || !activeWorkspace || !currentPerson) return;
    try {
      await createFeedback.mutateAsync({ feedbackLabel: `${selected.articleNumber}-${currentPerson.id}-${Date.now()}`, comments: feedbackComment || undefined, createdAt: new Date().toISOString(), helpful, knowledgeArticle: { id: selected.id, articleNumber: selected.articleNumber }, knowledgeVersion: currentVersion ? { id: currentVersion.id, immutableSnapshotLabel: currentVersion.immutableSnapshotLabel } : undefined, person: { id: currentPerson.id, displayName: currentPerson.displayName }, workspace: { id: activeWorkspace.id, workspaceName: activeWorkspace.workspaceName } });
      setFeedbackComment(''); toast.success('Feedback recorded');
    } catch (error: unknown) { toast.error(error instanceof Error ? error.message : 'Unable to record feedback'); }
  };

  return <main className="flex-1 p-4 md:p-6"><div className="mx-auto max-w-7xl space-y-5">
    {!requesterMode && <InMemoryDataBanner show={HAS_IN_MEMORY_TABLES} message="This app uses draft tables for testing. Data entered won't be saved. Contact the app owner to enable storage." className="border-accent bg-accent text-accent-foreground" />}
    <div className="flex flex-wrap items-start justify-between gap-4"><div><h1 className="text-2xl font-semibold">Knowledge base</h1><p className="text-muted-foreground">{requesterMode ? 'Find published guidance for common service needs.' : 'Author, review, publish, and improve workspace guidance.'}</p></div>{!requesterMode && <Dialog open={createOpen} onOpenChange={setCreateOpen}><DialogTrigger asChild><Button><FilePlus2 className="size-4" />New article</Button></DialogTrigger><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><form onSubmit={submitArticle}><DialogHeader><DialogTitle>Create knowledge draft</DialogTitle><DialogDescription>Start version 1 in Draft state. Submit it for review when ready.</DialogDescription></DialogHeader><div className="grid gap-4 py-5"><div className="grid gap-2"><Label htmlFor="kb-title">Title</Label><Input id="kb-title" required value={draft.title} onChange={(event) => setDraft({ ...draft, title: event.target.value })} /></div><div className="grid gap-2"><Label htmlFor="kb-summary">Summary</Label><Textarea id="kb-summary" required value={draft.summary} onChange={(event) => setDraft({ ...draft, summary: event.target.value })} /></div><div className="grid gap-2"><Label htmlFor="kb-body">Article content</Label><Textarea id="kb-body" className="min-h-48" required value={draft.body} onChange={(event) => setDraft({ ...draft, body: event.target.value })} /></div><div className="grid gap-4 sm:grid-cols-2"><div className="grid gap-2"><Label>Category</Label><Select value={draft.categoryId || undefined} onValueChange={(value) => setDraft({ ...draft, categoryId: value })}><SelectTrigger><SelectValue placeholder="Select category" /></SelectTrigger><SelectContent>{categories.filter((item: KnowledgeCategory) => item.id).map((item: KnowledgeCategory) => <SelectItem key={item.id} value={item.id}>{item.name1}</SelectItem>)}</SelectContent></Select></div><div className="grid gap-2"><Label>Audience</Label><Select value={draft.audience} onValueChange={(value: KnowledgeArticleAudienceKey) => setDraft({ ...draft, audience: value })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="Requesters">Requesters</SelectItem><SelectItem value="Agents">Agents</SelectItem><SelectItem value="AllMembers">All members</SelectItem></SelectContent></Select></div></div><div className="grid gap-2"><Label htmlFor="kb-tags">Tags</Label><Input id="kb-tags" placeholder="vpn, access, remote work" value={draft.tags} onChange={(event) => setDraft({ ...draft, tags: event.target.value })} /></div></div><DialogFooter><Button type="submit" disabled={!draft.categoryId || createArticle.isPending}>Create draft</Button></DialogFooter></form></DialogContent></Dialog>}</div>
    <div className="grid gap-3 md:grid-cols-[1fr_220px]"><div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" /><Input className="pl-9" aria-label="Search knowledge" placeholder="Search titles, summaries, and tags" value={query} onChange={(event) => setQuery(event.target.value)} /></div><Select value={categoryId} onValueChange={setCategoryId}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{categories.filter((item: KnowledgeCategory) => item.id).map((item: KnowledgeCategory) => <SelectItem key={item.id} value={item.id}>{item.name1}</SelectItem>)}</SelectContent></Select></div>
    {isLoading ? <p aria-live="polite">Loading knowledge…</p> : visibleArticles.length === 0 ? <Empty className="rounded-lg border py-16"><EmptyHeader><EmptyTitle>No articles found</EmptyTitle><EmptyDescription>Try a different search or category.</EmptyDescription></EmptyHeader></Empty> : <div className="grid gap-5 lg:grid-cols-[340px_1fr]"><div className="space-y-3">{visibleArticles.map((article: KnowledgeArticle) => <button type="button" key={article.id} onClick={() => setSelectedId(article.id)} className={`w-full rounded-lg border p-4 text-left transition-colors ${selected?.id === article.id ? 'border-primary bg-accent text-accent-foreground' : 'bg-card text-card-foreground hover:bg-muted'}`}><div className="flex items-start justify-between gap-2"><p className="font-semibold">{article.title}</p><Badge variant={article.stateKey === 'Published' ? 'default' : 'secondary'}>{article.stateKey}</Badge></div><p className="mt-2 text-sm">{article.summary}</p><p className="mt-3 text-xs">{article.articleNumber} · v{article.currentVersionNumber}</p></button>)}</div>{selected && <Card><CardHeader><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="mb-2 flex flex-wrap gap-2"><Badge>{selected.knowledgeCategory.name1}</Badge><Badge variant="outline">{selected.audienceKey === 'AllMembers' ? 'All members' : selected.audienceKey}</Badge></div><CardTitle className="text-xl">{selected.title}</CardTitle><CardDescription>{selected.summary}</CardDescription></div>{!requesterMode && <div className="flex gap-2">{selected.stateKey === 'Draft' && <Button variant="outline" onClick={() => void transition('Review')}><Send className="size-4" />Submit review</Button>}{selected.stateKey === 'Review' && <Button onClick={() => void transition('Published')}><Check className="size-4" />Publish</Button>}</div>}</div></CardHeader><CardContent className="space-y-6"><Separator /><article className="whitespace-pre-wrap leading-7">{currentVersion?.bodyContent ?? 'No version content is available.'}</article><div className="flex flex-wrap gap-2">{selected.tags.split(',').map((tag: string) => tag.trim()).filter(Boolean).map((tag: string) => <Badge key={tag} variant="secondary">{tag}</Badge>)}</div><Separator /><div><h2 className="mb-3 flex items-center gap-2 font-semibold"><Clock3 className="size-4" />Version history</h2><div className="space-y-2">{articleVersions.map((version: KnowledgeVersion) => <div key={version.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-muted p-3 text-muted-foreground"><div><p className="font-medium">Version {version.versionNumber} · {version.title}</p><p className="text-sm">{version.changeNotes || 'No change notes'} · {version.author.displayName}</p></div><Badge variant={version.stateKey === 'Published' ? 'default' : 'secondary'}>{version.stateKey}</Badge></div>)}</div></div>{requesterMode && <div className="space-y-3 rounded-lg border p-4"><div><h2 className="font-semibold">Was this article helpful?</h2><p className="text-sm text-muted-foreground">{articleFeedback.filter((item) => item.helpful).length} helpful · {articleFeedback.filter((item) => !item.helpful).length} not helpful</p></div><Textarea placeholder="Optional feedback" value={feedbackComment} onChange={(event) => setFeedbackComment(event.target.value)} /><div className="flex gap-2"><Button onClick={() => void sendFeedback(true)}><ThumbsUp className="size-4" />Yes</Button><Button variant="outline" onClick={() => void sendFeedback(false)}><ThumbsDown className="size-4" />No</Button></div></div>}</CardContent></Card>}</div>}
  </div></main>;
}
