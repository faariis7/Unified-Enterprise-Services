import { z } from 'zod';

/**
 * Zod schema for LifecycleStage validation
 */
export const LifecycleStageSchema = z.object({
  id: z.string().uuid(),
  stageName: z.string().min(1, { message: "Stage Name is required" }),
  lifecycleDefinitionID: z.object({ id: z.string().uuid(), name1: z.string() }),
  sortOrder: z.number().int(),
  stageCode: z.string().min(1, { message: "Stage Code is required" }),
  statusKey: z.enum(['Active', 'Inactive']),
  workspaceID: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new LifecycleStage (omits system-generated ID)
 */
export const CreateLifecycleStageSchema = LifecycleStageSchema.omit({ id: true });

/**
 * Schema for updating an existing LifecycleStage
 */
export const UpdateLifecycleStageSchema = LifecycleStageSchema;

export type LifecycleStageInput = z.infer<typeof LifecycleStageSchema>;
export type CreateLifecycleStageInput = z.infer<typeof CreateLifecycleStageSchema>;
export type UpdateLifecycleStageInput = z.infer<typeof UpdateLifecycleStageSchema>;