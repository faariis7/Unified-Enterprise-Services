import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestChecklistItemService } from "../services/request-checklist-item-service";
import type { RequestChecklistItem } from "../models/request-checklist-item-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all RequestChecklistItem records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, itemName, completed, completedAt
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRequestChecklistItemList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["requestChecklistItem-list", options],
    queryFn: () => RequestChecklistItemService.getAll(options),
  });
}

/**
 * Retrieve a single RequestChecklistItem record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRequestChecklistItem(id: string) {
  return useQuery({
    queryKey: ["requestChecklistItem", id],
    queryFn: () => RequestChecklistItemService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new RequestChecklistItem record.
 * @remarks Form validation: use CreateRequestChecklistItemSchema with zodResolver for type-safe create forms
 */
export function useCreateRequestChecklistItem() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RequestChecklistItem, "id">) => RequestChecklistItemService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["requestChecklistItem-list"] });
    },
  });
}

/**
 * Update an existing RequestChecklistItem record.
 * @remarks Form validation: use UpdateRequestChecklistItemSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateRequestChecklistItem() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<RequestChecklistItem, "id">>;
    }) => RequestChecklistItemService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["requestChecklistItem-list"] });
      client.invalidateQueries({ queryKey: ["requestChecklistItem", variables.id] });
    },
  });
}

/**
 * Delete a RequestChecklistItem record by its unique identifier.
 */
export function useDeleteRequestChecklistItem() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RequestChecklistItemService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["requestChecklistItem-list"] });
      client.invalidateQueries({ queryKey: ["requestChecklistItem", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const RequestChecklistItem_DATA_SOURCE_TYPE = 'InMemory' as const;

export { RequestChecklistItemSchema, CreateRequestChecklistItemSchema, UpdateRequestChecklistItemSchema } from "../validators/request-checklist-item-validator";
export type { RequestChecklistItemInput, CreateRequestChecklistItemInput, UpdateRequestChecklistItemInput } from "../validators/request-checklist-item-validator";