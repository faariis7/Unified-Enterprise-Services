import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KnowledgeArticleService } from "../services/knowledge-article-service";
import type { KnowledgeArticle } from "../models/knowledge-article-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all KnowledgeArticle records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, articleNumber, audienceKey, createdAndUpdatedAuditFields, currentVersionNumber, publishedAndReviewDates, stateKey, summary, tags, title, viewAndFeedbackCounts
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useKnowledgeArticleList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["knowledgeArticle-list", options],
    queryFn: () => KnowledgeArticleService.getAll(options),
  });
}

/**
 * Retrieve a single KnowledgeArticle record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useKnowledgeArticle(id: string) {
  return useQuery({
    queryKey: ["knowledgeArticle", id],
    queryFn: () => KnowledgeArticleService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new KnowledgeArticle record.
 * @remarks Form validation: use CreateKnowledgeArticleSchema with zodResolver for type-safe create forms
 */
export function useCreateKnowledgeArticle() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<KnowledgeArticle, "id">) => KnowledgeArticleService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["knowledgeArticle-list"] });
    },
  });
}

/**
 * Update an existing KnowledgeArticle record.
 * @remarks Form validation: use UpdateKnowledgeArticleSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateKnowledgeArticle() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<KnowledgeArticle, "id">>;
    }) => KnowledgeArticleService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["knowledgeArticle-list"] });
      client.invalidateQueries({ queryKey: ["knowledgeArticle", variables.id] });
    },
  });
}

/**
 * Delete a KnowledgeArticle record by its unique identifier.
 */
export function useDeleteKnowledgeArticle() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => KnowledgeArticleService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["knowledgeArticle-list"] });
      client.invalidateQueries({ queryKey: ["knowledgeArticle", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const KnowledgeArticle_DATA_SOURCE_TYPE = 'InMemory' as const;

export { KnowledgeArticleSchema, CreateKnowledgeArticleSchema, UpdateKnowledgeArticleSchema } from "../validators/knowledge-article-validator";
export type { KnowledgeArticleInput, CreateKnowledgeArticleInput, UpdateKnowledgeArticleInput } from "../validators/knowledge-article-validator";