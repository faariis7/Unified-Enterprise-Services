import { z } from 'zod';

/**
 * Zod schema for StatusTransition validation
 */
export const StatusTransitionSchema = z.object({
  id: z.string().uuid(),
  transitionName: z.string().min(1, { message: "Transition Name is required" }),
  destinationStatusDefinitionID: z.object({ id: z.string().uuid(), statusName: z.string() }),
  lifecycleDefinitionID: z.object({ id: z.string().uuid(), name1: z.string() }),
  sortOrder: z.number().int(),
  sourceStatusDefinitionID: z.object({ id: z.string().uuid(), statusName: z.string() }),
  statusKey: z.enum(['Active', 'Inactive']),
  transitionCode: z.string().min(1, { message: "Transition Code is required" }),
  workspaceID: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new StatusTransition (omits system-generated ID)
 */
export const CreateStatusTransitionSchema = StatusTransitionSchema.omit({ id: true });

/**
 * Schema for updating an existing StatusTransition
 */
export const UpdateStatusTransitionSchema = StatusTransitionSchema;

export type StatusTransitionInput = z.infer<typeof StatusTransitionSchema>;
export type CreateStatusTransitionInput = z.infer<typeof CreateStatusTransitionSchema>;
export type UpdateStatusTransitionInput = z.infer<typeof UpdateStatusTransitionSchema>;