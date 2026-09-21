import { z } from 'zod';

/**
 * Zod schema for FieldPermission validation
 */
export const FieldPermissionSchema = z.object({
  id: z.string().uuid(),
  fieldPermissionName: z.string().min(1, { message: "Field Permission Name is required" }),
  canCreate: z.boolean(),
  canRead: z.boolean(),
  canUpdate: z.boolean(),
  entityName: z.string().min(1, { message: "EntityName is required" }),
  fieldName: z.string().min(1, { message: "FieldName is required" }),
  permissionId: z.object({ id: z.string().uuid(), permissionName: z.string() }),
  roleId: z.object({ id: z.string().uuid(), roleName: z.string() }),
  statusKey: z.enum(['Active', 'Inactive']),
});

/**
 * Schema for creating a new FieldPermission (omits system-generated ID)
 */
export const CreateFieldPermissionSchema = FieldPermissionSchema.omit({ id: true });

/**
 * Schema for updating an existing FieldPermission
 */
export const UpdateFieldPermissionSchema = FieldPermissionSchema;

export type FieldPermissionInput = z.infer<typeof FieldPermissionSchema>;
export type CreateFieldPermissionInput = z.infer<typeof CreateFieldPermissionSchema>;
export type UpdateFieldPermissionInput = z.infer<typeof UpdateFieldPermissionSchema>;