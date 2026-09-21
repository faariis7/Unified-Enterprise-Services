import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AutomationTriggerService } from "../services/automation-trigger-service";
import type { AutomationTrigger } from "../models/automation-trigger-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all AutomationTrigger records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, triggerName, active, eventFilters, scheduleExpression, triggerTypeKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useAutomationTriggerList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["automationTrigger-list", options],
    queryFn: () => AutomationTriggerService.getAll(options),
  });
}

/**
 * Retrieve a single AutomationTrigger record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useAutomationTrigger(id: string) {
  return useQuery({
    queryKey: ["automationTrigger", id],
    queryFn: () => AutomationTriggerService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new AutomationTrigger record.
 * @remarks Form validation: use CreateAutomationTriggerSchema with zodResolver for type-safe create forms
 */
export function useCreateAutomationTrigger() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<AutomationTrigger, "id">) => AutomationTriggerService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["automationTrigger-list"] });
    },
  });
}

/**
 * Update an existing AutomationTrigger record.
 * @remarks Form validation: use UpdateAutomationTriggerSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateAutomationTrigger() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<AutomationTrigger, "id">>;
    }) => AutomationTriggerService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["automationTrigger-list"] });
      client.invalidateQueries({ queryKey: ["automationTrigger", variables.id] });
    },
  });
}

/**
 * Delete a AutomationTrigger record by its unique identifier.
 */
export function useDeleteAutomationTrigger() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AutomationTriggerService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["automationTrigger-list"] });
      client.invalidateQueries({ queryKey: ["automationTrigger", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const AutomationTrigger_DATA_SOURCE_TYPE = 'InMemory' as const;

export { AutomationTriggerSchema, CreateAutomationTriggerSchema, UpdateAutomationTriggerSchema } from "../validators/automation-trigger-validator";
export type { AutomationTriggerInput, CreateAutomationTriggerInput, UpdateAutomationTriggerInput } from "../validators/automation-trigger-validator";