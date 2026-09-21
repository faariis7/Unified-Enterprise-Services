import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestService } from "../services/request-service";
import type { Request } from "../models/request-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all Request records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, requestNumber, assignedAt, assignmentGroupCode, cancelledAt, catalogItemCode, closedAt, confidentialityLevelId, createdAt, currentStageId, departmentCode, description, firstRespondedAt, formDefinitionId, impactId, originEmailConversationID, originInternetMessageID, priorityKey, reopenedAt, requestSourceKey, requestTypeId, resolvedAt, serviceCode, siteCode, sourceId, statusKey, title, updatedAt, urgencyId, versionNumber
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRequestList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["request-list", options],
    queryFn: () => RequestService.getAll(options),
  });
}

/**
 * Retrieve a single Request record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRequest(id: string) {
  return useQuery({
    queryKey: ["request", id],
    queryFn: () => RequestService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new Request record.
 * @remarks Form validation: use CreateRequestSchema with zodResolver for type-safe create forms
 */
export function useCreateRequest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Request, "id">) => RequestService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["request-list"] });
    },
  });
}

/**
 * Update an existing Request record.
 * @remarks Form validation: use UpdateRequestSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateRequest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<Request, "id">>;
    }) => RequestService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["request-list"] });
      client.invalidateQueries({ queryKey: ["request", variables.id] });
    },
  });
}

/**
 * Delete a Request record by its unique identifier.
 */
export function useDeleteRequest() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RequestService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["request-list"] });
      client.invalidateQueries({ queryKey: ["request", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const Request_DATA_SOURCE_TYPE = 'InMemory' as const;

export { RequestSchema, CreateRequestSchema, UpdateRequestSchema } from "../validators/request-validator";
export type { RequestInput, CreateRequestInput, UpdateRequestInput } from "../validators/request-validator";