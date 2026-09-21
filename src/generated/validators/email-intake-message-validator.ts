import { z } from 'zod';

/**
 * Zod schema for EmailIntakeMessage validation
 */
export const EmailIntakeMessageSchema = z.object({
  id: z.string().uuid(),
  messageName: z.string().min(1, { message: "Message Name is required" }),
  attemptCount: z.number().int(),
  bodyPreview: z.string().min(1, { message: "Body Preview is required" }),
  conversationID: z.string().min(1, { message: "Conversation ID is required" }),
  emailIntakeConfiguration: z.object({ id: z.string().uuid(), configurationName: z.string() }),
  hasAttachments: z.boolean(),
  internetMessageID: z.string().min(1, { message: "Internet Message ID is required" }),
  lastError: z.string().optional(),
  matchedPerson: z.object({ id: z.string().uuid(), displayName: z.string() }).optional(),
  matchedRequest: z.object({ id: z.string().uuid(), requestNumber: z.string() }).optional(),
  microsoftMessageID: z.string().min(1, { message: "Microsoft Message ID is required" }),
  outcomeDetail: z.string().min(1, { message: "Outcome Detail is required" }),
  processedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Processed At is required" }),
  processingStatusKey: z.enum(['Discovered', 'Processing', 'Processed', 'Duplicate', 'NeedsReview', 'Failed']),
  receivedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Received At is required" }),
  senderEmail: z.string().email().min(1, { message: "Sender Email is required" }),
  senderName: z.string().min(1, { message: "Sender Name is required" }),
  subject: z.string().min(1, { message: "Subject is required" }),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new EmailIntakeMessage (omits system-generated ID)
 */
export const CreateEmailIntakeMessageSchema = EmailIntakeMessageSchema.omit({ id: true });

/**
 * Schema for updating an existing EmailIntakeMessage
 */
export const UpdateEmailIntakeMessageSchema = EmailIntakeMessageSchema;

export type EmailIntakeMessageInput = z.infer<typeof EmailIntakeMessageSchema>;
export type CreateEmailIntakeMessageInput = z.infer<typeof CreateEmailIntakeMessageSchema>;
export type UpdateEmailIntakeMessageInput = z.infer<typeof UpdateEmailIntakeMessageSchema>;