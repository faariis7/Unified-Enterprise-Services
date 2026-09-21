import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestFieldValueService } from "../services/request-field-value-service";
import type { RequestFieldValue } from "../models/request-field-value-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all RequestFieldValue records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, fieldLabel, booleanValue, createdAt, dateValue, displayValue, fieldDefinitionId, isDeleted, numberValue, stableFieldKey, structuredValue, textValue, updatedAt, value, valueTypeKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRequestFieldValueList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["requestFieldValue-list", options],
    queryFn: () => RequestFieldValueService.getAll(options),
  });
}

/**
 * Retrieve a single RequestFieldValue record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRequestFieldValue(id: string) {
  return useQuery({
    queryKey: ["requestFieldValue", id],
    queryFn: () => RequestFieldValueService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new RequestFieldValue record.
 * @remarks Form validation: use CreateRequestFieldValueSchema with zodResolver for type-safe create forms
 */
export function useCreateRequestFieldValue() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RequestFieldValue, "id">) => RequestFieldValueService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["requestFieldValue-list"] });
    },
  });
}

/**
 * Update an existing RequestFieldValue record.
 * @remarks Form validation: use UpdateRequestFieldValueSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateRequestFieldValue() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<RequestFieldValue, "id">>;
    }) => RequestFieldValueService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["requestFieldValue-list"] });
      client.invalidateQueries({ queryKey: ["requestFieldValue", variables.id] });
    },
  });
}

/**
 * Delete a RequestFieldValue record by its unique identifier.
 */
export function useDeleteRequestFieldValue() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RequestFieldValueService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["requestFieldValue-list"] });
      client.invalidateQueries({ queryKey: ["requestFieldValue", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const RequestFieldValue_DATA_SOURCE_TYPE = 'InMemory' as const;

export { RequestFieldValueSchema, CreateRequestFieldValueSchema, UpdateRequestFieldValueSchema } from "../validators/request-field-value-validator";
export type { RequestFieldValueInput, CreateRequestFieldValueInput, UpdateRequestFieldValueInput } from "../validators/request-field-value-validator";