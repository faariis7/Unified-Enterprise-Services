import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PublicationApprovalAuditService } from "../services/publication-approval-audit-service";
import type { PublicationApprovalAudit } from "../models/publication-approval-audit-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all PublicationApprovalAudit records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, auditName, createdAt, publishedAt, updatedAt
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function usePublicationApprovalAuditList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["publicationApprovalAudit-list", options],
    queryFn: () => PublicationApprovalAuditService.getAll(options),
  });
}

/**
 * Retrieve a single PublicationApprovalAudit record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function usePublicationApprovalAudit(id: string) {
  return useQuery({
    queryKey: ["publicationApprovalAudit", id],
    queryFn: () => PublicationApprovalAuditService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new PublicationApprovalAudit record.
 * @remarks Form validation: use CreatePublicationApprovalAuditSchema with zodResolver for type-safe create forms
 */
export function useCreatePublicationApprovalAudit() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<PublicationApprovalAudit, "id">) => PublicationApprovalAuditService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["publicationApprovalAudit-list"] });
    },
  });
}

/**
 * Update an existing PublicationApprovalAudit record.
 * @remarks Form validation: use UpdatePublicationApprovalAuditSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdatePublicationApprovalAudit() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<PublicationApprovalAudit, "id">>;
    }) => PublicationApprovalAuditService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["publicationApprovalAudit-list"] });
      client.invalidateQueries({ queryKey: ["publicationApprovalAudit", variables.id] });
    },
  });
}

/**
 * Delete a PublicationApprovalAudit record by its unique identifier.
 */
export function useDeletePublicationApprovalAudit() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => PublicationApprovalAuditService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["publicationApprovalAudit-list"] });
      client.invalidateQueries({ queryKey: ["publicationApprovalAudit", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const PublicationApprovalAudit_DATA_SOURCE_TYPE = 'InMemory' as const;

export { PublicationApprovalAuditSchema, CreatePublicationApprovalAuditSchema, UpdatePublicationApprovalAuditSchema } from "../validators/publication-approval-audit-validator";
export type { PublicationApprovalAuditInput, CreatePublicationApprovalAuditInput, UpdatePublicationApprovalAuditInput } from "../validators/publication-approval-audit-validator";