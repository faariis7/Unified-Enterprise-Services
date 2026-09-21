import { z } from 'zod';

/**
 * Zod schema for Request validation
 */
export const RequestSchema = z.object({
  id: z.string().uuid(),
  requestNumber: z.string().min(1, { message: "RequestNumber is required" }),
  assignedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "AssignedAt is required" }),
  assignee: z.object({ id: z.string().uuid(), displayName: z.string() }),
  assignmentGroupCode: z.string().min(1, { message: "AssignmentGroupId is required" }),
  cancelledAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "CancelledAt is required" }),
  catalogItemCode: z.string().min(1, { message: "CatalogItemId is required" }),
  closedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "ClosedAt is required" }),
  confidentialityLevelId: z.string().min(1, { message: "ConfidentialityLevelId is required" }),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "CreatedAt is required" }),
  createdBy: z.object({ id: z.string().uuid(), displayName: z.string() }),
  currentStageId: z.string().min(1, { message: "CurrentStageId is required" }),
  departmentCode: z.string().min(1, { message: "DepartmentId is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  firstRespondedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "FirstRespondedAt is required" }),
  formDefinitionId: z.string().min(1, { message: "FormDefinitionId is required" }),
  formVersion: z.object({ id: z.string().uuid(), snapshotLabel: z.string() }),
  impactId: z.string().min(1, { message: "ImpactId is required" }),
  lifecycleDefinition: z.object({ id: z.string().uuid(), name1: z.string() }).optional(),
  originEmailConversationID: z.string().optional(),
  originInternetMessageID: z.string().optional(),
  parentRequestId: z.object({ id: z.string().uuid(), requestNumber: z.string() }).optional(),
  priorityKey: z.enum(['Low', 'Medium', 'High', 'Critical']),
  reopenedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "ReopenedAt is required" }),
  requestedFor: z.object({ id: z.string().uuid(), displayName: z.string() }),
  requester: z.object({ id: z.string().uuid(), displayName: z.string() }),
  requestSourceKey: z.enum(['Portal', 'Email']),
  requestTypeId: z.string().min(1, { message: "RequestTypeId is required" }),
  resolvedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "ResolvedAt is required" }),
  serviceCode: z.string().min(1, { message: "ServiceId is required" }),
  siteCode: z.string().min(1, { message: "SiteId is required" }),
  sourceId: z.string().min(1, { message: "SourceId is required" }),
  statusKey: z.enum(['New', 'Assigned', 'InProgress', 'Pending', 'Resolved', 'Closed', 'Cancelled']),
  title: z.string().min(1, { message: "Title is required" }),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "UpdatedAt is required" }),
  updatedBy: z.object({ id: z.string().uuid(), displayName: z.string() }),
  urgencyId: z.string().min(1, { message: "UrgencyId is required" }),
  versionNumber: z.number().int(),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new Request (omits system-generated ID)
 */
export const CreateRequestSchema = RequestSchema.omit({ id: true });

/**
 * Schema for updating an existing Request
 */
export const UpdateRequestSchema = RequestSchema;

export type RequestInput = z.infer<typeof RequestSchema>;
export type CreateRequestInput = z.infer<typeof CreateRequestSchema>;
export type UpdateRequestInput = z.infer<typeof UpdateRequestSchema>;