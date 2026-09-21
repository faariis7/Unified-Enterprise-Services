import { z } from 'zod';

/**
 * Zod schema for RequestApprovalSchedule validation
 */
export const RequestApprovalScheduleSchema = z.object({
  id: z.string().uuid(),
  idempotencyKey: z.string().min(1, { message: "Idempotency Key is required" }),
  escalationAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Escalation At is required" }),
  expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Expires At is required" }),
  reminderAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Reminder At is required" }),
  requestApproval: z.object({ id: z.string().uuid(), approvalName: z.string() }),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new RequestApprovalSchedule (omits system-generated ID)
 */
export const CreateRequestApprovalScheduleSchema = RequestApprovalScheduleSchema.omit({ id: true });

/**
 * Schema for updating an existing RequestApprovalSchedule
 */
export const UpdateRequestApprovalScheduleSchema = RequestApprovalScheduleSchema;

export type RequestApprovalScheduleInput = z.infer<typeof RequestApprovalScheduleSchema>;
export type CreateRequestApprovalScheduleInput = z.infer<typeof CreateRequestApprovalScheduleSchema>;
export type UpdateRequestApprovalScheduleInput = z.infer<typeof UpdateRequestApprovalScheduleSchema>;