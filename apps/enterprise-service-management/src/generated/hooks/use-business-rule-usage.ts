import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BusinessRuleUsageService } from "../services/business-rule-usage-service";
import type { BusinessRuleUsage } from "../models/business-rule-usage-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all BusinessRuleUsage records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, consumerLabel, consumerRecordID, consumerTypeKey, createdAt, isDeleted, statusKey, usageContext
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useBusinessRuleUsageList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["businessRuleUsage-list", options],
    queryFn: () => BusinessRuleUsageService.getAll(options),
  });
}

/**
 * Retrieve a single BusinessRuleUsage record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useBusinessRuleUsage(id: string) {
  return useQuery({
    queryKey: ["businessRuleUsage", id],
    queryFn: () => BusinessRuleUsageService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new BusinessRuleUsage record.
 * @remarks Form validation: use CreateBusinessRuleUsageSchema with zodResolver for type-safe create forms
 */
export function useCreateBusinessRuleUsage() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<BusinessRuleUsage, "id">) => BusinessRuleUsageService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["businessRuleUsage-list"] });
    },
  });
}

/**
 * Update an existing BusinessRuleUsage record.
 * @remarks Form validation: use UpdateBusinessRuleUsageSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateBusinessRuleUsage() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<BusinessRuleUsage, "id">>;
    }) => BusinessRuleUsageService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["businessRuleUsage-list"] });
      client.invalidateQueries({ queryKey: ["businessRuleUsage", variables.id] });
    },
  });
}

/**
 * Delete a BusinessRuleUsage record by its unique identifier.
 */
export function useDeleteBusinessRuleUsage() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => BusinessRuleUsageService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["businessRuleUsage-list"] });
      client.invalidateQueries({ queryKey: ["businessRuleUsage", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const BusinessRuleUsage_DATA_SOURCE_TYPE = 'InMemory' as const;

export { BusinessRuleUsageSchema, CreateBusinessRuleUsageSchema, UpdateBusinessRuleUsageSchema } from "../validators/business-rule-usage-validator";
export type { BusinessRuleUsageInput, CreateBusinessRuleUsageInput, UpdateBusinessRuleUsageInput } from "../validators/business-rule-usage-validator";