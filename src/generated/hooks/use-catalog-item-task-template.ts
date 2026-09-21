import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CatalogItemTaskTemplateService } from "../services/catalog-item-task-template-service";
import type { CatalogItemTaskTemplate } from "../models/catalog-item-task-template-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all CatalogItemTaskTemplate records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, taskTitle, assignmentGroupCode, description, isRequired, sortOrder, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useCatalogItemTaskTemplateList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["catalogItemTaskTemplate-list", options],
    queryFn: () => CatalogItemTaskTemplateService.getAll(options),
  });
}

/**
 * Retrieve a single CatalogItemTaskTemplate record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useCatalogItemTaskTemplate(id: string) {
  return useQuery({
    queryKey: ["catalogItemTaskTemplate", id],
    queryFn: () => CatalogItemTaskTemplateService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new CatalogItemTaskTemplate record.
 * @remarks Form validation: use CreateCatalogItemTaskTemplateSchema with zodResolver for type-safe create forms
 */
export function useCreateCatalogItemTaskTemplate() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<CatalogItemTaskTemplate, "id">) => CatalogItemTaskTemplateService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["catalogItemTaskTemplate-list"] });
    },
  });
}

/**
 * Update an existing CatalogItemTaskTemplate record.
 * @remarks Form validation: use UpdateCatalogItemTaskTemplateSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateCatalogItemTaskTemplate() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<CatalogItemTaskTemplate, "id">>;
    }) => CatalogItemTaskTemplateService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["catalogItemTaskTemplate-list"] });
      client.invalidateQueries({ queryKey: ["catalogItemTaskTemplate", variables.id] });
    },
  });
}

/**
 * Delete a CatalogItemTaskTemplate record by its unique identifier.
 */
export function useDeleteCatalogItemTaskTemplate() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => CatalogItemTaskTemplateService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["catalogItemTaskTemplate-list"] });
      client.invalidateQueries({ queryKey: ["catalogItemTaskTemplate", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const CatalogItemTaskTemplate_DATA_SOURCE_TYPE = 'InMemory' as const;

export { CatalogItemTaskTemplateSchema, CreateCatalogItemTaskTemplateSchema, UpdateCatalogItemTaskTemplateSchema } from "../validators/catalog-item-task-template-validator";
export type { CatalogItemTaskTemplateInput, CreateCatalogItemTaskTemplateInput, UpdateCatalogItemTaskTemplateInput } from "../validators/catalog-item-task-template-validator";