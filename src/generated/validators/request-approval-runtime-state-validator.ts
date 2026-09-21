import { z } from 'zod';

/**
 * Zod schema for RequestApprovalRuntimeState validation
 */
export const RequestApprovalRuntimeStateSchema = z.object({
  id: z.string().uuid(),
  runtimeStateName: z.string().min(1, { message: "Runtime State Name is required" }),
  activatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  approvalStage: z.object({ id: z.string().uuid(), name1: z.string() }),
  completedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  correlationKey: z.string().min(1, { message: "Correlation Key is required" }),
  effectiveApprover: z.object({ id: z.string().uuid(), displayName: z.string() }),
  escalatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  expiresAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  originalApprover: z.object({ id: z.string().uuid(), displayName: z.string() }),
  requestApproval: z.object({ id: z.string().uuid(), approvalName: z.string() }),
  targetRecordID: z.string().min(1, { message: "Target Record ID is required" }),
  targetTypeKey: z.enum(['Request', 'Change', 'Generic']),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new RequestApprovalRuntimeState (omits system-generated ID)
 */
export const CreateRequestApprovalRuntimeStateSchema = RequestApprovalRuntimeStateSchema.omit({ id: true });

/**
 * Schema for updating an existing RequestApprovalRuntimeState
 */
export const UpdateRequestApprovalRuntimeStateSchema = RequestApprovalRuntimeStateSchema;

export type RequestApprovalRuntimeStateInput = z.infer<typeof RequestApprovalRuntimeStateSchema>;
export type CreateRequestApprovalRuntimeStateInput = z.infer<typeof CreateRequestApprovalRuntimeStateSchema>;
export type UpdateRequestApprovalRuntimeStateInput = z.infer<typeof UpdateRequestApprovalRuntimeStateSchema>;