import { z } from 'zod';

/**
 * Zod schema for KnowledgeArticle validation
 */
export const KnowledgeArticleSchema = z.object({
  id: z.string().uuid(),
  articleNumber: z.string().min(1, { message: "Article Number is required" }),
  audienceKey: z.enum(['Requesters', 'Agents', 'AllMembers']),
  createdAndUpdatedAuditFields: z.string().min(1, { message: "Created and Updated Audit Fields is required" }),
  currentVersionNumber: z.number().int(),
  knowledgeCategory: z.object({ id: z.string().uuid(), name1: z.string() }),
  ownerPerson: z.object({ id: z.string().uuid(), displayName: z.string() }),
  publishedAndReviewDates: z.string().min(1, { message: "Published and Review Dates is required" }),
  stateKey: z.enum(['Draft', 'Review', 'Published', 'Archived']),
  summary: z.string().min(1, { message: "Summary is required" }),
  tags: z.string().min(1, { message: "Tags is required" }),
  title: z.string().min(1, { message: "Title is required" }),
  viewAndFeedbackCounts: z.string().min(1, { message: "View and Feedback Counts is required" }),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new KnowledgeArticle (omits system-generated ID)
 */
export const CreateKnowledgeArticleSchema = KnowledgeArticleSchema.omit({ id: true });

/**
 * Schema for updating an existing KnowledgeArticle
 */
export const UpdateKnowledgeArticleSchema = KnowledgeArticleSchema;

export type KnowledgeArticleInput = z.infer<typeof KnowledgeArticleSchema>;
export type CreateKnowledgeArticleInput = z.infer<typeof CreateKnowledgeArticleSchema>;
export type UpdateKnowledgeArticleInput = z.infer<typeof UpdateKnowledgeArticleSchema>;