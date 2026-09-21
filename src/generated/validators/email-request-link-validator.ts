import { z } from 'zod';

/**
 * Zod schema for EmailRequestLink validation
 */
export const EmailRequestLinkSchema = z.object({
  id: z.string().uuid(),
  linkName: z.string().min(1, { message: "Link Name is required" }),
  conversationID: z.string().min(1, { message: "Conversation ID is required" }),
  emailIntakeMessage: z.object({ id: z.string().uuid(), messageName: z.string() }),
  internetMessageID: z.string().min(1, { message: "Internet Message ID is required" }),
  linkedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Linked At is required" }),
  relationshipTypeKey: z.enum(['Origin', 'Reply']),
  request: z.object({ id: z.string().uuid(), requestNumber: z.string() }),
});

/**
 * Schema for creating a new EmailRequestLink (omits system-generated ID)
 */
export const CreateEmailRequestLinkSchema = EmailRequestLinkSchema.omit({ id: true });

/**
 * Schema for updating an existing EmailRequestLink
 */
export const UpdateEmailRequestLinkSchema = EmailRequestLinkSchema;

export type EmailRequestLinkInput = z.infer<typeof EmailRequestLinkSchema>;
export type CreateEmailRequestLinkInput = z.infer<typeof CreateEmailRequestLinkSchema>;
export type UpdateEmailRequestLinkInput = z.infer<typeof UpdateEmailRequestLinkSchema>;