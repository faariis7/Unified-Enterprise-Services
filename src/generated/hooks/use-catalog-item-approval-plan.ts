import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CatalogItemApprovalPlanService } from "../services/catalog-item-approval-plan-service";
import type { CatalogItemApprovalPlan } from "../models/catalog-item-approval-plan-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all CatalogItemApprovalPlan records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, planName, approvalModeKey, approverReference, approverTypeKey, stageOrder, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useCatalogItemApprovalPlanList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["catalogItemApprovalPlan-list", options],
    queryFn: () => CatalogItemApprovalPlanService.getAll(options),
  });
}

/**
 * Retrieve a single CatalogItemApprovalPlan record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useCatalogItemApprovalPlan(id: string) {
  return useQuery({
    queryKey: ["catalogItemApprovalPlan", id],
    queryFn: () => CatalogItemApprovalPlanService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new CatalogItemApprovalPlan record.
 * @remarks Form validation: use CreateCatalogItemApprovalPlanSchema with zodResolver for type-safe create forms
 */
export function useCreateCatalogItemApprovalPlan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<CatalogItemApprovalPlan, "id">) => CatalogItemApprovalPlanService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["catalogItemApprovalPlan-list"] });
    },
  });
}

/**
 * Update an existing CatalogItemApprovalPlan record.
 * @remarks Form validation: use UpdateCatalogItemApprovalPlanSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateCatalogItemApprovalPlan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<CatalogItemApprovalPlan, "id">>;
    }) => CatalogItemApprovalPlanService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["catalogItemApprovalPlan-list"] });
      client.invalidateQueries({ queryKey: ["catalogItemApprovalPlan", variables.id] });
    },
  });
}

/**
 * Delete a CatalogItemApprovalPlan record by its unique identifier.
 */
export function useDeleteCatalogItemApprovalPlan() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => CatalogItemApprovalPlanService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["catalogItemApprovalPlan-list"] });
      client.invalidateQueries({ queryKey: ["catalogItemApprovalPlan", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const CatalogItemApprovalPlan_DATA_SOURCE_TYPE = 'InMemory' as const;

export { CatalogItemApprovalPlanSchema, CreateCatalogItemApprovalPlanSchema, UpdateCatalogItemApprovalPlanSchema } from "../validators/catalog-item-approval-plan-validator";
export type { CatalogItemApprovalPlanInput, CreateCatalogItemApprovalPlanInput, UpdateCatalogItemApprovalPlanInput } from "../validators/catalog-item-approval-plan-validator";