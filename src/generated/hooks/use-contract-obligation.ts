import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ContractObligationService } from "../services/contract-obligation-service";
import type { ContractObligation } from "../models/contract-obligation-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all ContractObligation records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, title, completionDate, completionNotes, createdAt, description, dueDate, recurrenceKey, statusKey, updatedAt
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useContractObligationList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["contractObligation-list", options],
    queryFn: () => ContractObligationService.getAll(options),
  });
}

/**
 * Retrieve a single ContractObligation record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useContractObligation(id: string) {
  return useQuery({
    queryKey: ["contractObligation", id],
    queryFn: () => ContractObligationService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new ContractObligation record.
 * @remarks Form validation: use CreateContractObligationSchema with zodResolver for type-safe create forms
 */
export function useCreateContractObligation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ContractObligation, "id">) => ContractObligationService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["contractObligation-list"] });
    },
  });
}

/**
 * Update an existing ContractObligation record.
 * @remarks Form validation: use UpdateContractObligationSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateContractObligation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<ContractObligation, "id">>;
    }) => ContractObligationService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["contractObligation-list"] });
      client.invalidateQueries({ queryKey: ["contractObligation", variables.id] });
    },
  });
}

/**
 * Delete a ContractObligation record by its unique identifier.
 */
export function useDeleteContractObligation() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ContractObligationService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["contractObligation-list"] });
      client.invalidateQueries({ queryKey: ["contractObligation", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const ContractObligation_DATA_SOURCE_TYPE = 'InMemory' as const;

export { ContractObligationSchema, CreateContractObligationSchema, UpdateContractObligationSchema } from "../validators/contract-obligation-validator";
export type { ContractObligationInput, CreateContractObligationInput, UpdateContractObligationInput } from "../validators/contract-obligation-validator";