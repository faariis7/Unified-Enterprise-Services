import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApprovalDecisionService } from "../services/approval-decision-service";
import type { ApprovalDecision } from "../models/approval-decision-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all ApprovalDecision records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, decisionName, comments, decidedAt, decisionKey, source, targetRecordID, targetTypeKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useApprovalDecisionList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["approvalDecision-list", options],
    queryFn: () => ApprovalDecisionService.getAll(options),
  });
}

/**
 * Retrieve a single ApprovalDecision record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useApprovalDecision(id: string) {
  return useQuery({
    queryKey: ["approvalDecision", id],
    queryFn: () => ApprovalDecisionService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new ApprovalDecision record.
 * @remarks Form validation: use CreateApprovalDecisionSchema with zodResolver for type-safe create forms
 */
export function useCreateApprovalDecision() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ApprovalDecision, "id">) => ApprovalDecisionService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["approvalDecision-list"] });
    },
  });
}

/**
 * Update an existing ApprovalDecision record.
 * @remarks Form validation: use UpdateApprovalDecisionSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateApprovalDecision() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<ApprovalDecision, "id">>;
    }) => ApprovalDecisionService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["approvalDecision-list"] });
      client.invalidateQueries({ queryKey: ["approvalDecision", variables.id] });
    },
  });
}

/**
 * Delete a ApprovalDecision record by its unique identifier.
 */
export function useDeleteApprovalDecision() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ApprovalDecisionService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["approvalDecision-list"] });
      client.invalidateQueries({ queryKey: ["approvalDecision", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const ApprovalDecision_DATA_SOURCE_TYPE = 'InMemory' as const;

export { ApprovalDecisionSchema, CreateApprovalDecisionSchema, UpdateApprovalDecisionSchema } from "../validators/approval-decision-validator";
export type { ApprovalDecisionInput, CreateApprovalDecisionInput, UpdateApprovalDecisionInput } from "../validators/approval-decision-validator";