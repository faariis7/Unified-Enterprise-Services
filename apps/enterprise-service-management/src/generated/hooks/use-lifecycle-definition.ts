import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { LifecycleDefinitionService } from "../services/lifecycle-definition-service";
import type { LifecycleDefinition } from "../models/lifecycle-definition-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all LifecycleDefinition records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, name1, catalogItemCode, code, default1, requestTypeCode, serviceCode, statusKey, version
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useLifecycleDefinitionList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["lifecycleDefinition-list", options],
    queryFn: () => LifecycleDefinitionService.getAll(options),
  });
}

/**
 * Retrieve a single LifecycleDefinition record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useLifecycleDefinition(id: string) {
  return useQuery({
    queryKey: ["lifecycleDefinition", id],
    queryFn: () => LifecycleDefinitionService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new LifecycleDefinition record.
 * @remarks Form validation: use CreateLifecycleDefinitionSchema with zodResolver for type-safe create forms
 */
export function useCreateLifecycleDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<LifecycleDefinition, "id">) => LifecycleDefinitionService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["lifecycleDefinition-list"] });
    },
  });
}

/**
 * Update an existing LifecycleDefinition record.
 * @remarks Form validation: use UpdateLifecycleDefinitionSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateLifecycleDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<LifecycleDefinition, "id">>;
    }) => LifecycleDefinitionService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["lifecycleDefinition-list"] });
      client.invalidateQueries({ queryKey: ["lifecycleDefinition", variables.id] });
    },
  });
}

/**
 * Delete a LifecycleDefinition record by its unique identifier.
 */
export function useDeleteLifecycleDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => LifecycleDefinitionService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["lifecycleDefinition-list"] });
      client.invalidateQueries({ queryKey: ["lifecycleDefinition", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const LifecycleDefinition_DATA_SOURCE_TYPE = 'InMemory' as const;

export { LifecycleDefinitionSchema, CreateLifecycleDefinitionSchema, UpdateLifecycleDefinitionSchema } from "../validators/lifecycle-definition-validator";
export type { LifecycleDefinitionInput, CreateLifecycleDefinitionInput, UpdateLifecycleDefinitionInput } from "../validators/lifecycle-definition-validator";