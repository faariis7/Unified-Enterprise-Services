import { z } from 'zod';

/**
 * Zod schema for Service validation
 */
export const ServiceSchema = z.object({
  id: z.string().uuid(),
  serviceName: z.string().min(1, { message: "Service Name is required" }),
  audienceConfiguration: z.string().optional(),
  availabilityConfiguration: z.string().optional(),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  currentPublishedFormVersion: z.object({ id: z.string().uuid(), snapshotLabel: z.string() }).optional(),
  defaultAssignmentGroupCode: z.string().min(1, { message: "Default Assignment Group Code is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  instructions: z.string().optional(),
  isDeleted: z.boolean().optional(),
  lifecycleStateKey: z.enum(['Draft', 'Published', 'Retired']).optional(),
  owner: z.object({ id: z.string().uuid(), displayName: z.string() }).optional(),
  ownerPerson: z.object({ id: z.string().uuid(), displayName: z.string() }).optional(),
  reportingConfiguration: z.string().optional(),
  requesterEligible: z.boolean(),
  serviceCategory: z.object({ id: z.string().uuid(), name1: z.string() }),
  serviceCode: z.string().min(1, { message: "Service Code is required" }),
  sortOrder: z.number().int().optional(),
  statusKey: z.enum(['Active', 'Inactive']),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new Service (omits system-generated ID)
 */
export const CreateServiceSchema = ServiceSchema.omit({ id: true });

/**
 * Schema for updating an existing Service
 */
export const UpdateServiceSchema = ServiceSchema;

export type ServiceInput = z.infer<typeof ServiceSchema>;
export type CreateServiceInput = z.infer<typeof CreateServiceSchema>;
export type UpdateServiceInput = z.infer<typeof UpdateServiceSchema>;