import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RolePermissionService } from "../services/role-permission-service";
import type { RolePermission } from "../models/role-permission-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all RolePermission records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, rolePermissionName, allowed
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRolePermissionList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["rolePermission-list", options],
    queryFn: () => RolePermissionService.getAll(options),
  });
}

/**
 * Retrieve a single RolePermission record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRolePermission(id: string) {
  return useQuery({
    queryKey: ["rolePermission", id],
    queryFn: () => RolePermissionService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new RolePermission record.
 * @remarks Form validation: use CreateRolePermissionSchema with zodResolver for type-safe create forms
 */
export function useCreateRolePermission() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RolePermission, "id">) => RolePermissionService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["rolePermission-list"] });
    },
  });
}

/**
 * Update an existing RolePermission record.
 * @remarks Form validation: use UpdateRolePermissionSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateRolePermission() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<RolePermission, "id">>;
    }) => RolePermissionService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["rolePermission-list"] });
      client.invalidateQueries({ queryKey: ["rolePermission", variables.id] });
    },
  });
}

/**
 * Delete a RolePermission record by its unique identifier.
 */
export function useDeleteRolePermission() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RolePermissionService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["rolePermission-list"] });
      client.invalidateQueries({ queryKey: ["rolePermission", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const RolePermission_DATA_SOURCE_TYPE = 'InMemory' as const;

export { RolePermissionSchema, CreateRolePermissionSchema, UpdateRolePermissionSchema } from "../validators/role-permission-validator";
export type { RolePermissionInput, CreateRolePermissionInput, UpdateRolePermissionInput } from "../validators/role-permission-validator";