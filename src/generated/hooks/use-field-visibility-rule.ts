import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FieldVisibilityRuleService } from "../services/field-visibility-rule-service";
import type { FieldVisibilityRule } from "../models/field-visibility-rule-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all FieldVisibilityRule records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, ruleName, comparisonValue, createdAt, effectKey, isDeleted, operatorKey, sortOrder, statusKey, updatedAt
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useFieldVisibilityRuleList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["fieldVisibilityRule-list", options],
    queryFn: () => FieldVisibilityRuleService.getAll(options),
  });
}

/**
 * Retrieve a single FieldVisibilityRule record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useFieldVisibilityRule(id: string) {
  return useQuery({
    queryKey: ["fieldVisibilityRule", id],
    queryFn: () => FieldVisibilityRuleService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new FieldVisibilityRule record.
 * @remarks Form validation: use CreateFieldVisibilityRuleSchema with zodResolver for type-safe create forms
 */
export function useCreateFieldVisibilityRule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<FieldVisibilityRule, "id">) => FieldVisibilityRuleService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["fieldVisibilityRule-list"] });
    },
  });
}

/**
 * Update an existing FieldVisibilityRule record.
 * @remarks Form validation: use UpdateFieldVisibilityRuleSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateFieldVisibilityRule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<FieldVisibilityRule, "id">>;
    }) => FieldVisibilityRuleService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["fieldVisibilityRule-list"] });
      client.invalidateQueries({ queryKey: ["fieldVisibilityRule", variables.id] });
    },
  });
}

/**
 * Delete a FieldVisibilityRule record by its unique identifier.
 */
export function useDeleteFieldVisibilityRule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => FieldVisibilityRuleService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["fieldVisibilityRule-list"] });
      client.invalidateQueries({ queryKey: ["fieldVisibilityRule", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const FieldVisibilityRule_DATA_SOURCE_TYPE = 'InMemory' as const;

export { FieldVisibilityRuleSchema, CreateFieldVisibilityRuleSchema, UpdateFieldVisibilityRuleSchema } from "../validators/field-visibility-rule-validator";
export type { FieldVisibilityRuleInput, CreateFieldVisibilityRuleInput, UpdateFieldVisibilityRuleInput } from "../validators/field-visibility-rule-validator";