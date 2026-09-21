import { z } from 'zod';

/**
 * Zod schema for RequestTransitionExecution validation
 */
export const RequestTransitionExecutionSchema = z.object({
  id: z.string().uuid(),
  executionName: z.string().min(1, { message: "Execution Name is required" }),
  actor: z.object({ id: z.string().uuid(), displayName: z.string() }),
  comment: z.string().optional(),
  executedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Executed At is required" }),
  failureReason: z.string().optional(),
  lifecycleTransition: z.object({ id: z.string().uuid(), transitionName: z.string() }),
  request: z.object({ id: z.string().uuid(), requestNumber: z.string() }),
  source: z.string().min(1, { message: "Source is required" }),
  statusKey: z.enum(['Succeeded', 'Failed', 'Blocked']),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new RequestTransitionExecution (omits system-generated ID)
 */
export const CreateRequestTransitionExecutionSchema = RequestTransitionExecutionSchema.omit({ id: true });

/**
 * Schema for updating an existing RequestTransitionExecution
 */
export const UpdateRequestTransitionExecutionSchema = RequestTransitionExecutionSchema;

export type RequestTransitionExecutionInput = z.infer<typeof RequestTransitionExecutionSchema>;
export type CreateRequestTransitionExecutionInput = z.infer<typeof CreateRequestTransitionExecutionSchema>;
export type UpdateRequestTransitionExecutionInput = z.infer<typeof UpdateRequestTransitionExecutionSchema>;