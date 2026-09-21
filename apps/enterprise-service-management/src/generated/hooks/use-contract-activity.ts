import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ContractActivityService } from "../services/contract-activity-service";
import type { ContractActivity } from "../models/contract-activity-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all ContractActivity records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, summary, activityTypeKey, details, fieldName, newValue, occurredAt, previousValue
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useContractActivityList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["contractActivity-list", options],
    queryFn: () => ContractActivityService.getAll(options),
  });
}

/**
 * Retrieve a single ContractActivity record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useContractActivity(id: string) {
  return useQuery({
    queryKey: ["contractActivity", id],
    queryFn: () => ContractActivityService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new ContractActivity record.
 * @remarks Form validation: use CreateContractActivitySchema with zodResolver for type-safe create forms
 */
export function useCreateContractActivity() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ContractActivity, "id">) => ContractActivityService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["contractActivity-list"] });
    },
  });
}

/**
 * Update an existing ContractActivity record.
 * @remarks Form validation: use UpdateContractActivitySchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateContractActivity() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<ContractActivity, "id">>;
    }) => ContractActivityService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["contractActivity-list"] });
      client.invalidateQueries({ queryKey: ["contractActivity", variables.id] });
    },
  });
}

/**
 * Delete a ContractActivity record by its unique identifier.
 */
export function useDeleteContractActivity() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ContractActivityService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["contractActivity-list"] });
      client.invalidateQueries({ queryKey: ["contractActivity", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const ContractActivity_DATA_SOURCE_TYPE = 'InMemory' as const;

export { ContractActivitySchema, CreateContractActivitySchema, UpdateContractActivitySchema } from "../validators/contract-activity-validator";
export type { ContractActivityInput, CreateContractActivityInput, UpdateContractActivityInput } from "../validators/contract-activity-validator";