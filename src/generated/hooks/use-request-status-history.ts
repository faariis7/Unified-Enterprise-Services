import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestStatusHistoryService } from "../services/request-status-history-service";
import type { RequestStatusHistory } from "../models/request-status-history-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all RequestStatusHistory records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, requestStatusHistoryName, changedAt, fieldName, newStatusId, previousStatusId
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRequestStatusHistoryList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["requestStatusHistory-list", options],
    queryFn: () => RequestStatusHistoryService.getAll(options),
  });
}

/**
 * Retrieve a single RequestStatusHistory record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRequestStatusHistory(id: string) {
  return useQuery({
    queryKey: ["requestStatusHistory", id],
    queryFn: () => RequestStatusHistoryService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new RequestStatusHistory record.
 * @remarks Form validation: use CreateRequestStatusHistorySchema with zodResolver for type-safe create forms
 */
export function useCreateRequestStatusHistory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RequestStatusHistory, "id">) => RequestStatusHistoryService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["requestStatusHistory-list"] });
    },
  });
}

/**
 * Update an existing RequestStatusHistory record.
 * @remarks Form validation: use UpdateRequestStatusHistorySchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateRequestStatusHistory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<RequestStatusHistory, "id">>;
    }) => RequestStatusHistoryService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["requestStatusHistory-list"] });
      client.invalidateQueries({ queryKey: ["requestStatusHistory", variables.id] });
    },
  });
}

/**
 * Delete a RequestStatusHistory record by its unique identifier.
 */
export function useDeleteRequestStatusHistory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RequestStatusHistoryService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["requestStatusHistory-list"] });
      client.invalidateQueries({ queryKey: ["requestStatusHistory", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const RequestStatusHistory_DATA_SOURCE_TYPE = 'InMemory' as const;

export { RequestStatusHistorySchema, CreateRequestStatusHistorySchema, UpdateRequestStatusHistorySchema } from "../validators/request-status-history-validator";
export type { RequestStatusHistoryInput, CreateRequestStatusHistoryInput, UpdateRequestStatusHistoryInput } from "../validators/request-status-history-validator";