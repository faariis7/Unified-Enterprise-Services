import { z } from 'zod';

/**
 * Zod schema for RequestNumberSequence validation
 */
export const RequestNumberSequenceSchema = z.object({
  id: z.string().uuid(),
  sequenceName: z.string().min(1, { message: "SequenceName is required" }),
  calendarYear: z.number().int(),
  nextNumber: z.number().int(),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "UpdatedAt is required" }),
  versionNumber: z.number().int(),
  workspaceId: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new RequestNumberSequence (omits system-generated ID)
 */
export const CreateRequestNumberSequenceSchema = RequestNumberSequenceSchema.omit({ id: true });

/**
 * Schema for updating an existing RequestNumberSequence
 */
export const UpdateRequestNumberSequenceSchema = RequestNumberSequenceSchema;

export type RequestNumberSequenceInput = z.infer<typeof RequestNumberSequenceSchema>;
export type CreateRequestNumberSequenceInput = z.infer<typeof CreateRequestNumberSequenceSchema>;
export type UpdateRequestNumberSequenceInput = z.infer<typeof UpdateRequestNumberSequenceSchema>;