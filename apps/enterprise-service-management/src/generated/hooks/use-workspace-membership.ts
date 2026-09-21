import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WorkspaceMembershipService } from "../services/workspace-membership-service";
import type { WorkspaceMembership } from "../models/workspace-membership-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all WorkspaceMembership records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, membershipLabel, active, createdAt, endDate, isDefaultWorkspace, roleKey, startDate
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useWorkspaceMembershipList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["workspaceMembership-list", options],
    queryFn: () => WorkspaceMembershipService.getAll(options),
  });
}

/**
 * Retrieve a single WorkspaceMembership record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useWorkspaceMembership(id: string) {
  return useQuery({
    queryKey: ["workspaceMembership", id],
    queryFn: () => WorkspaceMembershipService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new WorkspaceMembership record.
 * @remarks Form validation: use CreateWorkspaceMembershipSchema with zodResolver for type-safe create forms
 */
export function useCreateWorkspaceMembership() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<WorkspaceMembership, "id">) => WorkspaceMembershipService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["workspaceMembership-list"] });
    },
  });
}

/**
 * Update an existing WorkspaceMembership record.
 * @remarks Form validation: use UpdateWorkspaceMembershipSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateWorkspaceMembership() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<WorkspaceMembership, "id">>;
    }) => WorkspaceMembershipService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["workspaceMembership-list"] });
      client.invalidateQueries({ queryKey: ["workspaceMembership", variables.id] });
    },
  });
}

/**
 * Delete a WorkspaceMembership record by its unique identifier.
 */
export function useDeleteWorkspaceMembership() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => WorkspaceMembershipService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["workspaceMembership-list"] });
      client.invalidateQueries({ queryKey: ["workspaceMembership", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const WorkspaceMembership_DATA_SOURCE_TYPE = 'InMemory' as const;

export { WorkspaceMembershipSchema, CreateWorkspaceMembershipSchema, UpdateWorkspaceMembershipSchema } from "../validators/workspace-membership-validator";
export type { WorkspaceMembershipInput, CreateWorkspaceMembershipInput, UpdateWorkspaceMembershipInput } from "../validators/workspace-membership-validator";