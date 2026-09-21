import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AssignmentRuleService } from "../services/assignment-rule-service";
import type { AssignmentRule } from "../models/assignment-rule-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all AssignmentRule records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, name1, catalogItemCode, departmentCode, destinationGroupCode, priorityKey, serviceCode, siteCode, sortOrder, statusKey, stopProcessing, triggerKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useAssignmentRuleList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["assignmentRule-list", options],
    queryFn: () => AssignmentRuleService.getAll(options),
  });
}

/**
 * Retrieve a single AssignmentRule record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useAssignmentRule(id: string) {
  return useQuery({
    queryKey: ["assignmentRule", id],
    queryFn: () => AssignmentRuleService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new AssignmentRule record.
 * @remarks Form validation: use CreateAssignmentRuleSchema with zodResolver for type-safe create forms
 */
export function useCreateAssignmentRule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<AssignmentRule, "id">) => AssignmentRuleService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["assignmentRule-list"] });
    },
  });
}

/**
 * Update an existing AssignmentRule record.
 * @remarks Form validation: use UpdateAssignmentRuleSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateAssignmentRule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<AssignmentRule, "id">>;
    }) => AssignmentRuleService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["assignmentRule-list"] });
      client.invalidateQueries({ queryKey: ["assignmentRule", variables.id] });
    },
  });
}

/**
 * Delete a AssignmentRule record by its unique identifier.
 */
export function useDeleteAssignmentRule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => AssignmentRuleService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["assignmentRule-list"] });
      client.invalidateQueries({ queryKey: ["assignmentRule", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const AssignmentRule_DATA_SOURCE_TYPE = 'InMemory' as const;

export { AssignmentRuleSchema, CreateAssignmentRuleSchema, UpdateAssignmentRuleSchema } from "../validators/assignment-rule-validator";
export type { AssignmentRuleInput, CreateAssignmentRuleInput, UpdateAssignmentRuleInput } from "../validators/assignment-rule-validator";