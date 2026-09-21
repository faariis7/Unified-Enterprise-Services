import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestWatcherService } from "../services/request-watcher-service";
import type { RequestWatcher } from "../models/request-watcher-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all RequestWatcher records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, requestWatcherName, createdAt
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRequestWatcherList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["requestWatcher-list", options],
    queryFn: () => RequestWatcherService.getAll(options),
  });
}

/**
 * Retrieve a single RequestWatcher record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRequestWatcher(id: string) {
  return useQuery({
    queryKey: ["requestWatcher", id],
    queryFn: () => RequestWatcherService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new RequestWatcher record.
 * @remarks Form validation: use CreateRequestWatcherSchema with zodResolver for type-safe create forms
 */
export function useCreateRequestWatcher() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RequestWatcher, "id">) => RequestWatcherService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["requestWatcher-list"] });
    },
  });
}

/**
 * Update an existing RequestWatcher record.
 * @remarks Form validation: use UpdateRequestWatcherSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateRequestWatcher() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<RequestWatcher, "id">>;
    }) => RequestWatcherService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["requestWatcher-list"] });
      client.invalidateQueries({ queryKey: ["requestWatcher", variables.id] });
    },
  });
}

/**
 * Delete a RequestWatcher record by its unique identifier.
 */
export function useDeleteRequestWatcher() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RequestWatcherService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["requestWatcher-list"] });
      client.invalidateQueries({ queryKey: ["requestWatcher", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const RequestWatcher_DATA_SOURCE_TYPE = 'InMemory' as const;

export { RequestWatcherSchema, CreateRequestWatcherSchema, UpdateRequestWatcherSchema } from "../validators/request-watcher-validator";
export type { RequestWatcherInput, CreateRequestWatcherInput, UpdateRequestWatcherInput } from "../validators/request-watcher-validator";