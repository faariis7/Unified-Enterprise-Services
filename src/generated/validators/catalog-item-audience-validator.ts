import { z } from 'zod';

/**
 * Zod schema for CatalogItemAudience validation
 */
export const CatalogItemAudienceSchema = z.object({
  id: z.string().uuid(),
  audienceName: z.string().min(1, { message: "Audience Name is required" }),
  audienceReference: z.string().min(1, { message: "Audience Reference is required" }),
  audienceTypeKey: z.enum(['AllMembers', 'Role', 'Department', 'Site', 'Person']),
  catalogItem: z.object({ id: z.string().uuid(), itemName: z.string() }),
  isEligible: z.boolean(),
  statusKey: z.enum(['Active', 'Inactive']),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new CatalogItemAudience (omits system-generated ID)
 */
export const CreateCatalogItemAudienceSchema = CatalogItemAudienceSchema.omit({ id: true });

/**
 * Schema for updating an existing CatalogItemAudience
 */
export const UpdateCatalogItemAudienceSchema = CatalogItemAudienceSchema;

export type CatalogItemAudienceInput = z.infer<typeof CatalogItemAudienceSchema>;
export type CreateCatalogItemAudienceInput = z.infer<typeof CreateCatalogItemAudienceSchema>;
export type UpdateCatalogItemAudienceInput = z.infer<typeof UpdateCatalogItemAudienceSchema>;