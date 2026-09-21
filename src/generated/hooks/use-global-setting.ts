import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GlobalSettingService } from "../services/global-setting-service";
import type { GlobalSetting } from "../models/global-setting-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all GlobalSetting records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, settingKey, description, updatedAt, value, valueTypeKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useGlobalSettingList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["globalSetting-list", options],
    queryFn: () => GlobalSettingService.getAll(options),
  });
}

/**
 * Retrieve a single GlobalSetting record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useGlobalSetting(id: string) {
  return useQuery({
    queryKey: ["globalSetting", id],
    queryFn: () => GlobalSettingService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new GlobalSetting record.
 * @remarks Form validation: use CreateGlobalSettingSchema with zodResolver for type-safe create forms
 */
export function useCreateGlobalSetting() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<GlobalSetting, "id">) => GlobalSettingService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["globalSetting-list"] });
    },
  });
}

/**
 * Update an existing GlobalSetting record.
 * @remarks Form validation: use UpdateGlobalSettingSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateGlobalSetting() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<GlobalSetting, "id">>;
    }) => GlobalSettingService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["globalSetting-list"] });
      client.invalidateQueries({ queryKey: ["globalSetting", variables.id] });
    },
  });
}

/**
 * Delete a GlobalSetting record by its unique identifier.
 */
export function useDeleteGlobalSetting() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => GlobalSettingService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["globalSetting-list"] });
      client.invalidateQueries({ queryKey: ["globalSetting", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const GlobalSetting_DATA_SOURCE_TYPE = 'InMemory' as const;

export { GlobalSettingSchema, CreateGlobalSettingSchema, UpdateGlobalSettingSchema } from "../validators/global-setting-validator";
export type { GlobalSettingInput, CreateGlobalSettingInput, UpdateGlobalSettingInput } from "../validators/global-setting-validator";