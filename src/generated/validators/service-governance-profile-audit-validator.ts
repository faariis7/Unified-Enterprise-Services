import { z } from 'zod';

/**
 * Zod schema for ServiceGovernanceProfileAudit validation
 */
export const ServiceGovernanceProfileAuditSchema = z.object({
  id: z.string().uuid(),
  auditName: z.string().min(1, { message: "Audit Name is required" }),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Created At is required" }),
  createdBy: z.object({ id: z.string().uuid(), displayName: z.string() }),
  isDeleted: z.boolean(),
  lastReviewDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  serviceGovernanceProfile: z.object({ id: z.string().uuid(), profileName: z.string() }),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Updated At is required" }),
  updatedBy: z.object({ id: z.string().uuid(), displayName: z.string() }),
});

/**
 * Schema for creating a new ServiceGovernanceProfileAudit (omits system-generated ID)
 */
export const CreateServiceGovernanceProfileAuditSchema = ServiceGovernanceProfileAuditSchema.omit({ id: true });

/**
 * Schema for updating an existing ServiceGovernanceProfileAudit
 */
export const UpdateServiceGovernanceProfileAuditSchema = ServiceGovernanceProfileAuditSchema;

export type ServiceGovernanceProfileAuditInput = z.infer<typeof ServiceGovernanceProfileAuditSchema>;
export type CreateServiceGovernanceProfileAuditInput = z.infer<typeof CreateServiceGovernanceProfileAuditSchema>;
export type UpdateServiceGovernanceProfileAuditInput = z.infer<typeof UpdateServiceGovernanceProfileAuditSchema>;