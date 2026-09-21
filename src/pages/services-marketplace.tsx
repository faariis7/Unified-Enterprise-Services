import { useMemo, useState, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, BookOpen, BriefcaseBusiness, Building2, CalendarDays, ChevronDown, ChevronRight, Clock3, CreditCard, ExternalLink, FileText, Info, Laptop, ListTodo, MapPin, Plane, RefreshCw, Search, ShieldCheck, Star, Users, Wrench, type LucideIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { useCatalogItemList } from '@/generated/hooks/use-catalog-item';
import { useCatalogItemApprovalPlanList } from '@/generated/hooks/use-catalog-item-approval-plan';
import { useCatalogItemAudienceList } from '@/generated/hooks/use-catalog-item-audience';
import { useCatalogItemFormAssignmentList } from '@/generated/hooks/use-catalog-item-form-assignment';
import { useKnowledgeArticleList } from '@/generated/hooks/use-knowledge-article';
import { useRequestApprovalList } from '@/generated/hooks/use-request-approval';
import { useRequestList } from '@/generated/hooks/use-request';
import { useRequestTaskList } from '@/generated/hooks/use-request-task';
import { useServiceCategoryList } from '@/generated/hooks/use-service-category';
import { useServiceList } from '@/generated/hooks/use-service';
import { useWorkspaceList } from '@/generated/hooks/use-workspace';
import type { CatalogItem } from '@/generated/models/catalog-item-model';
import type { KnowledgeArticle } from '@/generated/models/knowledge-article-model';
import type { Request } from '@/generated/models/request-model';
import type { RequestApproval } from '@/generated/models/request-approval-model';
import type { RequestTask } from '@/generated/models/request-task-model';
import type { Service } from '@/generated/models/service-model';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useM365CalendarActions, type CalendarAction } from '@/hooks/use-m365-calendar-actions';
import { useM365DueTasks, type M365DueTask } from '@/hooks/use-m365-due-tasks';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const favoriteStorageKey = 'esm.requester-favorite-services';
const businessAreas = [
  { code: 'ALL', name: 'All departments', searchTerms: [] },
  { code: 'IT', name: 'Information Technology', searchTerms: ['information technology', 'it'] },
  { code: 'CCD', name: 'Corporate Communications', searchTerms: ['corporate communications', 'communications', 'ccd'] },
  { code: 'FMD', name: 'Facility Management', searchTerms: ['facility management', 'facilities', 'facility', 'fmd'] },
  { code: 'SSD', name: 'Support Services', searchTerms: ['support services', 'ssd'] },
  { code: 'RTT', name: 'Rawabi Travel & Tourism', searchTerms: ['rawabi travel tourism', 'travel', 'tourism', 'rtt'] },
  { code: 'GR', name: 'Government Affairs', searchTerms: ['government affairs', 'government relations', 'gr'] },
  { code: 'RVOS', name: 'Rawabi Vallianz Offshore Services', searchTerms: ['rawabi vallianz offshore services', 'offshore', 'marine', 'maritime', 'rvos'] },
] as const;
type BusinessAreaCode = (typeof businessAreas)[number]['code'];
type DiscoveryTab = 'popular' | 'recent' | 'recommended' | 'business-areas' | 'results';


function readFavorites(): string[] {
  try {
    const value = JSON.parse(window.localStorage.getItem(favoriteStorageKey) ?? '[]') as unknown;
    return Array.isArray(value) ? value.filter((item: unknown): item is string => typeof item === 'string') : [];
  } catch {
    return [];
  }
}

