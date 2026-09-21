import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CatalogItemSettingOverrideService } from "../services/catalog-item-setting-override-service";
import type { CatalogItemSettingOverride } from "../models/catalog-item-setting-override-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all CatalogItemSettingOverride records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, catalogItemSettingOverrideName, active, catalogItemCode, catalogItemName, overrideValue, updatedAt
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useCatalogItemSettingOverrideList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["catalogItemSettingOverride-list", options],
    queryFn: () => CatalogItemSettingOverrideService.getAll(options),
  });
}

/**
 * Retrieve a single CatalogItemSettingOverride record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useCatalogItemSettingOverride(id: string) {
  return useQuery({
    queryKey: ["catalogItemSettingOverride", id],
    queryFn: () => CatalogItemSettingOverrideService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new CatalogItemSettingOverride record.
 * @remarks Form validation: use CreateCatalogItemSettingOverrideSchema with zodResolver for type-safe create forms
 */
export function useCreateCatalogItemSettingOverride() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<CatalogItemSettingOverride, "id">) => CatalogItemSettingOverrideService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["catalogItemSettingOverride-list"] });
    },
  });
}

/**
 * Update an existing CatalogItemSettingOverride record.
 * @remarks Form validation: use UpdateCatalogItemSettingOverrideSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateCatalogItemSettingOverride() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<CatalogItemSettingOverride, "id">>;
    }) => CatalogItemSettingOverrideService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["catalogItemSettingOverride-list"] });
      client.invalidateQueries({ queryKey: ["catalogItemSettingOverride", variables.id] });
    },
  });
}

/**
 * Delete a CatalogItemSettingOverride record by its unique identifier.
 */
export function useDeleteCatalogItemSettingOverride() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => CatalogItemSettingOverrideService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["catalogItemSettingOverride-list"] });
      client.invalidateQueries({ queryKey: ["catalogItemSettingOverride", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const CatalogItemSettingOverride_DATA_SOURCE_TYPE = 'InMemory' as const;

export { CatalogItemSettingOverrideSchema, CreateCatalogItemSettingOverrideSchema, UpdateCatalogItemSettingOverrideSchema } from "../validators/catalog-item-setting-override-validator";
export type { CatalogItemSettingOverrideInput, CreateCatalogItemSettingOverrideInput, UpdateCatalogItemSettingOverrideInput } from "../validators/catalog-item-setting-override-validator";