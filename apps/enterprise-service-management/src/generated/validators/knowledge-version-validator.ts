import { z } from 'zod';

/**
 * Zod schema for KnowledgeVersion validation
 */
export const KnowledgeVersionSchema = z.object({
  id: z.string().uuid(),
  immutableSnapshotLabel: z.string().min(1, { message: "Immutable Snapshot Label is required" }),
  author: z.object({ id: z.string().uuid(), displayName: z.string() }),
  bodyContent: z.string().min(1, { message: "Body Content is required" }),
  changeNotes: z.string().min(1, { message: "Change Notes is required" }),
  knowledgeArticle: z.object({ id: z.string().uuid(), articleNumber: z.string() }),
  reviewComments: z.string().min(1, { message: "Review Comments is required" }),
  reviewer: z.object({ id: z.string().uuid(), displayName: z.string() }),
  stateKey: z.enum(['Draft', 'Review', 'Published', 'Archived']),
  submittedReviewedAndPublishedTimestamps: z.string().min(1, { message: "Submitted, Reviewed, and Published Timestamps is required" }),
  summary: z.string().min(1, { message: "Summary is required" }),
  title: z.string().min(1, { message: "Title is required" }),
  versionNumber: z.number().int(),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new KnowledgeVersion (omits system-generated ID)
 */
export const CreateKnowledgeVersionSchema = KnowledgeVersionSchema.omit({ id: true });

/**
 * Schema for updating an existing KnowledgeVersion
 */
export const UpdateKnowledgeVersionSchema = KnowledgeVersionSchema;

export type KnowledgeVersionInput = z.infer<typeof KnowledgeVersionSchema>;
export type CreateKnowledgeVersionInput = z.infer<typeof CreateKnowledgeVersionSchema>;
export type UpdateKnowledgeVersionInput = z.infer<typeof UpdateKnowledgeVersionSchema>;