import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MembershipRoleService } from "../services/membership-role-service";
import type { MembershipRole } from "../models/membership-role-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all MembershipRole records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, membershipRoleName
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useMembershipRoleList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["membershipRole-list", options],
    queryFn: () => MembershipRoleService.getAll(options),
  });
}

/**
 * Retrieve a single MembershipRole record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useMembershipRole(id: string) {
  return useQuery({
    queryKey: ["membershipRole", id],
    queryFn: () => MembershipRoleService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new MembershipRole record.
 * @remarks Form validation: use CreateMembershipRoleSchema with zodResolver for type-safe create forms
 */
export function useCreateMembershipRole() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<MembershipRole, "id">) => MembershipRoleService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["membershipRole-list"] });
    },
  });
}

/**
 * Update an existing MembershipRole record.
 * @remarks Form validation: use UpdateMembershipRoleSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateMembershipRole() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<MembershipRole, "id">>;
    }) => MembershipRoleService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["membershipRole-list"] });
      client.invalidateQueries({ queryKey: ["membershipRole", variables.id] });
    },
  });
}

/**
 * Delete a MembershipRole record by its unique identifier.
 */
export function useDeleteMembershipRole() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => MembershipRoleService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["membershipRole-list"] });
      client.invalidateQueries({ queryKey: ["membershipRole", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const MembershipRole_DATA_SOURCE_TYPE = 'InMemory' as const;

export { MembershipRoleSchema, CreateMembershipRoleSchema, UpdateMembershipRoleSchema } from "../validators/membership-role-validator";
export type { MembershipRoleInput, CreateMembershipRoleInput, UpdateMembershipRoleInput } from "../validators/membership-role-validator";