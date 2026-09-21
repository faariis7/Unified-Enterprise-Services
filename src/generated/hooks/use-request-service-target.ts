import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestServiceTargetService } from "../services/request-service-target-service";
import type { RequestServiceTarget } from "../models/request-service-target-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all RequestServiceTarget records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, snapshotPolicyName, accumulatedPausedMinutes, dueAt, lastEvaluatedAt, remainingMinutes, snapshotDurationMinutes, startedAt, statusKey, targetTypeKey, warningAt
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRequestServiceTargetList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["requestServiceTarget-list", options],
    queryFn: () => RequestServiceTargetService.getAll(options),
  });
}

/**
 * Retrieve a single RequestServiceTarget record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRequestServiceTarget(id: string) {
  return useQuery({
    queryKey: ["requestServiceTarget", id],
    queryFn: () => RequestServiceTargetService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new RequestServiceTarget record.
 * @remarks Form validation: use CreateRequestServiceTargetSchema with zodResolver for type-safe create forms
 */
export function useCreateRequestServiceTarget() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RequestServiceTarget, "id">) => RequestServiceTargetService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["requestServiceTarget-list"] });
    },
  });
}

/**
 * Update an existing RequestServiceTarget record.
 * @remarks Form validation: use UpdateRequestServiceTargetSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateRequestServiceTarget() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<RequestServiceTarget, "id">>;
    }) => RequestServiceTargetService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["requestServiceTarget-list"] });
      client.invalidateQueries({ queryKey: ["requestServiceTarget", variables.id] });
    },
  });
}

/**
 * Delete a RequestServiceTarget record by its unique identifier.
 */
export function useDeleteRequestServiceTarget() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RequestServiceTargetService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["requestServiceTarget-list"] });
      client.invalidateQueries({ queryKey: ["requestServiceTarget", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const RequestServiceTarget_DATA_SOURCE_TYPE = 'InMemory' as const;

export { RequestServiceTargetSchema, CreateRequestServiceTargetSchema, UpdateRequestServiceTargetSchema } from "../validators/request-service-target-validator";
export type { RequestServiceTargetInput, CreateRequestServiceTargetInput, UpdateRequestServiceTargetInput } from "../validators/request-service-target-validator";