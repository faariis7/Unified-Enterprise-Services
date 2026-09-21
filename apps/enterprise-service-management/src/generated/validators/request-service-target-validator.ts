import { z } from 'zod';

/**
 * Zod schema for RequestServiceTarget validation
 */
export const RequestServiceTargetSchema = z.object({
  id: z.string().uuid(),
  snapshotPolicyName: z.string().min(1, { message: "Snapshot Policy Name is required" }),
  accumulatedPausedMinutes: z.number().int(),
  dueAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Due At is required" }),
  lastEvaluatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Last Evaluated At is required" }),
  remainingMinutes: z.number().int(),
  requestId: z.object({ id: z.string().uuid(), requestNumber: z.string() }),
  serviceTargetDefinition: z.object({ id: z.string().uuid(), name1: z.string() }),
  serviceTargetRule: z.object({ id: z.string().uuid(), ruleName: z.string() }),
  snapshotDurationMinutes: z.number().int(),
  startedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Started At is required" }),
  statusKey: z.enum(['Active', 'Warning', 'Paused', 'Met', 'Breached', 'Cancelled']),
  targetTypeKey: z.enum(['Response', 'Resolution', 'Fulfillment', 'Approval', 'Custom']),
  warningAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Warning At is required" }),
  workspaceId: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new RequestServiceTarget (omits system-generated ID)
 */
export const CreateRequestServiceTargetSchema = RequestServiceTargetSchema.omit({ id: true });

/**
 * Schema for updating an existing RequestServiceTarget
 */
export const UpdateRequestServiceTargetSchema = RequestServiceTargetSchema;

export type RequestServiceTargetInput = z.infer<typeof RequestServiceTargetSchema>;
export type CreateRequestServiceTargetInput = z.infer<typeof CreateRequestServiceTargetSchema>;
export type UpdateRequestServiceTargetInput = z.infer<typeof UpdateRequestServiceTargetSchema>;