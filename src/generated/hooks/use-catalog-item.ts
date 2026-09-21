import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CatalogItemService } from "../services/catalog-item-service";
import type { CatalogItem } from "../models/catalog-item-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all CatalogItem records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, itemName, approvalRequired, defaultPriorityKey, initialTaskTitle, itemCode, requesterEligible, requestTypeCode, serviceTargetHours, shortDescription, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useCatalogItemList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["catalogItem-list", options],
    queryFn: () => CatalogItemService.getAll(options),
  });
}

/**
 * Retrieve a single CatalogItem record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useCatalogItem(id: string) {
  return useQuery({
    queryKey: ["catalogItem", id],
    queryFn: () => CatalogItemService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new CatalogItem record.
 * @remarks Form validation: use CreateCatalogItemSchema with zodResolver for type-safe create forms
 */
export function useCreateCatalogItem() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<CatalogItem, "id">) => CatalogItemService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["catalogItem-list"] });
    },
  });
}

/**
 * Update an existing CatalogItem record.
 * @remarks Form validation: use UpdateCatalogItemSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateCatalogItem() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<CatalogItem, "id">>;
    }) => CatalogItemService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["catalogItem-list"] });
      client.invalidateQueries({ queryKey: ["catalogItem", variables.id] });
    },
  });
}

/**
 * Delete a CatalogItem record by its unique identifier.
 */
export function useDeleteCatalogItem() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => CatalogItemService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["catalogItem-list"] });
      client.invalidateQueries({ queryKey: ["catalogItem", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const CatalogItem_DATA_SOURCE_TYPE = 'InMemory' as const;

export { CatalogItemSchema, CreateCatalogItemSchema, UpdateCatalogItemSchema } from "../validators/catalog-item-validator";
export type { CatalogItemInput, CreateCatalogItemInput, UpdateCatalogItemInput } from "../validators/catalog-item-validator";