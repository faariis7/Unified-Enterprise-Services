import { useMemo, useState, type ChangeEvent } from 'react';
import { ArrowRight, BriefcaseBusiness, Building2, Clock3, CreditCard, FileText, Laptop, Plane, Search, ShieldCheck, Star, Wrench, type LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useCatalogItemList } from '@/generated/hooks/use-catalog-item';
import { useCatalogItemApprovalPlanList } from '@/generated/hooks/use-catalog-item-approval-plan';
import { useCatalogItemFormAssignmentList } from '@/generated/hooks/use-catalog-item-form-assignment';
import { useServiceCategoryList } from '@/generated/hooks/use-service-category';
import { useServiceList } from '@/generated/hooks/use-service';
import { useWorkspaceList } from '@/generated/hooks/use-workspace';
import type { CatalogItem } from '@/generated/models/catalog-item-model';
import type { Service } from '@/generated/models/service-model';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';

const businessAreas = [
  { code: 'ALL', name: 'All services', terms: [] },
  { code: 'IT', name: 'Information Technology', terms: ['information technology', 'it'] },
  { code: 'CCD', name: 'Corporate Communications', terms: ['corporate communications', 'communications', 'ccd'] },
  { code: 'FMD', name: 'Facility Management', terms: ['facility management', 'facility', 'fmd'] },
  { code: 'SSD', name: 'Support Services', terms: ['support services', 'ssd'] },
  { code: 'RTT', name: 'Rawabi Travel & Tourism', terms: ['travel', 'tourism', 'rtt'] },
  { code: 'GR', name: 'Government Affairs', terms: ['government affairs', 'government relations', 'gr'] },
  { code: 'RVOS', name: 'Rawabi Vallianz Offshore Services', terms: ['offshore', 'marine', 'maritime', 'rvos'] },
] as const;

type AreaCode = (typeof businessAreas)[number]['code'];

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9\s]/g, ' ').replace(/\s+/g, ' ').trim();
}

function serviceIcon(item: CatalogItem): LucideIcon {
  const text = `${item.itemName} ${item.shortDescription}`.toLowerCase();
  if (text.includes('laptop') || text.includes('computer') || text.includes('vpn') || text.includes('access')) return Laptop;
  if (text.includes('flight') || text.includes('travel') || text.includes('visa')) return Plane;
  if (text.includes('business card')) return CreditCard;
  if (text.includes('letter') || text.includes('document')) return FileText;
  if (text.includes('facility') || text.includes('office')) return Building2;
  if (text.includes('maintenance') || text.includes('repair')) return Wrench;
  return BriefcaseBusiness;
}

function duration(hours: number): string {
  if (hours < 24) return `${hours} business ${hours === 1 ? 'hour' : 'hours'}`;
  const days = Math.ceil(hours / 8);
  return `${days} business ${days === 1 ? 'day' : 'days'}`;
}

