import { z } from 'zod';

/**
 * Zod schema for ContractComplianceDetail validation
 */
export const ContractComplianceDetailSchema = z.object({
  id: z.string().uuid(),
  detailName: z.string().min(1, { message: "Detail Name is required" }),
  confidentialityRequired: z.boolean(),
  contract: z.object({ id: z.string().uuid(), title: z.string() }),
  costCenter: z.string().min(1, { message: "Cost Center is required" }),
  dataProtectionRequired: z.boolean(),
  documentURL: z.string().url().optional(),
  insuranceExpiryDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  insuranceRequired: z.boolean(),
  liabilityCapAmount: z.number().optional(),
  procurementReference: z.string().optional(),
  purchaseOrderNumber: z.string().optional(),
  signatureStatusKey: z.enum(['NotStarted', 'InProgress', 'FullySigned', 'Declined']),
  signedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new ContractComplianceDetail (omits system-generated ID)
 */
export const CreateContractComplianceDetailSchema = ContractComplianceDetailSchema.omit({ id: true });

/**
 * Schema for updating an existing ContractComplianceDetail
 */
export const UpdateContractComplianceDetailSchema = ContractComplianceDetailSchema;

export type ContractComplianceDetailInput = z.infer<typeof ContractComplianceDetailSchema>;
export type CreateContractComplianceDetailInput = z.infer<typeof CreateContractComplianceDetailSchema>;
export type UpdateContractComplianceDetailInput = z.infer<typeof UpdateContractComplianceDetailSchema>;