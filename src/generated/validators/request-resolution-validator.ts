import { z } from 'zod';

/**
 * Zod schema for RequestResolution validation
 */
export const RequestResolutionSchema = z.object({
  id: z.string().uuid(),
  requestResolutionName: z.string().min(1, { message: "Request Resolution Name is required" }),
  request: z.object({ id: z.string().uuid(), requestNumber: z.string() }),
  resolutionCodeKey: z.enum(['Fulfilled', 'Fixed', 'Workaround', 'InformationProvided', 'Duplicate', 'Cancelled']),
  resolvedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Resolved At is required" }),
  resolvedBy: z.object({ id: z.string().uuid(), displayName: z.string() }),
  summary: z.string().min(1, { message: "Summary is required" }),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new RequestResolution (omits system-generated ID)
 */
export const CreateRequestResolutionSchema = RequestResolutionSchema.omit({ id: true });

/**
 * Schema for updating an existing RequestResolution
 */
export const UpdateRequestResolutionSchema = RequestResolutionSchema;

export type RequestResolutionInput = z.infer<typeof RequestResolutionSchema>;
export type CreateRequestResolutionInput = z.infer<typeof CreateRequestResolutionSchema>;
export type UpdateRequestResolutionInput = z.infer<typeof UpdateRequestResolutionSchema>;