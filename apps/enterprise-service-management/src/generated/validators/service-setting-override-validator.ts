import { z } from 'zod';

/**
 * Zod schema for ServiceSettingOverride validation
 */
export const ServiceSettingOverrideSchema = z.object({
  id: z.string().uuid(),
  serviceSettingOverrideName: z.string().min(1, { message: "Service Setting Override Name is required" }),
  active: z.boolean(),
  globalSetting: z.object({ id: z.string().uuid(), settingKey: z.string() }),
  overrideValue: z.string().min(1, { message: "Override Value is required" }),
  serviceCode: z.string().min(1, { message: "Service Code is required" }),
  serviceName: z.string().min(1, { message: "Service Name is required" }),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Updated At is required" }),
  updatedBy: z.object({ id: z.string().uuid(), displayName: z.string() }),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new ServiceSettingOverride (omits system-generated ID)
 */
export const CreateServiceSettingOverrideSchema = ServiceSettingOverrideSchema.omit({ id: true });

/**
 * Schema for updating an existing ServiceSettingOverride
 */
export const UpdateServiceSettingOverrideSchema = ServiceSettingOverrideSchema;

export type ServiceSettingOverrideInput = z.infer<typeof ServiceSettingOverrideSchema>;
export type CreateServiceSettingOverrideInput = z.infer<typeof CreateServiceSettingOverrideSchema>;
export type UpdateServiceSettingOverrideInput = z.infer<typeof UpdateServiceSettingOverrideSchema>;