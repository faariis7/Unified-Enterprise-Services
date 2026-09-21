import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ViewDefinitionService } from "../services/view-definition-service";
import type { ViewDefinition } from "../models/view-definition-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all ViewDefinition records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, viewName, entityName, statusKey, surfaceKey, version, viewKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useViewDefinitionList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["viewDefinition-list", options],
    queryFn: () => ViewDefinitionService.getAll(options),
  });
}

/**
 * Retrieve a single ViewDefinition record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useViewDefinition(id: string) {
  return useQuery({
    queryKey: ["viewDefinition", id],
    queryFn: () => ViewDefinitionService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new ViewDefinition record.
 * @remarks Form validation: use CreateViewDefinitionSchema with zodResolver for type-safe create forms
 */
export function useCreateViewDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ViewDefinition, "id">) => ViewDefinitionService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["viewDefinition-list"] });
    },
  });
}

/**
 * Update an existing ViewDefinition record.
 * @remarks Form validation: use UpdateViewDefinitionSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateViewDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<ViewDefinition, "id">>;
    }) => ViewDefinitionService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["viewDefinition-list"] });
      client.invalidateQueries({ queryKey: ["viewDefinition", variables.id] });
    },
  });
}

/**
 * Delete a ViewDefinition record by its unique identifier.
 */
export function useDeleteViewDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ViewDefinitionService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["viewDefinition-list"] });
      client.invalidateQueries({ queryKey: ["viewDefinition", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const ViewDefinition_DATA_SOURCE_TYPE = 'InMemory' as const;

export { ViewDefinitionSchema, CreateViewDefinitionSchema, UpdateViewDefinitionSchema } from "../validators/view-definition-validator";
export type { ViewDefinitionInput, CreateViewDefinitionInput, UpdateViewDefinitionInput } from "../validators/view-definition-validator";