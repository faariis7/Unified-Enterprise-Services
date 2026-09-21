import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TransitionPermissionService } from "../services/transition-permission-service";
import type { TransitionPermission } from "../models/transition-permission-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all TransitionPermission records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, permissionCode, scopeKey, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useTransitionPermissionList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["transitionPermission-list", options],
    queryFn: () => TransitionPermissionService.getAll(options),
  });
}

/**
 * Retrieve a single TransitionPermission record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useTransitionPermission(id: string) {
  return useQuery({
    queryKey: ["transitionPermission", id],
    queryFn: () => TransitionPermissionService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new TransitionPermission record.
 * @remarks Form validation: use CreateTransitionPermissionSchema with zodResolver for type-safe create forms
 */
export function useCreateTransitionPermission() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<TransitionPermission, "id">) => TransitionPermissionService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["transitionPermission-list"] });
    },
  });
}

/**
 * Update an existing TransitionPermission record.
 * @remarks Form validation: use UpdateTransitionPermissionSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateTransitionPermission() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<TransitionPermission, "id">>;
    }) => TransitionPermissionService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["transitionPermission-list"] });
      client.invalidateQueries({ queryKey: ["transitionPermission", variables.id] });
    },
  });
}

/**
 * Delete a TransitionPermission record by its unique identifier.
 */
export function useDeleteTransitionPermission() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => TransitionPermissionService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["transitionPermission-list"] });
      client.invalidateQueries({ queryKey: ["transitionPermission", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const TransitionPermission_DATA_SOURCE_TYPE = 'InMemory' as const;

export { TransitionPermissionSchema, CreateTransitionPermissionSchema, UpdateTransitionPermissionSchema } from "../validators/transition-permission-validator";
export type { TransitionPermissionInput, CreateTransitionPermissionInput, UpdateTransitionPermissionInput } from "../validators/transition-permission-validator";