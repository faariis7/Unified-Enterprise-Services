import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WorkspaceRoleAssignmentService } from "../services/workspace-role-assignment-service";
import type { WorkspaceRoleAssignment } from "../models/workspace-role-assignment-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all WorkspaceRoleAssignment records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, workspaceRoleAssignmentName, createdAt, endDate, startDate, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useWorkspaceRoleAssignmentList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["workspaceRoleAssignment-list", options],
    queryFn: () => WorkspaceRoleAssignmentService.getAll(options),
  });
}

/**
 * Retrieve a single WorkspaceRoleAssignment record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useWorkspaceRoleAssignment(id: string) {
  return useQuery({
    queryKey: ["workspaceRoleAssignment", id],
    queryFn: () => WorkspaceRoleAssignmentService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new WorkspaceRoleAssignment record.
 * @remarks Form validation: use CreateWorkspaceRoleAssignmentSchema with zodResolver for type-safe create forms
 */
export function useCreateWorkspaceRoleAssignment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<WorkspaceRoleAssignment, "id">) => WorkspaceRoleAssignmentService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["workspaceRoleAssignment-list"] });
    },
  });
}

/**
 * Update an existing WorkspaceRoleAssignment record.
 * @remarks Form validation: use UpdateWorkspaceRoleAssignmentSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateWorkspaceRoleAssignment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<WorkspaceRoleAssignment, "id">>;
    }) => WorkspaceRoleAssignmentService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["workspaceRoleAssignment-list"] });
      client.invalidateQueries({ queryKey: ["workspaceRoleAssignment", variables.id] });
    },
  });
}

/**
 * Delete a WorkspaceRoleAssignment record by its unique identifier.
 */
export function useDeleteWorkspaceRoleAssignment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => WorkspaceRoleAssignmentService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["workspaceRoleAssignment-list"] });
      client.invalidateQueries({ queryKey: ["workspaceRoleAssignment", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const WorkspaceRoleAssignment_DATA_SOURCE_TYPE = 'InMemory' as const;

export { WorkspaceRoleAssignmentSchema, CreateWorkspaceRoleAssignmentSchema, UpdateWorkspaceRoleAssignmentSchema } from "../validators/workspace-role-assignment-validator";
export type { WorkspaceRoleAssignmentInput, CreateWorkspaceRoleAssignmentInput, UpdateWorkspaceRoleAssignmentInput } from "../validators/workspace-role-assignment-validator";