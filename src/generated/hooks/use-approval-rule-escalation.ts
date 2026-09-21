import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApprovalRuleEscalationService } from "../services/approval-rule-escalation-service";
import type { ApprovalRuleEscalation } from "../models/approval-rule-escalation-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all ApprovalRuleEscalation records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, escalationName, escalationApproverTypeKey, escalationGroupCode
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useApprovalRuleEscalationList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["approvalRuleEscalation-list", options],
    queryFn: () => ApprovalRuleEscalationService.getAll(options),
  });
}

/**
 * Retrieve a single ApprovalRuleEscalation record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useApprovalRuleEscalation(id: string) {
  return useQuery({
    queryKey: ["approvalRuleEscalation", id],
    queryFn: () => ApprovalRuleEscalationService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new ApprovalRuleEscalation record.
 * @remarks Form validation: use CreateApprovalRuleEscalationSchema with zodResolver for type-safe create forms
 */
export function useCreateApprovalRuleEscalation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ApprovalRuleEscalation, "id">) => ApprovalRuleEscalationService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["approvalRuleEscalation-list"] });
    },
  });
}

/**
 * Update an existing ApprovalRuleEscalation record.
 * @remarks Form validation: use UpdateApprovalRuleEscalationSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateApprovalRuleEscalation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<ApprovalRuleEscalation, "id">>;
    }) => ApprovalRuleEscalationService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["approvalRuleEscalation-list"] });
      client.invalidateQueries({ queryKey: ["approvalRuleEscalation", variables.id] });
    },
  });
}

/**
 * Delete a ApprovalRuleEscalation record by its unique identifier.
 */
export function useDeleteApprovalRuleEscalation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ApprovalRuleEscalationService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["approvalRuleEscalation-list"] });
      client.invalidateQueries({ queryKey: ["approvalRuleEscalation", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const ApprovalRuleEscalation_DATA_SOURCE_TYPE = 'InMemory' as const;

export { ApprovalRuleEscalationSchema, CreateApprovalRuleEscalationSchema, UpdateApprovalRuleEscalationSchema } from "../validators/approval-rule-escalation-validator";
export type { ApprovalRuleEscalationInput, CreateApprovalRuleEscalationInput, UpdateApprovalRuleEscalationInput } from "../validators/approval-rule-escalation-validator";