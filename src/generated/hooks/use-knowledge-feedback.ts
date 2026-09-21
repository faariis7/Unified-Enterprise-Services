import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KnowledgeFeedbackService } from "../services/knowledge-feedback-service";
import type { KnowledgeFeedback } from "../models/knowledge-feedback-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all KnowledgeFeedback records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, feedbackLabel, comments, createdAt, helpful
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useKnowledgeFeedbackList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["knowledgeFeedback-list", options],
    queryFn: () => KnowledgeFeedbackService.getAll(options),
  });
}

/**
 * Retrieve a single KnowledgeFeedback record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useKnowledgeFeedback(id: string) {
  return useQuery({
    queryKey: ["knowledgeFeedback", id],
    queryFn: () => KnowledgeFeedbackService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new KnowledgeFeedback record.
 * @remarks Form validation: use CreateKnowledgeFeedbackSchema with zodResolver for type-safe create forms
 */
export function useCreateKnowledgeFeedback() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<KnowledgeFeedback, "id">) => KnowledgeFeedbackService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["knowledgeFeedback-list"] });
    },
  });
}

/**
 * Update an existing KnowledgeFeedback record.
 * @remarks Form validation: use UpdateKnowledgeFeedbackSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateKnowledgeFeedback() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<KnowledgeFeedback, "id">>;
    }) => KnowledgeFeedbackService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["knowledgeFeedback-list"] });
      client.invalidateQueries({ queryKey: ["knowledgeFeedback", variables.id] });
    },
  });
}

/**
 * Delete a KnowledgeFeedback record by its unique identifier.
 */
export function useDeleteKnowledgeFeedback() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => KnowledgeFeedbackService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["knowledgeFeedback-list"] });
      client.invalidateQueries({ queryKey: ["knowledgeFeedback", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const KnowledgeFeedback_DATA_SOURCE_TYPE = 'InMemory' as const;

export { KnowledgeFeedbackSchema, CreateKnowledgeFeedbackSchema, UpdateKnowledgeFeedbackSchema } from "../validators/knowledge-feedback-validator";
export type { KnowledgeFeedbackInput, CreateKnowledgeFeedbackInput, UpdateKnowledgeFeedbackInput } from "../validators/knowledge-feedback-validator";