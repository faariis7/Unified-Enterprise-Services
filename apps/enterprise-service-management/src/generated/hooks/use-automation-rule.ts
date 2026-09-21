import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AutomationRuleService } from "../services/automation-rule-service";
import type { AutomationRule } from "../models/automation-rule-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all AutomationRule records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, name1, catalogItemCode, cooldownMinutes, description, destinationStatus, maximumChainDepth, maximumExecutionsPerRequest, ruleOrder, serviceCode, sourceStatus, statusKey, stopProcessing
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useAutomationRuleList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["automationRule-list", options],
    queryFn: () => AutomationRuleService.getAll(options),
  });
}

/**
 * Retrieve a single AutomationRule record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useAutomationRule(id: string) {
  return useQuery({
    queryKey: ["automationRule", id],
    queryFn: () => AutomationRuleService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new AutomationRule record.
 * @remarks Form validation: use CreateAutomationRuleSchema with zodResolver for type-safe create forms
 */
export function useCreateAutomationRule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<AutomationRule, "id">) => AutomationRuleService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["automationRule-list"] });
    },
  });
}

/**
 * Update an existing AutomationRule record.
 * @remarks Form validation: use UpdateAutomationRuleSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateAutomationRule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<AutomationRule, "id">>;
    }) => AutomationRuleService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["automationRule-list"] });
      client.invalidateQueries({ queryKey: ["automationRule", variables.id] });
    },
  });
}

/**
 * Delete a AutomationRule record by its unique identifier.
 */
export function useDeleteAutomationRule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AutomationRuleService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["automationRule-list"] });
      client.invalidateQueries({ queryKey: ["automationRule", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const AutomationRule_DATA_SOURCE_TYPE = 'InMemory' as const;

export { AutomationRuleSchema, CreateAutomationRuleSchema, UpdateAutomationRuleSchema } from "../validators/automation-rule-validator";
export type { AutomationRuleInput, CreateAutomationRuleInput, UpdateAutomationRuleInput } from "../validators/automation-rule-validator";