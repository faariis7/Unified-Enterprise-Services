import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CatalogItemFormAssignmentService } from "../services/catalog-item-form-assignment-service";
import type { CatalogItemFormAssignment } from "../models/catalog-item-form-assignment-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all CatalogItemFormAssignment records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, assignmentName, effectiveFrom, effectiveTo, isDefault, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useCatalogItemFormAssignmentList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["catalogItemFormAssignment-list", options],
    queryFn: () => CatalogItemFormAssignmentService.getAll(options),
  });
}

/**
 * Retrieve a single CatalogItemFormAssignment record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useCatalogItemFormAssignment(id: string) {
  return useQuery({
    queryKey: ["catalogItemFormAssignment", id],
    queryFn: () => CatalogItemFormAssignmentService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new CatalogItemFormAssignment record.
 * @remarks Form validation: use CreateCatalogItemFormAssignmentSchema with zodResolver for type-safe create forms
 */
export function useCreateCatalogItemFormAssignment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<CatalogItemFormAssignment, "id">) => CatalogItemFormAssignmentService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["catalogItemFormAssignment-list"] });
    },
  });
}

/**
 * Update an existing CatalogItemFormAssignment record.
 * @remarks Form validation: use UpdateCatalogItemFormAssignmentSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateCatalogItemFormAssignment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<CatalogItemFormAssignment, "id">>;
    }) => CatalogItemFormAssignmentService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["catalogItemFormAssignment-list"] });
      client.invalidateQueries({ queryKey: ["catalogItemFormAssignment", variables.id] });
    },
  });
}

/**
 * Delete a CatalogItemFormAssignment record by its unique identifier.
 */
export function useDeleteCatalogItemFormAssignment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => CatalogItemFormAssignmentService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["catalogItemFormAssignment-list"] });
      client.invalidateQueries({ queryKey: ["catalogItemFormAssignment", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const CatalogItemFormAssignment_DATA_SOURCE_TYPE = 'InMemory' as const;

export { CatalogItemFormAssignmentSchema, CreateCatalogItemFormAssignmentSchema, UpdateCatalogItemFormAssignmentSchema } from "../validators/catalog-item-form-assignment-validator";
export type { CatalogItemFormAssignmentInput, CreateCatalogItemFormAssignmentInput, UpdateCatalogItemFormAssignmentInput } from "../validators/catalog-item-form-assignment-validator";