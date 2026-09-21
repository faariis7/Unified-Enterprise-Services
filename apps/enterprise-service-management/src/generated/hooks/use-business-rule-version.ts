import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BusinessRuleVersionService } from "../services/business-rule-version-service";
import type { BusinessRuleVersion } from "../models/business-rule-version-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all BusinessRuleVersion records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, snapshotLabel, createdAt, effectiveFrom, effectiveTo, immutableConditionExpression, immutableOutcomeConfiguration, isDeleted, publishedAt, statusKey, updatedAt, versionNumber
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useBusinessRuleVersionList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["businessRuleVersion-list", options],
    queryFn: () => BusinessRuleVersionService.getAll(options),
  });
}

/**
 * Retrieve a single BusinessRuleVersion record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useBusinessRuleVersion(id: string) {
  return useQuery({
    queryKey: ["businessRuleVersion", id],
    queryFn: () => BusinessRuleVersionService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new BusinessRuleVersion record.
 * @remarks Form validation: use CreateBusinessRuleVersionSchema with zodResolver for type-safe create forms
 */
export function useCreateBusinessRuleVersion() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<BusinessRuleVersion, "id">) => BusinessRuleVersionService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["businessRuleVersion-list"] });
    },
  });
}

/**
 * Update an existing BusinessRuleVersion record.
 * @remarks Form validation: use UpdateBusinessRuleVersionSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateBusinessRuleVersion() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<BusinessRuleVersion, "id">>;
    }) => BusinessRuleVersionService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["businessRuleVersion-list"] });
      client.invalidateQueries({ queryKey: ["businessRuleVersion", variables.id] });
    },
  });
}

/**
 * Delete a BusinessRuleVersion record by its unique identifier.
 */
export function useDeleteBusinessRuleVersion() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => BusinessRuleVersionService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["businessRuleVersion-list"] });
      client.invalidateQueries({ queryKey: ["businessRuleVersion", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const BusinessRuleVersion_DATA_SOURCE_TYPE = 'InMemory' as const;

export { BusinessRuleVersionSchema, CreateBusinessRuleVersionSchema, UpdateBusinessRuleVersionSchema } from "../validators/business-rule-version-validator";
export type { BusinessRuleVersionInput, CreateBusinessRuleVersionInput, UpdateBusinessRuleVersionInput } from "../validators/business-rule-version-validator";