import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestAssignmentHistoryService } from "../services/request-assignment-history-service";
import type { RequestAssignmentHistory } from "../models/request-assignment-history-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all RequestAssignmentHistory records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, assignmentHistoryName, assignedAt, assignmentGroupId
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRequestAssignmentHistoryList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["requestAssignmentHistory-list", options],
    queryFn: () => RequestAssignmentHistoryService.getAll(options),
  });
}

/**
 * Retrieve a single RequestAssignmentHistory record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRequestAssignmentHistory(id: string) {
  return useQuery({
    queryKey: ["requestAssignmentHistory", id],
    queryFn: () => RequestAssignmentHistoryService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new RequestAssignmentHistory record.
 * @remarks Form validation: use CreateRequestAssignmentHistorySchema with zodResolver for type-safe create forms
 */
export function useCreateRequestAssignmentHistory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RequestAssignmentHistory, "id">) => RequestAssignmentHistoryService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["requestAssignmentHistory-list"] });
    },
  });
}

/**
 * Update an existing RequestAssignmentHistory record.
 * @remarks Form validation: use UpdateRequestAssignmentHistorySchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateRequestAssignmentHistory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<RequestAssignmentHistory, "id">>;
    }) => RequestAssignmentHistoryService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["requestAssignmentHistory-list"] });
      client.invalidateQueries({ queryKey: ["requestAssignmentHistory", variables.id] });
    },
  });
}

/**
 * Delete a RequestAssignmentHistory record by its unique identifier.
 */
export function useDeleteRequestAssignmentHistory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RequestAssignmentHistoryService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["requestAssignmentHistory-list"] });
      client.invalidateQueries({ queryKey: ["requestAssignmentHistory", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const RequestAssignmentHistory_DATA_SOURCE_TYPE = 'InMemory' as const;

export { RequestAssignmentHistorySchema, CreateRequestAssignmentHistorySchema, UpdateRequestAssignmentHistorySchema } from "../validators/request-assignment-history-validator";
export type { RequestAssignmentHistoryInput, CreateRequestAssignmentHistoryInput, UpdateRequestAssignmentHistoryInput } from "../validators/request-assignment-history-validator";