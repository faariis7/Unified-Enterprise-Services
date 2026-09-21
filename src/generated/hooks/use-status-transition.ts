import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StatusTransitionService } from "../services/status-transition-service";
import type { StatusTransition } from "../models/status-transition-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all StatusTransition records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, transitionName, sortOrder, statusKey, transitionCode
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useStatusTransitionList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["statusTransition-list", options],
    queryFn: () => StatusTransitionService.getAll(options),
  });
}

/**
 * Retrieve a single StatusTransition record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useStatusTransition(id: string) {
  return useQuery({
    queryKey: ["statusTransition", id],
    queryFn: () => StatusTransitionService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new StatusTransition record.
 * @remarks Form validation: use CreateStatusTransitionSchema with zodResolver for type-safe create forms
 */
export function useCreateStatusTransition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<StatusTransition, "id">) => StatusTransitionService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["statusTransition-list"] });
    },
  });
}

/**
 * Update an existing StatusTransition record.
 * @remarks Form validation: use UpdateStatusTransitionSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateStatusTransition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<StatusTransition, "id">>;
    }) => StatusTransitionService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["statusTransition-list"] });
      client.invalidateQueries({ queryKey: ["statusTransition", variables.id] });
    },
  });
}

/**
 * Delete a StatusTransition record by its unique identifier.
 */
export function useDeleteStatusTransition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => StatusTransitionService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["statusTransition-list"] });
      client.invalidateQueries({ queryKey: ["statusTransition", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const StatusTransition_DATA_SOURCE_TYPE = 'InMemory' as const;

export { StatusTransitionSchema, CreateStatusTransitionSchema, UpdateStatusTransitionSchema } from "../validators/status-transition-validator";
export type { StatusTransitionInput, CreateStatusTransitionInput, UpdateStatusTransitionInput } from "../validators/status-transition-validator";