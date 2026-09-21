import { z } from 'zod';

/**
 * Zod schema for RequestAuditEvent validation
 */
export const RequestAuditEventSchema = z.object({
  id: z.string().uuid(),
  auditEventName: z.string().min(1, { message: "AuditEventName is required" }),
  actorPersonId: z.object({ id: z.string().uuid(), displayName: z.string() }),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  details: z.string().min(1, { message: "Details is required" }),
  eventType: z.string().min(1, { message: "EventType is required" }),
  isDeleted: z.boolean().optional(),
  occurredAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "OccurredAt is required" }),
  requestId: z.object({ id: z.string().uuid(), requestNumber: z.string() }),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").optional(),
  workspaceId: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new RequestAuditEvent (omits system-generated ID)
 */
export const CreateRequestAuditEventSchema = RequestAuditEventSchema.omit({ id: true });

/**
 * Schema for updating an existing RequestAuditEvent
 */
export const UpdateRequestAuditEventSchema = RequestAuditEventSchema;

export type RequestAuditEventInput = z.infer<typeof RequestAuditEventSchema>;
export type CreateRequestAuditEventInput = z.infer<typeof CreateRequestAuditEventSchema>;
export type UpdateRequestAuditEventInput = z.infer<typeof UpdateRequestAuditEventSchema>;