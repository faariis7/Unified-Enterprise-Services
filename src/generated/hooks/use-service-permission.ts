import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ServicePermissionService } from "../services/service-permission-service";
import type { ServicePermission } from "../models/service-permission-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all ServicePermission records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, servicePermissionName, catalogItemCode, serviceCode, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useServicePermissionList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["servicePermission-list", options],
    queryFn: () => ServicePermissionService.getAll(options),
  });
}

/**
 * Retrieve a single ServicePermission record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useServicePermission(id: string) {
  return useQuery({
    queryKey: ["servicePermission", id],
    queryFn: () => ServicePermissionService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new ServicePermission record.
 * @remarks Form validation: use CreateServicePermissionSchema with zodResolver for type-safe create forms
 */
export function useCreateServicePermission() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ServicePermission, "id">) => ServicePermissionService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["servicePermission-list"] });
    },
  });
}

/**
 * Update an existing ServicePermission record.
 * @remarks Form validation: use UpdateServicePermissionSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateServicePermission() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<ServicePermission, "id">>;
    }) => ServicePermissionService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["servicePermission-list"] });
      client.invalidateQueries({ queryKey: ["servicePermission", variables.id] });
    },
  });
}

/**
 * Delete a ServicePermission record by its unique identifier.
 */
export function useDeleteServicePermission() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ServicePermissionService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["servicePermission-list"] });
      client.invalidateQueries({ queryKey: ["servicePermission", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const ServicePermission_DATA_SOURCE_TYPE = 'InMemory' as const;

export { ServicePermissionSchema, CreateServicePermissionSchema, UpdateServicePermissionSchema } from "../validators/service-permission-validator";
export type { ServicePermissionInput, CreateServicePermissionInput, UpdateServicePermissionInput } from "../validators/service-permission-validator";