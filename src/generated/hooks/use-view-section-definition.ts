import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ViewSectionDefinitionService } from "../services/view-section-definition-service";
import type { ViewSectionDefinition } from "../models/view-section-definition-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all ViewSectionDefinition records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, sectionName, rendererKeyKey, requiredPermission, sectionKey, sortOrder, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useViewSectionDefinitionList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["viewSectionDefinition-list", options],
    queryFn: () => ViewSectionDefinitionService.getAll(options),
  });
}

/**
 * Retrieve a single ViewSectionDefinition record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useViewSectionDefinition(id: string) {
  return useQuery({
    queryKey: ["viewSectionDefinition", id],
    queryFn: () => ViewSectionDefinitionService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new ViewSectionDefinition record.
 * @remarks Form validation: use CreateViewSectionDefinitionSchema with zodResolver for type-safe create forms
 */
export function useCreateViewSectionDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ViewSectionDefinition, "id">) => ViewSectionDefinitionService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["viewSectionDefinition-list"] });
    },
  });
}

/**
 * Update an existing ViewSectionDefinition record.
 * @remarks Form validation: use UpdateViewSectionDefinitionSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateViewSectionDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<ViewSectionDefinition, "id">>;
    }) => ViewSectionDefinitionService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["viewSectionDefinition-list"] });
      client.invalidateQueries({ queryKey: ["viewSectionDefinition", variables.id] });
    },
  });
}

/**
 * Delete a ViewSectionDefinition record by its unique identifier.
 */
export function useDeleteViewSectionDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ViewSectionDefinitionService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["viewSectionDefinition-list"] });
      client.invalidateQueries({ queryKey: ["viewSectionDefinition", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const ViewSectionDefinition_DATA_SOURCE_TYPE = 'InMemory' as const;

export { ViewSectionDefinitionSchema, CreateViewSectionDefinitionSchema, UpdateViewSectionDefinitionSchema } from "../validators/view-section-definition-validator";
export type { ViewSectionDefinitionInput, CreateViewSectionDefinitionInput, UpdateViewSectionDefinitionInput } from "../validators/view-section-definition-validator";