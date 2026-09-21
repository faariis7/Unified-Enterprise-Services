import { z } from 'zod';

/**
 * Zod schema for KnowledgeFeedback validation
 */
export const KnowledgeFeedbackSchema = z.object({
  id: z.string().uuid(),
  feedbackLabel: z.string().min(1, { message: "Feedback Label is required" }),
  comments: z.string().optional(),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Created At is required" }),
  helpful: z.boolean(),
  knowledgeArticle: z.object({ id: z.string().uuid(), articleNumber: z.string() }),
  knowledgeVersion: z.object({ id: z.string().uuid(), immutableSnapshotLabel: z.string() }).optional(),
  person: z.object({ id: z.string().uuid(), displayName: z.string() }),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new KnowledgeFeedback (omits system-generated ID)
 */
export const CreateKnowledgeFeedbackSchema = KnowledgeFeedbackSchema.omit({ id: true });

/**
 * Schema for updating an existing KnowledgeFeedback
 */
export const UpdateKnowledgeFeedbackSchema = KnowledgeFeedbackSchema;

export type KnowledgeFeedbackInput = z.infer<typeof KnowledgeFeedbackSchema>;
export type CreateKnowledgeFeedbackInput = z.infer<typeof CreateKnowledgeFeedbackSchema>;
export type UpdateKnowledgeFeedbackInput = z.infer<typeof UpdateKnowledgeFeedbackSchema>;