import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ContractComplianceDetailService } from "../services/contract-compliance-detail-service";
import type { ContractComplianceDetail } from "../models/contract-compliance-detail-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all ContractComplianceDetail records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, detailName, confidentialityRequired, costCenter, dataProtectionRequired, documentURL, insuranceExpiryDate, insuranceRequired, liabilityCapAmount, procurementReference, purchaseOrderNumber, signatureStatusKey, signedDate
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useContractComplianceDetailList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["contractComplianceDetail-list", options],
    queryFn: () => ContractComplianceDetailService.getAll(options),
  });
}

/**
 * Retrieve a single ContractComplianceDetail record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useContractComplianceDetail(id: string) {
  return useQuery({
    queryKey: ["contractComplianceDetail", id],
    queryFn: () => ContractComplianceDetailService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new ContractComplianceDetail record.
 * @remarks Form validation: use CreateContractComplianceDetailSchema with zodResolver for type-safe create forms
 */
export function useCreateContractComplianceDetail() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ContractComplianceDetail, "id">) => ContractComplianceDetailService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["contractComplianceDetail-list"] });
    },
  });
}

/**
 * Update an existing ContractComplianceDetail record.
 * @remarks Form validation: use UpdateContractComplianceDetailSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateContractComplianceDetail() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<ContractComplianceDetail, "id">>;
    }) => ContractComplianceDetailService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["contractComplianceDetail-list"] });
      client.invalidateQueries({ queryKey: ["contractComplianceDetail", variables.id] });
    },
  });
}

/**
 * Delete a ContractComplianceDetail record by its unique identifier.
 */
export function useDeleteContractComplianceDetail() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ContractComplianceDetailService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["contractComplianceDetail-list"] });
      client.invalidateQueries({ queryKey: ["contractComplianceDetail", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const ContractComplianceDetail_DATA_SOURCE_TYPE = 'InMemory' as const;

export { ContractComplianceDetailSchema, CreateContractComplianceDetailSchema, UpdateContractComplianceDetailSchema } from "../validators/contract-compliance-detail-validator";
export type { ContractComplianceDetailInput, CreateContractComplianceDetailInput, UpdateContractComplianceDetailInput } from "../validators/contract-compliance-detail-validator";