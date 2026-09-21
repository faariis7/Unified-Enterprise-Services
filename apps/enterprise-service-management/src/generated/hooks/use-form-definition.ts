import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FormDefinitionService } from "../services/form-definition-service";
import type { FormDefinition } from "../models/form-definition-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all FormDefinition records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, name1, currentVersionNumber, description, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useFormDefinitionList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["formDefinition-list", options],
    queryFn: () => FormDefinitionService.getAll(options),
  });
}

/**
 * Retrieve a single FormDefinition record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useFormDefinition(id: string) {
  return useQuery({
    queryKey: ["formDefinition", id],
    queryFn: () => FormDefinitionService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new FormDefinition record.
 * @remarks Form validation: use CreateFormDefinitionSchema with zodResolver for type-safe create forms
 */
export function useCreateFormDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<FormDefinition, "id">) => FormDefinitionService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["formDefinition-list"] });
    },
  });
}

/**
 * Update an existing FormDefinition record.
 * @remarks Form validation: use UpdateFormDefinitionSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateFormDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<FormDefinition, "id">>;
    }) => FormDefinitionService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["formDefinition-list"] });
      client.invalidateQueries({ queryKey: ["formDefinition", variables.id] });
    },
  });
}

/**
 * Delete a FormDefinition record by its unique identifier.
 */
export function useDeleteFormDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => FormDefinitionService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["formDefinition-list"] });
      client.invalidateQueries({ queryKey: ["formDefinition", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const FormDefinition_DATA_SOURCE_TYPE = 'InMemory' as const;

export { FormDefinitionSchema, CreateFormDefinitionSchema, UpdateFormDefinitionSchema } from "../validators/form-definition-validator";
export type { FormDefinitionInput, CreateFormDefinitionInput, UpdateFormDefinitionInput } from "../validators/form-definition-validator";