import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FieldDefinitionService } from "../services/field-definition-service";
import type { FieldDefinition } from "../models/field-definition-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all FieldDefinition records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, label, agentOnly, configuration, createdAt, defaultValue, fieldCode, fieldTypeKey, helpText, isDeleted, placeholder, readOnly1, reportable, requesterVisible, required, searchable, sensitive, sortOrder, updatedAt, visibilityRoleKey, widthKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useFieldDefinitionList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["fieldDefinition-list", options],
    queryFn: () => FieldDefinitionService.getAll(options),
  });
}

/**
 * Retrieve a single FieldDefinition record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useFieldDefinition(id: string) {
  return useQuery({
    queryKey: ["fieldDefinition", id],
    queryFn: () => FieldDefinitionService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new FieldDefinition record.
 * @remarks Form validation: use CreateFieldDefinitionSchema with zodResolver for type-safe create forms
 */
export function useCreateFieldDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<FieldDefinition, "id">) => FieldDefinitionService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["fieldDefinition-list"] });
    },
  });
}

/**
 * Update an existing FieldDefinition record.
 * @remarks Form validation: use UpdateFieldDefinitionSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateFieldDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<FieldDefinition, "id">>;
    }) => FieldDefinitionService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["fieldDefinition-list"] });
      client.invalidateQueries({ queryKey: ["fieldDefinition", variables.id] });
    },
  });
}

/**
 * Delete a FieldDefinition record by its unique identifier.
 */
export function useDeleteFieldDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => FieldDefinitionService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["fieldDefinition-list"] });
      client.invalidateQueries({ queryKey: ["fieldDefinition", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const FieldDefinition_DATA_SOURCE_TYPE = 'InMemory' as const;

export { FieldDefinitionSchema, CreateFieldDefinitionSchema, UpdateFieldDefinitionSchema } from "../validators/field-definition-validator";
export type { FieldDefinitionInput, CreateFieldDefinitionInput, UpdateFieldDefinitionInput } from "../validators/field-definition-validator";