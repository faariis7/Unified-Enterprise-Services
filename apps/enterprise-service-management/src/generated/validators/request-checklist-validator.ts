import { z } from 'zod';

/**
 * Zod schema for RequestChecklist validation
 */
export const RequestChecklistSchema = z.object({
  id: z.string().uuid(),
  checklistName: z.string().min(1, { message: "ChecklistName is required" }),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "CreatedAt is required" }),
  createdBy: z.object({ id: z.string().uuid(), displayName: z.string() }),
  requestId: z.object({ id: z.string().uuid(), requestNumber: z.string() }),
  statusKey: z.enum(['Open', 'Completed', 'Cancelled']),
  workspaceId: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new RequestChecklist (omits system-generated ID)
 */
export const CreateRequestChecklistSchema = RequestChecklistSchema.omit({ id: true });

/**
 * Schema for updating an existing RequestChecklist
 */
export const UpdateRequestChecklistSchema = RequestChecklistSchema;

export type RequestChecklistInput = z.infer<typeof RequestChecklistSchema>;
export type CreateRequestChecklistInput = z.infer<typeof CreateRequestChecklistSchema>;
export type UpdateRequestChecklistInput = z.infer<typeof UpdateRequestChecklistSchema>;