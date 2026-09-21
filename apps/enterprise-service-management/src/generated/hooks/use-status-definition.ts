import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { StatusDefinitionService } from "../services/status-definition-service";
import type { StatusDefinition } from "../models/status-definition-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all StatusDefinition records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, statusName, isInitial, isTerminal, sortOrder, statusCode, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useStatusDefinitionList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["statusDefinition-list", options],
    queryFn: () => StatusDefinitionService.getAll(options),
  });
}

/**
 * Retrieve a single StatusDefinition record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useStatusDefinition(id: string) {
  return useQuery({
    queryKey: ["statusDefinition", id],
    queryFn: () => StatusDefinitionService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new StatusDefinition record.
 * @remarks Form validation: use CreateStatusDefinitionSchema with zodResolver for type-safe create forms
 */
export function useCreateStatusDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<StatusDefinition, "id">) => StatusDefinitionService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["statusDefinition-list"] });
    },
  });
}

/**
 * Update an existing StatusDefinition record.
 * @remarks Form validation: use UpdateStatusDefinitionSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateStatusDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<StatusDefinition, "id">>;
    }) => StatusDefinitionService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["statusDefinition-list"] });
      client.invalidateQueries({ queryKey: ["statusDefinition", variables.id] });
    },
  });
}

/**
 * Delete a StatusDefinition record by its unique identifier.
 */
export function useDeleteStatusDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => StatusDefinitionService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["statusDefinition-list"] });
      client.invalidateQueries({ queryKey: ["statusDefinition", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const StatusDefinition_DATA_SOURCE_TYPE = 'InMemory' as const;

export { StatusDefinitionSchema, CreateStatusDefinitionSchema, UpdateStatusDefinitionSchema } from "../validators/status-definition-validator";
export type { StatusDefinitionInput, CreateStatusDefinitionInput, UpdateStatusDefinitionInput } from "../validators/status-definition-validator";