import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ServiceSettingOverrideService } from "../services/service-setting-override-service";
import type { ServiceSettingOverride } from "../models/service-setting-override-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all ServiceSettingOverride records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, serviceSettingOverrideName, active, overrideValue, serviceCode, serviceName, updatedAt
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useServiceSettingOverrideList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["serviceSettingOverride-list", options],
    queryFn: () => ServiceSettingOverrideService.getAll(options),
  });
}

/**
 * Retrieve a single ServiceSettingOverride record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useServiceSettingOverride(id: string) {
  return useQuery({
    queryKey: ["serviceSettingOverride", id],
    queryFn: () => ServiceSettingOverrideService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new ServiceSettingOverride record.
 * @remarks Form validation: use CreateServiceSettingOverrideSchema with zodResolver for type-safe create forms
 */
export function useCreateServiceSettingOverride() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ServiceSettingOverride, "id">) => ServiceSettingOverrideService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["serviceSettingOverride-list"] });
    },
  });
}

/**
 * Update an existing ServiceSettingOverride record.
 * @remarks Form validation: use UpdateServiceSettingOverrideSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateServiceSettingOverride() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<ServiceSettingOverride, "id">>;
    }) => ServiceSettingOverrideService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["serviceSettingOverride-list"] });
      client.invalidateQueries({ queryKey: ["serviceSettingOverride", variables.id] });
    },
  });
}

/**
 * Delete a ServiceSettingOverride record by its unique identifier.
 */
export function useDeleteServiceSettingOverride() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ServiceSettingOverrideService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["serviceSettingOverride-list"] });
      client.invalidateQueries({ queryKey: ["serviceSettingOverride", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const ServiceSettingOverride_DATA_SOURCE_TYPE = 'InMemory' as const;

export { ServiceSettingOverrideSchema, CreateServiceSettingOverrideSchema, UpdateServiceSettingOverrideSchema } from "../validators/service-setting-override-validator";
export type { ServiceSettingOverrideInput, CreateServiceSettingOverrideInput, UpdateServiceSettingOverrideInput } from "../validators/service-setting-override-validator";