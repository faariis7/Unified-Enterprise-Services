import { z } from 'zod';

/**
 * Zod schema for MembershipRole validation
 */
export const MembershipRoleSchema = z.object({
  id: z.string().uuid(),
  membershipRoleName: z.string().min(1, { message: "Membership Role Name is required" }),
  roleDefinition: z.object({ id: z.string().uuid(), roleName: z.string() }),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
  workspaceMembership: z.object({ id: z.string().uuid(), membershipLabel: z.string() }),
});

/**
 * Schema for creating a new MembershipRole (omits system-generated ID)
 */
export const CreateMembershipRoleSchema = MembershipRoleSchema.omit({ id: true });

/**
 * Schema for updating an existing MembershipRole
 */
export const UpdateMembershipRoleSchema = MembershipRoleSchema;

export type MembershipRoleInput = z.infer<typeof MembershipRoleSchema>;
export type CreateMembershipRoleInput = z.infer<typeof CreateMembershipRoleSchema>;
export type UpdateMembershipRoleInput = z.infer<typeof UpdateMembershipRoleSchema>;