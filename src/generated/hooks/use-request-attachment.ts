import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestAttachmentService } from "../services/request-attachment-service";
import type { RequestAttachment } from "../models/request-attachment-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all RequestAttachment records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, fileName, contentType, createdAt, fileSizeBytes, isDeleted, stableFieldKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRequestAttachmentList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["requestAttachment-list", options],
    queryFn: () => RequestAttachmentService.getAll(options),
  });
}

/**
 * Retrieve a single RequestAttachment record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRequestAttachment(id: string) {
  return useQuery({
    queryKey: ["requestAttachment", id],
    queryFn: () => RequestAttachmentService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new RequestAttachment record.
 * @remarks Form validation: use CreateRequestAttachmentSchema with zodResolver for type-safe create forms
 */
export function useCreateRequestAttachment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RequestAttachment, "id">) => RequestAttachmentService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["requestAttachment-list"] });
    },
  });
}

/**
 * Update an existing RequestAttachment record.
 * @remarks Form validation: use UpdateRequestAttachmentSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateRequestAttachment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<RequestAttachment, "id">>;
    }) => RequestAttachmentService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["requestAttachment-list"] });
      client.invalidateQueries({ queryKey: ["requestAttachment", variables.id] });
    },
  });
}

/**
 * Delete a RequestAttachment record by its unique identifier.
 */
export function useDeleteRequestAttachment() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RequestAttachmentService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["requestAttachment-list"] });
      client.invalidateQueries({ queryKey: ["requestAttachment", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const RequestAttachment_DATA_SOURCE_TYPE = 'InMemory' as const;

export { RequestAttachmentSchema, CreateRequestAttachmentSchema, UpdateRequestAttachmentSchema } from "../validators/request-attachment-validator";
export type { RequestAttachmentInput, CreateRequestAttachmentInput, UpdateRequestAttachmentInput } from "../validators/request-attachment-validator";