import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LifecycleTransitionRequiredFieldService } from "../services/lifecycle-transition-required-field-service";
import type { LifecycleTransitionRequiredField } from "../models/lifecycle-transition-required-field-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all LifecycleTransitionRequiredField records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, fieldLabel, fieldName, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useLifecycleTransitionRequiredFieldList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["lifecycleTransitionRequiredField-list", options],
    queryFn: () => LifecycleTransitionRequiredFieldService.getAll(options),
  });
}

/**
 * Retrieve a single LifecycleTransitionRequiredField record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useLifecycleTransitionRequiredField(id: string) {
  return useQuery({
    queryKey: ["lifecycleTransitionRequiredField", id],
    queryFn: () => LifecycleTransitionRequiredFieldService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new LifecycleTransitionRequiredField record.
 * @remarks Form validation: use CreateLifecycleTransitionRequiredFieldSchema with zodResolver for type-safe create forms
 */
export function useCreateLifecycleTransitionRequiredField() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<LifecycleTransitionRequiredField, "id">) => LifecycleTransitionRequiredFieldService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["lifecycleTransitionRequiredField-list"] });
    },
  });
}

/**
 * Update an existing LifecycleTransitionRequiredField record.
 * @remarks Form validation: use UpdateLifecycleTransitionRequiredFieldSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateLifecycleTransitionRequiredField() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<LifecycleTransitionRequiredField, "id">>;
    }) => LifecycleTransitionRequiredFieldService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["lifecycleTransitionRequiredField-list"] });
      client.invalidateQueries({ queryKey: ["lifecycleTransitionRequiredField", variables.id] });
    },
  });
}

/**
 * Delete a LifecycleTransitionRequiredField record by its unique identifier.
 */
export function useDeleteLifecycleTransitionRequiredField() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => LifecycleTransitionRequiredFieldService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["lifecycleTransitionRequiredField-list"] });
      client.invalidateQueries({ queryKey: ["lifecycleTransitionRequiredField", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const LifecycleTransitionRequiredField_DATA_SOURCE_TYPE = 'InMemory' as const;

export { LifecycleTransitionRequiredFieldSchema, CreateLifecycleTransitionRequiredFieldSchema, UpdateLifecycleTransitionRequiredFieldSchema } from "../validators/lifecycle-transition-required-field-validator";
export type { LifecycleTransitionRequiredFieldInput, CreateLifecycleTransitionRequiredFieldInput, UpdateLifecycleTransitionRequiredFieldInput } from "../validators/lifecycle-transition-required-field-validator";