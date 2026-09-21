import { z } from 'zod';

/**
 * Zod schema for RequestActivity validation
 */
export const RequestActivitySchema = z.object({
  id: z.string().uuid(),
  requestActivityName: z.string().min(1, { message: "Request Activity Name is required" }),
  activityTypeKey: z.enum(['Comment', 'Assignment', 'StatusChange', 'CustomerCommunication', 'InternalNote', 'Resolution']),
  actor: z.object({ id: z.string().uuid(), displayName: z.string() }),
  body: z.string().min(1, { message: "Body is required" }),
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Occurred At is required" }),
  request: z.object({ id: z.string().uuid(), requestNumber: z.string() }),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new RequestActivity (omits system-generated ID)
 */
export const CreateRequestActivitySchema = RequestActivitySchema.omit({ id: true });

/**
 * Schema for updating an existing RequestActivity
 */
export const UpdateRequestActivitySchema = RequestActivitySchema;

export type RequestActivityInput = z.infer<typeof RequestActivitySchema>;
export type CreateRequestActivityInput = z.infer<typeof CreateRequestActivitySchema>;
export type UpdateRequestActivityInput = z.infer<typeof UpdateRequestActivitySchema>;