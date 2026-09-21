import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FieldOptionService } from "../services/field-option-service";
import type { FieldOption } from "../models/field-option-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all FieldOption records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, label, createdAt, isDeleted, sortOrder, statusKey, updatedAt, value
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useFieldOptionList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["fieldOption-list", options],
    queryFn: () => FieldOptionService.getAll(options),
  });
}

/**
 * Retrieve a single FieldOption record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useFieldOption(id: string) {
  return useQuery({
    queryKey: ["fieldOption", id],
    queryFn: () => FieldOptionService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new FieldOption record.
 * @remarks Form validation: use CreateFieldOptionSchema with zodResolver for type-safe create forms
 */
export function useCreateFieldOption() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<FieldOption, "id">) => FieldOptionService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["fieldOption-list"] });
    },
  });
}

/**
 * Update an existing FieldOption record.
 * @remarks Form validation: use UpdateFieldOptionSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateFieldOption() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<FieldOption, "id">>;
    }) => FieldOptionService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["fieldOption-list"] });
      client.invalidateQueries({ queryKey: ["fieldOption", variables.id] });
    },
  });
}

/**
 * Delete a FieldOption record by its unique identifier.
 */
export function useDeleteFieldOption() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => FieldOptionService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["fieldOption-list"] });
      client.invalidateQueries({ queryKey: ["fieldOption", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const FieldOption_DATA_SOURCE_TYPE = 'InMemory' as const;

export { FieldOptionSchema, CreateFieldOptionSchema, UpdateFieldOptionSchema } from "../validators/field-option-validator";
export type { FieldOptionInput, CreateFieldOptionInput, UpdateFieldOptionInput } from "../validators/field-option-validator";