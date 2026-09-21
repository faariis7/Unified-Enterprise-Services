import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PublicationApprovalService } from "../services/publication-approval-service";
import type { PublicationApproval } from "../models/publication-approval-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all PublicationApproval records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, approvalName, changeReason, isDeleted, makerCheckerSatisfied, requestedAt, reviewComment, reviewDate, reviewedAt, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function usePublicationApprovalList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["publicationApproval-list", options],
    queryFn: () => PublicationApprovalService.getAll(options),
  });
}

/**
 * Retrieve a single PublicationApproval record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function usePublicationApproval(id: string) {
  return useQuery({
    queryKey: ["publicationApproval", id],
    queryFn: () => PublicationApprovalService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new PublicationApproval record.
 * @remarks Form validation: use CreatePublicationApprovalSchema with zodResolver for type-safe create forms
 */
export function useCreatePublicationApproval() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<PublicationApproval, "id">) => PublicationApprovalService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["publicationApproval-list"] });
    },
  });
}

/**
 * Update an existing PublicationApproval record.
 * @remarks Form validation: use UpdatePublicationApprovalSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdatePublicationApproval() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<PublicationApproval, "id">>;
    }) => PublicationApprovalService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["publicationApproval-list"] });
      client.invalidateQueries({ queryKey: ["publicationApproval", variables.id] });
    },
  });
}

/**
 * Delete a PublicationApproval record by its unique identifier.
 */
export function useDeletePublicationApproval() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => PublicationApprovalService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["publicationApproval-list"] });
      client.invalidateQueries({ queryKey: ["publicationApproval", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const PublicationApproval_DATA_SOURCE_TYPE = 'InMemory' as const;

export { PublicationApprovalSchema, CreatePublicationApprovalSchema, UpdatePublicationApprovalSchema } from "../validators/publication-approval-validator";
export type { PublicationApprovalInput, CreatePublicationApprovalInput, UpdatePublicationApprovalInput } from "../validators/publication-approval-validator";