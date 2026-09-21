import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ServiceCategoryService } from "../services/service-category-service";
import type { ServiceCategory } from "../models/service-category-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all ServiceCategory records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, name1, createdAt, description, icon, isDeleted, sortOrder, statusKey, updatedAt
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useServiceCategoryList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["serviceCategory-list", options],
    queryFn: () => ServiceCategoryService.getAll(options),
  });
}

/**
 * Retrieve a single ServiceCategory record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useServiceCategory(id: string) {
  return useQuery({
    queryKey: ["serviceCategory", id],
    queryFn: () => ServiceCategoryService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new ServiceCategory record.
 * @remarks Form validation: use CreateServiceCategorySchema with zodResolver for type-safe create forms
 */
export function useCreateServiceCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ServiceCategory, "id">) => ServiceCategoryService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["serviceCategory-list"] });
    },
  });
}

/**
 * Update an existing ServiceCategory record.
 * @remarks Form validation: use UpdateServiceCategorySchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateServiceCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<ServiceCategory, "id">>;
    }) => ServiceCategoryService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["serviceCategory-list"] });
      client.invalidateQueries({ queryKey: ["serviceCategory", variables.id] });
    },
  });
}

/**
 * Delete a ServiceCategory record by its unique identifier.
 */
export function useDeleteServiceCategory() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ServiceCategoryService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["serviceCategory-list"] });
      client.invalidateQueries({ queryKey: ["serviceCategory", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const ServiceCategory_DATA_SOURCE_TYPE = 'InMemory' as const;

export { ServiceCategorySchema, CreateServiceCategorySchema, UpdateServiceCategorySchema } from "../validators/service-category-validator";
export type { ServiceCategoryInput, CreateServiceCategoryInput, UpdateServiceCategoryInput } from "../validators/service-category-validator";