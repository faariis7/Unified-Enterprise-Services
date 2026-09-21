import { z } from 'zod';

/**
 * Zod schema for CatalogItem validation
 */
export const CatalogItemSchema = z.object({
  id: z.string().uuid(),
  itemName: z.string().min(1, { message: "Item Name is required" }),
  approvalRequired: z.boolean(),
  defaultPriorityKey: z.enum(['Low', 'Medium', 'High', 'Critical']),
  formDefinition: z.object({ id: z.string().uuid(), name1: z.string() }),
  initialTaskTitle: z.string().optional(),
  itemCode: z.string().min(1, { message: "Item Code is required" }),
  requesterEligible: z.boolean(),
  requestTypeCode: z.string().min(1, { message: "Request Type Code is required" }),
  service: z.object({ id: z.string().uuid(), serviceName: z.string() }),
  serviceTargetHours: z.number().int(),
  shortDescription: z.string().min(1, { message: "Short Description is required" }),
  statusKey: z.enum(['Draft', 'Published', 'Retired']),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new CatalogItem (omits system-generated ID)
 */
export const CreateCatalogItemSchema = CatalogItemSchema.omit({ id: true });

/**
 * Schema for updating an existing CatalogItem
 */
export const UpdateCatalogItemSchema = CatalogItemSchema;

export type CatalogItemInput = z.infer<typeof CatalogItemSchema>;
export type CreateCatalogItemInput = z.infer<typeof CreateCatalogItemSchema>;
export type UpdateCatalogItemInput = z.infer<typeof UpdateCatalogItemSchema>;