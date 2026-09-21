import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { RequestAuditEventService } from "../services/request-audit-event-service";
import type { RequestAuditEvent } from "../models/request-audit-event-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all RequestAuditEvent records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, auditEventName, createdAt, details, eventType, isDeleted, occurredAt, updatedAt
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useRequestAuditEventList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["requestAuditEvent-list", options],
    queryFn: () => RequestAuditEventService.getAll(options),
  });
}

/**
 * Retrieve a single RequestAuditEvent record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useRequestAuditEvent(id: string) {
  return useQuery({
    queryKey: ["requestAuditEvent", id],
    queryFn: () => RequestAuditEventService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new RequestAuditEvent record.
 * @remarks Form validation: use CreateRequestAuditEventSchema with zodResolver for type-safe create forms
 */
export function useCreateRequestAuditEvent() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<RequestAuditEvent, "id">) => RequestAuditEventService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["requestAuditEvent-list"] });
    },
  });
}

/**
 * Update an existing RequestAuditEvent record.
 * @remarks Form validation: use UpdateRequestAuditEventSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateRequestAuditEvent() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<RequestAuditEvent, "id">>;
    }) => RequestAuditEventService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["requestAuditEvent-list"] });
      client.invalidateQueries({ queryKey: ["requestAuditEvent", variables.id] });
    },
  });
}

/**
 * Delete a RequestAuditEvent record by its unique identifier.
 */
export function useDeleteRequestAuditEvent() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => RequestAuditEventService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["requestAuditEvent-list"] });
      client.invalidateQueries({ queryKey: ["requestAuditEvent", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const RequestAuditEvent_DATA_SOURCE_TYPE = 'InMemory' as const;

export { RequestAuditEventSchema, CreateRequestAuditEventSchema, UpdateRequestAuditEventSchema } from "../validators/request-audit-event-validator";
export type { RequestAuditEventInput, CreateRequestAuditEventInput, UpdateRequestAuditEventInput } from "../validators/request-audit-event-validator";