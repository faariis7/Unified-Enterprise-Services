import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KnowledgeCategoryService } from "../services/knowledge-category-service";
import type { KnowledgeCategory } from "../models/knowledge-category-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all KnowledgeCategory records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, name1, active, description, icon, sortOrder
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useKnowledgeCategoryList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["knowledgeCategory-list", options],
    queryFn: () => KnowledgeCategoryService.getAll(options),
  });
}

/**
 * Retrieve a single KnowledgeCategory record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useKnowledgeCategory(id: string) {
  return useQuery({
    queryKey: ["knowledgeCategory", id],
    queryFn: () => KnowledgeCategoryService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new KnowledgeCategory record.
 * @remarks Form validation: use CreateKnowledgeCategorySchema with zodResolver for type-safe create forms
 */
export function useCreateKnowledgeCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<KnowledgeCategory, "id">) => KnowledgeCategoryService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["knowledgeCategory-list"] });
    },
  });
}

/**
 * Update an existing KnowledgeCategory record.
 * @remarks Form validation: use UpdateKnowledgeCategorySchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateKnowledgeCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<KnowledgeCategory, "id">>;
    }) => KnowledgeCategoryService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["knowledgeCategory-list"] });
      client.invalidateQueries({ queryKey: ["knowledgeCategory", variables.id] });
    },
  });
}

/**
 * Delete a KnowledgeCategory record by its unique identifier.
 */
export function useDeleteKnowledgeCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => KnowledgeCategoryService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["knowledgeCategory-list"] });
      client.invalidateQueries({ queryKey: ["knowledgeCategory", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const KnowledgeCategory_DATA_SOURCE_TYPE = 'InMemory' as const;

export { KnowledgeCategorySchema, CreateKnowledgeCategorySchema, UpdateKnowledgeCategorySchema } from "../validators/knowledge-category-validator";
export type { KnowledgeCategoryInput, CreateKnowledgeCategoryInput, UpdateKnowledgeCategoryInput } from "../validators/knowledge-category-validator";