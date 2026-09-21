import { useMemo, useState, type FormEvent } from 'react';
import { format } from 'date-fns';
import { Activity, CalendarClock, CalendarIcon, CheckCircle2, CircleDollarSign, FileText, Handshake, Pencil, Plus, RotateCcw, Search, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import { InMemoryDataBanner } from '@/generated/components/in-memory-data-banner';
import { HAS_IN_MEMORY_TABLES } from '@/generated/hooks';
import { useContractList, useCreateContract, useUpdateContract } from '@/generated/hooks/use-contract';
import { useVendorList } from '@/generated/hooks/use-vendor';
import { useContractObligationList, useCreateContractObligation, useUpdateContractObligation } from '@/generated/hooks/use-contract-obligation';
import { useContractActivityList, useCreateContractActivity } from '@/generated/hooks/use-contract-activity';
import { useContractCommercialTermList, useCreateContractCommercialTerm, useUpdateContractCommercialTerm } from '@/generated/hooks/use-contract-commercial-term';
import { useContractComplianceDetailList, useCreateContractComplianceDetail, useUpdateContractComplianceDetail } from '@/generated/hooks/use-contract-compliance-detail';
import type { Contract, ContractAgreementModeKey, ContractContractTypeKey, ContractLifecycleStatusKey } from '@/generated/models/contract-model';
import type { Vendor } from '@/generated/models/vendor-model';
import type { ContractObligation, ContractObligationRecurrenceKey, ContractObligationStatusKey } from '@/generated/models/contract-obligation-model';
import type { ContractActivity, ContractActivityActivityTypeKey } from '@/generated/models/contract-activity-model';
import type { ContractCommercialTerm, ContractCommercialTermBillingFrequencyKey, ContractCommercialTermTaxTreatmentKey } from '@/generated/models/contract-commercial-term-model';
import type { ContractComplianceDetail, ContractComplianceDetailSignatureStatusKey } from '@/generated/models/contract-compliance-detail-model';
import { useWorkspaceContext } from '@/contexts/workspace-context';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';

const contractTypes: ContractContractTypeKey[] = ['Service', 'Purchase', 'Subscription', 'Lease', 'Maintenance', 'Other'];
const agreementModes: ContractAgreementModeKey[] = ['FixedTerm', 'AutoRenewing'];
const lifecycleActions: Record<ContractLifecycleStatusKey, ContractLifecycleStatusKey[]> = { Draft: ['Active', 'Archived'], Active: ['Expiring', 'Terminated'], Expiring: ['Active', 'Expired', 'Terminated'], Expired: ['Archived'], Terminated: ['Archived'], Archived: [] };
const formatDate = (value: string) => new Intl.DateTimeFormat('en', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(value));
const formatMoney = (value: number, currency: string) => new Intl.NumberFormat('en', { style: 'currency', currency, maximumFractionDigits: 0 }).format(value);

export default function ContractsPage() {
  const { activeWorkspace, currentPerson } = useWorkspaceContext();
  const { data: contracts = [], isLoading } = useContractList();
  const { data: vendors = [] } = useVendorList();
  const { data: obligations = [] } = useContractObligationList();
  const { data: activities = [] } = useContractActivityList();
  const createContract = useCreateContract();
  const updateContract = useUpdateContract();
  const createObligation = useCreateContractObligation();
  const updateObligation = useUpdateContractObligation();
  const createActivity = useCreateContractActivity();
  const { data: commercialTerms = [] } = useContractCommercialTermList();
  const { data: complianceDetails = [] } = useContractComplianceDetailList();
  const createCommercialTerm = useCreateContractCommercialTerm();
  const updateCommercialTerm = useUpdateContractCommercialTerm();
  const createComplianceDetail = useCreateContractComplianceDetail();
  const updateComplianceDetail = useUpdateContractComplianceDetail();
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [selectedId, setSelectedId] = useState('');
  const [dialog, setDialog] = useState<'create' | 'edit' | 'lifecycle' | 'obligation' | 'operations' | null>(null);

  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [dueDate, setDueDate] = useState<Date>();
  const [renewalDecisionDate, setRenewalDecisionDate] = useState<Date>();
  const [insuranceExpiryDate, setInsuranceExpiryDate] = useState<Date>();
  const [signedDate, setSignedDate] = useState<Date>();

  const workspaceContracts = useMemo(() => contracts.filter((contract: Contract) => contract.workspace.id === activeWorkspace?.id), [activeWorkspace?.id, contracts]);
  const workspaceVendors = useMemo(() => vendors.filter((vendor: Vendor) => vendor.workspace.id === activeWorkspace?.id), [activeWorkspace?.id, vendors]);
  const filtered = workspaceContracts.filter((contract: Contract) => `${contract.title} ${contract.contractNumber} ${contract.vendor.vendorName}`.toLowerCase().includes(query.toLowerCase()) && (status === 'all' || contract.lifecycleStatusKey === status));
  const selected = workspaceContracts.find((contract: Contract) => contract.id === selectedId) ?? filtered[0];
  const selectedObligations = obligations.filter((obligation: ContractObligation) => obligation.contract.id === selected?.id);
  const selectedActivities = activities.filter((item: ContractActivity) => item.contract.id === selected?.id).sort((a: ContractActivity, b: ContractActivity) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  const selectedCommercialTerm = commercialTerms.find((term: ContractCommercialTerm) => term.contract.id === selected?.id);
  const selectedComplianceDetail = complianceDetails.find((detail: ContractComplianceDetail) => detail.contract.id === selected?.id);
  const renewalAlerts = commercialTerms.filter((term: ContractCommercialTerm) => term.workspace.id === activeWorkspace?.id && term.renewalDecisionDate && new Date(term.renewalDecisionDate).getTime() <= Date.now() + 90 * 86400000).length;
  const activeValue = workspaceContracts.filter((contract: Contract) => ['Active', 'Expiring'].includes(contract.lifecycleStatusKey)).reduce((sum: number, contract: Contract) => sum + contract.totalValue, 0);

  const openObligations = obligations.filter((obligation: ContractObligation) => obligation.workspace.id === activeWorkspace?.id && !['Completed', 'Waived'].includes(obligation.statusKey)).length;

  const recordActivity = (contract: Contract, type: ContractActivityActivityTypeKey, summary: string, details: string, fieldName?: string, previousValue?: string, newValue?: string) => {
    if (!activeWorkspace || !currentPerson) return;
    createActivity.mutate({ activityTypeKey: type, actorPerson: { id: currentPerson.id, displayName: currentPerson.displayName }, contract: { id: contract.id, title: contract.title }, details, fieldName, newValue, occurredAt: new Date().toISOString(), previousValue, summary, workspace: { id: activeWorkspace.id, workspaceName: activeWorkspace.workspaceName } });
  };

  const submitContract = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const vendor = workspaceVendors.find((item: Vendor) => item.id === String(form.get('vendorId')));
    if (!activeWorkspace || !currentPerson || !vendor || !startDate || !endDate) return toast.error('Complete all contract dates and vendor details.');
    if (endDate <= startDate) return toast.error('End date must be after the start date.');
    const values = { title: String(form.get('title')).trim(), contractNumber: String(form.get('contractNumber')).trim(), agreementModeKey: String(form.get('agreementMode')) as ContractAgreementModeKey, contractTypeKey: String(form.get('contractType')) as ContractContractTypeKey, currency: 'SAR', description: String(form.get('description')).trim(), startDate: format(startDate, 'yyyy-MM-dd'), endDate: format(endDate, 'yyyy-MM-dd'), renewalTerminationAndAuditDetails: String(form.get('renewalDetails')).trim(), responsiblePerson: { id: currentPerson.id, displayName: currentPerson.displayName }, totalValue: Number(form.get('totalValue')), vendor: { id: vendor.id, vendorName: vendor.vendorName }, workspace: { id: activeWorkspace.id, workspaceName: activeWorkspace.workspaceName } };
    if (dialog === 'edit' && selected) {
      updateContract.mutate({ id: selected.id, changedFields: values }, { onSuccess: () => { recordActivity(selected, 'Updated', 'Contract details updated', 'Core contract metadata and terms were edited.'); toast.success('Contract updated'); setDialog(null); }, onError: () => toast.error('Contract could not be updated') });
    } else {
      createContract.mutate({ ...values, lifecycleStatusKey: 'Draft' }, { onSuccess: (contract: Contract) => { recordActivity(contract, 'Created', 'Contract created', 'Draft agreement added to the register.'); toast.success('Contract created'); setDialog(null); }, onError: () => toast.error('Contract could not be created') });
    }
  };

  const submitLifecycle = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    const next = String(form.get('nextStatus')) as ContractLifecycleStatusKey;
    const reason = String(form.get('reason')).trim();
    if (!lifecycleActions[selected.lifecycleStatusKey].includes(next)) return toast.error('That lifecycle transition is not allowed.');
    if (!reason) return toast.error('A lifecycle reason is required.');
    updateContract.mutate(
      { id: selected.id, changedFields: { lifecycleStatusKey: next } },
      {
        onSuccess: () => {
          recordActivity(selected, next === 'Active' && selected.lifecycleStatusKey === 'Expiring' ? 'RenewalAction' : 'StatusChanged', `Contract moved to ${next}`, reason, 'Lifecycle status', selected.lifecycleStatusKey, next);
          toast.success(`Contract moved to ${next}`);
          setDialog(null);
        },
        onError: () => toast.error('Lifecycle action could not be applied'),
      },
    );
  };


  const openOperations = () => {
    if (!selected) return;
    setRenewalDecisionDate(selectedCommercialTerm?.renewalDecisionDate ? new Date(selectedCommercialTerm.renewalDecisionDate) : undefined);
    setInsuranceExpiryDate(selectedComplianceDetail?.insuranceExpiryDate ? new Date(selectedComplianceDetail.insuranceExpiryDate) : undefined);
    setSignedDate(selectedComplianceDetail?.signedDate ? new Date(selectedComplianceDetail.signedDate) : undefined);
    setDialog('operations');
  };

  const submitOperations = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected || !activeWorkspace || !currentPerson) return;
    const form = new FormData(event.currentTarget);
    const requiredText = ['counterpartyLegalName', 'governingLaw', 'jurisdiction', 'costCenter'].map((key: string) => String(form.get(key)).trim());
    if (requiredText.some((value: string) => !value)) return toast.error('Complete all required operational fields.');

    const paymentTermsDays = Number(form.get('paymentTermsDays'));
    const renewalNoticeDays = Number(form.get('renewalNoticeDays'));
    const terminationNoticeDays = Number(form.get('terminationNoticeDays'));
    const liabilityRaw = String(form.get('liabilityCapAmount')).trim();
    if ([paymentTermsDays, renewalNoticeDays, terminationNoticeDays].some((value: number) => !Number.isInteger(value) || value < 0)) return toast.error('Notice and payment days must be non-negative whole numbers.');
    const commercialValues: Omit<ContractCommercialTerm, 'id'> = { termName: `${selected.contractNumber} commercial terms`, billingFrequencyKey: String(form.get('billingFrequency')) as ContractCommercialTermBillingFrequencyKey, businessOwnerPerson: { id: currentPerson.id, displayName: currentPerson.displayName }, contract: { id: selected.id, title: selected.title }, contractManagerPerson: { id: currentPerson.id, displayName: currentPerson.displayName }, counterpartyLegalName: requiredText[0], governingLaw: requiredText[1], jurisdiction: requiredText[2], paymentTermsDays, renewalDecisionDate: renewalDecisionDate ? format(renewalDecisionDate, 'yyyy-MM-dd') : undefined, renewalNoticeDays, taxTreatmentKey: String(form.get('taxTreatment')) as ContractCommercialTermTaxTreatmentKey, terminationNoticeDays, workspace: { id: activeWorkspace.id, workspaceName: activeWorkspace.workspaceName } };
    const complianceValues: Omit<ContractComplianceDetail, 'id'> = { detailName: `${selected.contractNumber} compliance`, confidentialityRequired: form.get('confidentialityRequired') === 'on', contract: { id: selected.id, title: selected.title }, costCenter: requiredText[3], dataProtectionRequired: form.get('dataProtectionRequired') === 'on', documentURL: String(form.get('documentURL')).trim() || undefined, insuranceExpiryDate: insuranceExpiryDate ? format(insuranceExpiryDate, 'yyyy-MM-dd') : undefined, insuranceRequired: form.get('insuranceRequired') === 'on', liabilityCapAmount: liabilityRaw ? Number(liabilityRaw) : undefined, procurementReference: String(form.get('procurementReference')).trim() || undefined, purchaseOrderNumber: String(form.get('purchaseOrderNumber')).trim() || undefined, signatureStatusKey: String(form.get('signatureStatus')) as ContractComplianceDetailSignatureStatusKey, signedDate: signedDate ? format(signedDate, 'yyyy-MM-dd') : undefined, workspace: { id: activeWorkspace.id, workspaceName: activeWorkspace.workspaceName } };
    if (complianceValues.documentURL) { try { new URL(complianceValues.documentURL); } catch (_error: unknown) { return toast.error('Document URL must be a valid URL.'); } }
    if (complianceValues.liabilityCapAmount !== undefined && complianceValues.liabilityCapAmount < 0) return toast.error('Liability cap cannot be negative.');
    try {
      if (selectedCommercialTerm) await updateCommercialTerm.mutateAsync({ id: selectedCommercialTerm.id, changedFields: commercialValues }); else await createCommercialTerm.mutateAsync(commercialValues);
      if (selectedComplianceDetail) await updateComplianceDetail.mutateAsync({ id: selectedComplianceDetail.id, changedFields: complianceValues }); else await createComplianceDetail.mutateAsync(complianceValues);
      recordActivity(selected, 'Updated', 'Operational terms updated', 'Commercial, renewal, notice, signature, insurance, and governance fields were validated and saved.');
      toast.success('Operational contract details saved');
      setDialog(null);
    } catch (_error: unknown) { toast.error('Operational details could not be saved'); }
  };
  const submitObligation = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selected || !activeWorkspace || !currentPerson || !dueDate) return toast.error('Complete the obligation due date.');
    const form = new FormData(event.currentTarget);
    createObligation.mutate({ title: String(form.get('title')).trim(), completionNotes: '', contract: { id: selected.id, title: selected.title }, createdAt: new Date().toISOString(), createdBy: { id: currentPerson.id, displayName: currentPerson.displayName }, description: String(form.get('description')).trim(), dueDate: format(dueDate, 'yyyy-MM-dd'), ownerPerson: { id: currentPerson.id, displayName: currentPerson.displayName }, recurrenceKey: String(form.get('recurrence')) as ContractObligationRecurrenceKey, statusKey: 'Open', updatedAt: new Date().toISOString(), updatedBy: { id: currentPerson.id, displayName: currentPerson.displayName }, workspace: { id: activeWorkspace.id, workspaceName: activeWorkspace.workspaceName } }, { onSuccess: () => { recordActivity(selected, 'ObligationAction', 'Obligation created', String(form.get('title'))); toast.success('Obligation created'); setDialog(null); } });
  };

  const changeObligation = (obligation: ContractObligation, next: ContractObligationStatusKey) => {
    if (!selected || !currentPerson) return;
    const changedFields: Partial<Omit<ContractObligation, 'id'>> = { statusKey: next, updatedAt: new Date().toISOString(), updatedBy: { id: currentPerson.id, displayName: currentPerson.displayName } };
    if (next === 'Completed') changedFields.completionDate = new Date().toISOString();
    updateObligation.mutate({ id: obligation.id, changedFields }, { onSuccess: () => { recordActivity(selected, 'ObligationAction', `${obligation.title}: ${next}`, `Obligation changed from ${obligation.statusKey} to ${next}.`, 'Obligation status', obligation.statusKey, next); toast.success(`Obligation marked ${next}`); } });
  };

  const openEdit = () => { if (!selected) return; setStartDate(new Date(selected.startDate)); setEndDate(new Date(selected.endDate)); setDialog('edit'); };
  const openCreate = () => { setStartDate(undefined); setEndDate(undefined); setDialog('create'); };

  return (
    <main className="flex-1 bg-background p-5 text-foreground md:p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <InMemoryDataBanner show={HAS_IN_MEMORY_TABLES} message="Contract workflows are enabled for testing. Persistent files and scheduled outbound alerts remain deployment blockers." className="rounded-md border border-border bg-accent text-accent-foreground" />
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end"><div><p className="mb-2 text-sm font-semibold text-muted-foreground">{activeWorkspace?.workspaceName}</p><h1 className="text-2xl font-bold tracking-tight">Contracts</h1><p className="mt-2 text-muted-foreground">Manage agreement terms, lifecycle decisions, obligations, and audit activity.</p></div><Button onClick={openCreate} disabled={!workspaceVendors.some((vendor: Vendor) => vendor.statusKey === 'Active')}><Plus className="size-4" />New contract</Button></div>
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" aria-label="Contract overview"><Metric icon={Handshake} label="Total contracts" value={String(workspaceContracts.length)} /><Metric icon={CircleDollarSign} label="Active value" value={formatMoney(activeValue, 'SAR')} /><Metric icon={CalendarClock} label="Renewal alerts" value={String(renewalAlerts)} /><Metric icon={ShieldCheck} label="Open obligations" value={String(openObligations)} /></section>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_25rem]">
          <Card><CardHeader className="border-b border-border"><div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between"><CardTitle>Contract register</CardTitle><div className="flex gap-2"><div className="relative min-w-0 flex-1"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input value={query} onChange={(event: React.ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)} placeholder="Search contracts" className="pl-9" /></div><Select value={status} onValueChange={(value: string) => setStatus(value)}><SelectTrigger className="w-36"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem>{Object.keys(lifecycleActions).filter((value: string) => value).map((value: string) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div></div></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full text-left text-sm"><thead className="bg-muted text-muted-foreground"><tr><th className="px-5 py-3 font-semibold">Contract</th><th className="px-5 py-3 font-semibold">Vendor</th><th className="px-5 py-3 font-semibold">End date</th><th className="px-5 py-3 font-semibold">Value</th><th className="px-5 py-3 font-semibold">Status</th></tr></thead><tbody>{filtered.map((contract: Contract) => <tr key={contract.id} onClick={() => setSelectedId(contract.id)} className={`cursor-pointer border-t border-border transition-colors hover:bg-muted ${selected?.id === contract.id ? 'bg-secondary text-secondary-foreground' : ''}`}><td className="px-5 py-4"><p className="font-semibold">{contract.title}</p><p className={selected?.id === contract.id ? 'text-secondary-foreground' : 'text-muted-foreground'}>{contract.contractNumber}</p></td><td className="px-5 py-4">{contract.vendor.vendorName}</td><td className="px-5 py-4">{formatDate(contract.endDate)}</td><td className="px-5 py-4 font-semibold">{formatMoney(contract.totalValue, contract.currency)}</td><td className="px-5 py-4"><Badge variant={['Expired', 'Terminated'].includes(contract.lifecycleStatusKey) ? 'destructive' : contract.lifecycleStatusKey === 'Active' ? 'default' : 'secondary'}>{contract.lifecycleStatusKey}</Badge></td></tr>)}</tbody></table></div>{!isLoading && filtered.length === 0 && <div className="p-10 text-center"><FileText className="mx-auto mb-3 size-8 text-muted-foreground" /><p className="font-semibold">No contracts found</p><p className="mt-1 text-sm text-muted-foreground">Adjust the filters or create a contract.</p></div>}</CardContent></Card>
          <Card className="h-fit xl:sticky xl:top-5"><CardHeader className="border-b border-border"><div className="flex items-center justify-between"><CardTitle>Contract control</CardTitle>{selected && <Button variant="ghost" size="icon-sm" onClick={openEdit} aria-label="Edit contract"><Pencil className="size-4" /></Button>}</div></CardHeader><CardContent className="pt-5">{selected ? <Tabs defaultValue="details"><TabsList className="grid w-full grid-cols-3"><TabsTrigger value="details">Details</TabsTrigger><TabsTrigger value="obligations">Work</TabsTrigger><TabsTrigger value="activity">Activity</TabsTrigger></TabsList><TabsContent value="details" className="space-y-5"><div><div className="flex items-center gap-2"><Badge variant="outline">{selected.contractTypeKey}</Badge><Badge>{selected.lifecycleStatusKey}</Badge></div><h2 className="mt-3 text-lg font-bold">{selected.title}</h2><p className="mt-1 text-sm text-muted-foreground">{selected.description}</p></div><dl className="grid grid-cols-2 gap-4 text-sm"><Detail label="Vendor" value={selected.vendor.vendorName} /><Detail label="Owner" value={selected.responsiblePerson.displayName} /><Detail label="Term" value={`${formatDate(selected.startDate)} — ${formatDate(selected.endDate)}`} /><Detail label="Mode" value={selected.agreementModeKey === 'AutoRenewing' ? 'Auto renewing' : 'Fixed term'} />{selectedCommercialTerm && <><Detail label="Payment" value={`${selectedCommercialTerm.paymentTermsDays} days · ${selectedCommercialTerm.billingFrequencyKey}`} /><Detail label="Renewal notice" value={`${selectedCommercialTerm.renewalNoticeDays} days`} /><Detail label="Governing law" value={selectedCommercialTerm.governingLaw} /><Detail label="Jurisdiction" value={selectedCommercialTerm.jurisdiction} /></>}{selectedComplianceDetail && <><Detail label="Signature" value={selectedComplianceDetail.signatureStatusKey} /><Detail label="Cost center" value={selectedComplianceDetail.costCenter} /><Detail label="Insurance" value={selectedComplianceDetail.insuranceRequired ? 'Required' : 'Not required'} /><Detail label="Data protection" value={selectedComplianceDetail.dataProtectionRequired ? 'Required' : 'Not required'} /></>}</dl><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={openEdit}><Pencil className="size-4" />Edit core</Button><Button variant="outline" onClick={openOperations}><ShieldCheck className="size-4" />Operational terms</Button>{lifecycleActions[selected.lifecycleStatusKey].length > 0 && <Button onClick={() => setDialog('lifecycle')}><RotateCcw className="size-4" />Lifecycle action</Button>}</div></TabsContent><TabsContent value="obligations" className="space-y-3"><div className="flex items-center justify-between"><p className="font-semibold">Obligations</p><Button size="sm" onClick={() => { setDueDate(undefined); setDialog('obligation'); }}><Plus className="size-4" />Add</Button></div>{selectedObligations.map((obligation: ContractObligation) => <div key={obligation.id} className="rounded-md border border-border bg-muted p-3 text-muted-foreground"><div className="flex items-start justify-between gap-2"><div><p className="font-semibold text-foreground">{obligation.title}</p><p className="mt-1 text-xs">Due {formatDate(obligation.dueDate)} · {obligation.statusKey}</p></div>{!['Completed', 'Waived'].includes(obligation.statusKey) ? <Button size="icon-sm" variant="outline" onClick={() => changeObligation(obligation, 'Completed')} aria-label={`Complete ${obligation.title}`}><CheckCircle2 className="size-4" /></Button> : <Button size="icon-sm" variant="outline" onClick={() => changeObligation(obligation, 'Open')} aria-label={`Reopen ${obligation.title}`}><RotateCcw className="size-4" /></Button>}</div></div>)}{selectedObligations.length === 0 && <p className="text-sm text-muted-foreground">No obligations recorded.</p>}</TabsContent><TabsContent value="activity" className="space-y-3">{selectedActivities.map((item: ContractActivity) => <div key={item.id} className="border-l-2 border-l-primary pl-3"><p className="text-sm font-semibold">{item.summary}</p><p className="mt-1 text-xs text-muted-foreground">{item.actorPerson.displayName} · {formatDate(item.occurredAt)}</p><p className="mt-1 text-xs text-muted-foreground">{item.details}</p></div>)}{selectedActivities.length === 0 && <div className="py-6 text-center"><Activity className="mx-auto mb-2 size-6 text-muted-foreground" /><p className="text-sm text-muted-foreground">No activity recorded yet.</p></div>}</TabsContent></Tabs> : <p className="text-sm text-muted-foreground">Select a contract to view details.</p>}</CardContent></Card>
        </div>
      </div>

      <Dialog open={dialog === 'create' || dialog === 'edit'} onOpenChange={(open: boolean) => { if (!open) setDialog(null); }}><DialogContent><form onSubmit={submitContract}><DialogHeader><DialogTitle>{dialog === 'edit' ? 'Edit contract' : 'Create contract'}</DialogTitle><DialogDescription>Maintain validated supplier agreement terms for this workspace.</DialogDescription></DialogHeader><div className="grid max-h-[65vh] gap-4 overflow-y-auto py-5 sm:grid-cols-2"><Field label="Title" name="title" defaultValue={dialog === 'edit' ? selected?.title : ''} /><Field label="Contract number" name="contractNumber" defaultValue={dialog === 'edit' ? selected?.contractNumber : ''} /><div className="space-y-2 sm:col-span-2"><Label htmlFor="vendorId">Vendor</Label><Select name="vendorId" required defaultValue={dialog === 'edit' ? selected?.vendor.id : undefined}><SelectTrigger id="vendorId"><SelectValue placeholder="Select active vendor" /></SelectTrigger><SelectContent>{workspaceVendors.filter((vendor: Vendor) => vendor.id && vendor.statusKey === 'Active').map((vendor: Vendor) => <SelectItem key={vendor.id} value={vendor.id}>{vendor.vendorName}</SelectItem>)}</SelectContent></Select></div><SelectField label="Contract type" name="contractType" values={contractTypes} defaultValue={dialog === 'edit' ? selected?.contractTypeKey : undefined} /><SelectField label="Agreement mode" name="agreementMode" values={agreementModes} defaultValue={dialog === 'edit' ? selected?.agreementModeKey : undefined} /><DateField label="Start date" date={startDate} setDate={setStartDate} /><DateField label="End date" date={endDate} setDate={setEndDate} /><Field label="Total value (SAR)" name="totalValue" type="number" defaultValue={dialog === 'edit' ? String(selected?.totalValue ?? '') : ''} /><div className="space-y-2 sm:col-span-2"><Label htmlFor="description">Description</Label><Textarea id="description" name="description" defaultValue={dialog === 'edit' ? selected?.description : ''} required /></div><div className="space-y-2 sm:col-span-2"><Label htmlFor="renewalDetails">Renewal and termination details</Label><Textarea id="renewalDetails" name="renewalDetails" defaultValue={dialog === 'edit' ? selected?.renewalTerminationAndAuditDetails : ''} required /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancel</Button><Button type="submit" disabled={createContract.isPending || updateContract.isPending}>Save contract</Button></DialogFooter></form></DialogContent></Dialog>
      <Dialog open={dialog === 'operations'} onOpenChange={(open: boolean) => { if (!open) setDialog(null); }}><DialogContent className="sm:max-w-3xl"><form onSubmit={submitOperations}><DialogHeader><DialogTitle>Operational contract terms</DialogTitle><DialogDescription>Capture commercial, renewal, notice, signature, insurance, and governance controls as live records.</DialogDescription></DialogHeader><div className="grid max-h-[65vh] gap-4 overflow-y-auto py-5 sm:grid-cols-2"><Field label="Counterparty legal name" name="counterpartyLegalName" defaultValue={selectedCommercialTerm?.counterpartyLegalName ?? selected?.vendor.vendorName ?? ''} /><Field label="Cost center" name="costCenter" defaultValue={selectedComplianceDetail?.costCenter ?? ''} /><Field label="Governing law" name="governingLaw" defaultValue={selectedCommercialTerm?.governingLaw ?? ''} /><Field label="Jurisdiction" name="jurisdiction" defaultValue={selectedCommercialTerm?.jurisdiction ?? ''} /><Field label="Payment terms (days)" name="paymentTermsDays" type="number" defaultValue={String(selectedCommercialTerm?.paymentTermsDays ?? 30)} /><SelectField label="Billing frequency" name="billingFrequency" values={['Monthly', 'Quarterly', 'Semiannual', 'Annual', 'Milestone', 'OneTime']} defaultValue={selectedCommercialTerm?.billingFrequencyKey ?? 'Monthly'} /><SelectField label="Tax treatment" name="taxTreatment" values={['Inclusive', 'Exclusive', 'Exempt', 'WithholdingApplies']} defaultValue={selectedCommercialTerm?.taxTreatmentKey ?? 'Exclusive'} /><Field label="Renewal notice (days)" name="renewalNoticeDays" type="number" defaultValue={String(selectedCommercialTerm?.renewalNoticeDays ?? 90)} /><Field label="Termination notice (days)" name="terminationNoticeDays" type="number" defaultValue={String(selectedCommercialTerm?.terminationNoticeDays ?? 30)} /><DateField label="Renewal decision date" date={renewalDecisionDate} setDate={setRenewalDecisionDate} /><SelectField label="Signature status" name="signatureStatus" values={['NotStarted', 'InProgress', 'FullySigned', 'Declined']} defaultValue={selectedComplianceDetail?.signatureStatusKey ?? 'NotStarted'} /><DateField label="Signed date" date={signedDate} setDate={setSignedDate} /><Field label="Liability cap amount" name="liabilityCapAmount" type="number" defaultValue={selectedComplianceDetail?.liabilityCapAmount === undefined ? '' : String(selectedComplianceDetail.liabilityCapAmount)} /><DateField label="Insurance expiry" date={insuranceExpiryDate} setDate={setInsuranceExpiryDate} /><Field label="Purchase order number" name="purchaseOrderNumber" defaultValue={selectedComplianceDetail?.purchaseOrderNumber ?? ''} required={false} /><Field label="Procurement reference" name="procurementReference" defaultValue={selectedComplianceDetail?.procurementReference ?? ''} required={false} /><div className="sm:col-span-2"><Field label="Document URL" name="documentURL" type="url" defaultValue={selectedComplianceDetail?.documentURL ?? ''} required={false} /></div><div className="sm:col-span-2 grid gap-3 rounded-md border border-border bg-muted p-4 text-muted-foreground sm:grid-cols-3"><CheckField name="confidentialityRequired" label="Confidentiality required" defaultChecked={selectedComplianceDetail?.confidentialityRequired ?? true} /><CheckField name="dataProtectionRequired" label="Data protection required" defaultChecked={selectedComplianceDetail?.dataProtectionRequired ?? false} /><CheckField name="insuranceRequired" label="Insurance required" defaultChecked={selectedComplianceDetail?.insuranceRequired ?? false} /></div></div><DialogFooter><Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancel</Button><Button type="submit" disabled={createCommercialTerm.isPending || updateCommercialTerm.isPending || createComplianceDetail.isPending || updateComplianceDetail.isPending}>Save operational terms</Button></DialogFooter></form></DialogContent></Dialog>
      <Dialog open={dialog === 'lifecycle'} onOpenChange={(open: boolean) => { if (!open && !updateContract.isPending) setDialog(null); }}><DialogContent><form onSubmit={submitLifecycle}><DialogHeader><DialogTitle>Contract lifecycle action</DialogTitle><DialogDescription>Only valid transitions are available. Every action is retained in the activity timeline.</DialogDescription></DialogHeader><div className="space-y-4 py-5"><div className="space-y-2"><Label htmlFor="nextStatus">Next status</Label><Select name="nextStatus" required disabled={updateContract.isPending}><SelectTrigger id="nextStatus"><SelectValue placeholder="Select action" /></SelectTrigger><SelectContent>{(selected ? lifecycleActions[selected.lifecycleStatusKey] : []).filter((value: ContractLifecycleStatusKey) => value).map((value: ContractLifecycleStatusKey) => <SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label htmlFor="reason">Reason</Label><Textarea id="reason" name="reason" required disabled={updateContract.isPending} placeholder="Record the business reason and decision context" /></div></div><DialogFooter><Button type="button" variant="outline" disabled={updateContract.isPending} onClick={() => setDialog(null)}>Cancel</Button><Button type="submit" disabled={updateContract.isPending}>{updateContract.isPending ? 'Applying…' : 'Apply action'}</Button></DialogFooter></form></DialogContent></Dialog>
      <Dialog open={dialog === 'obligation'} onOpenChange={(open: boolean) => { if (!open) setDialog(null); }}><DialogContent><form onSubmit={submitObligation}><DialogHeader><DialogTitle>Add obligation</DialogTitle><DialogDescription>Create assigned contractual work with a tracked due date.</DialogDescription></DialogHeader><div className="space-y-4 py-5"><Field label="Title" name="title" /><div className="space-y-2"><Label htmlFor="obligation-description">Description</Label><Textarea id="obligation-description" name="description" required /></div><DateField label="Due date" date={dueDate} setDate={setDueDate} /><SelectField label="Recurrence" name="recurrence" values={['None', 'Monthly', 'Quarterly', 'Semiannual', 'Annual', 'Custom']} /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setDialog(null)}>Cancel</Button><Button type="submit">Create obligation</Button></DialogFooter></form></DialogContent></Dialog>
    </main>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Handshake; label: string; value: string }) { return <Card><CardContent className="flex items-center gap-4 p-5"><div className="flex size-11 items-center justify-center rounded-md bg-primary text-primary-foreground"><Icon className="size-5" /></div><div><p className="text-sm font-semibold text-muted-foreground">{label}</p><p className="mt-1 text-xl font-bold">{value}</p></div></CardContent></Card>; }
