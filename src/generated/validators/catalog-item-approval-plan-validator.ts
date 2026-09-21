import { z } from 'zod';

/**
 * Zod schema for CatalogItemApprovalPlan validation
 */
export const CatalogItemApprovalPlanSchema = z.object({
  id: z.string().uuid(),
  planName: z.string().min(1, { message: "Plan Name is required" }),
  approvalModeKey: z.enum(['Sequential', 'Parallel']),
  approverReference: z.string().min(1, { message: "Approver Reference is required" }),
  approverTypeKey: z.enum(['Manager', 'Person', 'Role', 'Group']),
  catalogItem: z.object({ id: z.string().uuid(), itemName: z.string() }),
  stageOrder: z.number().int(),
  statusKey: z.enum(['Active', 'Inactive']),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new CatalogItemApprovalPlan (omits system-generated ID)
 */
export const CreateCatalogItemApprovalPlanSchema = CatalogItemApprovalPlanSchema.omit({ id: true });

/**
 * Schema for updating an existing CatalogItemApprovalPlan
 */
export const UpdateCatalogItemApprovalPlanSchema = CatalogItemApprovalPlanSchema;

export type CatalogItemApprovalPlanInput = z.infer<typeof CatalogItemApprovalPlanSchema>;
export type CreateCatalogItemApprovalPlanInput = z.infer<typeof CreateCatalogItemApprovalPlanSchema>;
export type UpdateCatalogItemApprovalPlanInput = z.infer<typeof UpdateCatalogItemApprovalPlanSchema>;