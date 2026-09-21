import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestNumberSequenceService } from "../services/request-number-sequence-service";
import type { RequestNumberSequence } from "../models/request-number-sequence-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all RequestNumberSequence records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, sequenceName, calendarYear, nextNumber, updatedAt, versionNumber
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRequestNumberSequenceList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["requestNumberSequence-list", options],
    queryFn: () => RequestNumberSequenceService.getAll(options),
  });
}

/**
 * Retrieve a single RequestNumberSequence record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRequestNumberSequence(id: string) {
  return useQuery({
    queryKey: ["requestNumberSequence", id],
    queryFn: () => RequestNumberSequenceService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new RequestNumberSequence record.
 * @remarks Form validation: use CreateRequestNumberSequenceSchema with zodResolver for type-safe create forms
 */
export function useCreateRequestNumberSequence() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RequestNumberSequence, "id">) => RequestNumberSequenceService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["requestNumberSequence-list"] });
    },
  });
}

/**
 * Update an existing RequestNumberSequence record.
 * @remarks Form validation: use UpdateRequestNumberSequenceSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateRequestNumberSequence() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<RequestNumberSequence, "id">>;
    }) => RequestNumberSequenceService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["requestNumberSequence-list"] });
      client.invalidateQueries({ queryKey: ["requestNumberSequence", variables.id] });
    },
  });
}

/**
 * Delete a RequestNumberSequence record by its unique identifier.
 */
export function useDeleteRequestNumberSequence() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RequestNumberSequenceService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["requestNumberSequence-list"] });
      client.invalidateQueries({ queryKey: ["requestNumberSequence", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const RequestNumberSequence_DATA_SOURCE_TYPE = 'InMemory' as const;

export { RequestNumberSequenceSchema, CreateRequestNumberSequenceSchema, UpdateRequestNumberSequenceSchema } from "../validators/request-number-sequence-validator";
export type { RequestNumberSequenceInput, CreateRequestNumberSequenceInput, UpdateRequestNumberSequenceInput } from "../validators/request-number-sequence-validator";