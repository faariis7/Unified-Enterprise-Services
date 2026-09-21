import { z } from 'zod';

/**
 * Zod schema for CatalogItemSettingOverride validation
 */
export const CatalogItemSettingOverrideSchema = z.object({
  id: z.string().uuid(),
  catalogItemSettingOverrideName: z.string().min(1, { message: "Catalog Item Setting Override Name is required" }),
  active: z.boolean(),
  catalogItemCode: z.string().min(1, { message: "Catalog Item Code is required" }),
  catalogItemName: z.string().min(1, { message: "Catalog Item Name is required" }),
  globalSetting: z.object({ id: z.string().uuid(), settingKey: z.string() }),
  overrideValue: z.string().min(1, { message: "Override Value is required" }),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Updated At is required" }),
  updatedBy: z.object({ id: z.string().uuid(), displayName: z.string() }),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new CatalogItemSettingOverride (omits system-generated ID)
 */
export const CreateCatalogItemSettingOverrideSchema = CatalogItemSettingOverrideSchema.omit({ id: true });

/**
 * Schema for updating an existing CatalogItemSettingOverride
 */
export const UpdateCatalogItemSettingOverrideSchema = CatalogItemSettingOverrideSchema;

export type CatalogItemSettingOverrideInput = z.infer<typeof CatalogItemSettingOverrideSchema>;
export type CreateCatalogItemSettingOverrideInput = z.infer<typeof CreateCatalogItemSettingOverrideSchema>;
export type UpdateCatalogItemSettingOverrideInput = z.infer<typeof UpdateCatalogItemSettingOverrideSchema>;