import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BusinessRuleDefinitionService } from "../services/business-rule-definition-service";
import type { BusinessRuleDefinition } from "../models/business-rule-definition-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all BusinessRuleDefinition records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, name1, allowLocalOverrides, createdAt, description, isDeleted, ruleTypeKey, stableRuleKey, statusKey, updatedAt
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useBusinessRuleDefinitionList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["businessRuleDefinition-list", options],
    queryFn: () => BusinessRuleDefinitionService.getAll(options),
  });
}

/**
 * Retrieve a single BusinessRuleDefinition record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useBusinessRuleDefinition(id: string) {
  return useQuery({
    queryKey: ["businessRuleDefinition", id],
    queryFn: () => BusinessRuleDefinitionService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new BusinessRuleDefinition record.
 * @remarks Form validation: use CreateBusinessRuleDefinitionSchema with zodResolver for type-safe create forms
 */
export function useCreateBusinessRuleDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<BusinessRuleDefinition, "id">) => BusinessRuleDefinitionService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["businessRuleDefinition-list"] });
    },
  });
}

/**
 * Update an existing BusinessRuleDefinition record.
 * @remarks Form validation: use UpdateBusinessRuleDefinitionSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateBusinessRuleDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<BusinessRuleDefinition, "id">>;
    }) => BusinessRuleDefinitionService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["businessRuleDefinition-list"] });
      client.invalidateQueries({ queryKey: ["businessRuleDefinition", variables.id] });
    },
  });
}

/**
 * Delete a BusinessRuleDefinition record by its unique identifier.
 */
export function useDeleteBusinessRuleDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => BusinessRuleDefinitionService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["businessRuleDefinition-list"] });
      client.invalidateQueries({ queryKey: ["businessRuleDefinition", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const BusinessRuleDefinition_DATA_SOURCE_TYPE = 'InMemory' as const;

export { BusinessRuleDefinitionSchema, CreateBusinessRuleDefinitionSchema, UpdateBusinessRuleDefinitionSchema } from "../validators/business-rule-definition-validator";
export type { BusinessRuleDefinitionInput, CreateBusinessRuleDefinitionInput, UpdateBusinessRuleDefinitionInput } from "../validators/business-rule-definition-validator";