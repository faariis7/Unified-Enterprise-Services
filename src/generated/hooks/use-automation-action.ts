import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AutomationActionService } from "../services/automation-action-service";
import type { AutomationAction } from "../models/automation-action-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all AutomationAction records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, actionName, actionTypeKey, configuredValue, notificationMessage, sortOrder, statusKey, targetField, taskTitle
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useAutomationActionList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["automationAction-list", options],
    queryFn: () => AutomationActionService.getAll(options),
  });
}

/**
 * Retrieve a single AutomationAction record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useAutomationAction(id: string) {
  return useQuery({
    queryKey: ["automationAction", id],
    queryFn: () => AutomationActionService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new AutomationAction record.
 * @remarks Form validation: use CreateAutomationActionSchema with zodResolver for type-safe create forms
 */
export function useCreateAutomationAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<AutomationAction, "id">) => AutomationActionService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["automationAction-list"] });
    },
  });
}

/**
 * Update an existing AutomationAction record.
 * @remarks Form validation: use UpdateAutomationActionSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateAutomationAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<AutomationAction, "id">>;
    }) => AutomationActionService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["automationAction-list"] });
      client.invalidateQueries({ queryKey: ["automationAction", variables.id] });
    },
  });
}

/**
 * Delete a AutomationAction record by its unique identifier.
 */
export function useDeleteAutomationAction() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AutomationActionService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["automationAction-list"] });
      client.invalidateQueries({ queryKey: ["automationAction", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const AutomationAction_DATA_SOURCE_TYPE = 'InMemory' as const;

export { AutomationActionSchema, CreateAutomationActionSchema, UpdateAutomationActionSchema } from "../validators/automation-action-validator";
export type { AutomationActionInput, CreateAutomationActionInput, UpdateAutomationActionInput } from "../validators/automation-action-validator";