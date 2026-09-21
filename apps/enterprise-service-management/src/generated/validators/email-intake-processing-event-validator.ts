import { z } from 'zod';

/**
 * Zod schema for EmailIntakeProcessingEvent validation
 */
export const EmailIntakeProcessingEventSchema = z.object({
  id: z.string().uuid(),
  eventName: z.string().min(1, { message: "Event Name is required" }),
  actorPerson: z.object({ id: z.string().uuid(), displayName: z.string() }).optional(),
  detail: z.string().min(1, { message: "Detail is required" }),
  emailIntakeMessage: z.object({ id: z.string().uuid(), messageName: z.string() }),
  eventTypeKey: z.enum(['Discovered', 'Validation', 'Matched', 'RequestCreated', 'ReplyAdded', 'AttachmentAdded', 'Duplicate', 'NeedsReview', 'Failed', 'Retried']),
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Occurred At is required" }),
});

/**
 * Schema for creating a new EmailIntakeProcessingEvent (omits system-generated ID)
 */
export const CreateEmailIntakeProcessingEventSchema = EmailIntakeProcessingEventSchema.omit({ id: true });

/**
 * Schema for updating an existing EmailIntakeProcessingEvent
 */
export const UpdateEmailIntakeProcessingEventSchema = EmailIntakeProcessingEventSchema;

export type EmailIntakeProcessingEventInput = z.infer<typeof EmailIntakeProcessingEventSchema>;
export type CreateEmailIntakeProcessingEventInput = z.infer<typeof CreateEmailIntakeProcessingEventSchema>;
export type UpdateEmailIntakeProcessingEventInput = z.infer<typeof UpdateEmailIntakeProcessingEventSchema>;