import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CatalogItemAudienceService } from "../services/catalog-item-audience-service";
import type { CatalogItemAudience } from "../models/catalog-item-audience-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all CatalogItemAudience records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, audienceName, audienceReference, audienceTypeKey, isEligible, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useCatalogItemAudienceList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["catalogItemAudience-list", options],
    queryFn: () => CatalogItemAudienceService.getAll(options),
  });
}

/**
 * Retrieve a single CatalogItemAudience record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useCatalogItemAudience(id: string) {
  return useQuery({
    queryKey: ["catalogItemAudience", id],
    queryFn: () => CatalogItemAudienceService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new CatalogItemAudience record.
 * @remarks Form validation: use CreateCatalogItemAudienceSchema with zodResolver for type-safe create forms
 */
export function useCreateCatalogItemAudience() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<CatalogItemAudience, "id">) => CatalogItemAudienceService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["catalogItemAudience-list"] });
    },
  });
}

/**
 * Update an existing CatalogItemAudience record.
 * @remarks Form validation: use UpdateCatalogItemAudienceSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateCatalogItemAudience() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<CatalogItemAudience, "id">>;
    }) => CatalogItemAudienceService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["catalogItemAudience-list"] });
      client.invalidateQueries({ queryKey: ["catalogItemAudience", variables.id] });
    },
  });
}

/**
 * Delete a CatalogItemAudience record by its unique identifier.
 */
export function useDeleteCatalogItemAudience() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => CatalogItemAudienceService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["catalogItemAudience-list"] });
      client.invalidateQueries({ queryKey: ["catalogItemAudience", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const CatalogItemAudience_DATA_SOURCE_TYPE = 'InMemory' as const;

export { CatalogItemAudienceSchema, CreateCatalogItemAudienceSchema, UpdateCatalogItemAudienceSchema } from "../validators/catalog-item-audience-validator";
export type { CatalogItemAudienceInput, CreateCatalogItemAudienceInput, UpdateCatalogItemAudienceInput } from "../validators/catalog-item-audience-validator";