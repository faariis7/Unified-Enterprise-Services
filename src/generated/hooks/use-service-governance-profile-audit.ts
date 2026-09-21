import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ServiceGovernanceProfileAuditService } from "../services/service-governance-profile-audit-service";
import type { ServiceGovernanceProfileAudit } from "../models/service-governance-profile-audit-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all ServiceGovernanceProfileAudit records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, auditName, createdAt, isDeleted, lastReviewDate, updatedAt
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useServiceGovernanceProfileAuditList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["serviceGovernanceProfileAudit-list", options],
    queryFn: () => ServiceGovernanceProfileAuditService.getAll(options),
  });
}

/**
 * Retrieve a single ServiceGovernanceProfileAudit record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useServiceGovernanceProfileAudit(id: string) {
  return useQuery({
    queryKey: ["serviceGovernanceProfileAudit", id],
    queryFn: () => ServiceGovernanceProfileAuditService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new ServiceGovernanceProfileAudit record.
 * @remarks Form validation: use CreateServiceGovernanceProfileAuditSchema with zodResolver for type-safe create forms
 */
export function useCreateServiceGovernanceProfileAudit() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ServiceGovernanceProfileAudit, "id">) => ServiceGovernanceProfileAuditService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["serviceGovernanceProfileAudit-list"] });
    },
  });
}

/**
 * Update an existing ServiceGovernanceProfileAudit record.
 * @remarks Form validation: use UpdateServiceGovernanceProfileAuditSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateServiceGovernanceProfileAudit() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<ServiceGovernanceProfileAudit, "id">>;
    }) => ServiceGovernanceProfileAuditService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["serviceGovernanceProfileAudit-list"] });
      client.invalidateQueries({ queryKey: ["serviceGovernanceProfileAudit", variables.id] });
    },
  });
}

/**
 * Delete a ServiceGovernanceProfileAudit record by its unique identifier.
 */
export function useDeleteServiceGovernanceProfileAudit() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ServiceGovernanceProfileAuditService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["serviceGovernanceProfileAudit-list"] });
      client.invalidateQueries({ queryKey: ["serviceGovernanceProfileAudit", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const ServiceGovernanceProfileAudit_DATA_SOURCE_TYPE = 'InMemory' as const;

export { ServiceGovernanceProfileAuditSchema, CreateServiceGovernanceProfileAuditSchema, UpdateServiceGovernanceProfileAuditSchema } from "../validators/service-governance-profile-audit-validator";
export type { ServiceGovernanceProfileAuditInput, CreateServiceGovernanceProfileAuditInput, UpdateServiceGovernanceProfileAuditInput } from "../validators/service-governance-profile-audit-validator";