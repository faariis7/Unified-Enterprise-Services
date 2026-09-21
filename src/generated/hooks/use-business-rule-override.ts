import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BusinessRuleOverrideService } from "../services/business-rule-override-service";
import type { BusinessRuleOverride } from "../models/business-rule-override-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all BusinessRuleOverride records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, reason, createdAt, isDeleted, localOverrideModeKey, overrideCondition, overrideConfiguration, statusKey, updatedAt
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useBusinessRuleOverrideList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["businessRuleOverride-list", options],
    queryFn: () => BusinessRuleOverrideService.getAll(options),
  });
}

/**
 * Retrieve a single BusinessRuleOverride record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useBusinessRuleOverride(id: string) {
  return useQuery({
    queryKey: ["businessRuleOverride", id],
    queryFn: () => BusinessRuleOverrideService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new BusinessRuleOverride record.
 * @remarks Form validation: use CreateBusinessRuleOverrideSchema with zodResolver for type-safe create forms
 */
export function useCreateBusinessRuleOverride() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<BusinessRuleOverride, "id">) => BusinessRuleOverrideService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["businessRuleOverride-list"] });
    },
  });
}

/**
 * Update an existing BusinessRuleOverride record.
 * @remarks Form validation: use UpdateBusinessRuleOverrideSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateBusinessRuleOverride() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<BusinessRuleOverride, "id">>;
    }) => BusinessRuleOverrideService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["businessRuleOverride-list"] });
      client.invalidateQueries({ queryKey: ["businessRuleOverride", variables.id] });
    },
  });
}

/**
 * Delete a BusinessRuleOverride record by its unique identifier.
 */
export function useDeleteBusinessRuleOverride() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => BusinessRuleOverrideService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["businessRuleOverride-list"] });
      client.invalidateQueries({ queryKey: ["businessRuleOverride", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const BusinessRuleOverride_DATA_SOURCE_TYPE = 'InMemory' as const;

export { BusinessRuleOverrideSchema, CreateBusinessRuleOverrideSchema, UpdateBusinessRuleOverrideSchema } from "../validators/business-rule-override-validator";
export type { BusinessRuleOverrideInput, CreateBusinessRuleOverrideInput, UpdateBusinessRuleOverrideInput } from "../validators/business-rule-override-validator";