function normalizeSearchText(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function serviceIcon(item: CatalogItem): LucideIcon {
  const text = `${item.itemName} ${item.shortDescription}`.toLowerCase();
  if (text.includes('laptop') || text.includes('computer') || text.includes('vpn') || text.includes('access')) return Laptop;
  if (text.includes('flight') || text.includes('travel') || text.includes('visa')) return Plane;
  if (text.includes('business card')) return CreditCard;
  if (text.includes('employment') || text.includes('letter') || text.includes('document')) return FileText;
  if (text.includes('office') || text.includes('facility') || text.includes('move')) return Building2;
  if (text.includes('maintenance') || text.includes('repair')) return Wrench;
  if (text.includes('location') || text.includes('site')) return MapPin;
  return BriefcaseBusiness;
}

function friendlyStatus(status: Request['statusKey']): string {
  if (status === 'Resolved' || status === 'Closed') return 'Completed';
  if (status === 'Pending') return 'Awaiting your action';
  if (status === 'New' || status === 'Assigned' || status === 'InProgress') return 'In progress';
  return 'Cancelled';
}

export default function ServicesMarketplacePage() {
  const { currentPerson, availableWorkspaces, getWorkspaceRole } = useWorkspaceContext();
  const { data: approvalPlans = [] } = useCatalogItemApprovalPlanList();
  const { data: audiences = [] } = useCatalogItemAudienceList();
  const { data: formAssignments = [] } = useCatalogItemFormAssignmentList();
  const { data: workspaces = [] } = useWorkspaceList();
  const { data: categories = [] } = useServiceCategoryList();
  const { data: services = [] } = useServiceList();
  const { data: items = [] } = useCatalogItemList();
  const { data: knowledgeArticles = [] } = useKnowledgeArticleList({ filter: "stateKey eq 'Published'", orderBy: ['title asc'] });
  const ownRequestFilter = currentPerson ? `(requester/id eq '${currentPerson.id}' or requestedFor/id eq '${currentPerson.id}')` : 'id eq null';

  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);
  const { data: requests = [] } = useRequestList({ filter: ownRequestFilter, orderBy: ['updatedAt desc'] });
  const approvalFilter = currentPerson ? `approverPersonId/id eq '${currentPerson.id}'` : 'id eq null';
  const { data: approvals = [] } = useRequestApprovalList({ filter: approvalFilter, orderBy: ['createdAt desc'] });
  const [search, setSearch] = useState('');
  const [activeBusinessArea, setActiveBusinessArea] = useState<BusinessAreaCode>('ALL');
  const [activeTab, setActiveTab] = useState<DiscoveryTab>('popular');
  const [favoriteIds, setFavoriteIds] = useState<string[]>(readFavorites);
  const requestIds = useMemo(() => new Set(requests.map((request: Request) => request.id)), [requests]);
  const { data: requestTasks = [] } = useRequestTaskList();
  const openRequestTasks = useMemo(() => requestTasks.filter((task: RequestTask) => requestIds.has(task.requestId.id) && !['Completed', 'Cancelled'].includes(task.statusIdKey)), [requestIds, requestTasks]);
  const calendarActions = useM365CalendarActions();
  const m365Tasks = useM365DueTasks();

  const workspaceById = useMemo(() => new Map(workspaces.map((workspace) => [workspace.id, workspace])), [workspaces]);
  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);

  const availableWorkspaceIds = useMemo(() => new Set(availableWorkspaces.map((workspace) => workspace.id)), [availableWorkspaces]);
  const activeServices = useMemo(() => services.filter((service: Service) => service.statusKey === 'Active' && service.requesterEligible && availableWorkspaceIds.has(service.workspace.id)), [availableWorkspaceIds, services]);
  const serviceById = useMemo(() => new Map(activeServices.map((service: Service) => [service.id, service])), [activeServices]);
  const eligibleItemIds = useMemo(() => new Set(audiences.filter((audience) => {
    if (!currentPerson || audience.statusKey !== 'Active' || !audience.isEligible || !availableWorkspaceIds.has(audience.workspace.id)) return false;
    if (audience.audienceTypeKey === 'AllMembers') return true;
    if (audience.audienceTypeKey === 'Person') return audience.audienceReference === currentPerson.id;
    if (audience.audienceTypeKey === 'Department') return audience.audienceReference === currentPerson.departmentCode;
    if (audience.audienceTypeKey === 'Site') return audience.audienceReference === currentPerson.siteCode;
    if (audience.audienceTypeKey === 'Role') return audience.audienceReference.toLowerCase() === getWorkspaceRole(audience.workspace.id).toLowerCase();
    return false;
  }).map((audience) => audience.catalogItem.id)), [audiences, availableWorkspaceIds, currentPerson, getWorkspaceRole]);
  const publishedItems = useMemo(() => items.filter((item: CatalogItem) => item.statusKey === 'Published' && item.requesterEligible && availableWorkspaceIds.has(item.workspace.id) && eligibleItemIds.has(item.id) && serviceById.has(item.service.id)), [availableWorkspaceIds, eligibleItemIds, items, serviceById]);
  const itemByCode = useMemo(() => new Map(publishedItems.map((item: CatalogItem) => [item.itemCode, item])), [publishedItems]);
  const requestCounts = useMemo(() => requests.reduce((counts: Map<string, number>, request: Request) => counts.set(request.catalogItemCode, (counts.get(request.catalogItemCode) ?? 0) + 1), new Map<string, number>()), [requests]);
  const popularItems = useMemo(() => [...publishedItems].sort((first: CatalogItem, second: CatalogItem) => (requestCounts.get(second.itemCode) ?? 0) - (requestCounts.get(first.itemCode) ?? 0)).slice(0, 8), [publishedItems, requestCounts]);
  const recentItems = useMemo(() => Array.from(new Set(requests.map((request: Request) => request.catalogItemCode))).map((code: string) => itemByCode.get(code)).filter((item: CatalogItem | undefined): item is CatalogItem => Boolean(item)).slice(0, 8), [itemByCode, requests]);
  const favoriteItems = useMemo(() => favoriteIds.map((id: string) => publishedItems.find((item: CatalogItem) => item.id === id)).filter((item: CatalogItem | undefined): item is CatalogItem => Boolean(item)).slice(0, 8), [favoriteIds, publishedItems]);
  const recommendedItems = useMemo(() => publishedItems.filter((item: CatalogItem) => !recentItems.some((recent: CatalogItem) => recent.id === item.id)).slice(0, 8), [publishedItems, recentItems]);
  const filteredItems = useMemo(() => publishedItems.filter((item: CatalogItem) => {
    const service = serviceById.get(item.service.id);
    const category = service ? categoryById.get(service.serviceCategory.id) : undefined;
    const workspace = workspaceById.get(item.workspace.id);
    const categoryText = normalizeSearchText(`${category?.name1 ?? ''} ${workspace?.workspaceName ?? ''} ${workspace?.workspaceKey ?? ''}`);
    const query = search.trim().toLowerCase();
    const selectedBusinessArea = businessAreas.find((area) => area.code === activeBusinessArea);
    const matchesBusinessArea = activeBusinessArea === 'ALL' || selectedBusinessArea?.searchTerms.some((term: string) => categoryText.includes(normalizeSearchText(term))) === true;
    return matchesBusinessArea && (!query || `${item.itemName} ${item.shortDescription} ${service?.serviceName ?? ''} ${categoryText}`.toLowerCase().includes(query));
  }), [activeBusinessArea, categoryById, publishedItems, search, serviceById, workspaceById]);

  const defaultWorkspace = availableWorkspaces[0];
  const portalBase = defaultWorkspace ? `/w/${defaultWorkspace.workspaceKey.toLowerCase()}/portal` : '/';
  const pendingApprovalItems = approvals.filter((approval: RequestApproval) => approval.statusKey === 'Pending');
  const awaitingActionRequests = requests.filter((request: Request) => request.statusKey === 'Pending');
  const activeRequests = requests.filter((request: Request) => ['New', 'Assigned', 'InProgress'].includes(request.statusKey));

  const serviceSearchIndex = useMemo(() => publishedItems.map((item: CatalogItem) => {
    const service = serviceById.get(item.service.id);
    const category = service ? categoryById.get(service.serviceCategory.id) : undefined;
    const workspace = workspaceById.get(item.workspace.id);
    return {
      item,
      name: normalizeSearchText(item.itemName),
      searchableText: normalizeSearchText(`${item.itemName} ${item.shortDescription} ${item.itemCode} ${service?.serviceName ?? ''} ${category?.name1 ?? ''} ${workspace?.workspaceName ?? ''}`),
    };
  }), [categoryById, publishedItems, serviceById, workspaceById]);
  const liveSearchResults = useMemo(() => {
    const terms = normalizeSearchText(search).split(' ').filter(Boolean);
    if (!terms.length) return [];
    return serviceSearchIndex
      .map((entry: { item: CatalogItem; name: string; searchableText: string }) => ({
        item: entry.item,
        score: terms.reduce((total: number, term: string) => total + (entry.name.startsWith(term) ? 4 : entry.name.includes(term) ? 3 : entry.searchableText.includes(term) ? 1 : 0), 0),
        matches: terms.every((term: string) => entry.searchableText.includes(term)),
      }))
      .filter((entry: { item: CatalogItem; score: number; matches: boolean }) => entry.matches)
      .sort((first: { score: number }, second: { score: number }) => second.score - first.score)
      .map((entry: { item: CatalogItem }) => entry.item);
  }, [search, serviceSearchIndex]);
  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    const nextSearch = event.target.value;
    setSearch(nextSearch);
    if (nextSearch.trim()) setActiveTab('results');
  };
  const toggleFavorite = (itemId: string) => setFavoriteIds((current: string[]) => {
    const next = current.includes(itemId) ? current.filter((id: string) => id !== itemId) : [...current, itemId];
    window.localStorage.setItem(favoriteStorageKey, JSON.stringify(next));
    return next;
  });

  const railProps = { workspaceById, favoriteIds, onToggleFavorite: toggleFavorite, onOpenService: setSelectedItem };
  const relatedArticles = useMemo(() => {
    if (!selectedItem) return [];
    const service = serviceById.get(selectedItem.service.id);
    const category = service ? categoryById.get(service.serviceCategory.id) : undefined;
    const terms = normalizeSearchText(`${selectedItem.itemName} ${selectedItem.shortDescription} ${service?.serviceName ?? ''} ${category?.name1 ?? ''}`)
      .split(' ')
      .filter((term: string) => term.length > 2);
    return knowledgeArticles
      .filter((article: KnowledgeArticle) => article.stateKey === 'Published' && ['Requesters', 'AllMembers'].includes(article.audienceKey) && article.workspace.id === selectedItem.workspace.id)
      .map((article: KnowledgeArticle) => {
        const articleText = normalizeSearchText(`${article.title} ${article.summary} ${article.tags} ${article.knowledgeCategory.name1}`);
        return { article, score: terms.reduce((score: number, term: string) => score + (articleText.includes(term) ? 1 : 0), 0) };
      })
      .filter((entry: { article: KnowledgeArticle; score: number }) => entry.score > 0)
      .sort((first: { score: number }, second: { score: number }) => second.score - first.score)
      .slice(0, 3)
      .map((entry: { article: KnowledgeArticle }) => entry.article);
  }, [categoryById, knowledgeArticles, selectedItem, serviceById]);
  return (
    <main className="flex-1 bg-background text-foreground">
      <section className="relative bg-background">
        <div className="rawabi-pattern absolute inset-y-0 right-0 hidden w-1/2 overflow-hidden md:block" aria-hidden="true" />
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45, ease: 'easeOut' as const }} className="relative z-10 mx-auto max-w-7xl px-5 py-12 md:px-10 md:py-16">
          <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1.8fr)_minmax(19rem,1fr)] lg:gap-10">
            <div className="min-w-0 py-2 lg:py-5">
              <p className="inline-flex items-center gap-3 text-sm font-semibold text-primary"><span className="h-px w-8 bg-accent" aria-hidden="true" />Powered by People</p>
              <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-tight text-primary md:text-6xl">What do you need today?</h1>
              <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground md:text-lg">One place to access the services that keep our people and businesses moving.</p>
              <div className="relative mt-8 max-w-4xl">
                <Search className="absolute left-6 top-8 z-10 size-6 -translate-y-1/2 text-primary md:top-10" aria-hidden="true" />
                <Input aria-label="Search indexed services" value={search} onChange={handleSearchChange} placeholder="Start typing to find a service..." autoComplete="off" className="h-16 rounded-lg border-input bg-card pl-16 pr-6 text-base text-card-foreground shadow-sm placeholder:text-muted-foreground focus-visible:ring-accent md:h-20 md:text-lg" />
                {search.trim() && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-[min(32rem,60vh)] overflow-y-auto overscroll-contain rounded-lg border border-border bg-popover text-popover-foreground shadow-lg" role="region" aria-label="Live service search results" aria-live="polite">
                    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-popover px-5 py-3 text-sm"><span className="font-semibold">Services</span><span className="text-muted-foreground">{liveSearchResults.length} found</span></div>
                    {liveSearchResults.map((item: CatalogItem) => {
                      const Icon = serviceIcon(item);
                      return (
                        <button key={item.id} type="button" onClick={() => setSelectedItem(item)} className="flex w-full items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-muted focus-visible:bg-muted focus-visible:outline-none">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground"><Icon className="size-5" aria-hidden="true" /></span>
                          <span className="min-w-0 flex-1"><span className="block truncate text-sm font-semibold">{item.itemName}</span><span className="block truncate text-xs text-muted-foreground">{item.shortDescription}</span></span>
                          <span className="hidden items-center gap-1 text-xs text-muted-foreground sm:flex"><Clock3 className="size-3.5" />{item.serviceTargetHours}h</span><ChevronRight className="size-4 shrink-0" />
                        </button>
                      );
                    })}
                    {liveSearchResults.length === 0 && <div className="px-5 py-6"><p className="font-semibold">No matching services</p><p className="mt-1 text-sm text-muted-foreground">Try a service name, category, or a simpler phrase.</p></div>}
                  </div>
                )}
                <p className="mt-3 text-sm text-muted-foreground">Services appear instantly as you type—no search button needed.</p>
              </div>
            </div>
            <RequesterActionCenter portalBase={portalBase} awaitingActionRequests={awaitingActionRequests} pendingApprovals={pendingApprovalItems} requestTasks={openRequestTasks} calendarActions={calendarActions.data} calendarLoading={calendarActions.isFetching} calendarError={calendarActions.isError} onRefreshCalendar={calendarActions.refetch} m365Tasks={m365Tasks.data ?? []} m365TasksLoading={m365Tasks.isFetching} m365TasksError={m365Tasks.isError} onRefreshM365Tasks={m365Tasks.refetch} />
          </div>
        </motion.div>
      </section>

      <div className="mx-auto max-w-7xl space-y-16 px-5 py-10 md:px-10 md:py-12">
        {favoriteItems.length > 0 && (
          <section aria-labelledby="favorites-heading">
            <SectionHeading id="favorites-heading" title="Favorite services" action="Services you saved for faster access." />
            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
              {favoriteItems.map((item: CatalogItem) => <QuickService key={item.id} item={item} onOpenService={setSelectedItem} />)}
            </div>
          </section>
        )}

        <section id="discovery" aria-labelledby="discovery-heading" className="min-w-0 scroll-mt-24">
          <SectionHeading id="discovery-heading" title="Discover services" action="Browse what is popular, familiar, or relevant to you." />
          <Tabs value={activeTab} onValueChange={(value: string) => setActiveTab(value as DiscoveryTab)} className="mt-7 gap-7">
            <div className="overflow-x-auto pb-1">
              <TabsList aria-label="Service discovery views" className="h-11 min-w-max rounded-full bg-muted p-1">
                <TabsTrigger value="popular" className="rounded-full px-5">Popular</TabsTrigger>
                <TabsTrigger value="recent" className="rounded-full px-5">Recently used</TabsTrigger>
                <TabsTrigger value="recommended" className="rounded-full px-5">Recommended</TabsTrigger>
                <TabsTrigger value="business-areas" className="rounded-full px-5">Business areas</TabsTrigger>
                {search.trim() && <TabsTrigger value="results" className="rounded-full px-5">Results</TabsTrigger>}
              </TabsList>
            </div>
            <TabsContent value="popular"><ServiceRail items={popularItems} emptyTitle="No popular services yet" {...railProps} /></TabsContent>
            <TabsContent value="recent"><ServiceRail items={recentItems} emptyTitle="No recently used services" emptyDescription="Services you request will appear here for quick re-ordering." reRequest {...railProps} /></TabsContent>
            <TabsContent value="recommended"><ServiceRail items={recommendedItems} emptyTitle="No recommendations yet" emptyDescription="Recommendations will appear as your service history grows." {...railProps} /></TabsContent>
            <TabsContent value="business-areas">
              <div className="flex flex-wrap gap-2 pb-3" aria-label="Business area filters">
                {businessAreas.map((area: (typeof businessAreas)[number]) => <Button key={area.code} type="button" size="sm" variant={activeBusinessArea === area.code ? 'default' : 'secondary'} className="h-auto rounded-full px-4 py-2" title={area.name} aria-label={area.name} onClick={() => setActiveBusinessArea(area.code)}>{area.code === 'ALL' ? 'All' : area.code}</Button>)}
              </div>
              <ServiceRail items={filteredItems.slice(0, 10)} emptyTitle="No services in this business area" {...railProps} />
            </TabsContent>
            <TabsContent value="results">
              <p className="mb-5 text-sm text-muted-foreground">{search.trim() ? `${liveSearchResults.length} indexed services match “${search.trim()}”` : 'Start typing above to find a service.'}</p>
              <ServiceRail items={liveSearchResults} emptyTitle="No matching services" emptyDescription="Try a service name, category, or a simpler phrase." {...railProps} />
            </TabsContent>
          </Tabs>
        </section>
        <ServicePreviewDialog item={selectedItem} onOpenChange={(open: boolean) => { if (!open) setSelectedItem(null); }} service={selectedItem ? serviceById.get(selectedItem.service.id) : undefined} categoryName={selectedItem ? categoryById.get(serviceById.get(selectedItem.service.id)?.serviceCategory.id ?? '')?.name1 : undefined} workspaceName={selectedItem ? workspaceById.get(selectedItem.workspace.id)?.workspaceName : undefined} workspaceCode={selectedItem ? workspaceById.get(selectedItem.workspace.id)?.workspaceKey.toLowerCase() ?? '' : ''} approvalRequired={selectedItem ? approvalPlans.some((plan) => plan.catalogItem.id === selectedItem.id && plan.statusKey === 'Active') : false} audienceLabels={selectedItem ? audiences.filter((audience) => audience.catalogItem.id === selectedItem.id && audience.statusKey === 'Active' && audience.isEligible).map((audience) => audience.audienceName || (audience.audienceTypeKey === 'AllMembers' ? 'All employees' : audience.audienceReference)) : []} canProceed={selectedItem ? formAssignments.some((assignment) => assignment.catalogItem.id === selectedItem.id && assignment.statusKey === 'Active' && assignment.isDefault) : false} relatedArticles={relatedArticles} popularItems={popularItems} />
      </div>
    </main>
  );
}

