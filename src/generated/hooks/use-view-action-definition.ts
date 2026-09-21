import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ViewActionDefinitionService } from "../services/view-action-definition-service";
import type { ViewActionDefinition } from "../models/view-action-definition-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all ViewActionDefinition records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, actionName, actionKey, handlerKeyKey, placementKey, requiredPermission, sectionKey, sortOrder, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useViewActionDefinitionList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["viewActionDefinition-list", options],
    queryFn: () => ViewActionDefinitionService.getAll(options),
  });
}

/**
 * Retrieve a single ViewActionDefinition record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useViewActionDefinition(id: string) {
  return useQuery({
    queryKey: ["viewActionDefinition", id],
    queryFn: () => ViewActionDefinitionService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new ViewActionDefinition record.
 * @remarks Form validation: use CreateViewActionDefinitionSchema with zodResolver for type-safe create forms
 */
export function useCreateViewActionDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ViewActionDefinition, "id">) => ViewActionDefinitionService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["viewActionDefinition-list"] });
    },
  });
}

/**
 * Update an existing ViewActionDefinition record.
 * @remarks Form validation: use UpdateViewActionDefinitionSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateViewActionDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<ViewActionDefinition, "id">>;
    }) => ViewActionDefinitionService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["viewActionDefinition-list"] });
      client.invalidateQueries({ queryKey: ["viewActionDefinition", variables.id] });
    },
  });
}

/**
 * Delete a ViewActionDefinition record by its unique identifier.
 */
export function useDeleteViewActionDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ViewActionDefinitionService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["viewActionDefinition-list"] });
      client.invalidateQueries({ queryKey: ["viewActionDefinition", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const ViewActionDefinition_DATA_SOURCE_TYPE = 'InMemory' as const;

export { ViewActionDefinitionSchema, CreateViewActionDefinitionSchema, UpdateViewActionDefinitionSchema } from "../validators/view-action-definition-validator";
export type { ViewActionDefinitionInput, CreateViewActionDefinitionInput, UpdateViewActionDefinitionInput } from "../validators/view-action-definition-validator";