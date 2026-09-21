import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestApprovalRuntimeStateService } from "../services/request-approval-runtime-state-service";
import type { RequestApprovalRuntimeState } from "../models/request-approval-runtime-state-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all RequestApprovalRuntimeState records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, runtimeStateName, activatedAt, completedAt, correlationKey, escalatedAt, expiresAt, targetRecordID, targetTypeKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRequestApprovalRuntimeStateList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["requestApprovalRuntimeState-list", options],
    queryFn: () => RequestApprovalRuntimeStateService.getAll(options),
  });
}

/**
 * Retrieve a single RequestApprovalRuntimeState record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRequestApprovalRuntimeState(id: string) {
  return useQuery({
    queryKey: ["requestApprovalRuntimeState", id],
    queryFn: () => RequestApprovalRuntimeStateService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new RequestApprovalRuntimeState record.
 * @remarks Form validation: use CreateRequestApprovalRuntimeStateSchema with zodResolver for type-safe create forms
 */
export function useCreateRequestApprovalRuntimeState() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RequestApprovalRuntimeState, "id">) => RequestApprovalRuntimeStateService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["requestApprovalRuntimeState-list"] });
    },
  });
}

/**
 * Update an existing RequestApprovalRuntimeState record.
 * @remarks Form validation: use UpdateRequestApprovalRuntimeStateSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateRequestApprovalRuntimeState() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<RequestApprovalRuntimeState, "id">>;
    }) => RequestApprovalRuntimeStateService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["requestApprovalRuntimeState-list"] });
      client.invalidateQueries({ queryKey: ["requestApprovalRuntimeState", variables.id] });
    },
  });
}

/**
 * Delete a RequestApprovalRuntimeState record by its unique identifier.
 */
export function useDeleteRequestApprovalRuntimeState() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RequestApprovalRuntimeStateService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["requestApprovalRuntimeState-list"] });
      client.invalidateQueries({ queryKey: ["requestApprovalRuntimeState", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const RequestApprovalRuntimeState_DATA_SOURCE_TYPE = 'InMemory' as const;

export { RequestApprovalRuntimeStateSchema, CreateRequestApprovalRuntimeStateSchema, UpdateRequestApprovalRuntimeStateSchema } from "../validators/request-approval-runtime-state-validator";
export type { RequestApprovalRuntimeStateInput, CreateRequestApprovalRuntimeStateInput, UpdateRequestApprovalRuntimeStateInput } from "../validators/request-approval-runtime-state-validator";