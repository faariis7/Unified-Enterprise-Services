import { z } from 'zod';

/**
 * Zod schema for StatusDefinition validation
 */
export const StatusDefinitionSchema = z.object({
  id: z.string().uuid(),
  statusName: z.string().min(1, { message: "Status Name is required" }),
  isInitial: z.boolean(),
  isTerminal: z.boolean(),
  lifecycleDefinitionID: z.object({ id: z.string().uuid(), name1: z.string() }),
  lifecycleStageID: z.object({ id: z.string().uuid(), stageName: z.string() }),
  sortOrder: z.number().int(),
  statusCode: z.string().min(1, { message: "Status Code is required" }),
  statusKey: z.enum(['Active', 'Inactive']),
  workspaceID: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new StatusDefinition (omits system-generated ID)
 */
export const CreateStatusDefinitionSchema = StatusDefinitionSchema.omit({ id: true });

/**
 * Schema for updating an existing StatusDefinition
 */
export const UpdateStatusDefinitionSchema = StatusDefinitionSchema;

export type StatusDefinitionInput = z.infer<typeof StatusDefinitionSchema>;
export type CreateStatusDefinitionInput = z.infer<typeof CreateStatusDefinitionSchema>;
export type UpdateStatusDefinitionInput = z.infer<typeof UpdateStatusDefinitionSchema>;