import { z } from 'zod';

/**
 * Zod schema for ContractCommercialTerm validation
 */
export const ContractCommercialTermSchema = z.object({
  id: z.string().uuid(),
  termName: z.string().min(1, { message: "Term Name is required" }),
  billingFrequencyKey: z.enum(['Monthly', 'Quarterly', 'Semiannual', 'Annual', 'Milestone', 'OneTime']),
  businessOwnerPerson: z.object({ id: z.string().uuid(), displayName: z.string() }),
  contract: z.object({ id: z.string().uuid(), title: z.string() }),
  contractManagerPerson: z.object({ id: z.string().uuid(), displayName: z.string() }),
  counterpartyLegalName: z.string().min(1, { message: "Counterparty Legal Name is required" }),
  governingLaw: z.string().min(1, { message: "Governing Law is required" }),
  jurisdiction: z.string().min(1, { message: "Jurisdiction is required" }),
  paymentTermsDays: z.number().int(),
  renewalDecisionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  renewalNoticeDays: z.number().int(),
  taxTreatmentKey: z.enum(['Inclusive', 'Exclusive', 'Exempt', 'WithholdingApplies']),
  terminationNoticeDays: z.number().int(),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new ContractCommercialTerm (omits system-generated ID)
 */
export const CreateContractCommercialTermSchema = ContractCommercialTermSchema.omit({ id: true });

/**
 * Schema for updating an existing ContractCommercialTerm
 */
export const UpdateContractCommercialTermSchema = ContractCommercialTermSchema;

export type ContractCommercialTermInput = z.infer<typeof ContractCommercialTermSchema>;
export type CreateContractCommercialTermInput = z.infer<typeof CreateContractCommercialTermSchema>;
export type UpdateContractCommercialTermInput = z.infer<typeof UpdateContractCommercialTermSchema>;