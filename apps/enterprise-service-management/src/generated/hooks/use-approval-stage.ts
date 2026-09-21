import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApprovalStageService } from "../services/approval-stage-service";
import type { ApprovalStage } from "../models/approval-stage-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all ApprovalStage records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, name1, activationModeKey, completionRuleKey, escalationMinutes, executionModeKey, expirationMinutes, minimumApprovals, rejectionBehaviorKey, stageNumber, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useApprovalStageList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["approvalStage-list", options],
    queryFn: () => ApprovalStageService.getAll(options),
  });
}

/**
 * Retrieve a single ApprovalStage record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useApprovalStage(id: string) {
  return useQuery({
    queryKey: ["approvalStage", id],
    queryFn: () => ApprovalStageService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new ApprovalStage record.
 * @remarks Form validation: use CreateApprovalStageSchema with zodResolver for type-safe create forms
 */
export function useCreateApprovalStage() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ApprovalStage, "id">) => ApprovalStageService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["approvalStage-list"] });
    },
  });
}

/**
 * Update an existing ApprovalStage record.
 * @remarks Form validation: use UpdateApprovalStageSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateApprovalStage() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<ApprovalStage, "id">>;
    }) => ApprovalStageService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["approvalStage-list"] });
      client.invalidateQueries({ queryKey: ["approvalStage", variables.id] });
    },
  });
}

/**
 * Delete a ApprovalStage record by its unique identifier.
 */
export function useDeleteApprovalStage() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ApprovalStageService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["approvalStage-list"] });
      client.invalidateQueries({ queryKey: ["approvalStage", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const ApprovalStage_DATA_SOURCE_TYPE = 'InMemory' as const;

export { ApprovalStageSchema, CreateApprovalStageSchema, UpdateApprovalStageSchema } from "../validators/approval-stage-validator";
export type { ApprovalStageInput, CreateApprovalStageInput, UpdateApprovalStageInput } from "../validators/approval-stage-validator";