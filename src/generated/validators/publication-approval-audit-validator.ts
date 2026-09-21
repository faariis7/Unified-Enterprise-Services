import { z } from 'zod';

/**
 * Zod schema for PublicationApprovalAudit validation
 */
export const PublicationApprovalAuditSchema = z.object({
  id: z.string().uuid(),
  auditName: z.string().min(1, { message: "Audit Name is required" }),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Created At is required" }),
  publicationApproval: z.object({ id: z.string().uuid(), approvalName: z.string() }),
  publishedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  publishedBy: z.object({ id: z.string().uuid(), displayName: z.string() }).optional(),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Updated At is required" }),
});

/**
 * Schema for creating a new PublicationApprovalAudit (omits system-generated ID)
 */
export const CreatePublicationApprovalAuditSchema = PublicationApprovalAuditSchema.omit({ id: true });

/**
 * Schema for updating an existing PublicationApprovalAudit
 */
export const UpdatePublicationApprovalAuditSchema = PublicationApprovalAuditSchema;

export type PublicationApprovalAuditInput = z.infer<typeof PublicationApprovalAuditSchema>;
export type CreatePublicationApprovalAuditInput = z.infer<typeof CreatePublicationApprovalAuditSchema>;
export type UpdatePublicationApprovalAuditInput = z.infer<typeof UpdatePublicationApprovalAuditSchema>;