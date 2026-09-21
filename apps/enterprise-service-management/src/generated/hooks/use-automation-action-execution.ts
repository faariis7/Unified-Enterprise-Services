import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AutomationActionExecutionService } from "../services/automation-action-execution-service";
import type { AutomationActionExecution } from "../models/automation-action-execution-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all AutomationActionExecution records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, idempotencyKey, details, executedAt, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useAutomationActionExecutionList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["automationActionExecution-list", options],
    queryFn: () => AutomationActionExecutionService.getAll(options),
  });
}

/**
 * Retrieve a single AutomationActionExecution record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useAutomationActionExecution(id: string) {
  return useQuery({
    queryKey: ["automationActionExecution", id],
    queryFn: () => AutomationActionExecutionService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new AutomationActionExecution record.
 * @remarks Form validation: use CreateAutomationActionExecutionSchema with zodResolver for type-safe create forms
 */
export function useCreateAutomationActionExecution() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<AutomationActionExecution, "id">) => AutomationActionExecutionService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["automationActionExecution-list"] });
    },
  });
}

/**
 * Update an existing AutomationActionExecution record.
 * @remarks Form validation: use UpdateAutomationActionExecutionSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateAutomationActionExecution() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<AutomationActionExecution, "id">>;
    }) => AutomationActionExecutionService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["automationActionExecution-list"] });
      client.invalidateQueries({ queryKey: ["automationActionExecution", variables.id] });
    },
  });
}

/**
 * Delete a AutomationActionExecution record by its unique identifier.
 */
export function useDeleteAutomationActionExecution() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AutomationActionExecutionService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["automationActionExecution-list"] });
      client.invalidateQueries({ queryKey: ["automationActionExecution", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const AutomationActionExecution_DATA_SOURCE_TYPE = 'InMemory' as const;

export { AutomationActionExecutionSchema, CreateAutomationActionExecutionSchema, UpdateAutomationActionExecutionSchema } from "../validators/automation-action-execution-validator";
export type { AutomationActionExecutionInput, CreateAutomationActionExecutionInput, UpdateAutomationActionExecutionInput } from "../validators/automation-action-execution-validator";