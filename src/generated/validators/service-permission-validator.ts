import { z } from 'zod';

/**
 * Zod schema for ServicePermission validation
 */
export const ServicePermissionSchema = z.object({
  id: z.string().uuid(),
  servicePermissionName: z.string().min(1, { message: "Service Permission Name is required" }),
  catalogItemCode: z.string().optional(),
  permissionId: z.object({ id: z.string().uuid(), permissionName: z.string() }),
  roleId: z.object({ id: z.string().uuid(), roleName: z.string() }),
  serviceCode: z.string().min(1, { message: "ServiceCode is required" }),
  statusKey: z.enum(['Active', 'Inactive']),
  workspaceId: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new ServicePermission (omits system-generated ID)
 */
export const CreateServicePermissionSchema = ServicePermissionSchema.omit({ id: true });

/**
 * Schema for updating an existing ServicePermission
 */
export const UpdateServicePermissionSchema = ServicePermissionSchema;

export type ServicePermissionInput = z.infer<typeof ServicePermissionSchema>;
export type CreateServicePermissionInput = z.infer<typeof CreateServicePermissionSchema>;
export type UpdateServicePermissionInput = z.infer<typeof UpdateServicePermissionSchema>;