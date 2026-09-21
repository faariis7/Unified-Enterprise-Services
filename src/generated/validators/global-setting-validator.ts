import { z } from 'zod';

/**
 * Zod schema for GlobalSetting validation
 */
export const GlobalSettingSchema = z.object({
  id: z.string().uuid(),
  settingKey: z.string().min(1, { message: "Setting Key is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Updated At is required" }),
  updatedBy: z.object({ id: z.string().uuid(), displayName: z.string() }),
  value: z.string().min(1, { message: "Value is required" }),
  valueTypeKey: z.enum(['Text', 'WholeNumber', 'Decimal', 'YesNo', 'JSON']),
});

/**
 * Schema for creating a new GlobalSetting (omits system-generated ID)
 */
export const CreateGlobalSettingSchema = GlobalSettingSchema.omit({ id: true });

/**
 * Schema for updating an existing GlobalSetting
 */
export const UpdateGlobalSettingSchema = GlobalSettingSchema;

export type GlobalSettingInput = z.infer<typeof GlobalSettingSchema>;
export type CreateGlobalSettingInput = z.infer<typeof CreateGlobalSettingSchema>;
export type UpdateGlobalSettingInput = z.infer<typeof UpdateGlobalSettingSchema>;