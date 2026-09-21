import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TransitionValidationService } from "../services/transition-validation-service";
import type { TransitionValidation } from "../models/transition-validation-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all TransitionValidation records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, errorMessage, expectedValue, fieldCode, sortOrder, statusKey, validationTypeKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useTransitionValidationList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["transitionValidation-list", options],
    queryFn: () => TransitionValidationService.getAll(options),
  });
}

/**
 * Retrieve a single TransitionValidation record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useTransitionValidation(id: string) {
  return useQuery({
    queryKey: ["transitionValidation", id],
    queryFn: () => TransitionValidationService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new TransitionValidation record.
 * @remarks Form validation: use CreateTransitionValidationSchema with zodResolver for type-safe create forms
 */
export function useCreateTransitionValidation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<TransitionValidation, "id">) => TransitionValidationService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["transitionValidation-list"] });
    },
  });
}

/**
 * Update an existing TransitionValidation record.
 * @remarks Form validation: use UpdateTransitionValidationSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateTransitionValidation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<TransitionValidation, "id">>;
    }) => TransitionValidationService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["transitionValidation-list"] });
      client.invalidateQueries({ queryKey: ["transitionValidation", variables.id] });
    },
  });
}

/**
 * Delete a TransitionValidation record by its unique identifier.
 */
export function useDeleteTransitionValidation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => TransitionValidationService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["transitionValidation-list"] });
      client.invalidateQueries({ queryKey: ["transitionValidation", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const TransitionValidation_DATA_SOURCE_TYPE = 'InMemory' as const;

export { TransitionValidationSchema, CreateTransitionValidationSchema, UpdateTransitionValidationSchema } from "../validators/transition-validation-validator";
export type { TransitionValidationInput, CreateTransitionValidationInput, UpdateTransitionValidationInput } from "../validators/transition-validation-validator";