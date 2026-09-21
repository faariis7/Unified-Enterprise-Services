import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FieldValidationRuleService } from "../services/field-validation-rule-service";
import type { FieldValidationRule } from "../models/field-validation-rule-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all FieldValidationRule records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, errorMessage, comparisonValue, createdAt, isDeleted, ruleTypeKey, sortOrder, statusKey, updatedAt
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useFieldValidationRuleList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["fieldValidationRule-list", options],
    queryFn: () => FieldValidationRuleService.getAll(options),
  });
}

/**
 * Retrieve a single FieldValidationRule record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useFieldValidationRule(id: string) {
  return useQuery({
    queryKey: ["fieldValidationRule", id],
    queryFn: () => FieldValidationRuleService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new FieldValidationRule record.
 * @remarks Form validation: use CreateFieldValidationRuleSchema with zodResolver for type-safe create forms
 */
export function useCreateFieldValidationRule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<FieldValidationRule, "id">) => FieldValidationRuleService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["fieldValidationRule-list"] });
    },
  });
}

/**
 * Update an existing FieldValidationRule record.
 * @remarks Form validation: use UpdateFieldValidationRuleSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateFieldValidationRule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<FieldValidationRule, "id">>;
    }) => FieldValidationRuleService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["fieldValidationRule-list"] });
      client.invalidateQueries({ queryKey: ["fieldValidationRule", variables.id] });
    },
  });
}

/**
 * Delete a FieldValidationRule record by its unique identifier.
 */
export function useDeleteFieldValidationRule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => FieldValidationRuleService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["fieldValidationRule-list"] });
      client.invalidateQueries({ queryKey: ["fieldValidationRule", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const FieldValidationRule_DATA_SOURCE_TYPE = 'InMemory' as const;

export { FieldValidationRuleSchema, CreateFieldValidationRuleSchema, UpdateFieldValidationRuleSchema } from "../validators/field-validation-rule-validator";
export type { FieldValidationRuleInput, CreateFieldValidationRuleInput, UpdateFieldValidationRuleInput } from "../validators/field-validation-rule-validator";