export default function AllServicesPage() {
  const { data: workspaces = [] } = useWorkspaceList();
  const { data: categories = [] } = useServiceCategoryList();
  const { data: services = [] } = useServiceList();
  const { data: items = [] } = useCatalogItemList();
  const { data: approvalPlans = [] } = useCatalogItemApprovalPlanList();
  const { data: formAssignments = [] } = useCatalogItemFormAssignmentList();
  const [area, setArea] = useState<AreaCode>('ALL');
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<CatalogItem | null>(null);

  const workspaceById = useMemo(() => new Map(workspaces.map((workspace) => [workspace.id, workspace])), [workspaces]);
  const categoryById = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories]);
  const activeServices = useMemo(() => services.filter((service: Service) => service.statusKey === 'Active' && service.requesterEligible), [services]);
  const serviceById = useMemo(() => new Map(activeServices.map((service: Service) => [service.id, service])), [activeServices]);
  const publishedItems = useMemo(() => items.filter((item: CatalogItem) => item.statusKey === 'Published' && item.requesterEligible && serviceById.has(item.service.id)), [items, serviceById]);

  const itemArea = (item: CatalogItem): (typeof businessAreas)[number] => {
    const service = serviceById.get(item.service.id);
    const category = service ? categoryById.get(service.serviceCategory.id) : undefined;
    const workspace = workspaceById.get(item.workspace.id);
    const text = normalize(`${category?.name1 ?? ''} ${workspace?.workspaceName ?? ''} ${workspace?.workspaceKey ?? ''}`);
    return businessAreas.slice(1).find((candidate) => candidate.terms.some((term: string) => text.includes(normalize(term)))) ?? businessAreas[0];
  };

  const visibleItems = useMemo(() => {
    const query = normalize(search);
    return publishedItems.filter((item: CatalogItem) => {
      const service = serviceById.get(item.service.id);
      const itemBusinessArea = itemArea(item);
      const matchesArea = area === 'ALL' || itemBusinessArea.code === area;
      const searchable = normalize(`${item.itemName} ${item.shortDescription} ${item.itemCode} ${service?.serviceName ?? ''} ${itemBusinessArea.name}`);
      return matchesArea && (!query || searchable.includes(query));
    }).sort((first: CatalogItem, second: CatalogItem) => first.itemName.localeCompare(second.itemName));
  }, [area, publishedItems, search, serviceById, categoryById, workspaceById]);

  const groupedItems = useMemo(() => businessAreas.slice(1).map((businessArea) => ({
    businessArea,
    items: visibleItems.filter((item: CatalogItem) => itemArea(item).code === businessArea.code),
  })).filter((group) => group.items.length > 0), [visibleItems, categoryById, serviceById, workspaceById]);

  const selectedService = selectedItem ? serviceById.get(selectedItem.service.id) : undefined;
  const selectedWorkspace = selectedItem ? workspaceById.get(selectedItem.workspace.id) : undefined;
  const approvalRequired = selectedItem ? approvalPlans.some((plan) => plan.catalogItem.id === selectedItem.id && plan.statusKey === 'Active') : false;
  const canProceed = selectedItem ? formAssignments.some((assignment) => assignment.catalogItem.id === selectedItem.id && assignment.statusKey === 'Active' && assignment.isDefault) : false;

  return (
    <main className="flex-1 bg-background text-foreground">
      <header className="border-b border-border bg-muted text-muted-foreground">
        <div className="mx-auto max-w-7xl px-5 py-12 md:px-10 md:py-16">
          <p className="text-sm font-semibold text-foreground">Employee services</p>
          <div className="mt-3 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div className="max-w-2xl"><h1 className="text-3xl font-semibold tracking-tight text-foreground md:text-5xl">All services, clearly organized.</h1><p className="mt-4 text-base leading-7">Browse every available service by business area, compare expected delivery, and understand what happens before you start.</p></div>
            <div className="relative w-full lg:max-w-md"><Search className="absolute left-4 top-1/2 size-5 -translate-y-1/2 text-foreground" aria-hidden="true" /><Input value={search} onChange={(event: ChangeEvent<HTMLInputElement>) => setSearch(event.target.value)} placeholder="Filter services..." aria-label="Filter all services" className="h-12 bg-card pl-12 text-card-foreground" /></div>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-10 md:px-10 md:py-14">
        <div className="flex flex-wrap gap-2" aria-label="Filter services by business area">
          {businessAreas.map((businessArea) => <Button key={businessArea.code} type="button" variant={area === businessArea.code ? 'default' : 'secondary'} className="rounded-full" title={businessArea.name} onClick={() => setArea(businessArea.code)}>{businessArea.code === 'ALL' ? 'All' : businessArea.code}</Button>)}
        </div>
        <div className="mt-5 flex items-center justify-between gap-4 border-b border-border pb-5"><p className="text-sm text-muted-foreground"><strong className="text-foreground">{visibleItems.length}</strong> {visibleItems.length === 1 ? 'service' : 'services'} available</p>{area !== 'ALL' && <p className="text-sm font-semibold text-foreground">{businessAreas.find((businessArea) => businessArea.code === area)?.name}</p>}</div>

        <div className="mt-10 space-y-14">
          {(area === 'ALL' ? groupedItems : [{ businessArea: businessAreas.find((businessArea) => businessArea.code === area) ?? businessAreas[0], items: visibleItems }]).map((group) => (
            <section key={group.businessArea.code} aria-labelledby={`area-${group.businessArea.code}`}>
              <div className="flex items-end justify-between gap-5"><div><p className="text-sm font-bold text-primary">{group.businessArea.code}</p><h2 id={`area-${group.businessArea.code}`} className="mt-1 text-2xl font-semibold tracking-tight">{group.businessArea.name}</h2></div><span className="text-sm text-muted-foreground">{group.items.length} available</span></div>
              <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {group.items.map((item: CatalogItem) => <CatalogService key={item.id} item={item} service={serviceById.get(item.service.id)} requiresApproval={approvalPlans.some((plan) => plan.catalogItem.id === item.id && plan.statusKey === 'Active')} onOpen={setSelectedItem} />)}
              </div>
            </section>
          ))}
          {visibleItems.length === 0 && <div className="bg-muted p-8 text-muted-foreground"><h2 className="text-xl font-semibold text-foreground">No matching services</h2><p className="mt-2">Try another phrase or choose a different business area.</p></div>}
        </div>
      </div>

      <ServiceDialog item={selectedItem} service={selectedService} workspaceName={selectedWorkspace?.workspaceName} workspaceCode={selectedWorkspace?.workspaceKey.toLowerCase() ?? ''} approvalRequired={approvalRequired} canProceed={canProceed} onOpenChange={(open: boolean) => { if (!open) setSelectedItem(null); }} />
    </main>
  );
}

