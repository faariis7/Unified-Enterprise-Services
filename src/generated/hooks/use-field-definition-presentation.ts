import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FieldDefinitionPresentationService } from "../services/field-definition-presentation-service";
import type { FieldDefinitionPresentation } from "../models/field-definition-presentation-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all FieldDefinitionPresentation records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, presentationName, defaultValue, helpText, sortOrder
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useFieldDefinitionPresentationList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["fieldDefinitionPresentation-list", options],
    queryFn: () => FieldDefinitionPresentationService.getAll(options),
  });
}

/**
 * Retrieve a single FieldDefinitionPresentation record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useFieldDefinitionPresentation(id: string) {
  return useQuery({
    queryKey: ["fieldDefinitionPresentation", id],
    queryFn: () => FieldDefinitionPresentationService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new FieldDefinitionPresentation record.
 * @remarks Form validation: use CreateFieldDefinitionPresentationSchema with zodResolver for type-safe create forms
 */
export function useCreateFieldDefinitionPresentation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<FieldDefinitionPresentation, "id">) => FieldDefinitionPresentationService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["fieldDefinitionPresentation-list"] });
    },
  });
}

/**
 * Update an existing FieldDefinitionPresentation record.
 * @remarks Form validation: use UpdateFieldDefinitionPresentationSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateFieldDefinitionPresentation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<FieldDefinitionPresentation, "id">>;
    }) => FieldDefinitionPresentationService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["fieldDefinitionPresentation-list"] });
      client.invalidateQueries({ queryKey: ["fieldDefinitionPresentation", variables.id] });
    },
  });
}

/**
 * Delete a FieldDefinitionPresentation record by its unique identifier.
 */
export function useDeleteFieldDefinitionPresentation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => FieldDefinitionPresentationService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["fieldDefinitionPresentation-list"] });
      client.invalidateQueries({ queryKey: ["fieldDefinitionPresentation", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const FieldDefinitionPresentation_DATA_SOURCE_TYPE = 'InMemory' as const;

export { FieldDefinitionPresentationSchema, CreateFieldDefinitionPresentationSchema, UpdateFieldDefinitionPresentationSchema } from "../validators/field-definition-presentation-validator";
export type { FieldDefinitionPresentationInput, CreateFieldDefinitionPresentationInput, UpdateFieldDefinitionPresentationInput } from "../validators/field-definition-presentation-validator";