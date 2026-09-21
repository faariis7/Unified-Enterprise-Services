import { z } from 'zod';

/**
 * Zod schema for ConfigurationAuditEvent validation
 */
export const ConfigurationAuditEventSchema = z.object({
  id: z.string().uuid(),
  configurationAuditEventName: z.string().min(1, { message: "Configuration Audit Event Name is required" }),
  actionKey: z.enum(['Created', 'Updated', 'OverrideSet', 'OverrideReset']),
  actor: z.object({ id: z.string().uuid(), displayName: z.string() }),
  newValue: z.string().optional(),
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Occurred At is required" }),
  previousValue: z.string().optional(),
  scopeKey: z.enum(['Global', 'Workspace', 'Service', 'CatalogItem']),
  settingKey: z.string().min(1, { message: "Setting Key is required" }),
  sourceKey: z.enum(['GlobalDefault', 'WorkspaceOverride', 'ServiceOverride', 'CatalogItemOverride', 'RequestCalculated']),
  targetRecordID: z.string().min(1, { message: "Target Record ID is required" }),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }).optional(),
});

/**
 * Schema for creating a new ConfigurationAuditEvent (omits system-generated ID)
 */
export const CreateConfigurationAuditEventSchema = ConfigurationAuditEventSchema.omit({ id: true });

/**
 * Schema for updating an existing ConfigurationAuditEvent
 */
export const UpdateConfigurationAuditEventSchema = ConfigurationAuditEventSchema;

export type ConfigurationAuditEventInput = z.infer<typeof ConfigurationAuditEventSchema>;
export type CreateConfigurationAuditEventInput = z.infer<typeof CreateConfigurationAuditEventSchema>;
export type UpdateConfigurationAuditEventInput = z.infer<typeof UpdateConfigurationAuditEventSchema>;