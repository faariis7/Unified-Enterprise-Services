import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestApprovalService } from "../services/request-approval-service";
import type { RequestApproval } from "../models/request-approval-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all RequestApproval records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, approvalName, approverGroupCode, approverTypeKey, comments, createdAt, decidedAt, stageNumber, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRequestApprovalList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["requestApproval-list", options],
    queryFn: () => RequestApprovalService.getAll(options),
  });
}

/**
 * Retrieve a single RequestApproval record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRequestApproval(id: string) {
  return useQuery({
    queryKey: ["requestApproval", id],
    queryFn: () => RequestApprovalService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new RequestApproval record.
 * @remarks Form validation: use CreateRequestApprovalSchema with zodResolver for type-safe create forms
 */
export function useCreateRequestApproval() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RequestApproval, "id">) => RequestApprovalService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["requestApproval-list"] });
    },
  });
}

/**
 * Update an existing RequestApproval record.
 * @remarks Form validation: use UpdateRequestApprovalSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateRequestApproval() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<RequestApproval, "id">>;
    }) => RequestApprovalService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["requestApproval-list"] });
      client.invalidateQueries({ queryKey: ["requestApproval", variables.id] });
    },
  });
}

/**
 * Delete a RequestApproval record by its unique identifier.
 */
export function useDeleteRequestApproval() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RequestApprovalService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["requestApproval-list"] });
      client.invalidateQueries({ queryKey: ["requestApproval", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const RequestApproval_DATA_SOURCE_TYPE = 'InMemory' as const;

export { RequestApprovalSchema, CreateRequestApprovalSchema, UpdateRequestApprovalSchema } from "../validators/request-approval-validator";
export type { RequestApprovalInput, CreateRequestApprovalInput, UpdateRequestApprovalInput } from "../validators/request-approval-validator";