function CatalogService({ item, service, requiresApproval, onOpen }: { item: CatalogItem; service?: Service; requiresApproval: boolean; onOpen: (item: CatalogItem) => void }) {
  const Icon = serviceIcon(item);
  return <article className="flex min-h-56 flex-col bg-card p-5 text-card-foreground shadow-sm transition-shadow hover:shadow-md"><div className="flex items-start justify-between gap-4"><span className="flex size-11 items-center justify-center rounded-md bg-secondary text-secondary-foreground"><Icon className="size-5" aria-hidden="true" /></span>{requiresApproval && <Badge variant="outline"><ShieldCheck /> Approval</Badge>}</div><button type="button" onClick={() => onOpen(item)} className="mt-5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><h3 className="text-lg font-semibold text-primary">{item.itemName}</h3><p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{service?.description || item.shortDescription}</p></button><div className="mt-auto flex items-center justify-between gap-4 pt-6"><span className="flex items-center gap-2 text-sm text-muted-foreground"><Clock3 className="size-4" />{duration(item.serviceTargetHours)}</span><Button type="button" variant="ghost" size="sm" onClick={() => onOpen(item)}>View service <ArrowRight /></Button></div></article>;
}

function ServiceDialog({ item, service, workspaceName, workspaceCode, approvalRequired, canProceed, onOpenChange }: { item: CatalogItem | null; service?: Service; workspaceName?: string; workspaceCode: string; approvalRequired: boolean; canProceed: boolean; onOpenChange: (open: boolean) => void }) {
  if (!item) return null;
  const Icon = serviceIcon(item);
  const proceedPath = `/w/${workspaceCode}/portal/request/${item.itemCode}`;
  return <Dialog open={Boolean(item)} onOpenChange={onOpenChange}><DialogContent className="w-[calc(100%-1.5rem)] p-0 sm:max-w-lg"><div className="p-7 sm:p-9"><span className="flex size-12 items-center justify-center rounded-md bg-secondary text-secondary-foreground"><Icon className="size-5" aria-hidden="true" /></span><DialogTitle className="mt-6 text-3xl leading-tight text-primary">{item.itemName}</DialogTitle><DialogDescription className="mt-3 text-sm leading-6">{service?.description || item.shortDescription}</DialogDescription><div className="mt-7 divide-y divide-border bg-muted px-5"><ServiceFact label="Expected fulfillment" value={duration(item.serviceTargetHours)} /><ServiceFact label="Approval" value={approvalRequired ? 'Required' : 'Not required'} /><ServiceFact label="Provided by" value={workspaceName ?? 'Rawabi'} /></div><div className="mt-7 flex items-center justify-end gap-2"><Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Close</Button><Button disabled={!canProceed} className="bg-accent text-accent-foreground hover:bg-accent" asChild={canProceed}>{canProceed ? <Link to={proceedPath}>Start request <ArrowRight /></Link> : <span>Unavailable</span>}</Button></div></div></DialogContent></Dialog>;
}

function ServiceFact({ label, value }: { label: string; value: string }) {
  return <div className="flex items-center justify-between gap-5 py-3"><span className="text-xs text-muted-foreground">{label}</span><span className="text-right text-sm font-semibold text-foreground">{value}</span></div>;
}
