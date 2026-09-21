import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PermissionService } from "../services/permission-service";
import type { Permission } from "../models/permission-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all Permission records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, permissionName, description, operationKey, permissionCode, resourceKey, scopeTypeKey, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function usePermissionList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["permission-list", options],
    queryFn: () => PermissionService.getAll(options),
  });
}

/**
 * Retrieve a single Permission record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function usePermission(id: string) {
  return useQuery({
    queryKey: ["permission", id],
    queryFn: () => PermissionService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new Permission record.
 * @remarks Form validation: use CreatePermissionSchema with zodResolver for type-safe create forms
 */
export function useCreatePermission() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Permission, "id">) => PermissionService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["permission-list"] });
    },
  });
}

/**
 * Update an existing Permission record.
 * @remarks Form validation: use UpdatePermissionSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdatePermission() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<Permission, "id">>;
    }) => PermissionService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["permission-list"] });
      client.invalidateQueries({ queryKey: ["permission", variables.id] });
    },
  });
}

/**
 * Delete a Permission record by its unique identifier.
 */
export function useDeletePermission() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => PermissionService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["permission-list"] });
      client.invalidateQueries({ queryKey: ["permission", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const Permission_DATA_SOURCE_TYPE = 'InMemory' as const;

export { PermissionSchema, CreatePermissionSchema, UpdatePermissionSchema } from "../validators/permission-validator";
export type { PermissionInput, CreatePermissionInput, UpdatePermissionInput } from "../validators/permission-validator";