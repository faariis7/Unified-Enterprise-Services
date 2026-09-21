import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestChecklistService } from "../services/request-checklist-service";
import type { RequestChecklist } from "../models/request-checklist-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all RequestChecklist records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, checklistName, createdAt, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRequestChecklistList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["requestChecklist-list", options],
    queryFn: () => RequestChecklistService.getAll(options),
  });
}

/**
 * Retrieve a single RequestChecklist record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRequestChecklist(id: string) {
  return useQuery({
    queryKey: ["requestChecklist", id],
    queryFn: () => RequestChecklistService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new RequestChecklist record.
 * @remarks Form validation: use CreateRequestChecklistSchema with zodResolver for type-safe create forms
 */
export function useCreateRequestChecklist() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RequestChecklist, "id">) => RequestChecklistService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["requestChecklist-list"] });
    },
  });
}

/**
 * Update an existing RequestChecklist record.
 * @remarks Form validation: use UpdateRequestChecklistSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateRequestChecklist() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<RequestChecklist, "id">>;
    }) => RequestChecklistService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["requestChecklist-list"] });
      client.invalidateQueries({ queryKey: ["requestChecklist", variables.id] });
    },
  });
}

/**
 * Delete a RequestChecklist record by its unique identifier.
 */
export function useDeleteRequestChecklist() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RequestChecklistService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["requestChecklist-list"] });
      client.invalidateQueries({ queryKey: ["requestChecklist", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const RequestChecklist_DATA_SOURCE_TYPE = 'InMemory' as const;

export { RequestChecklistSchema, CreateRequestChecklistSchema, UpdateRequestChecklistSchema } from "../validators/request-checklist-validator";
export type { RequestChecklistInput, CreateRequestChecklistInput, UpdateRequestChecklistInput } from "../validators/request-checklist-validator";