import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BusinessRuleDependencyService } from "../services/business-rule-dependency-service";
import type { BusinessRuleDependency } from "../models/business-rule-dependency-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all BusinessRuleDependency records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, displayLabel, createdAt, dependencyTypeKey, isDeleted, referencedRecordIDOrKey, required, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useBusinessRuleDependencyList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["businessRuleDependency-list", options],
    queryFn: () => BusinessRuleDependencyService.getAll(options),
  });
}

/**
 * Retrieve a single BusinessRuleDependency record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useBusinessRuleDependency(id: string) {
  return useQuery({
    queryKey: ["businessRuleDependency", id],
    queryFn: () => BusinessRuleDependencyService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new BusinessRuleDependency record.
 * @remarks Form validation: use CreateBusinessRuleDependencySchema with zodResolver for type-safe create forms
 */
export function useCreateBusinessRuleDependency() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<BusinessRuleDependency, "id">) => BusinessRuleDependencyService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["businessRuleDependency-list"] });
    },
  });
}

/**
 * Update an existing BusinessRuleDependency record.
 * @remarks Form validation: use UpdateBusinessRuleDependencySchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateBusinessRuleDependency() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<BusinessRuleDependency, "id">>;
    }) => BusinessRuleDependencyService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["businessRuleDependency-list"] });
      client.invalidateQueries({ queryKey: ["businessRuleDependency", variables.id] });
    },
  });
}

/**
 * Delete a BusinessRuleDependency record by its unique identifier.
 */
export function useDeleteBusinessRuleDependency() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => BusinessRuleDependencyService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["businessRuleDependency-list"] });
      client.invalidateQueries({ queryKey: ["businessRuleDependency", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const BusinessRuleDependency_DATA_SOURCE_TYPE = 'InMemory' as const;

export { BusinessRuleDependencySchema, CreateBusinessRuleDependencySchema, UpdateBusinessRuleDependencySchema } from "../validators/business-rule-dependency-validator";
export type { BusinessRuleDependencyInput, CreateBusinessRuleDependencyInput, UpdateBusinessRuleDependencyInput } from "../validators/business-rule-dependency-validator";