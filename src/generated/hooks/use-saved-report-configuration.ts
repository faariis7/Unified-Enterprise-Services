import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SavedReportConfigurationService } from "../services/saved-report-configuration-service";
import type { SavedReportConfiguration } from "../models/saved-report-configuration-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all SavedReportConfiguration records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, configurationName, aggregationKey, dateScopeKey, dimensionKey, filtersJSON, layoutJSON, measureKey, sortingJSON, visualizationKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useSavedReportConfigurationList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["savedReportConfiguration-list", options],
    queryFn: () => SavedReportConfigurationService.getAll(options),
  });
}

/**
 * Retrieve a single SavedReportConfiguration record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useSavedReportConfiguration(id: string) {
  return useQuery({
    queryKey: ["savedReportConfiguration", id],
    queryFn: () => SavedReportConfigurationService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new SavedReportConfiguration record.
 * @remarks Form validation: use CreateSavedReportConfigurationSchema with zodResolver for type-safe create forms
 */
export function useCreateSavedReportConfiguration() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<SavedReportConfiguration, "id">) => SavedReportConfigurationService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["savedReportConfiguration-list"] });
    },
  });
}

/**
 * Update an existing SavedReportConfiguration record.
 * @remarks Form validation: use UpdateSavedReportConfigurationSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateSavedReportConfiguration() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<SavedReportConfiguration, "id">>;
    }) => SavedReportConfigurationService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["savedReportConfiguration-list"] });
      client.invalidateQueries({ queryKey: ["savedReportConfiguration", variables.id] });
    },
  });
}

/**
 * Delete a SavedReportConfiguration record by its unique identifier.
 */
export function useDeleteSavedReportConfiguration() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => SavedReportConfigurationService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["savedReportConfiguration-list"] });
      client.invalidateQueries({ queryKey: ["savedReportConfiguration", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const SavedReportConfiguration_DATA_SOURCE_TYPE = 'InMemory' as const;

export { SavedReportConfigurationSchema, CreateSavedReportConfigurationSchema, UpdateSavedReportConfigurationSchema } from "../validators/saved-report-configuration-validator";
export type { SavedReportConfigurationInput, CreateSavedReportConfigurationInput, UpdateSavedReportConfigurationInput } from "../validators/saved-report-configuration-validator";