import { z } from 'zod';

/**
 * Zod schema for RequestFeedback validation
 */
export const RequestFeedbackSchema = z.object({
  id: z.string().uuid(),
  feedbackName: z.string().min(1, { message: "FeedbackName is required" }),
  comments: z.string().min(1, { message: "Comments is required" }),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "CreatedAt is required" }),
  personId: z.object({ id: z.string().uuid(), displayName: z.string() }),
  rating: z.number().int(),
  requestId: z.object({ id: z.string().uuid(), requestNumber: z.string() }),
  workspaceId: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new RequestFeedback (omits system-generated ID)
 */
export const CreateRequestFeedbackSchema = RequestFeedbackSchema.omit({ id: true });

/**
 * Schema for updating an existing RequestFeedback
 */
export const UpdateRequestFeedbackSchema = RequestFeedbackSchema;

export type RequestFeedbackInput = z.infer<typeof RequestFeedbackSchema>;
export type CreateRequestFeedbackInput = z.infer<typeof CreateRequestFeedbackSchema>;
export type UpdateRequestFeedbackInput = z.infer<typeof UpdateRequestFeedbackSchema>;