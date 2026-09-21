import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestTransitionExecutionService } from "../services/request-transition-execution-service";
import type { RequestTransitionExecution } from "../models/request-transition-execution-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all RequestTransitionExecution records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, executionName, comment, executedAt, failureReason, source, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRequestTransitionExecutionList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["requestTransitionExecution-list", options],
    queryFn: () => RequestTransitionExecutionService.getAll(options),
  });
}

/**
 * Retrieve a single RequestTransitionExecution record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRequestTransitionExecution(id: string) {
  return useQuery({
    queryKey: ["requestTransitionExecution", id],
    queryFn: () => RequestTransitionExecutionService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new RequestTransitionExecution record.
 * @remarks Form validation: use CreateRequestTransitionExecutionSchema with zodResolver for type-safe create forms
 */
export function useCreateRequestTransitionExecution() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RequestTransitionExecution, "id">) => RequestTransitionExecutionService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["requestTransitionExecution-list"] });
    },
  });
}

/**
 * Update an existing RequestTransitionExecution record.
 * @remarks Form validation: use UpdateRequestTransitionExecutionSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateRequestTransitionExecution() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<RequestTransitionExecution, "id">>;
    }) => RequestTransitionExecutionService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["requestTransitionExecution-list"] });
      client.invalidateQueries({ queryKey: ["requestTransitionExecution", variables.id] });
    },
  });
}

/**
 * Delete a RequestTransitionExecution record by its unique identifier.
 */
export function useDeleteRequestTransitionExecution() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RequestTransitionExecutionService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["requestTransitionExecution-list"] });
      client.invalidateQueries({ queryKey: ["requestTransitionExecution", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const RequestTransitionExecution_DATA_SOURCE_TYPE = 'InMemory' as const;

export { RequestTransitionExecutionSchema, CreateRequestTransitionExecutionSchema, UpdateRequestTransitionExecutionSchema } from "../validators/request-transition-execution-validator";
export type { RequestTransitionExecutionInput, CreateRequestTransitionExecutionInput, UpdateRequestTransitionExecutionInput } from "../validators/request-transition-execution-validator";