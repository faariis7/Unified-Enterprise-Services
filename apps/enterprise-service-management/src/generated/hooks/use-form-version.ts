import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FormVersionService } from "../services/form-version-service";
import type { FormVersion } from "../models/form-version-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all FormVersion records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, snapshotLabel, configurationSnapshot, createdAt, isDeleted, publishedAt, statusKey, updatedAt, versionNumber
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useFormVersionList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["formVersion-list", options],
    queryFn: () => FormVersionService.getAll(options),
  });
}

/**
 * Retrieve a single FormVersion record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useFormVersion(id: string) {
  return useQuery({
    queryKey: ["formVersion", id],
    queryFn: () => FormVersionService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new FormVersion record.
 * @remarks Form validation: use CreateFormVersionSchema with zodResolver for type-safe create forms
 */
export function useCreateFormVersion() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<FormVersion, "id">) => FormVersionService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["formVersion-list"] });
    },
  });
}

/**
 * Update an existing FormVersion record.
 * @remarks Form validation: use UpdateFormVersionSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateFormVersion() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<FormVersion, "id">>;
    }) => FormVersionService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["formVersion-list"] });
      client.invalidateQueries({ queryKey: ["formVersion", variables.id] });
    },
  });
}

/**
 * Delete a FormVersion record by its unique identifier.
 */
export function useDeleteFormVersion() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => FormVersionService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["formVersion-list"] });
      client.invalidateQueries({ queryKey: ["formVersion", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const FormVersion_DATA_SOURCE_TYPE = 'InMemory' as const;

export { FormVersionSchema, CreateFormVersionSchema, UpdateFormVersionSchema } from "../validators/form-version-validator";
export type { FormVersionInput, CreateFormVersionInput, UpdateFormVersionInput } from "../validators/form-version-validator";