function Detail({ label, value }: { label: string; value: string }) { return <div><dt className="font-semibold text-muted-foreground">{label}</dt><dd className="mt-1 font-medium">{value}</dd></div>; }
function Field({ label, name, type = 'text', defaultValue = '', required = true }: { label: string; name: string; type?: string; defaultValue?: string; required?: boolean }) { return <div className="space-y-2"><Label htmlFor={name}>{label}</Label><Input id={name} name={name} type={type} defaultValue={defaultValue} required={required} min={type === 'number' ? 0 : undefined} /></div>; }
function CheckField({ name, label, defaultChecked }: { name: string; label: string; defaultChecked: boolean }) { return <label className="flex items-center gap-2 text-sm font-medium text-foreground"><input type="checkbox" name={name} defaultChecked={defaultChecked} className="size-4 accent-primary" />{label}</label>; }
function SelectField({ label, name, values, defaultValue }: { label: string; name: string; values: string[]; defaultValue?: string }) { return <div className="space-y-2"><Label htmlFor={name}>{label}</Label><Select name={name} required defaultValue={defaultValue}><SelectTrigger id={name}><SelectValue placeholder={`Select ${label.toLowerCase()}`} /></SelectTrigger><SelectContent>{values.filter((value: string) => value).map((value: string) => <SelectItem key={value} value={value}>{value === 'FixedTerm' ? 'Fixed term' : value === 'AutoRenewing' ? 'Auto renewing' : value}</SelectItem>)}</SelectContent></Select></div>; }
function DateField({ label, date, setDate }: { label: string; date: Date | undefined; setDate: (value: Date | undefined) => void }) { return <div className="space-y-2"><Label>{label}</Label><Popover><PopoverTrigger asChild><Button type="button" variant="outline" className={cn('w-full justify-start text-left font-normal', !date && 'text-muted-foreground')}><CalendarIcon className="mr-2 size-4" />{date ? format(date, 'PPP') : <span>Pick a date</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={date} onSelect={(value: Date | undefined) => setDate(value)} initialFocus /></PopoverContent></Popover></div>; }
