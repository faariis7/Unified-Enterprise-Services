import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ContractDocumentService } from "../services/contract-document-service";
import type { ContractDocument } from "../models/contract-document-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all ContractDocument records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, fileName, contentType, documentType, fileSizeBytes, statusKey, storageReferenceURL, uploadedDate, versionNumber
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useContractDocumentList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["contractDocument-list", options],
    queryFn: () => ContractDocumentService.getAll(options),
  });
}

/**
 * Retrieve a single ContractDocument record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useContractDocument(id: string) {
  return useQuery({
    queryKey: ["contractDocument", id],
    queryFn: () => ContractDocumentService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new ContractDocument record.
 * @remarks Form validation: use CreateContractDocumentSchema with zodResolver for type-safe create forms
 */
export function useCreateContractDocument() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ContractDocument, "id">) => ContractDocumentService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["contractDocument-list"] });
    },
  });
}

/**
 * Update an existing ContractDocument record.
 * @remarks Form validation: use UpdateContractDocumentSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateContractDocument() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<ContractDocument, "id">>;
    }) => ContractDocumentService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["contractDocument-list"] });
      client.invalidateQueries({ queryKey: ["contractDocument", variables.id] });
    },
  });
}

/**
 * Delete a ContractDocument record by its unique identifier.
 */
export function useDeleteContractDocument() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ContractDocumentService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["contractDocument-list"] });
      client.invalidateQueries({ queryKey: ["contractDocument", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const ContractDocument_DATA_SOURCE_TYPE = 'InMemory' as const;

export { ContractDocumentSchema, CreateContractDocumentSchema, UpdateContractDocumentSchema } from "../validators/contract-document-validator";
export type { ContractDocumentInput, CreateContractDocumentInput, UpdateContractDocumentInput } from "../validators/contract-document-validator";