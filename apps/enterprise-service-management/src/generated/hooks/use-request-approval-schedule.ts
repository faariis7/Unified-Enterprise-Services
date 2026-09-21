import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestApprovalScheduleService } from "../services/request-approval-schedule-service";
import type { RequestApprovalSchedule } from "../models/request-approval-schedule-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all RequestApprovalSchedule records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, idempotencyKey, escalationAt, expiresAt, reminderAt
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRequestApprovalScheduleList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["requestApprovalSchedule-list", options],
    queryFn: () => RequestApprovalScheduleService.getAll(options),
  });
}

/**
 * Retrieve a single RequestApprovalSchedule record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRequestApprovalSchedule(id: string) {
  return useQuery({
    queryKey: ["requestApprovalSchedule", id],
    queryFn: () => RequestApprovalScheduleService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new RequestApprovalSchedule record.
 * @remarks Form validation: use CreateRequestApprovalScheduleSchema with zodResolver for type-safe create forms
 */
export function useCreateRequestApprovalSchedule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RequestApprovalSchedule, "id">) => RequestApprovalScheduleService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["requestApprovalSchedule-list"] });
    },
  });
}

/**
 * Update an existing RequestApprovalSchedule record.
 * @remarks Form validation: use UpdateRequestApprovalScheduleSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateRequestApprovalSchedule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<RequestApprovalSchedule, "id">>;
    }) => RequestApprovalScheduleService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["requestApprovalSchedule-list"] });
      client.invalidateQueries({ queryKey: ["requestApprovalSchedule", variables.id] });
    },
  });
}

/**
 * Delete a RequestApprovalSchedule record by its unique identifier.
 */
export function useDeleteRequestApprovalSchedule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RequestApprovalScheduleService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["requestApprovalSchedule-list"] });
      client.invalidateQueries({ queryKey: ["requestApprovalSchedule", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const RequestApprovalSchedule_DATA_SOURCE_TYPE = 'InMemory' as const;

export { RequestApprovalScheduleSchema, CreateRequestApprovalScheduleSchema, UpdateRequestApprovalScheduleSchema } from "../validators/request-approval-schedule-validator";
export type { RequestApprovalScheduleInput, CreateRequestApprovalScheduleInput, UpdateRequestApprovalScheduleInput } from "../validators/request-approval-schedule-validator";