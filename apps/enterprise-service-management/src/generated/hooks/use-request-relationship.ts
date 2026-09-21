import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestRelationshipService } from "../services/request-relationship-service";
import type { RequestRelationship } from "../models/request-relationship-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all RequestRelationship records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, relationshipName, createdAt, relationshipTypeKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRequestRelationshipList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["requestRelationship-list", options],
    queryFn: () => RequestRelationshipService.getAll(options),
  });
}

/**
 * Retrieve a single RequestRelationship record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRequestRelationship(id: string) {
  return useQuery({
    queryKey: ["requestRelationship", id],
    queryFn: () => RequestRelationshipService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new RequestRelationship record.
 * @remarks Form validation: use CreateRequestRelationshipSchema with zodResolver for type-safe create forms
 */
export function useCreateRequestRelationship() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RequestRelationship, "id">) => RequestRelationshipService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["requestRelationship-list"] });
    },
  });
}

/**
 * Update an existing RequestRelationship record.
 * @remarks Form validation: use UpdateRequestRelationshipSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateRequestRelationship() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<RequestRelationship, "id">>;
    }) => RequestRelationshipService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["requestRelationship-list"] });
      client.invalidateQueries({ queryKey: ["requestRelationship", variables.id] });
    },
  });
}

/**
 * Delete a RequestRelationship record by its unique identifier.
 */
export function useDeleteRequestRelationship() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RequestRelationshipService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["requestRelationship-list"] });
      client.invalidateQueries({ queryKey: ["requestRelationship", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const RequestRelationship_DATA_SOURCE_TYPE = 'InMemory' as const;

export { RequestRelationshipSchema, CreateRequestRelationshipSchema, UpdateRequestRelationshipSchema } from "../validators/request-relationship-validator";
export type { RequestRelationshipInput, CreateRequestRelationshipInput, UpdateRequestRelationshipInput } from "../validators/request-relationship-validator";