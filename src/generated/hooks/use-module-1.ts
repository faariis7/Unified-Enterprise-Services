import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Module_1Service } from "../services/module-1-service";
import type { Module_1 } from "../models/module-1-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all Module_1 records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, moduleName, description, globalStatusKey, icon, isCoreModule, moduleCode, requiredPermission, route, sortOrder
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useModule_1List(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["module_1-list", options],
    queryFn: () => Module_1Service.getAll(options),
  });
}

/**
 * Retrieve a single Module_1 record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useModule_1(id: string) {
  return useQuery({
    queryKey: ["module_1", id],
    queryFn: () => Module_1Service.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new Module_1 record.
 * @remarks Form validation: use CreateModule_1Schema with zodResolver for type-safe create forms
 */
export function useCreateModule_1() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Module_1, "id">) => Module_1Service.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["module_1-list"] });
    },
  });
}

/**
 * Update an existing Module_1 record.
 * @remarks Form validation: use UpdateModule_1Schema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateModule_1() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<Module_1, "id">>;
    }) => Module_1Service.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["module_1-list"] });
      client.invalidateQueries({ queryKey: ["module_1", variables.id] });
    },
  });
}

/**
 * Delete a Module_1 record by its unique identifier.
 */
export function useDeleteModule_1() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => Module_1Service.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["module_1-list"] });
      client.invalidateQueries({ queryKey: ["module_1", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const Module_1_DATA_SOURCE_TYPE = 'InMemory' as const;

export { Module_1Schema, CreateModule_1Schema, UpdateModule_1Schema } from "../validators/module-1-validator";
export type { Module_1Input, CreateModule_1Input, UpdateModule_1Input } from "../validators/module-1-validator";