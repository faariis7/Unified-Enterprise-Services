import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestNotificationService } from "../services/request-notification-service";
import type { RequestNotification } from "../models/request-notification-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all RequestNotification records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, notificationName, channelKey, message, sentAt, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRequestNotificationList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["requestNotification-list", options],
    queryFn: () => RequestNotificationService.getAll(options),
  });
}

/**
 * Retrieve a single RequestNotification record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRequestNotification(id: string) {
  return useQuery({
    queryKey: ["requestNotification", id],
    queryFn: () => RequestNotificationService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new RequestNotification record.
 * @remarks Form validation: use CreateRequestNotificationSchema with zodResolver for type-safe create forms
 */
export function useCreateRequestNotification() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RequestNotification, "id">) => RequestNotificationService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["requestNotification-list"] });
    },
  });
}

/**
 * Update an existing RequestNotification record.
 * @remarks Form validation: use UpdateRequestNotificationSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateRequestNotification() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<RequestNotification, "id">>;
    }) => RequestNotificationService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["requestNotification-list"] });
      client.invalidateQueries({ queryKey: ["requestNotification", variables.id] });
    },
  });
}

/**
 * Delete a RequestNotification record by its unique identifier.
 */
export function useDeleteRequestNotification() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RequestNotificationService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["requestNotification-list"] });
      client.invalidateQueries({ queryKey: ["requestNotification", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const RequestNotification_DATA_SOURCE_TYPE = 'InMemory' as const;

export { RequestNotificationSchema, CreateRequestNotificationSchema, UpdateRequestNotificationSchema } from "../validators/request-notification-validator";
export type { RequestNotificationInput, CreateRequestNotificationInput, UpdateRequestNotificationInput } from "../validators/request-notification-validator";