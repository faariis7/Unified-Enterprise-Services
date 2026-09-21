import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WorkspaceModuleService } from "../services/workspace-module-service";
import type { WorkspaceModule } from "../models/workspace-module-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all WorkspaceModule records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, workspaceModuleName, configurationStatusKey, displayNameOverride, enabled, enabledAt, sortOrder
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useWorkspaceModuleList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["workspaceModule-list", options],
    queryFn: () => WorkspaceModuleService.getAll(options),
  });
}

/**
 * Retrieve a single WorkspaceModule record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useWorkspaceModule(id: string) {
  return useQuery({
    queryKey: ["workspaceModule", id],
    queryFn: () => WorkspaceModuleService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new WorkspaceModule record.
 * @remarks Form validation: use CreateWorkspaceModuleSchema with zodResolver for type-safe create forms
 */
export function useCreateWorkspaceModule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<WorkspaceModule, "id">) => WorkspaceModuleService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["workspaceModule-list"] });
    },
  });
}

/**
 * Update an existing WorkspaceModule record.
 * @remarks Form validation: use UpdateWorkspaceModuleSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateWorkspaceModule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<WorkspaceModule, "id">>;
    }) => WorkspaceModuleService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["workspaceModule-list"] });
      client.invalidateQueries({ queryKey: ["workspaceModule", variables.id] });
    },
  });
}

/**
 * Delete a WorkspaceModule record by its unique identifier.
 */
export function useDeleteWorkspaceModule() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => WorkspaceModuleService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["workspaceModule-list"] });
      client.invalidateQueries({ queryKey: ["workspaceModule", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const WorkspaceModule_DATA_SOURCE_TYPE = 'InMemory' as const;

export { WorkspaceModuleSchema, CreateWorkspaceModuleSchema, UpdateWorkspaceModuleSchema } from "../validators/workspace-module-validator";
export type { WorkspaceModuleInput, CreateWorkspaceModuleInput, UpdateWorkspaceModuleInput } from "../validators/workspace-module-validator";