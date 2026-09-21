import { z } from 'zod';

/**
 * Zod schema for RolePermission validation
 */
export const RolePermissionSchema = z.object({
  id: z.string().uuid(),
  rolePermissionName: z.string().min(1, { message: "Role Permission Name is required" }),
  allowed: z.boolean(),
  permissionDefinition: z.object({ id: z.string().uuid(), permissionName: z.string() }),
  roleDefinition: z.object({ id: z.string().uuid(), roleName: z.string() }),
});

/**
 * Schema for creating a new RolePermission (omits system-generated ID)
 */
export const CreateRolePermissionSchema = RolePermissionSchema.omit({ id: true });

/**
 * Schema for updating an existing RolePermission
 */
export const UpdateRolePermissionSchema = RolePermissionSchema;

export type RolePermissionInput = z.infer<typeof RolePermissionSchema>;
export type CreateRolePermissionInput = z.infer<typeof CreateRolePermissionSchema>;
export type UpdateRolePermissionInput = z.infer<typeof UpdateRolePermissionSchema>;