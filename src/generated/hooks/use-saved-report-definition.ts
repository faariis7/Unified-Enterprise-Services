import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { SavedReportDefinitionService } from "../services/saved-report-definition-service";
import type { SavedReportDefinition } from "../models/saved-report-definition-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all SavedReportDefinition records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, name1, accessPermissionKey, createdAt, description, isDeleted, serviceCode, sharingScopeKey, statusKey, updatedAt
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useSavedReportDefinitionList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["savedReportDefinition-list", options],
    queryFn: () => SavedReportDefinitionService.getAll(options),
  });
}

/**
 * Retrieve a single SavedReportDefinition record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useSavedReportDefinition(id: string) {
  return useQuery({
    queryKey: ["savedReportDefinition", id],
    queryFn: () => SavedReportDefinitionService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new SavedReportDefinition record.
 * @remarks Form validation: use CreateSavedReportDefinitionSchema with zodResolver for type-safe create forms
 */
export function useCreateSavedReportDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<SavedReportDefinition, "id">) => SavedReportDefinitionService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["savedReportDefinition-list"] });
    },
  });
}

/**
 * Update an existing SavedReportDefinition record.
 * @remarks Form validation: use UpdateSavedReportDefinitionSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateSavedReportDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<SavedReportDefinition, "id">>;
    }) => SavedReportDefinitionService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["savedReportDefinition-list"] });
      client.invalidateQueries({ queryKey: ["savedReportDefinition", variables.id] });
    },
  });
}

/**
 * Delete a SavedReportDefinition record by its unique identifier.
 */
export function useDeleteSavedReportDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => SavedReportDefinitionService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["savedReportDefinition-list"] });
      client.invalidateQueries({ queryKey: ["savedReportDefinition", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const SavedReportDefinition_DATA_SOURCE_TYPE = 'InMemory' as const;

export { SavedReportDefinitionSchema, CreateSavedReportDefinitionSchema, UpdateSavedReportDefinitionSchema } from "../validators/saved-report-definition-validator";
export type { SavedReportDefinitionInput, CreateSavedReportDefinitionInput, UpdateSavedReportDefinitionInput } from "../validators/saved-report-definition-validator";