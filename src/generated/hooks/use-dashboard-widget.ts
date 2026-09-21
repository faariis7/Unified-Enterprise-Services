import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardWidgetService } from "../services/dashboard-widget-service";
import type { DashboardWidget } from "../models/dashboard-widget-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all DashboardWidget records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, title, createdAt, isDeleted, sortOrder, widthKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useDashboardWidgetList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["dashboardWidget-list", options],
    queryFn: () => DashboardWidgetService.getAll(options),
  });
}

/**
 * Retrieve a single DashboardWidget record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useDashboardWidget(id: string) {
  return useQuery({
    queryKey: ["dashboardWidget", id],
    queryFn: () => DashboardWidgetService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new DashboardWidget record.
 * @remarks Form validation: use CreateDashboardWidgetSchema with zodResolver for type-safe create forms
 */
export function useCreateDashboardWidget() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<DashboardWidget, "id">) => DashboardWidgetService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["dashboardWidget-list"] });
    },
  });
}

/**
 * Update an existing DashboardWidget record.
 * @remarks Form validation: use UpdateDashboardWidgetSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateDashboardWidget() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<DashboardWidget, "id">>;
    }) => DashboardWidgetService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["dashboardWidget-list"] });
      client.invalidateQueries({ queryKey: ["dashboardWidget", variables.id] });
    },
  });
}

/**
 * Delete a DashboardWidget record by its unique identifier.
 */
export function useDeleteDashboardWidget() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => DashboardWidgetService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["dashboardWidget-list"] });
      client.invalidateQueries({ queryKey: ["dashboardWidget", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const DashboardWidget_DATA_SOURCE_TYPE = 'InMemory' as const;

export { DashboardWidgetSchema, CreateDashboardWidgetSchema, UpdateDashboardWidgetSchema } from "../validators/dashboard-widget-validator";
export type { DashboardWidgetInput, CreateDashboardWidgetInput, UpdateDashboardWidgetInput } from "../validators/dashboard-widget-validator";