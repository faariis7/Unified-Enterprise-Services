import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { KnowledgeVersionService } from "../services/knowledge-version-service";
import type { KnowledgeVersion } from "../models/knowledge-version-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all KnowledgeVersion records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, immutableSnapshotLabel, bodyContent, changeNotes, reviewComments, stateKey, submittedReviewedAndPublishedTimestamps, summary, title, versionNumber
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useKnowledgeVersionList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["knowledgeVersion-list", options],
    queryFn: () => KnowledgeVersionService.getAll(options),
  });
}

/**
 * Retrieve a single KnowledgeVersion record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useKnowledgeVersion(id: string) {
  return useQuery({
    queryKey: ["knowledgeVersion", id],
    queryFn: () => KnowledgeVersionService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new KnowledgeVersion record.
 * @remarks Form validation: use CreateKnowledgeVersionSchema with zodResolver for type-safe create forms
 */
export function useCreateKnowledgeVersion() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<KnowledgeVersion, "id">) => KnowledgeVersionService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["knowledgeVersion-list"] });
    },
  });
}

/**
 * Update an existing KnowledgeVersion record.
 * @remarks Form validation: use UpdateKnowledgeVersionSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateKnowledgeVersion() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<KnowledgeVersion, "id">>;
    }) => KnowledgeVersionService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["knowledgeVersion-list"] });
      client.invalidateQueries({ queryKey: ["knowledgeVersion", variables.id] });
    },
  });
}

/**
 * Delete a KnowledgeVersion record by its unique identifier.
 */
export function useDeleteKnowledgeVersion() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => KnowledgeVersionService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["knowledgeVersion-list"] });
      client.invalidateQueries({ queryKey: ["knowledgeVersion", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const KnowledgeVersion_DATA_SOURCE_TYPE = 'InMemory' as const;

export { KnowledgeVersionSchema, CreateKnowledgeVersionSchema, UpdateKnowledgeVersionSchema } from "../validators/knowledge-version-validator";
export type { KnowledgeVersionInput, CreateKnowledgeVersionInput, UpdateKnowledgeVersionInput } from "../validators/knowledge-version-validator";