import { z } from 'zod';

/**
 * Zod schema for EmailIntakeConfiguration validation
 */
export const EmailIntakeConfigurationSchema = z.object({
  id: z.string().uuid(),
  configurationName: z.string().min(1, { message: "Configuration Name is required" }),
  defaultCatalogItem: z.object({ id: z.string().uuid(), itemName: z.string() }).optional(),
  defaultService: z.object({ id: z.string().uuid(), serviceName: z.string() }).optional(),
  enabled: z.boolean(),
  folderName: z.string().min(1, { message: "Folder Name is required" }),
  lastSyncAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Last Sync At is required" }),
  mailboxAddress: z.string().email().min(1, { message: "Mailbox Address is required" }),
  markAsRead: z.boolean(),
  unknownSenderBehaviorKey: z.enum(['NeedsReview', 'Reject']),
  updatedBy: z.object({ id: z.string().uuid(), displayName: z.string() }),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new EmailIntakeConfiguration (omits system-generated ID)
 */
export const CreateEmailIntakeConfigurationSchema = EmailIntakeConfigurationSchema.omit({ id: true });

/**
 * Schema for updating an existing EmailIntakeConfiguration
 */
export const UpdateEmailIntakeConfigurationSchema = EmailIntakeConfigurationSchema;

export type EmailIntakeConfigurationInput = z.infer<typeof EmailIntakeConfigurationSchema>;
export type CreateEmailIntakeConfigurationInput = z.infer<typeof CreateEmailIntakeConfigurationSchema>;
export type UpdateEmailIntakeConfigurationInput = z.infer<typeof UpdateEmailIntakeConfigurationSchema>;