import { z } from 'zod';

/**
 * Zod schema for ServiceGovernanceProfile validation
 */
export const ServiceGovernanceProfileSchema = z.object({
  id: z.string().uuid(),
  profileName: z.string().min(1, { message: "Profile Name is required" }),
  auditor: z.object({ id: z.string().uuid(), displayName: z.string() }),
  backupOwner: z.object({ id: z.string().uuid(), displayName: z.string() }),
  makerCheckerRequired: z.boolean(),
  nextReviewDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").min(1, { message: "Next Review Date is required" }),
  publisher: z.object({ id: z.string().uuid(), displayName: z.string() }),
  reportAuthor: z.object({ id: z.string().uuid(), displayName: z.string() }),
  reviewFrequencyDays: z.number().int(),
  service: z.object({ id: z.string().uuid(), serviceName: z.string() }),
  serviceDesigner: z.object({ id: z.string().uuid(), displayName: z.string() }),
  serviceOwner: z.object({ id: z.string().uuid(), displayName: z.string() }),
  statusKey: z.enum(['Active', 'Inactive']),
  workflowDesigner: z.object({ id: z.string().uuid(), displayName: z.string() }),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new ServiceGovernanceProfile (omits system-generated ID)
 */
export const CreateServiceGovernanceProfileSchema = ServiceGovernanceProfileSchema.omit({ id: true });

/**
 * Schema for updating an existing ServiceGovernanceProfile
 */
export const UpdateServiceGovernanceProfileSchema = ServiceGovernanceProfileSchema;

export type ServiceGovernanceProfileInput = z.infer<typeof ServiceGovernanceProfileSchema>;
export type CreateServiceGovernanceProfileInput = z.infer<typeof CreateServiceGovernanceProfileSchema>;
export type UpdateServiceGovernanceProfileInput = z.infer<typeof UpdateServiceGovernanceProfileSchema>;