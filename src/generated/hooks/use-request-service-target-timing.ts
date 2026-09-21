import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestServiceTargetTimingService } from "../services/request-service-target-timing-service";
import type { RequestServiceTargetTiming } from "../models/request-service-target-timing-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all RequestServiceTargetTiming records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, timingName, breachedAt, breachReason, completedAt, idempotencyKey, pausedAt, resumedAt
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRequestServiceTargetTimingList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["requestServiceTargetTiming-list", options],
    queryFn: () => RequestServiceTargetTimingService.getAll(options),
  });
}

/**
 * Retrieve a single RequestServiceTargetTiming record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRequestServiceTargetTiming(id: string) {
  return useQuery({
    queryKey: ["requestServiceTargetTiming", id],
    queryFn: () => RequestServiceTargetTimingService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new RequestServiceTargetTiming record.
 * @remarks Form validation: use CreateRequestServiceTargetTimingSchema with zodResolver for type-safe create forms
 */
export function useCreateRequestServiceTargetTiming() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RequestServiceTargetTiming, "id">) => RequestServiceTargetTimingService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["requestServiceTargetTiming-list"] });
    },
  });
}

/**
 * Update an existing RequestServiceTargetTiming record.
 * @remarks Form validation: use UpdateRequestServiceTargetTimingSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateRequestServiceTargetTiming() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<RequestServiceTargetTiming, "id">>;
    }) => RequestServiceTargetTimingService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["requestServiceTargetTiming-list"] });
      client.invalidateQueries({ queryKey: ["requestServiceTargetTiming", variables.id] });
    },
  });
}

/**
 * Delete a RequestServiceTargetTiming record by its unique identifier.
 */
export function useDeleteRequestServiceTargetTiming() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RequestServiceTargetTimingService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["requestServiceTargetTiming-list"] });
      client.invalidateQueries({ queryKey: ["requestServiceTargetTiming", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const RequestServiceTargetTiming_DATA_SOURCE_TYPE = 'InMemory' as const;

export { RequestServiceTargetTimingSchema, CreateRequestServiceTargetTimingSchema, UpdateRequestServiceTargetTimingSchema } from "../validators/request-service-target-timing-validator";
export type { RequestServiceTargetTimingInput, CreateRequestServiceTargetTimingInput, UpdateRequestServiceTargetTimingInput } from "../validators/request-service-target-timing-validator";