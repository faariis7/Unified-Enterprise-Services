import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LifecycleStatusService } from "../services/lifecycle-status-service";
import type { LifecycleStatus } from "../models/lifecycle-status-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all LifecycleStatus records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, statusName, pauseTargets, sortOrder, stageCode, statusCode, statusKey, terminal
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useLifecycleStatusList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["lifecycleStatus-list", options],
    queryFn: () => LifecycleStatusService.getAll(options),
  });
}

/**
 * Retrieve a single LifecycleStatus record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useLifecycleStatus(id: string) {
  return useQuery({
    queryKey: ["lifecycleStatus", id],
    queryFn: () => LifecycleStatusService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new LifecycleStatus record.
 * @remarks Form validation: use CreateLifecycleStatusSchema with zodResolver for type-safe create forms
 */
export function useCreateLifecycleStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<LifecycleStatus, "id">) => LifecycleStatusService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["lifecycleStatus-list"] });
    },
  });
}

/**
 * Update an existing LifecycleStatus record.
 * @remarks Form validation: use UpdateLifecycleStatusSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateLifecycleStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<LifecycleStatus, "id">>;
    }) => LifecycleStatusService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["lifecycleStatus-list"] });
      client.invalidateQueries({ queryKey: ["lifecycleStatus", variables.id] });
    },
  });
}

/**
 * Delete a LifecycleStatus record by its unique identifier.
 */
export function useDeleteLifecycleStatus() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => LifecycleStatusService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["lifecycleStatus-list"] });
      client.invalidateQueries({ queryKey: ["lifecycleStatus", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const LifecycleStatus_DATA_SOURCE_TYPE = 'InMemory' as const;

export { LifecycleStatusSchema, CreateLifecycleStatusSchema, UpdateLifecycleStatusSchema } from "../validators/lifecycle-status-validator";
export type { LifecycleStatusInput, CreateLifecycleStatusInput, UpdateLifecycleStatusInput } from "../validators/lifecycle-status-validator";