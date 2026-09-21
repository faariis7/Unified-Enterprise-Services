import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestResolutionService } from "../services/request-resolution-service";
import type { RequestResolution } from "../models/request-resolution-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all RequestResolution records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, requestResolutionName, resolutionCodeKey, resolvedAt, summary
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRequestResolutionList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["requestResolution-list", options],
    queryFn: () => RequestResolutionService.getAll(options),
  });
}

/**
 * Retrieve a single RequestResolution record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRequestResolution(id: string) {
  return useQuery({
    queryKey: ["requestResolution", id],
    queryFn: () => RequestResolutionService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new RequestResolution record.
 * @remarks Form validation: use CreateRequestResolutionSchema with zodResolver for type-safe create forms
 */
export function useCreateRequestResolution() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RequestResolution, "id">) => RequestResolutionService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["requestResolution-list"] });
    },
  });
}

/**
 * Update an existing RequestResolution record.
 * @remarks Form validation: use UpdateRequestResolutionSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateRequestResolution() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<RequestResolution, "id">>;
    }) => RequestResolutionService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["requestResolution-list"] });
      client.invalidateQueries({ queryKey: ["requestResolution", variables.id] });
    },
  });
}

/**
 * Delete a RequestResolution record by its unique identifier.
 */
export function useDeleteRequestResolution() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RequestResolutionService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["requestResolution-list"] });
      client.invalidateQueries({ queryKey: ["requestResolution", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const RequestResolution_DATA_SOURCE_TYPE = 'InMemory' as const;

export { RequestResolutionSchema, CreateRequestResolutionSchema, UpdateRequestResolutionSchema } from "../validators/request-resolution-validator";
export type { RequestResolutionInput, CreateRequestResolutionInput, UpdateRequestResolutionInput } from "../validators/request-resolution-validator";