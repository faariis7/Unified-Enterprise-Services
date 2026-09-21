import { z } from 'zod';

/**
 * Zod schema for RequestRelationship validation
 */
export const RequestRelationshipSchema = z.object({
  id: z.string().uuid(),
  relationshipName: z.string().min(1, { message: "RelationshipName is required" }),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "CreatedAt is required" }),
  createdBy: z.object({ id: z.string().uuid(), displayName: z.string() }),
  relatedRequestId: z.object({ id: z.string().uuid(), requestNumber: z.string() }),
  relationshipTypeKey: z.enum(['Related', 'Duplicate', 'Blocks', 'BlockedBy', 'Parent', 'Child']),
  requestId: z.object({ id: z.string().uuid(), requestNumber: z.string() }),
  workspaceId: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new RequestRelationship (omits system-generated ID)
 */
export const CreateRequestRelationshipSchema = RequestRelationshipSchema.omit({ id: true });

/**
 * Schema for updating an existing RequestRelationship
 */
export const UpdateRequestRelationshipSchema = RequestRelationshipSchema;

export type RequestRelationshipInput = z.infer<typeof RequestRelationshipSchema>;
export type CreateRequestRelationshipInput = z.infer<typeof CreateRequestRelationshipSchema>;
export type UpdateRequestRelationshipInput = z.infer<typeof UpdateRequestRelationshipSchema>;