import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FieldPermissionService } from "../services/field-permission-service";
import type { FieldPermission } from "../models/field-permission-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all FieldPermission records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, fieldPermissionName, canCreate, canRead, canUpdate, entityName, fieldName, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useFieldPermissionList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["fieldPermission-list", options],
    queryFn: () => FieldPermissionService.getAll(options),
  });
}

/**
 * Retrieve a single FieldPermission record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useFieldPermission(id: string) {
  return useQuery({
    queryKey: ["fieldPermission", id],
    queryFn: () => FieldPermissionService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new FieldPermission record.
 * @remarks Form validation: use CreateFieldPermissionSchema with zodResolver for type-safe create forms
 */
export function useCreateFieldPermission() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<FieldPermission, "id">) => FieldPermissionService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["fieldPermission-list"] });
    },
  });
}

/**
 * Update an existing FieldPermission record.
 * @remarks Form validation: use UpdateFieldPermissionSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateFieldPermission() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<FieldPermission, "id">>;
    }) => FieldPermissionService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["fieldPermission-list"] });
      client.invalidateQueries({ queryKey: ["fieldPermission", variables.id] });
    },
  });
}

/**
 * Delete a FieldPermission record by its unique identifier.
 */
export function useDeleteFieldPermission() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => FieldPermissionService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["fieldPermission-list"] });
      client.invalidateQueries({ queryKey: ["fieldPermission", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const FieldPermission_DATA_SOURCE_TYPE = 'InMemory' as const;

export { FieldPermissionSchema, CreateFieldPermissionSchema, UpdateFieldPermissionSchema } from "../validators/field-permission-validator";
export type { FieldPermissionInput, CreateFieldPermissionInput, UpdateFieldPermissionInput } from "../validators/field-permission-validator";