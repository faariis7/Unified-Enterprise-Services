import { z } from 'zod';

/**
 * Zod schema for Contract validation
 */
export const ContractSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, { message: "Title is required" }),
  agreementModeKey: z.enum(['FixedTerm', 'AutoRenewing']),
  contractNumber: z.string().min(1, { message: "Contract Number is required" }),
  contractTypeKey: z.enum(['Service', 'Purchase', 'Subscription', 'Lease', 'Maintenance', 'Other']),
  currency: z.string().min(1, { message: "Currency is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").min(1, { message: "End Date is required" }),
  lifecycleStatusKey: z.enum(['Draft', 'Active', 'Expiring', 'Expired', 'Terminated', 'Archived']),
  renewalTerminationAndAuditDetails: z.string().min(1, { message: "Renewal, Termination, and Audit Details is required" }),
  responsiblePerson: z.object({ id: z.string().uuid(), displayName: z.string() }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").min(1, { message: "Start Date is required" }),
  totalValue: z.number(),
  vendor: z.object({ id: z.string().uuid(), vendorName: z.string() }),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new Contract (omits system-generated ID)
 */
export const CreateContractSchema = ContractSchema.omit({ id: true });

/**
 * Schema for updating an existing Contract
 */
export const UpdateContractSchema = ContractSchema;

export type ContractInput = z.infer<typeof ContractSchema>;
export type CreateContractInput = z.infer<typeof CreateContractSchema>;
export type UpdateContractInput = z.infer<typeof UpdateContractSchema>;