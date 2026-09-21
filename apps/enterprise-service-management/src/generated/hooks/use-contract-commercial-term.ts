import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ContractCommercialTermService } from "../services/contract-commercial-term-service";
import type { ContractCommercialTerm } from "../models/contract-commercial-term-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all ContractCommercialTerm records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, termName, billingFrequencyKey, counterpartyLegalName, governingLaw, jurisdiction, paymentTermsDays, renewalDecisionDate, renewalNoticeDays, taxTreatmentKey, terminationNoticeDays
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useContractCommercialTermList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["contractCommercialTerm-list", options],
    queryFn: () => ContractCommercialTermService.getAll(options),
  });
}

/**
 * Retrieve a single ContractCommercialTerm record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useContractCommercialTerm(id: string) {
  return useQuery({
    queryKey: ["contractCommercialTerm", id],
    queryFn: () => ContractCommercialTermService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new ContractCommercialTerm record.
 * @remarks Form validation: use CreateContractCommercialTermSchema with zodResolver for type-safe create forms
 */
export function useCreateContractCommercialTerm() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ContractCommercialTerm, "id">) => ContractCommercialTermService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["contractCommercialTerm-list"] });
    },
  });
}

/**
 * Update an existing ContractCommercialTerm record.
 * @remarks Form validation: use UpdateContractCommercialTermSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateContractCommercialTerm() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<ContractCommercialTerm, "id">>;
    }) => ContractCommercialTermService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["contractCommercialTerm-list"] });
      client.invalidateQueries({ queryKey: ["contractCommercialTerm", variables.id] });
    },
  });
}

/**
 * Delete a ContractCommercialTerm record by its unique identifier.
 */
export function useDeleteContractCommercialTerm() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ContractCommercialTermService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["contractCommercialTerm-list"] });
      client.invalidateQueries({ queryKey: ["contractCommercialTerm", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const ContractCommercialTerm_DATA_SOURCE_TYPE = 'InMemory' as const;

export { ContractCommercialTermSchema, CreateContractCommercialTermSchema, UpdateContractCommercialTermSchema } from "../validators/contract-commercial-term-validator";
export type { ContractCommercialTermInput, CreateContractCommercialTermInput, UpdateContractCommercialTermInput } from "../validators/contract-commercial-term-validator";