import { z } from 'zod';

/**
 * Zod schema for RequestTag validation
 */
export const RequestTagSchema = z.object({
  id: z.string().uuid(),
  tagName: z.string().min(1, { message: "Tag Name is required" }),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Created At is required" }),
  createdBy: z.object({ id: z.string().uuid(), displayName: z.string() }),
  request: z.object({ id: z.string().uuid(), requestNumber: z.string() }),
  value: z.string().min(1, { message: "Value is required" }),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new RequestTag (omits system-generated ID)
 */
export const CreateRequestTagSchema = RequestTagSchema.omit({ id: true });

/**
 * Schema for updating an existing RequestTag
 */
export const UpdateRequestTagSchema = RequestTagSchema;

export type RequestTagInput = z.infer<typeof RequestTagSchema>;
export type CreateRequestTagInput = z.infer<typeof CreateRequestTagSchema>;
export type UpdateRequestTagInput = z.infer<typeof UpdateRequestTagSchema>;