import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MetadataRecordService } from "../services/metadata-record-service";
import type { MetadataRecord } from "../models/metadata-record-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all MetadataRecord records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, recordName, active, configurationJSON, configurationKey, createdAt, deletedAt, entityRecordID, entityTypeKey, isDeleted, sortOrder, updatedAt
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useMetadataRecordList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["metadataRecord-list", options],
    queryFn: () => MetadataRecordService.getAll(options),
  });
}

/**
 * Retrieve a single MetadataRecord record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useMetadataRecord(id: string) {
  return useQuery({
    queryKey: ["metadataRecord", id],
    queryFn: () => MetadataRecordService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new MetadataRecord record.
 * @remarks Form validation: use CreateMetadataRecordSchema with zodResolver for type-safe create forms
 */
export function useCreateMetadataRecord() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<MetadataRecord, "id">) => MetadataRecordService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["metadataRecord-list"] });
    },
  });
}

/**
 * Update an existing MetadataRecord record.
 * @remarks Form validation: use UpdateMetadataRecordSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateMetadataRecord() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<MetadataRecord, "id">>;
    }) => MetadataRecordService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["metadataRecord-list"] });
      client.invalidateQueries({ queryKey: ["metadataRecord", variables.id] });
    },
  });
}

/**
 * Delete a MetadataRecord record by its unique identifier.
 */
export function useDeleteMetadataRecord() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => MetadataRecordService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["metadataRecord-list"] });
      client.invalidateQueries({ queryKey: ["metadataRecord", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const MetadataRecord_DATA_SOURCE_TYPE = 'InMemory' as const;

export { MetadataRecordSchema, CreateMetadataRecordSchema, UpdateMetadataRecordSchema } from "../validators/metadata-record-validator";
export type { MetadataRecordInput, CreateMetadataRecordInput, UpdateMetadataRecordInput } from "../validators/metadata-record-validator";