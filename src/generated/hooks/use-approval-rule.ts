import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApprovalRuleService } from "../services/approval-rule-service";
import type { ApprovalRule } from "../models/approval-rule-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all ApprovalRule records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, ruleName, approverTypeKey, conditionExpression, delegationAllowed, escalationGroupCode, groupCode, minimumApprovals, rejectionBehaviorKey, ruleOrder, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useApprovalRuleList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["approvalRule-list", options],
    queryFn: () => ApprovalRuleService.getAll(options),
  });
}

/**
 * Retrieve a single ApprovalRule record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useApprovalRule(id: string) {
  return useQuery({
    queryKey: ["approvalRule", id],
    queryFn: () => ApprovalRuleService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new ApprovalRule record.
 * @remarks Form validation: use CreateApprovalRuleSchema with zodResolver for type-safe create forms
 */
export function useCreateApprovalRule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ApprovalRule, "id">) => ApprovalRuleService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["approvalRule-list"] });
    },
  });
}

/**
 * Update an existing ApprovalRule record.
 * @remarks Form validation: use UpdateApprovalRuleSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateApprovalRule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<ApprovalRule, "id">>;
    }) => ApprovalRuleService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["approvalRule-list"] });
      client.invalidateQueries({ queryKey: ["approvalRule", variables.id] });
    },
  });
}

/**
 * Delete a ApprovalRule record by its unique identifier.
 */
export function useDeleteApprovalRule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ApprovalRuleService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["approvalRule-list"] });
      client.invalidateQueries({ queryKey: ["approvalRule", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const ApprovalRule_DATA_SOURCE_TYPE = 'InMemory' as const;

export { ApprovalRuleSchema, CreateApprovalRuleSchema, UpdateApprovalRuleSchema } from "../validators/approval-rule-validator";
export type { ApprovalRuleInput, CreateApprovalRuleInput, UpdateApprovalRuleInput } from "../validators/approval-rule-validator";