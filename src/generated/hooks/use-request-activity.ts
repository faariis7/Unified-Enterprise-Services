import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestActivityService } from "../services/request-activity-service";
import type { RequestActivity } from "../models/request-activity-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all RequestActivity records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, requestActivityName, activityTypeKey, body, occurredAt
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRequestActivityList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["requestActivity-list", options],
    queryFn: () => RequestActivityService.getAll(options),
  });
}

/**
 * Retrieve a single RequestActivity record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRequestActivity(id: string) {
  return useQuery({
    queryKey: ["requestActivity", id],
    queryFn: () => RequestActivityService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new RequestActivity record.
 * @remarks Form validation: use CreateRequestActivitySchema with zodResolver for type-safe create forms
 */
export function useCreateRequestActivity() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RequestActivity, "id">) => RequestActivityService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["requestActivity-list"] });
    },
  });
}

/**
 * Update an existing RequestActivity record.
 * @remarks Form validation: use UpdateRequestActivitySchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateRequestActivity() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<RequestActivity, "id">>;
    }) => RequestActivityService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["requestActivity-list"] });
      client.invalidateQueries({ queryKey: ["requestActivity", variables.id] });
    },
  });
}

/**
 * Delete a RequestActivity record by its unique identifier.
 */
export function useDeleteRequestActivity() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RequestActivityService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["requestActivity-list"] });
      client.invalidateQueries({ queryKey: ["requestActivity", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const RequestActivity_DATA_SOURCE_TYPE = 'InMemory' as const;

export { RequestActivitySchema, CreateRequestActivitySchema, UpdateRequestActivitySchema } from "../validators/request-activity-validator";
export type { RequestActivityInput, CreateRequestActivityInput, UpdateRequestActivityInput } from "../validators/request-activity-validator";