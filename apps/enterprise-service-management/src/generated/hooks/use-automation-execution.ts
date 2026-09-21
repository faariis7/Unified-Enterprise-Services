import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AutomationExecutionService } from "../services/automation-execution-service";
import type { AutomationExecution } from "../models/automation-execution-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all AutomationExecution records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, correlationKey, completedAt, depth, failureCode, failureMessage, source, startedAt, statusKey, triggerKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useAutomationExecutionList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["automationExecution-list", options],
    queryFn: () => AutomationExecutionService.getAll(options),
  });
}

/**
 * Retrieve a single AutomationExecution record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useAutomationExecution(id: string) {
  return useQuery({
    queryKey: ["automationExecution", id],
    queryFn: () => AutomationExecutionService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new AutomationExecution record.
 * @remarks Form validation: use CreateAutomationExecutionSchema with zodResolver for type-safe create forms
 */
export function useCreateAutomationExecution() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<AutomationExecution, "id">) => AutomationExecutionService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["automationExecution-list"] });
    },
  });
}

/**
 * Update an existing AutomationExecution record.
 * @remarks Form validation: use UpdateAutomationExecutionSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateAutomationExecution() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<AutomationExecution, "id">>;
    }) => AutomationExecutionService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["automationExecution-list"] });
      client.invalidateQueries({ queryKey: ["automationExecution", variables.id] });
    },
  });
}

/**
 * Delete a AutomationExecution record by its unique identifier.
 */
export function useDeleteAutomationExecution() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AutomationExecutionService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["automationExecution-list"] });
      client.invalidateQueries({ queryKey: ["automationExecution", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const AutomationExecution_DATA_SOURCE_TYPE = 'InMemory' as const;

export { AutomationExecutionSchema, CreateAutomationExecutionSchema, UpdateAutomationExecutionSchema } from "../validators/automation-execution-validator";
export type { AutomationExecutionInput, CreateAutomationExecutionInput, UpdateAutomationExecutionInput } from "../validators/automation-execution-validator";