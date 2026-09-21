import { z } from 'zod';

/**
 * Zod schema for ServiceMembership validation
 */
export const ServiceMembershipSchema = z.object({
  id: z.string().uuid(),
  membershipLabel: z.string().min(1, { message: "Membership Label is required" }),
  addedBy: z.object({ id: z.string().uuid(), displayName: z.string() }).optional(),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Created At is required" }),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").optional(),
  person: z.object({ id: z.string().uuid(), displayName: z.string() }),
  roleKey: z.enum(['Agent', 'ServiceManager', 'ServiceAdministrator', 'Approver', 'Auditor']),
  service: z.object({ id: z.string().uuid(), serviceName: z.string() }),
  serviceCode: z.string().min(1, { message: "Service Code is required" }),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").min(1, { message: "Start Date is required" }),
  statusKey: z.enum(['Active', 'Inactive', 'Suspended']),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new ServiceMembership (omits system-generated ID)
 */
export const CreateServiceMembershipSchema = ServiceMembershipSchema.omit({ id: true });

/**
 * Schema for updating an existing ServiceMembership
 */
export const UpdateServiceMembershipSchema = ServiceMembershipSchema;

export type ServiceMembershipInput = z.infer<typeof ServiceMembershipSchema>;
export type CreateServiceMembershipInput = z.infer<typeof CreateServiceMembershipSchema>;
export type UpdateServiceMembershipInput = z.infer<typeof UpdateServiceMembershipSchema>;