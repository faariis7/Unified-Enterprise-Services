import { z } from 'zod';

/**
 * Zod schema for ServiceCategory validation
 */
export const ServiceCategorySchema = z.object({
  id: z.string().uuid(),
  name1: z.string().min(1, { message: "Name is required" }),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  description: z.string().min(1, { message: "Description is required" }),
  icon: z.string().min(1, { message: "Icon is required" }),
  isDeleted: z.boolean().optional(),
  sortOrder: z.number().int(),
  statusKey: z.enum(['Active', 'Inactive']),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new ServiceCategory (omits system-generated ID)
 */
export const CreateServiceCategorySchema = ServiceCategorySchema.omit({ id: true });

/**
 * Schema for updating an existing ServiceCategory
 */
export const UpdateServiceCategorySchema = ServiceCategorySchema;

export type ServiceCategoryInput = z.infer<typeof ServiceCategorySchema>;
export type CreateServiceCategoryInput = z.infer<typeof CreateServiceCategorySchema>;
export type UpdateServiceCategoryInput = z.infer<typeof UpdateServiceCategorySchema>;