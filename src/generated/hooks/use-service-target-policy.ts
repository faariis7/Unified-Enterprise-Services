import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ServiceTargetPolicyService } from "../services/service-target-policy-service";
import type { ServiceTargetPolicy } from "../models/service-target-policy-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all ServiceTargetPolicy records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, name1, active, breachActionsKeys, description, durationMinutes, effectiveDates, pauseBehaviorKey, startEventKey, stopEventKey, targetTypeKey, version, warningThresholdPercent
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useServiceTargetPolicyList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["serviceTargetPolicy-list", options],
    queryFn: () => ServiceTargetPolicyService.getAll(options),
  });
}

/**
 * Retrieve a single ServiceTargetPolicy record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useServiceTargetPolicy(id: string) {
  return useQuery({
    queryKey: ["serviceTargetPolicy", id],
    queryFn: () => ServiceTargetPolicyService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new ServiceTargetPolicy record.
 * @remarks Form validation: use CreateServiceTargetPolicySchema with zodResolver for type-safe create forms
 */
export function useCreateServiceTargetPolicy() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ServiceTargetPolicy, "id">) => ServiceTargetPolicyService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["serviceTargetPolicy-list"] });
    },
  });
}

/**
 * Update an existing ServiceTargetPolicy record.
 * @remarks Form validation: use UpdateServiceTargetPolicySchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateServiceTargetPolicy() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<ServiceTargetPolicy, "id">>;
    }) => ServiceTargetPolicyService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["serviceTargetPolicy-list"] });
      client.invalidateQueries({ queryKey: ["serviceTargetPolicy", variables.id] });
    },
  });
}

/**
 * Delete a ServiceTargetPolicy record by its unique identifier.
 */
export function useDeleteServiceTargetPolicy() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ServiceTargetPolicyService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["serviceTargetPolicy-list"] });
      client.invalidateQueries({ queryKey: ["serviceTargetPolicy", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const ServiceTargetPolicy_DATA_SOURCE_TYPE = 'InMemory' as const;

export { ServiceTargetPolicySchema, CreateServiceTargetPolicySchema, UpdateServiceTargetPolicySchema } from "../validators/service-target-policy-validator";
export type { ServiceTargetPolicyInput, CreateServiceTargetPolicyInput, UpdateServiceTargetPolicyInput } from "../validators/service-target-policy-validator";