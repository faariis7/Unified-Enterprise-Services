import { z } from 'zod';

/**
 * Zod schema for RequestNotification validation
 */
export const RequestNotificationSchema = z.object({
  id: z.string().uuid(),
  notificationName: z.string().min(1, { message: "NotificationName is required" }),
  channelKey: z.enum(['Email', 'InApp', 'SMS']),
  message: z.string().min(1, { message: "Message is required" }),
  recipientPersonId: z.object({ id: z.string().uuid(), displayName: z.string() }),
  requestId: z.object({ id: z.string().uuid(), requestNumber: z.string() }),
  sentAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "SentAt is required" }),
  statusKey: z.enum(['Queued', 'Sent', 'Failed', 'Cancelled']),
  workspaceId: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new RequestNotification (omits system-generated ID)
 */
export const CreateRequestNotificationSchema = RequestNotificationSchema.omit({ id: true });

/**
 * Schema for updating an existing RequestNotification
 */
export const UpdateRequestNotificationSchema = RequestNotificationSchema;

export type RequestNotificationInput = z.infer<typeof RequestNotificationSchema>;
export type CreateRequestNotificationInput = z.infer<typeof CreateRequestNotificationSchema>;
export type UpdateRequestNotificationInput = z.infer<typeof UpdateRequestNotificationSchema>;