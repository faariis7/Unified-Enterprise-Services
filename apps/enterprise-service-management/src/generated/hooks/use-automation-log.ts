import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AutomationLogService } from "../services/automation-log-service";
import type { AutomationLog } from "../models/automation-log-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all AutomationLog records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, logName, actionSummary, completedAt, conditionSummary, correlationKey, depth, loopPreventionReason, outcomeKey, startedAt
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useAutomationLogList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["automationLog-list", options],
    queryFn: () => AutomationLogService.getAll(options),
  });
}

/**
 * Retrieve a single AutomationLog record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useAutomationLog(id: string) {
  return useQuery({
    queryKey: ["automationLog", id],
    queryFn: () => AutomationLogService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new AutomationLog record.
 * @remarks Form validation: use CreateAutomationLogSchema with zodResolver for type-safe create forms
 */
export function useCreateAutomationLog() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<AutomationLog, "id">) => AutomationLogService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["automationLog-list"] });
    },
  });
}

/**
 * Update an existing AutomationLog record.
 * @remarks Form validation: use UpdateAutomationLogSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateAutomationLog() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<AutomationLog, "id">>;
    }) => AutomationLogService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["automationLog-list"] });
      client.invalidateQueries({ queryKey: ["automationLog", variables.id] });
    },
  });
}

/**
 * Delete a AutomationLog record by its unique identifier.
 */
export function useDeleteAutomationLog() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AutomationLogService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["automationLog-list"] });
      client.invalidateQueries({ queryKey: ["automationLog", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const AutomationLog_DATA_SOURCE_TYPE = 'InMemory' as const;

export { AutomationLogSchema, CreateAutomationLogSchema, UpdateAutomationLogSchema } from "../validators/automation-log-validator";
export type { AutomationLogInput, CreateAutomationLogInput, UpdateAutomationLogInput } from "../validators/automation-log-validator";