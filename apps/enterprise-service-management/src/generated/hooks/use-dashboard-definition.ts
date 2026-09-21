import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardDefinitionService } from "../services/dashboard-definition-service";
import type { DashboardDefinition } from "../models/dashboard-definition-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all DashboardDefinition records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, name1, createdAt, isDeleted, layoutJSON, sharingScopeKey, statusKey, updatedAt
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useDashboardDefinitionList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["dashboardDefinition-list", options],
    queryFn: () => DashboardDefinitionService.getAll(options),
  });
}

/**
 * Retrieve a single DashboardDefinition record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useDashboardDefinition(id: string) {
  return useQuery({
    queryKey: ["dashboardDefinition", id],
    queryFn: () => DashboardDefinitionService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new DashboardDefinition record.
 * @remarks Form validation: use CreateDashboardDefinitionSchema with zodResolver for type-safe create forms
 */
export function useCreateDashboardDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<DashboardDefinition, "id">) => DashboardDefinitionService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["dashboardDefinition-list"] });
    },
  });
}

/**
 * Update an existing DashboardDefinition record.
 * @remarks Form validation: use UpdateDashboardDefinitionSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateDashboardDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<DashboardDefinition, "id">>;
    }) => DashboardDefinitionService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["dashboardDefinition-list"] });
      client.invalidateQueries({ queryKey: ["dashboardDefinition", variables.id] });
    },
  });
}

/**
 * Delete a DashboardDefinition record by its unique identifier.
 */
export function useDeleteDashboardDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => DashboardDefinitionService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["dashboardDefinition-list"] });
      client.invalidateQueries({ queryKey: ["dashboardDefinition", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const DashboardDefinition_DATA_SOURCE_TYPE = 'InMemory' as const;

export { DashboardDefinitionSchema, CreateDashboardDefinitionSchema, UpdateDashboardDefinitionSchema } from "../validators/dashboard-definition-validator";
export type { DashboardDefinitionInput, CreateDashboardDefinitionInput, UpdateDashboardDefinitionInput } from "../validators/dashboard-definition-validator";