import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestTagService } from "../services/request-tag-service";
import type { RequestTag } from "../models/request-tag-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all RequestTag records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, tagName, createdAt, value
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRequestTagList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["requestTag-list", options],
    queryFn: () => RequestTagService.getAll(options),
  });
}

/**
 * Retrieve a single RequestTag record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRequestTag(id: string) {
  return useQuery({
    queryKey: ["requestTag", id],
    queryFn: () => RequestTagService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new RequestTag record.
 * @remarks Form validation: use CreateRequestTagSchema with zodResolver for type-safe create forms
 */
export function useCreateRequestTag() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RequestTag, "id">) => RequestTagService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["requestTag-list"] });
    },
  });
}

/**
 * Update an existing RequestTag record.
 * @remarks Form validation: use UpdateRequestTagSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateRequestTag() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<RequestTag, "id">>;
    }) => RequestTagService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["requestTag-list"] });
      client.invalidateQueries({ queryKey: ["requestTag", variables.id] });
    },
  });
}

/**
 * Delete a RequestTag record by its unique identifier.
 */
export function useDeleteRequestTag() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RequestTagService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["requestTag-list"] });
      client.invalidateQueries({ queryKey: ["requestTag", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const RequestTag_DATA_SOURCE_TYPE = 'InMemory' as const;

export { RequestTagSchema, CreateRequestTagSchema, UpdateRequestTagSchema } from "../validators/request-tag-validator";
export type { RequestTagInput, CreateRequestTagInput, UpdateRequestTagInput } from "../validators/request-tag-validator";