import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ServiceTargetRuleService } from "../services/service-target-rule-service";
import type { ServiceTargetRule } from "../models/service-target-rule-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all ServiceTargetRule records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, ruleName, active, catalogItemCode, fieldOperatorValueConditions, impact, priorityKey, requestTypeCode, serviceCode, sortOrder, urgency
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useServiceTargetRuleList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["serviceTargetRule-list", options],
    queryFn: () => ServiceTargetRuleService.getAll(options),
  });
}

/**
 * Retrieve a single ServiceTargetRule record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useServiceTargetRule(id: string) {
  return useQuery({
    queryKey: ["serviceTargetRule", id],
    queryFn: () => ServiceTargetRuleService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new ServiceTargetRule record.
 * @remarks Form validation: use CreateServiceTargetRuleSchema with zodResolver for type-safe create forms
 */
export function useCreateServiceTargetRule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ServiceTargetRule, "id">) => ServiceTargetRuleService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["serviceTargetRule-list"] });
    },
  });
}

/**
 * Update an existing ServiceTargetRule record.
 * @remarks Form validation: use UpdateServiceTargetRuleSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateServiceTargetRule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<ServiceTargetRule, "id">>;
    }) => ServiceTargetRuleService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["serviceTargetRule-list"] });
      client.invalidateQueries({ queryKey: ["serviceTargetRule", variables.id] });
    },
  });
}

/**
 * Delete a ServiceTargetRule record by its unique identifier.
 */
export function useDeleteServiceTargetRule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ServiceTargetRuleService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["serviceTargetRule-list"] });
      client.invalidateQueries({ queryKey: ["serviceTargetRule", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const ServiceTargetRule_DATA_SOURCE_TYPE = 'InMemory' as const;

export { ServiceTargetRuleSchema, CreateServiceTargetRuleSchema, UpdateServiceTargetRuleSchema } from "../validators/service-target-rule-validator";
export type { ServiceTargetRuleInput, CreateServiceTargetRuleInput, UpdateServiceTargetRuleInput } from "../validators/service-target-rule-validator";