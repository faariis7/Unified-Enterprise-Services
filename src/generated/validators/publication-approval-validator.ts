import { z } from 'zod';

/**
 * Zod schema for PublicationApproval validation
 */
export const PublicationApprovalSchema = z.object({
  id: z.string().uuid(),
  approvalName: z.string().min(1, { message: "Approval Name is required" }),
  changeReason: z.string().min(1, { message: "Change Reason is required" }),
  formVersion: z.object({ id: z.string().uuid(), snapshotLabel: z.string() }),
  isDeleted: z.boolean(),
  makerCheckerSatisfied: z.boolean(),
  requestedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Requested At is required" }),
  requestedBy: z.object({ id: z.string().uuid(), displayName: z.string() }),
  reviewComment: z.string().optional(),
  reviewDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").min(1, { message: "Review Date is required" }),
  reviewedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  reviewedBy: z.object({ id: z.string().uuid(), displayName: z.string() }).optional(),
  service: z.object({ id: z.string().uuid(), serviceName: z.string() }),
  statusKey: z.enum(['Pending', 'Approved', 'Rejected', 'Withdrawn']),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new PublicationApproval (omits system-generated ID)
 */
export const CreatePublicationApprovalSchema = PublicationApprovalSchema.omit({ id: true });

/**
 * Schema for updating an existing PublicationApproval
 */
export const UpdatePublicationApprovalSchema = PublicationApprovalSchema;

export type PublicationApprovalInput = z.infer<typeof PublicationApprovalSchema>;
export type CreatePublicationApprovalInput = z.infer<typeof CreatePublicationApprovalSchema>;
export type UpdatePublicationApprovalInput = z.infer<typeof UpdatePublicationApprovalSchema>;