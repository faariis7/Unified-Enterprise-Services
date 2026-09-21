import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { GlobalRoleAssignmentService } from "../services/global-role-assignment-service";
import type { GlobalRoleAssignment } from "../models/global-role-assignment-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all GlobalRoleAssignment records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, globalRoleAssignmentName, createdAt, endDate, startDate, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useGlobalRoleAssignmentList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["globalRoleAssignment-list", options],
    queryFn: () => GlobalRoleAssignmentService.getAll(options),
  });
}

/**
 * Retrieve a single GlobalRoleAssignment record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useGlobalRoleAssignment(id: string) {
  return useQuery({
    queryKey: ["globalRoleAssignment", id],
    queryFn: () => GlobalRoleAssignmentService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new GlobalRoleAssignment record.
 * @remarks Form validation: use CreateGlobalRoleAssignmentSchema with zodResolver for type-safe create forms
 */
export function useCreateGlobalRoleAssignment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<GlobalRoleAssignment, "id">) => GlobalRoleAssignmentService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["globalRoleAssignment-list"] });
    },
  });
}

/**
 * Update an existing GlobalRoleAssignment record.
 * @remarks Form validation: use UpdateGlobalRoleAssignmentSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateGlobalRoleAssignment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<GlobalRoleAssignment, "id">>;
    }) => GlobalRoleAssignmentService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["globalRoleAssignment-list"] });
      client.invalidateQueries({ queryKey: ["globalRoleAssignment", variables.id] });
    },
  });
}

/**
 * Delete a GlobalRoleAssignment record by its unique identifier.
 */
export function useDeleteGlobalRoleAssignment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => GlobalRoleAssignmentService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["globalRoleAssignment-list"] });
      client.invalidateQueries({ queryKey: ["globalRoleAssignment", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const GlobalRoleAssignment_DATA_SOURCE_TYPE = 'InMemory' as const;

export { GlobalRoleAssignmentSchema, CreateGlobalRoleAssignmentSchema, UpdateGlobalRoleAssignmentSchema } from "../validators/global-role-assignment-validator";
export type { GlobalRoleAssignmentInput, CreateGlobalRoleAssignmentInput, UpdateGlobalRoleAssignmentInput } from "../validators/global-role-assignment-validator";