import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WorkspaceService } from "../services/workspace-service";
import type { Workspace } from "../models/workspace-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all Workspace records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, workspaceName, active, agentWorkspaceEnabled, createdAt, defaultCalendarId, defaultSiteId, defaultTimeZone, description, icon, primaryColor, requesterPortalEnabled, requestNumberFormat, requestNumberPrefix, updatedAt, workspaceKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useWorkspaceList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["workspace-list", options],
    queryFn: () => WorkspaceService.getAll(options),
  });
}

/**
 * Retrieve a single Workspace record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useWorkspace(id: string) {
  return useQuery({
    queryKey: ["workspace", id],
    queryFn: () => WorkspaceService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new Workspace record.
 * @remarks Form validation: use CreateWorkspaceSchema with zodResolver for type-safe create forms
 */
export function useCreateWorkspace() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Workspace, "id">) => WorkspaceService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["workspace-list"] });
    },
  });
}

/**
 * Update an existing Workspace record.
 * @remarks Form validation: use UpdateWorkspaceSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateWorkspace() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<Workspace, "id">>;
    }) => WorkspaceService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["workspace-list"] });
      client.invalidateQueries({ queryKey: ["workspace", variables.id] });
    },
  });
}

/**
 * Delete a Workspace record by its unique identifier.
 */
export function useDeleteWorkspace() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => WorkspaceService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["workspace-list"] });
      client.invalidateQueries({ queryKey: ["workspace", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const Workspace_DATA_SOURCE_TYPE = 'InMemory' as const;

export { WorkspaceSchema, CreateWorkspaceSchema, UpdateWorkspaceSchema } from "../validators/workspace-validator";
export type { WorkspaceInput, CreateWorkspaceInput, UpdateWorkspaceInput } from "../validators/workspace-validator";