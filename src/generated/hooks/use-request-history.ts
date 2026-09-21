import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestHistoryService } from "../services/request-history-service";
import type { RequestHistory } from "../models/request-history-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all RequestHistory records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, changeType, changedAt, fieldName, newValue, oldValue, reason, source
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRequestHistoryList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["requestHistory-list", options],
    queryFn: () => RequestHistoryService.getAll(options),
  });
}

/**
 * Retrieve a single RequestHistory record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRequestHistory(id: string) {
  return useQuery({
    queryKey: ["requestHistory", id],
    queryFn: () => RequestHistoryService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new RequestHistory record.
 * @remarks Form validation: use CreateRequestHistorySchema with zodResolver for type-safe create forms
 */
export function useCreateRequestHistory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RequestHistory, "id">) => RequestHistoryService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["requestHistory-list"] });
    },
  });
}

/**
 * Update an existing RequestHistory record.
 * @remarks Form validation: use UpdateRequestHistorySchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateRequestHistory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<RequestHistory, "id">>;
    }) => RequestHistoryService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["requestHistory-list"] });
      client.invalidateQueries({ queryKey: ["requestHistory", variables.id] });
    },
  });
}

/**
 * Delete a RequestHistory record by its unique identifier.
 */
export function useDeleteRequestHistory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RequestHistoryService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["requestHistory-list"] });
      client.invalidateQueries({ queryKey: ["requestHistory", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const RequestHistory_DATA_SOURCE_TYPE = 'InMemory' as const;

export { RequestHistorySchema, CreateRequestHistorySchema, UpdateRequestHistorySchema } from "../validators/request-history-validator";
export type { RequestHistoryInput, CreateRequestHistoryInput, UpdateRequestHistoryInput } from "../validators/request-history-validator";