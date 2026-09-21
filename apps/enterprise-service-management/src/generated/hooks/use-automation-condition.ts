import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AutomationConditionService } from "../services/automation-condition-service";
import type { AutomationCondition } from "../models/automation-condition-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all AutomationCondition records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, conditionName, active, comparisonValue, conditionGroup, conditionOrder, fieldName, groupLogicKey, operatorKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useAutomationConditionList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["automationCondition-list", options],
    queryFn: () => AutomationConditionService.getAll(options),
  });
}

/**
 * Retrieve a single AutomationCondition record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useAutomationCondition(id: string) {
  return useQuery({
    queryKey: ["automationCondition", id],
    queryFn: () => AutomationConditionService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new AutomationCondition record.
 * @remarks Form validation: use CreateAutomationConditionSchema with zodResolver for type-safe create forms
 */
export function useCreateAutomationCondition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<AutomationCondition, "id">) => AutomationConditionService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["automationCondition-list"] });
    },
  });
}

/**
 * Update an existing AutomationCondition record.
 * @remarks Form validation: use UpdateAutomationConditionSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateAutomationCondition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<AutomationCondition, "id">>;
    }) => AutomationConditionService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["automationCondition-list"] });
      client.invalidateQueries({ queryKey: ["automationCondition", variables.id] });
    },
  });
}

/**
 * Delete a AutomationCondition record by its unique identifier.
 */
export function useDeleteAutomationCondition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AutomationConditionService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["automationCondition-list"] });
      client.invalidateQueries({ queryKey: ["automationCondition", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const AutomationCondition_DATA_SOURCE_TYPE = 'InMemory' as const;

export { AutomationConditionSchema, CreateAutomationConditionSchema, UpdateAutomationConditionSchema } from "../validators/automation-condition-validator";
export type { AutomationConditionInput, CreateAutomationConditionInput, UpdateAutomationConditionInput } from "../validators/automation-condition-validator";