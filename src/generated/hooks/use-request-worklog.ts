import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestWorklogService } from "../services/request-worklog-service";
import type { RequestWorklog } from "../models/request-worklog-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all RequestWorklog records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, worklogName, duration, notes, workedAt
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRequestWorklogList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["requestWorklog-list", options],
    queryFn: () => RequestWorklogService.getAll(options),
  });
}

/**
 * Retrieve a single RequestWorklog record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRequestWorklog(id: string) {
  return useQuery({
    queryKey: ["requestWorklog", id],
    queryFn: () => RequestWorklogService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new RequestWorklog record.
 * @remarks Form validation: use CreateRequestWorklogSchema with zodResolver for type-safe create forms
 */
export function useCreateRequestWorklog() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RequestWorklog, "id">) => RequestWorklogService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["requestWorklog-list"] });
    },
  });
}

/**
 * Update an existing RequestWorklog record.
 * @remarks Form validation: use UpdateRequestWorklogSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateRequestWorklog() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<RequestWorklog, "id">>;
    }) => RequestWorklogService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["requestWorklog-list"] });
      client.invalidateQueries({ queryKey: ["requestWorklog", variables.id] });
    },
  });
}

/**
 * Delete a RequestWorklog record by its unique identifier.
 */
export function useDeleteRequestWorklog() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RequestWorklogService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["requestWorklog-list"] });
      client.invalidateQueries({ queryKey: ["requestWorklog", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const RequestWorklog_DATA_SOURCE_TYPE = 'InMemory' as const;

export { RequestWorklogSchema, CreateRequestWorklogSchema, UpdateRequestWorklogSchema } from "../validators/request-worklog-validator";
export type { RequestWorklogInput, CreateRequestWorklogInput, UpdateRequestWorklogInput } from "../validators/request-worklog-validator";