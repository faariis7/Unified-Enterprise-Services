import { z } from 'zod';

/**
 * Zod schema for TransitionPermission validation
 */
export const TransitionPermissionSchema = z.object({
  id: z.string().uuid(),
  permissionCode: z.string().min(1, { message: "Permission Code is required" }),
  scopeKey: z.enum(['Workspace', 'AssignmentGroup', 'Department', 'Site', 'AssignedRequest', 'OwnRequest']),
  statusKey: z.enum(['Active', 'Inactive']),
  statusTransitionID: z.object({ id: z.string().uuid(), transitionName: z.string() }),
  workspaceID: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new TransitionPermission (omits system-generated ID)
 */
export const CreateTransitionPermissionSchema = TransitionPermissionSchema.omit({ id: true });

/**
 * Schema for updating an existing TransitionPermission
 */
export const UpdateTransitionPermissionSchema = TransitionPermissionSchema;

export type TransitionPermissionInput = z.infer<typeof TransitionPermissionSchema>;
export type CreateTransitionPermissionInput = z.infer<typeof CreateTransitionPermissionSchema>;
export type UpdateTransitionPermissionInput = z.infer<typeof UpdateTransitionPermissionSchema>;