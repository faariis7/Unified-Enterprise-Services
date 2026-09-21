import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ContractService } from "../services/contract-service";
import type { Contract } from "../models/contract-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all Contract records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, title, agreementModeKey, contractNumber, contractTypeKey, currency, description, endDate, lifecycleStatusKey, renewalTerminationAndAuditDetails, startDate, totalValue
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useContractList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["contract-list", options],
    queryFn: () => ContractService.getAll(options),
  });
}

/**
 * Retrieve a single Contract record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useContract(id: string) {
  return useQuery({
    queryKey: ["contract", id],
    queryFn: () => ContractService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new Contract record.
 * @remarks Form validation: use CreateContractSchema with zodResolver for type-safe create forms
 */
export function useCreateContract() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Contract, "id">) => ContractService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["contract-list"] });
    },
  });
}

/**
 * Update an existing Contract record.
 * @remarks Form validation: use UpdateContractSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateContract() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<Contract, "id">>;
    }) => ContractService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["contract-list"] });
      client.invalidateQueries({ queryKey: ["contract", variables.id] });
    },
  });
}

/**
 * Delete a Contract record by its unique identifier.
 */
export function useDeleteContract() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ContractService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["contract-list"] });
      client.invalidateQueries({ queryKey: ["contract", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const Contract_DATA_SOURCE_TYPE = 'InMemory' as const;

export { ContractSchema, CreateContractSchema, UpdateContractSchema } from "../validators/contract-validator";
export type { ContractInput, CreateContractInput, UpdateContractInput } from "../validators/contract-validator";