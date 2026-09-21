import { z } from 'zod';

/**
 * Zod schema for RequestChecklistItem validation
 */
export const RequestChecklistItemSchema = z.object({
  id: z.string().uuid(),
  itemName: z.string().min(1, { message: "ItemName is required" }),
  completed: z.boolean(),
  completedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "CompletedAt is required" }),
  completedBy: z.object({ id: z.string().uuid(), displayName: z.string() }),
  requestChecklistId: z.object({ id: z.string().uuid(), checklistName: z.string() }),
  requestId: z.object({ id: z.string().uuid(), requestNumber: z.string() }),
  workspaceId: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new RequestChecklistItem (omits system-generated ID)
 */
export const CreateRequestChecklistItemSchema = RequestChecklistItemSchema.omit({ id: true });

/**
 * Schema for updating an existing RequestChecklistItem
 */
export const UpdateRequestChecklistItemSchema = RequestChecklistItemSchema;

export type RequestChecklistItemInput = z.infer<typeof RequestChecklistItemSchema>;
export type CreateRequestChecklistItemInput = z.infer<typeof CreateRequestChecklistItemSchema>;
export type UpdateRequestChecklistItemInput = z.infer<typeof UpdateRequestChecklistItemSchema>;