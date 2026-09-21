import { z } from 'zod';

/**
 * Zod schema for RequestAssignmentHistory validation
 */
export const RequestAssignmentHistorySchema = z.object({
  id: z.string().uuid(),
  assignmentHistoryName: z.string().min(1, { message: "AssignmentHistoryName is required" }),
  assignedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "AssignedAt is required" }),
  assignedBy: z.object({ id: z.string().uuid(), displayName: z.string() }),
  assignedPersonId: z.object({ id: z.string().uuid(), displayName: z.string() }),
  assignmentGroupId: z.string().min(1, { message: "AssignmentGroupId is required" }),
  requestId: z.object({ id: z.string().uuid(), requestNumber: z.string() }),
  workspaceId: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new RequestAssignmentHistory (omits system-generated ID)
 */
export const CreateRequestAssignmentHistorySchema = RequestAssignmentHistorySchema.omit({ id: true });

/**
 * Schema for updating an existing RequestAssignmentHistory
 */
export const UpdateRequestAssignmentHistorySchema = RequestAssignmentHistorySchema;

export type RequestAssignmentHistoryInput = z.infer<typeof RequestAssignmentHistorySchema>;
export type CreateRequestAssignmentHistoryInput = z.infer<typeof CreateRequestAssignmentHistorySchema>;
export type UpdateRequestAssignmentHistoryInput = z.infer<typeof UpdateRequestAssignmentHistorySchema>;