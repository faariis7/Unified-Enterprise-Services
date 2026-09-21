import { z } from 'zod';

/**
 * Zod schema for RequestReminder validation
 */
export const RequestReminderSchema = z.object({
  id: z.string().uuid(),
  reminderName: z.string().min(1, { message: "ReminderName is required" }),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "CreatedAt is required" }),
  remindAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "RemindAt is required" }),
  remindPersonId: z.object({ id: z.string().uuid(), displayName: z.string() }),
  requestId: z.object({ id: z.string().uuid(), requestNumber: z.string() }),
  statusKey: z.enum(['Scheduled', 'Sent', 'Cancelled']),
  workspaceId: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new RequestReminder (omits system-generated ID)
 */
export const CreateRequestReminderSchema = RequestReminderSchema.omit({ id: true });

/**
 * Schema for updating an existing RequestReminder
 */
export const UpdateRequestReminderSchema = RequestReminderSchema;

export type RequestReminderInput = z.infer<typeof RequestReminderSchema>;
export type CreateRequestReminderInput = z.infer<typeof CreateRequestReminderSchema>;
export type UpdateRequestReminderInput = z.infer<typeof UpdateRequestReminderSchema>;