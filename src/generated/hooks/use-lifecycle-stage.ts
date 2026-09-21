import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LifecycleStageService } from "../services/lifecycle-stage-service";
import type { LifecycleStage } from "../models/lifecycle-stage-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all LifecycleStage records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, stageName, sortOrder, stageCode, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useLifecycleStageList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["lifecycleStage-list", options],
    queryFn: () => LifecycleStageService.getAll(options),
  });
}

/**
 * Retrieve a single LifecycleStage record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useLifecycleStage(id: string) {
  return useQuery({
    queryKey: ["lifecycleStage", id],
    queryFn: () => LifecycleStageService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new LifecycleStage record.
 * @remarks Form validation: use CreateLifecycleStageSchema with zodResolver for type-safe create forms
 */
export function useCreateLifecycleStage() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<LifecycleStage, "id">) => LifecycleStageService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["lifecycleStage-list"] });
    },
  });
}

/**
 * Update an existing LifecycleStage record.
 * @remarks Form validation: use UpdateLifecycleStageSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateLifecycleStage() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<LifecycleStage, "id">>;
    }) => LifecycleStageService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["lifecycleStage-list"] });
      client.invalidateQueries({ queryKey: ["lifecycleStage", variables.id] });
    },
  });
}

/**
 * Delete a LifecycleStage record by its unique identifier.
 */
export function useDeleteLifecycleStage() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => LifecycleStageService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["lifecycleStage-list"] });
      client.invalidateQueries({ queryKey: ["lifecycleStage", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const LifecycleStage_DATA_SOURCE_TYPE = 'InMemory' as const;

export { LifecycleStageSchema, CreateLifecycleStageSchema, UpdateLifecycleStageSchema } from "../validators/lifecycle-stage-validator";
export type { LifecycleStageInput, CreateLifecycleStageInput, UpdateLifecycleStageInput } from "../validators/lifecycle-stage-validator";