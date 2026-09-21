import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WorkspaceSettingOverrideService } from "../services/workspace-setting-override-service";
import type { WorkspaceSettingOverride } from "../models/workspace-setting-override-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all WorkspaceSettingOverride records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, workspaceSettingOverrideName, active, overrideValue, updatedAt
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useWorkspaceSettingOverrideList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["workspaceSettingOverride-list", options],
    queryFn: () => WorkspaceSettingOverrideService.getAll(options),
  });
}

/**
 * Retrieve a single WorkspaceSettingOverride record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useWorkspaceSettingOverride(id: string) {
  return useQuery({
    queryKey: ["workspaceSettingOverride", id],
    queryFn: () => WorkspaceSettingOverrideService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new WorkspaceSettingOverride record.
 * @remarks Form validation: use CreateWorkspaceSettingOverrideSchema with zodResolver for type-safe create forms
 */
export function useCreateWorkspaceSettingOverride() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<WorkspaceSettingOverride, "id">) => WorkspaceSettingOverrideService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["workspaceSettingOverride-list"] });
    },
  });
}

/**
 * Update an existing WorkspaceSettingOverride record.
 * @remarks Form validation: use UpdateWorkspaceSettingOverrideSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateWorkspaceSettingOverride() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<WorkspaceSettingOverride, "id">>;
    }) => WorkspaceSettingOverrideService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["workspaceSettingOverride-list"] });
      client.invalidateQueries({ queryKey: ["workspaceSettingOverride", variables.id] });
    },
  });
}

/**
 * Delete a WorkspaceSettingOverride record by its unique identifier.
 */
export function useDeleteWorkspaceSettingOverride() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => WorkspaceSettingOverrideService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["workspaceSettingOverride-list"] });
      client.invalidateQueries({ queryKey: ["workspaceSettingOverride", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const WorkspaceSettingOverride_DATA_SOURCE_TYPE = 'InMemory' as const;

export { WorkspaceSettingOverrideSchema, CreateWorkspaceSettingOverrideSchema, UpdateWorkspaceSettingOverrideSchema } from "../validators/workspace-setting-override-validator";
export type { WorkspaceSettingOverrideInput, CreateWorkspaceSettingOverrideInput, UpdateWorkspaceSettingOverrideInput } from "../validators/workspace-setting-override-validator";