import { z } from 'zod';

/**
 * Zod schema for ContractObligation validation
 */
export const ContractObligationSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, { message: "Title is required" }),
  completionDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  completionNotes: z.string().optional(),
  contract: z.object({ id: z.string().uuid(), title: z.string() }),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Created At is required" }),
  createdBy: z.object({ id: z.string().uuid(), displayName: z.string() }),
  description: z.string().min(1, { message: "Description is required" }),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").min(1, { message: "Due Date is required" }),
  ownerPerson: z.object({ id: z.string().uuid(), displayName: z.string() }),
  recurrenceKey: z.enum(['None', 'Monthly', 'Quarterly', 'Semiannual', 'Annual', 'Custom']),
  statusKey: z.enum(['Open', 'InProgress', 'Completed', 'Overdue', 'Waived']),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Updated At is required" }),
  updatedBy: z.object({ id: z.string().uuid(), displayName: z.string() }),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new ContractObligation (omits system-generated ID)
 */
export const CreateContractObligationSchema = ContractObligationSchema.omit({ id: true });

/**
 * Schema for updating an existing ContractObligation
 */
export const UpdateContractObligationSchema = ContractObligationSchema;

export type ContractObligationInput = z.infer<typeof ContractObligationSchema>;
export type CreateContractObligationInput = z.infer<typeof CreateContractObligationSchema>;
export type UpdateContractObligationInput = z.infer<typeof UpdateContractObligationSchema>;