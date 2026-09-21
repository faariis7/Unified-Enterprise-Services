import { z } from 'zod';

/**
 * Zod schema for CatalogItemFormAssignment validation
 */
export const CatalogItemFormAssignmentSchema = z.object({
  id: z.string().uuid(),
  assignmentName: z.string().min(1, { message: "Assignment Name is required" }),
  catalogItem: z.object({ id: z.string().uuid(), itemName: z.string() }),
  effectiveFrom: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").min(1, { message: "Effective From is required" }),
  effectiveTo: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  formDefinition: z.object({ id: z.string().uuid(), name1: z.string() }),
  formVersion: z.object({ id: z.string().uuid(), snapshotLabel: z.string() }),
  isDefault: z.boolean(),
  statusKey: z.enum(['Active', 'Inactive']),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new CatalogItemFormAssignment (omits system-generated ID)
 */
export const CreateCatalogItemFormAssignmentSchema = CatalogItemFormAssignmentSchema.omit({ id: true });

/**
 * Schema for updating an existing CatalogItemFormAssignment
 */
export const UpdateCatalogItemFormAssignmentSchema = CatalogItemFormAssignmentSchema;

export type CatalogItemFormAssignmentInput = z.infer<typeof CatalogItemFormAssignmentSchema>;
export type CreateCatalogItemFormAssignmentInput = z.infer<typeof CreateCatalogItemFormAssignmentSchema>;
export type UpdateCatalogItemFormAssignmentInput = z.infer<typeof UpdateCatalogItemFormAssignmentSchema>;