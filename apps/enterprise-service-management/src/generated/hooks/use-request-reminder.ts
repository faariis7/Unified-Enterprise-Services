import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestReminderService } from "../services/request-reminder-service";
import type { RequestReminder } from "../models/request-reminder-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all RequestReminder records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, reminderName, createdAt, remindAt, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRequestReminderList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["requestReminder-list", options],
    queryFn: () => RequestReminderService.getAll(options),
  });
}

/**
 * Retrieve a single RequestReminder record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRequestReminder(id: string) {
  return useQuery({
    queryKey: ["requestReminder", id],
    queryFn: () => RequestReminderService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new RequestReminder record.
 * @remarks Form validation: use CreateRequestReminderSchema with zodResolver for type-safe create forms
 */
export function useCreateRequestReminder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RequestReminder, "id">) => RequestReminderService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["requestReminder-list"] });
    },
  });
}

/**
 * Update an existing RequestReminder record.
 * @remarks Form validation: use UpdateRequestReminderSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateRequestReminder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<RequestReminder, "id">>;
    }) => RequestReminderService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["requestReminder-list"] });
      client.invalidateQueries({ queryKey: ["requestReminder", variables.id] });
    },
  });
}

/**
 * Delete a RequestReminder record by its unique identifier.
 */
export function useDeleteRequestReminder() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RequestReminderService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["requestReminder-list"] });
      client.invalidateQueries({ queryKey: ["requestReminder", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const RequestReminder_DATA_SOURCE_TYPE = 'InMemory' as const;

export { RequestReminderSchema, CreateRequestReminderSchema, UpdateRequestReminderSchema } from "../validators/request-reminder-validator";
export type { RequestReminderInput, CreateRequestReminderInput, UpdateRequestReminderInput } from "../validators/request-reminder-validator";