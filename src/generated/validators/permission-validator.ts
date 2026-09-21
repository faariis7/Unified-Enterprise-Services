import { z } from 'zod';

/**
 * Zod schema for Permission validation
 */
export const PermissionSchema = z.object({
  id: z.string().uuid(),
  permissionName: z.string().min(1, { message: "PermissionName is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  operationKey: z.enum(['Create', 'Read', 'Update', 'Delete', 'Assign', 'Transition', 'Resolve', 'Reopen', 'Export', 'Administer', 'CrossWorkspaceAccess', 'Audit', 'Integrate', 'Notify', 'Search', 'Report', 'Upload', 'Download']),
  permissionCode: z.string().min(1, { message: "PermissionCode is required" }),
  resourceKey: z.enum(['Request', 'Workspace', 'Platform', 'Attachment', 'Notification', 'Search', 'Report', 'Lifecycle', 'Integration']),
  scopeTypeKey: z.enum(['Global', 'Workspace', 'AssignmentGroup', 'Department', 'Site', 'OwnRequests', 'RequestedForRequests', 'AssignedRequests', 'WatchedRequests', 'SpecificService', 'SpecificCatalogItem', 'SpecificField', 'SpecificRecord']),
  statusKey: z.enum(['Active', 'Inactive']),
});

/**
 * Schema for creating a new Permission (omits system-generated ID)
 */
export const CreatePermissionSchema = PermissionSchema.omit({ id: true });

/**
 * Schema for updating an existing Permission
 */
export const UpdatePermissionSchema = PermissionSchema;

export type PermissionInput = z.infer<typeof PermissionSchema>;
export type CreatePermissionInput = z.infer<typeof CreatePermissionSchema>;
export type UpdatePermissionInput = z.infer<typeof UpdatePermissionSchema>;