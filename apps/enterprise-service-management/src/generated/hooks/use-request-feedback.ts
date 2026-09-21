import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestFeedbackService } from "../services/request-feedback-service";
import type { RequestFeedback } from "../models/request-feedback-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all RequestFeedback records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, feedbackName, comments, createdAt, rating
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRequestFeedbackList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["requestFeedback-list", options],
    queryFn: () => RequestFeedbackService.getAll(options),
  });
}

/**
 * Retrieve a single RequestFeedback record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRequestFeedback(id: string) {
  return useQuery({
    queryKey: ["requestFeedback", id],
    queryFn: () => RequestFeedbackService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new RequestFeedback record.
 * @remarks Form validation: use CreateRequestFeedbackSchema with zodResolver for type-safe create forms
 */
export function useCreateRequestFeedback() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RequestFeedback, "id">) => RequestFeedbackService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["requestFeedback-list"] });
    },
  });
}

/**
 * Update an existing RequestFeedback record.
 * @remarks Form validation: use UpdateRequestFeedbackSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateRequestFeedback() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<RequestFeedback, "id">>;
    }) => RequestFeedbackService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["requestFeedback-list"] });
      client.invalidateQueries({ queryKey: ["requestFeedback", variables.id] });
    },
  });
}

/**
 * Delete a RequestFeedback record by its unique identifier.
 */
export function useDeleteRequestFeedback() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RequestFeedbackService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["requestFeedback-list"] });
      client.invalidateQueries({ queryKey: ["requestFeedback", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const RequestFeedback_DATA_SOURCE_TYPE = 'InMemory' as const;

export { RequestFeedbackSchema, CreateRequestFeedbackSchema, UpdateRequestFeedbackSchema } from "../validators/request-feedback-validator";
export type { RequestFeedbackInput, CreateRequestFeedbackInput, UpdateRequestFeedbackInput } from "../validators/request-feedback-validator";