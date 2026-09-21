import { z } from 'zod';

/**
 * Zod schema for RequestServiceTargetTiming validation
 */
export const RequestServiceTargetTimingSchema = z.object({
  id: z.string().uuid(),
  timingName: z.string().min(1, { message: "Timing Name is required" }),
  breachedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  breachReason: z.string().optional(),
  completedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  idempotencyKey: z.string().min(1, { message: "Idempotency Key is required" }),
  pausedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  requestServiceTarget: z.object({ id: z.string().uuid(), snapshotPolicyName: z.string() }),
  resumedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
});

/**
 * Schema for creating a new RequestServiceTargetTiming (omits system-generated ID)
 */
export const CreateRequestServiceTargetTimingSchema = RequestServiceTargetTimingSchema.omit({ id: true });

/**
 * Schema for updating an existing RequestServiceTargetTiming
 */
export const UpdateRequestServiceTargetTimingSchema = RequestServiceTargetTimingSchema;

export type RequestServiceTargetTimingInput = z.infer<typeof RequestServiceTargetTimingSchema>;
export type CreateRequestServiceTargetTimingInput = z.infer<typeof CreateRequestServiceTargetTimingSchema>;
export type UpdateRequestServiceTargetTimingInput = z.infer<typeof UpdateRequestServiceTargetTimingSchema>;