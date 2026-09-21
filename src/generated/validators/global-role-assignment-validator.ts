import { z } from 'zod';

/**
 * Zod schema for GlobalRoleAssignment validation
 */
export const GlobalRoleAssignmentSchema = z.object({
  id: z.string().uuid(),
  globalRoleAssignmentName: z.string().min(1, { message: "Global Role Assignment Name is required" }),
  assignedBy: z.object({ id: z.string().uuid(), displayName: z.string() }),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Created At is required" }),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  person: z.object({ id: z.string().uuid(), displayName: z.string() }),
  roleDefinition: z.object({ id: z.string().uuid(), roleName: z.string() }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").min(1, { message: "Start Date is required" }),
  statusKey: z.enum(['Active', 'Inactive']),
});

/**
 * Schema for creating a new GlobalRoleAssignment (omits system-generated ID)
 */
export const CreateGlobalRoleAssignmentSchema = GlobalRoleAssignmentSchema.omit({ id: true });

/**
 * Schema for updating an existing GlobalRoleAssignment
 */
export const UpdateGlobalRoleAssignmentSchema = GlobalRoleAssignmentSchema;

export type GlobalRoleAssignmentInput = z.infer<typeof GlobalRoleAssignmentSchema>;
export type CreateGlobalRoleAssignmentInput = z.infer<typeof CreateGlobalRoleAssignmentSchema>;
export type UpdateGlobalRoleAssignmentInput = z.infer<typeof UpdateGlobalRoleAssignmentSchema>;