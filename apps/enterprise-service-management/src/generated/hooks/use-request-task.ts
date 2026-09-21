import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestTaskService } from "../services/request-task-service";
import type { RequestTask } from "../models/request-task-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all RequestTask records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, title, completedAt, dueDate, statusIdKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRequestTaskList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["requestTask-list", options],
    queryFn: () => RequestTaskService.getAll(options),
  });
}

/**
 * Retrieve a single RequestTask record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRequestTask(id: string) {
  return useQuery({
    queryKey: ["requestTask", id],
    queryFn: () => RequestTaskService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new RequestTask record.
 * @remarks Form validation: use CreateRequestTaskSchema with zodResolver for type-safe create forms
 */
export function useCreateRequestTask() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RequestTask, "id">) => RequestTaskService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["requestTask-list"] });
    },
  });
}

/**
 * Update an existing RequestTask record.
 * @remarks Form validation: use UpdateRequestTaskSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateRequestTask() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<RequestTask, "id">>;
    }) => RequestTaskService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["requestTask-list"] });
      client.invalidateQueries({ queryKey: ["requestTask", variables.id] });
    },
  });
}

/**
 * Delete a RequestTask record by its unique identifier.
 */
export function useDeleteRequestTask() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RequestTaskService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["requestTask-list"] });
      client.invalidateQueries({ queryKey: ["requestTask", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const RequestTask_DATA_SOURCE_TYPE = 'InMemory' as const;

export { RequestTaskSchema, CreateRequestTaskSchema, UpdateRequestTaskSchema } from "../validators/request-task-validator";
export type { RequestTaskInput, CreateRequestTaskInput, UpdateRequestTaskInput } from "../validators/request-task-validator";