function SectionHeading({ id, title, action }: { id: string; title: string; action: string }) {
  return <div className="max-w-2xl"><h2 id={id} className="text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2><p className="mt-2 text-sm leading-6 text-muted-foreground">{action}</p></div>;
}
function RequesterActionCenter({ portalBase, awaitingActionRequests, pendingApprovals, requestTasks, calendarActions, calendarLoading, calendarError, onRefreshCalendar, m365Tasks, m365TasksLoading, m365TasksError, onRefreshM365Tasks }: { portalBase: string; awaitingActionRequests: Request[]; pendingApprovals: RequestApproval[]; requestTasks: RequestTask[]; calendarActions: CalendarAction[]; calendarLoading: boolean; calendarError: boolean; onRefreshCalendar: () => Promise<unknown>; m365Tasks: M365DueTask[]; m365TasksLoading: boolean; m365TasksError: boolean; onRefreshM365Tasks: () => Promise<unknown> }) {
  const actions = [
    { label: 'Awaiting your reply', count: awaitingActionRequests.length, description: 'Requests that need your input', icon: Info, to: `${portalBase}/my-requests` },
    { label: 'Pending approvals', count: pendingApprovals.length, description: 'Decisions waiting for you', icon: ShieldCheck, to: `${portalBase}/my-approvals` },
    { label: 'Open request tasks', count: requestTasks.length, description: 'Service tasks assigned to you', icon: ListTodo, to: `${portalBase}/my-requests` },
  ].filter((action: { count: number }) => action.count > 0);
  const requiredActionCount = actions.reduce((total: number, action: { count: number }) => total + action.count, 0) + m365Tasks.length + calendarActions.length;
  const hasContent = actions.length > 0 || m365Tasks.length > 0 || calendarActions.length > 0;
  const formatEventTime = (event: CalendarAction) => new Intl.DateTimeFormat(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' }).format(event.startsAt);
  const formatTaskDue = (task: M365DueTask) => {
    const due = new Date(task.dueDate);
    return Number.isNaN(due.getTime()) ? 'Due soon' : new Intl.DateTimeFormat(undefined, { weekday: 'short', hour: 'numeric', minute: '2-digit' }).format(due);
  };
  return (
    <section aria-labelledby="action-center-heading" className="rounded-xl bg-muted p-5 text-foreground sm:p-6 lg:mt-1">
      <div className="flex items-start justify-between gap-4">
        <div><p className="text-xs font-semibold text-muted-foreground">Your priorities</p><h2 id="action-center-heading" className="mt-1 text-2xl font-semibold tracking-tight text-foreground">Action center</h2><p className="mt-1 text-sm leading-5 text-muted-foreground">{requiredActionCount > 0 ? `${requiredActionCount} ${requiredActionCount === 1 ? 'item needs' : 'items need'} your attention.` : 'You’re all caught up.'}</p></div>
        <Button variant="ghost" size="icon-sm" aria-label="Refresh calendar and tasks" onClick={() => { void Promise.all([onRefreshCalendar(), onRefreshM365Tasks()]); }}><RefreshCw /></Button>
      </div>
      {hasContent && (
        <div className="mt-5 grid gap-2">
          {actions.map(({ label, count, description, icon: Icon, to }: { label: string; count: number; description: string; icon: LucideIcon; to: string }) => (
            <Link key={label} to={to} className="group flex min-h-16 min-w-0 items-center gap-3 rounded-lg bg-card px-3.5 py-3 text-card-foreground shadow-sm transition-all hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-accent text-accent-foreground"><Icon className="size-4.5" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="flex min-w-0 items-start justify-between gap-3"><span className="min-w-0 whitespace-normal break-words text-sm font-semibold leading-5 text-foreground">{label}</span><span className="shrink-0 text-xl font-semibold tabular-nums text-foreground">{count}</span></span><span className="mt-0.5 block whitespace-normal break-words text-xs leading-4 text-muted-foreground">{description}</span></span><ChevronRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" /></Link>
          ))}
          {Array.from(m365Tasks.reduce((groups: Map<string, M365DueTask[]>, task: M365DueTask) => {
            const source = task.source.trim() || 'Microsoft 365';
            groups.set(source, [...(groups.get(source) ?? []), task]);
            return groups;
          }, new Map<string, M365DueTask[]>())).map(([source, tasks]: [string, M365DueTask[]]) => (
            <ExternalTaskGroup key={source} source={source} tasks={tasks} formatTaskDue={formatTaskDue} />
          ))}
          {calendarActions.slice(0, 3).map((event: CalendarAction) => (
            <div key={event.id} className="flex min-h-16 min-w-0 items-center gap-3 rounded-lg bg-card px-3.5 py-3 text-card-foreground shadow-sm"><span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground"><CalendarDays className="size-4.5" aria-hidden="true" /></span><span className="min-w-0 flex-1"><span className="block whitespace-normal break-words text-sm font-semibold leading-5">{event.title}</span><span className="mt-0.5 block whitespace-normal break-words text-xs leading-4 text-muted-foreground">{formatEventTime(event)}{event.location ? ` · ${event.location}` : ''}</span></span></div>
          ))}
        </div>
      )}
      {(calendarLoading || m365TasksLoading) && <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground" role="status"><RefreshCw className="size-3.5 animate-spin" aria-hidden="true" />Checking Outlook and Microsoft 365 tasks…</div>}
      {!hasContent && !calendarLoading && !m365TasksLoading && !calendarError && !m365TasksError && (
        <div className="mt-5 rounded-lg bg-card px-4 py-5 text-card-foreground shadow-sm"><p className="text-sm font-semibold">Nothing needs your attention</p><p className="mt-1 text-xs text-muted-foreground">Continue exploring services whenever you’re ready.</p></div>
      )}
      {(calendarError || m365TasksError) && <div className="mt-3 flex min-w-0 flex-wrap items-center justify-between gap-3 rounded-lg bg-card px-3 py-2 text-card-foreground"><p className="min-w-0 flex-1 whitespace-normal break-words text-xs leading-4 text-muted-foreground">{hasContent ? 'Some Microsoft 365 actions could not be loaded.' : 'Microsoft 365 actions are unavailable. Check the connection and try again.'}</p><Button className="shrink-0" variant="ghost" size="sm" onClick={() => { void Promise.all([onRefreshCalendar(), onRefreshM365Tasks()]); }}>Retry</Button></div>}
    </section>
  );
}

function ExternalTaskGroup({ source, tasks, formatTaskDue }: { source: string; tasks: M365DueTask[]; formatTaskDue: (task: M365DueTask) => string }) {
  const [open, setOpen] = useState(false);
  const firstTask = tasks[0];
  if (!firstTask) return null;
  const remainingCount = tasks.length - 1;
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg bg-card text-card-foreground shadow-sm">
      <div className="flex min-w-0 items-center gap-3 px-3.5 py-3">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground"><ListTodo className="size-4.5" aria-hidden="true" /></span>
        <ExternalTaskLink task={firstTask} dueLabel={formatTaskDue(firstTask)} />
        {remainingCount > 0 && (
          <CollapsibleTrigger asChild>
            <Button type="button" variant="ghost" size="sm" className="h-auto shrink-0 gap-1 px-2 py-1" aria-label={`${open ? 'Collapse' : 'Expand'} ${source} tasks`}>
              <span>{open ? 'Less' : `+${remainingCount} more`}</span><ChevronDown className={`size-4 transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
            </Button>
          </CollapsibleTrigger>
        )}
      </div>
      {remainingCount > 0 && (
        <CollapsibleContent>
          <div className="space-y-1 border-t border-border px-3.5 py-2">
            {tasks.slice(1).map((task: M365DueTask, index: number) => <ExternalTaskLink key={`${task.title}-${task.dueDate}-${index}`} task={task} dueLabel={formatTaskDue(task)} compact />)}
          </div>
        </CollapsibleContent>
      )}
    </Collapsible>
  );
}

function ExternalTaskLink({ task, dueLabel, compact = false }: { task: M365DueTask; dueLabel: string; compact?: boolean }) {
  const content = <><span className="block whitespace-normal break-words text-sm font-semibold leading-5">{task.title}</span><span className="mt-0.5 block whitespace-normal break-words text-xs leading-4 text-muted-foreground">{task.source} · {dueLabel}</span></>;
  const className = `min-w-0 flex-1 rounded-md text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${compact ? 'block px-2 py-2 hover:bg-muted' : ''}`;
  if (!task.webUrl) return <div className={className}>{content}</div>;
  return <a href={task.webUrl} target="_blank" rel="noopener noreferrer" className={className} aria-label={`Open ${task.title} in ${task.source}`}>{content}<ExternalLink className="ml-1 inline size-3.5 text-muted-foreground" aria-hidden="true" /></a>;
}


function QuickService({ item, onOpenService }: { item: CatalogItem; onOpenService: (item: CatalogItem) => void }) {
  const Icon = serviceIcon(item);
  return <button type="button" onClick={() => onOpenService(item)} className="group flex min-h-28 flex-col items-start justify-between gap-3 rounded-lg bg-card p-4 text-left text-card-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="flex size-10 items-center justify-center rounded-md bg-secondary text-secondary-foreground"><Icon className="size-5" aria-hidden="true" /></span><span className="flex w-full items-end justify-between gap-2"><span className="line-clamp-2 text-sm font-semibold leading-snug text-primary">{item.itemName}</span><ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" /></span></button>;
}

function ServiceRail({ items, workspaceById, favoriteIds, onToggleFavorite, onOpenService, reRequest = false, emptyTitle, emptyDescription }: { items: CatalogItem[]; workspaceById: Map<string, { workspaceKey: string }>; favoriteIds: string[]; onToggleFavorite: (itemId: string) => void; onOpenService: (item: CatalogItem) => void; reRequest?: boolean; emptyTitle: string; emptyDescription?: string }) {
  if (!items.length) return <EmptyState title={emptyTitle} description={emptyDescription ?? 'Check back when more services become available.'} />;
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">{items.map((item: CatalogItem) => <ServiceTile key={item.id} item={item} workspaceCode={workspaceById.get(item.workspace.id)?.workspaceKey.toLowerCase() ?? ''} saved={favoriteIds.includes(item.id)} onToggleFavorite={onToggleFavorite} onOpenService={onOpenService} reRequest={reRequest} />)}</div>;
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return <div className="rounded-lg bg-muted p-8 text-muted-foreground"><p className="font-semibold text-foreground">{title}</p><p className="mt-2 text-sm">{description}</p></div>;
}

function ServiceTile({ item, saved, onToggleFavorite, onOpenService, reRequest = false }: { item: CatalogItem; workspaceCode: string; saved: boolean; onToggleFavorite: (itemId: string) => void; onOpenService: (item: CatalogItem) => void; reRequest?: boolean }) {
  const Icon = serviceIcon(item);
  return <article className="flex min-h-44 flex-col rounded-lg bg-card p-4 text-card-foreground shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"><div className="flex items-start justify-between gap-3"><span className="flex size-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground"><Icon className="size-4.5" aria-hidden="true" /></span><Button type="button" variant="ghost" size="icon-sm" aria-label={saved ? `Remove ${item.itemName} from favorites` : `Add ${item.itemName} to favorites`} aria-pressed={saved} onClick={() => onToggleFavorite(item.id)}><Star className={saved ? 'fill-current text-accent-foreground' : ''} /></Button></div><button type="button" onClick={() => onOpenService(item)} className="text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><h3 className="mt-3 line-clamp-1 text-sm font-semibold text-primary">{item.itemName}</h3><p className="mt-1 line-clamp-1 text-xs leading-5 text-muted-foreground">{item.shortDescription}</p></button><div className="mt-auto flex items-center justify-between gap-2 pt-4"><span className="flex items-center gap-1 text-xs text-muted-foreground"><Clock3 className="size-3.5" />{item.serviceTargetHours}h</span><Button type="button" size="sm" className="h-8 bg-accent px-3 text-accent-foreground hover:bg-accent" onClick={() => onOpenService(item)}>{reRequest ? 'Again' : 'Request'} <ArrowRight className="size-3.5" /></Button></div></article>;
}

function formatServiceDuration(hours: number): string {
  if (hours < 24) return `${hours} business ${hours === 1 ? 'hour' : 'hours'}`;
  const days = Math.ceil(hours / 8);
  return `${days} business ${days === 1 ? 'day' : 'days'}`;
}



function ServicePreviewDialog({ item, onOpenChange, service, categoryName, workspaceName, workspaceCode, approvalRequired, audienceLabels, canProceed, relatedArticles }: { item: CatalogItem | null; onOpenChange: (open: boolean) => void; service?: Service; categoryName?: string; workspaceName?: string; workspaceCode: string; approvalRequired: boolean; audienceLabels: string[]; canProceed: boolean; relatedArticles: KnowledgeArticle[]; popularItems: CatalogItem[] }) {
  if (!item) return null;
  const Icon = serviceIcon(item);
  const eligibility = Array.from(new Set(audienceLabels))[0] ?? 'All employees';
  const duration = formatServiceDuration(item.serviceTargetHours);
  const description = service?.description || item.shortDescription;
  const proceedPath = `/w/${workspaceCode}/portal/request/${item.itemCode}`;
  const closeDialog = () => onOpenChange(false);
  const facts = [{ label: 'Expected time', value: duration }, { label: 'Available to', value: eligibility }, { label: 'Approval', value: approvalRequired ? 'Required' : 'Not required' }];

  return (
    <Dialog open={Boolean(item)} onOpenChange={(open: boolean) => { if (!open) closeDialog(); }}>
      <DialogContent className="w-[calc(100%-1.5rem)] gap-0 overflow-hidden p-0 sm:max-w-lg">
        <motion.div initial={{ opacity: 0, y: -24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.28, ease: 'easeOut' as const }}>
          <div className="bg-card px-6 py-7 text-card-foreground sm:px-8 sm:py-9">
            <ServiceIcon icon={Icon} />
            <p className="mt-6 text-xs font-semibold text-muted-foreground">{categoryName ?? 'Employee service'}</p>
            <DialogTitle className="mt-2 text-3xl leading-tight tracking-tight text-primary">{item.itemName}</DialogTitle>
            <DialogDescription className="mt-4 line-clamp-3 text-sm leading-6">{description}</DialogDescription>
            <div className="mt-7 space-y-1 rounded-lg bg-muted px-5 py-2">
              {facts.map((fact: { label: string; value: string }) => <PlainFact key={fact.label} {...fact} />)}
            </div>
            <p className="mt-5 text-xs text-muted-foreground">Provided by {workspaceName ?? 'Rawabi'}</p>
            <PopupFooter articles={relatedArticles} workspaceCode={workspaceCode} onClose={closeDialog} canProceed={canProceed} proceedPath={proceedPath} />
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
}

function ServiceIcon({ icon: Icon }: { icon: LucideIcon }) {
  return <span className="flex size-12 shrink-0 items-center justify-center rounded-md bg-secondary text-secondary-foreground"><Icon className="size-5" aria-hidden="true" /></span>;
}

function PlainFact({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-5 border-b border-border py-3 last:border-b-0"><p className="text-xs text-muted-foreground">{label}</p><p className="text-right text-sm font-semibold text-foreground">{value}</p></div>;
}

function PopupFooter({ articles, workspaceCode, onClose, canProceed, proceedPath }: { articles: KnowledgeArticle[]; workspaceCode: string; onClose: () => void; canProceed: boolean; proceedPath: string }) {
  return <div className="mt-6 space-y-5 border-t border-border pt-5"><KnowledgeLinks articles={articles} workspaceCode={workspaceCode} onNavigate={onClose} /><PreviewActions canProceed={canProceed} proceedPath={proceedPath} onClose={onClose} /></div>;
}

function KnowledgeLinks({ articles, workspaceCode, onNavigate }: { articles: KnowledgeArticle[]; workspaceCode: string; onNavigate: () => void }) {
  if (!articles.length) return <p className="text-xs text-muted-foreground">Everything needed is collected in the request form.</p>;
  return <div><p className="mb-2 text-xs font-semibold text-foreground">Helpful before you start</p><div className="space-y-2">{articles.slice(0, 2).map((article: KnowledgeArticle) => <Link key={article.id} to={`/w/${workspaceCode}/portal/knowledge`} onClick={onNavigate} className="flex items-center gap-2 text-xs font-semibold text-foreground hover:underline"><BookOpen className="size-3.5 shrink-0" /><span className="truncate">{article.title}</span></Link>)}</div></div>;
}

function PreviewActions({ canProceed, proceedPath, onClose }: { canProceed: boolean; proceedPath: string; onClose: () => void }) {
  return <div className="flex items-center justify-end gap-2"><Button type="button" variant="ghost" size="sm" onClick={onClose}>Close</Button><Button disabled={!canProceed} className="bg-accent text-accent-foreground hover:bg-accent" asChild={canProceed}>{canProceed ? <Link to={proceedPath}>Start request <ArrowRight /></Link> : <span>Unavailable</span>}</Button></div>;
}