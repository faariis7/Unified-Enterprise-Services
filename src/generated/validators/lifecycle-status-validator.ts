import { z } from 'zod';

/**
 * Zod schema for LifecycleStatus validation
 */
export const LifecycleStatusSchema = z.object({
  id: z.string().uuid(),
  statusName: z.string().min(1, { message: "Status Name is required" }),
  lifecycle: z.object({ id: z.string().uuid(), name1: z.string() }),
  pauseTargets: z.boolean(),
  sortOrder: z.number().int(),
  stageCode: z.string().min(1, { message: "Stage Code is required" }),
  statusCode: z.string().min(1, { message: "Status Code is required" }),
  statusKey: z.enum(['Active', 'Inactive']),
  terminal: z.boolean(),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new LifecycleStatus (omits system-generated ID)
 */
export const CreateLifecycleStatusSchema = LifecycleStatusSchema.omit({ id: true });

/**
 * Schema for updating an existing LifecycleStatus
 */
export const UpdateLifecycleStatusSchema = LifecycleStatusSchema;

export type LifecycleStatusInput = z.infer<typeof LifecycleStatusSchema>;
export type CreateLifecycleStatusInput = z.infer<typeof CreateLifecycleStatusSchema>;
export type UpdateLifecycleStatusInput = z.infer<typeof UpdateLifecycleStatusSchema>;