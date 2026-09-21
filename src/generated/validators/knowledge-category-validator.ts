import { z } from 'zod';

/**
 * Zod schema for KnowledgeCategory validation
 */
export const KnowledgeCategorySchema = z.object({
  id: z.string().uuid(),
  name1: z.string().min(1, { message: "Name is required" }),
  active: z.boolean(),
  description: z.string().min(1, { message: "Description is required" }),
  icon: z.string().min(1, { message: "Icon is required" }),
  parentCategory: z.object({ id: z.string().uuid(), name1: z.string() }).optional(),
  sortOrder: z.number().int(),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new KnowledgeCategory (omits system-generated ID)
 */
export const CreateKnowledgeCategorySchema = KnowledgeCategorySchema.omit({ id: true });

/**
 * Schema for updating an existing KnowledgeCategory
 */
export const UpdateKnowledgeCategorySchema = KnowledgeCategorySchema;

export type KnowledgeCategoryInput = z.infer<typeof KnowledgeCategorySchema>;
export type CreateKnowledgeCategoryInput = z.infer<typeof CreateKnowledgeCategorySchema>;
export type UpdateKnowledgeCategoryInput = z.infer<typeof UpdateKnowledgeCategorySchema>;