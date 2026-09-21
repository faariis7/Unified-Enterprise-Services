import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FieldDependencyService } from "../services/field-dependency-service";
import type { FieldDependency } from "../models/field-dependency-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all FieldDependency records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, dependencyName, dependencyTypeKey, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useFieldDependencyList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["fieldDependency-list", options],
    queryFn: () => FieldDependencyService.getAll(options),
  });
}

/**
 * Retrieve a single FieldDependency record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useFieldDependency(id: string) {
  return useQuery({
    queryKey: ["fieldDependency", id],
    queryFn: () => FieldDependencyService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new FieldDependency record.
 * @remarks Form validation: use CreateFieldDependencySchema with zodResolver for type-safe create forms
 */
export function useCreateFieldDependency() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<FieldDependency, "id">) => FieldDependencyService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["fieldDependency-list"] });
    },
  });
}

/**
 * Update an existing FieldDependency record.
 * @remarks Form validation: use UpdateFieldDependencySchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateFieldDependency() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<FieldDependency, "id">>;
    }) => FieldDependencyService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["fieldDependency-list"] });
      client.invalidateQueries({ queryKey: ["fieldDependency", variables.id] });
    },
  });
}

/**
 * Delete a FieldDependency record by its unique identifier.
 */
export function useDeleteFieldDependency() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => FieldDependencyService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["fieldDependency-list"] });
      client.invalidateQueries({ queryKey: ["fieldDependency", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const FieldDependency_DATA_SOURCE_TYPE = 'InMemory' as const;

export { FieldDependencySchema, CreateFieldDependencySchema, UpdateFieldDependencySchema } from "../validators/field-dependency-validator";
export type { FieldDependencyInput, CreateFieldDependencyInput, UpdateFieldDependencyInput } from "../validators/field-dependency-validator";