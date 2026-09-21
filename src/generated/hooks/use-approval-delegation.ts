import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApprovalDelegationService } from "../services/approval-delegation-service";
import type { ApprovalDelegation } from "../models/approval-delegation-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all ApprovalDelegation records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, delegationName, createdAt, endAt, reason, scopeReference, scopeTypeKey, startAt, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useApprovalDelegationList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["approvalDelegation-list", options],
    queryFn: () => ApprovalDelegationService.getAll(options),
  });
}

/**
 * Retrieve a single ApprovalDelegation record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useApprovalDelegation(id: string) {
  return useQuery({
    queryKey: ["approvalDelegation", id],
    queryFn: () => ApprovalDelegationService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new ApprovalDelegation record.
 * @remarks Form validation: use CreateApprovalDelegationSchema with zodResolver for type-safe create forms
 */
export function useCreateApprovalDelegation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ApprovalDelegation, "id">) => ApprovalDelegationService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["approvalDelegation-list"] });
    },
  });
}

/**
 * Update an existing ApprovalDelegation record.
 * @remarks Form validation: use UpdateApprovalDelegationSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateApprovalDelegation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<ApprovalDelegation, "id">>;
    }) => ApprovalDelegationService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["approvalDelegation-list"] });
      client.invalidateQueries({ queryKey: ["approvalDelegation", variables.id] });
    },
  });
}

/**
 * Delete a ApprovalDelegation record by its unique identifier.
 */
export function useDeleteApprovalDelegation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ApprovalDelegationService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["approvalDelegation-list"] });
      client.invalidateQueries({ queryKey: ["approvalDelegation", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const ApprovalDelegation_DATA_SOURCE_TYPE = 'InMemory' as const;

export { ApprovalDelegationSchema, CreateApprovalDelegationSchema, UpdateApprovalDelegationSchema } from "../validators/approval-delegation-validator";
export type { ApprovalDelegationInput, CreateApprovalDelegationInput, UpdateApprovalDelegationInput } from "../validators/approval-delegation-validator";