import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EmailIntakeProcessingEventService } from "../services/email-intake-processing-event-service";
import type { EmailIntakeProcessingEvent } from "../models/email-intake-processing-event-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all EmailIntakeProcessingEvent records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, eventName, detail, eventTypeKey, occurredAt
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useEmailIntakeProcessingEventList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["emailIntakeProcessingEvent-list", options],
    queryFn: () => EmailIntakeProcessingEventService.getAll(options),
  });
}

/**
 * Retrieve a single EmailIntakeProcessingEvent record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useEmailIntakeProcessingEvent(id: string) {
  return useQuery({
    queryKey: ["emailIntakeProcessingEvent", id],
    queryFn: () => EmailIntakeProcessingEventService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new EmailIntakeProcessingEvent record.
 * @remarks Form validation: use CreateEmailIntakeProcessingEventSchema with zodResolver for type-safe create forms
 */
export function useCreateEmailIntakeProcessingEvent() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<EmailIntakeProcessingEvent, "id">) => EmailIntakeProcessingEventService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["emailIntakeProcessingEvent-list"] });
    },
  });
}

/**
 * Update an existing EmailIntakeProcessingEvent record.
 * @remarks Form validation: use UpdateEmailIntakeProcessingEventSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateEmailIntakeProcessingEvent() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<EmailIntakeProcessingEvent, "id">>;
    }) => EmailIntakeProcessingEventService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["emailIntakeProcessingEvent-list"] });
      client.invalidateQueries({ queryKey: ["emailIntakeProcessingEvent", variables.id] });
    },
  });
}

/**
 * Delete a EmailIntakeProcessingEvent record by its unique identifier.
 */
export function useDeleteEmailIntakeProcessingEvent() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => EmailIntakeProcessingEventService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["emailIntakeProcessingEvent-list"] });
      client.invalidateQueries({ queryKey: ["emailIntakeProcessingEvent", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const EmailIntakeProcessingEvent_DATA_SOURCE_TYPE = 'InMemory' as const;

export { EmailIntakeProcessingEventSchema, CreateEmailIntakeProcessingEventSchema, UpdateEmailIntakeProcessingEventSchema } from "../validators/email-intake-processing-event-validator";
export type { EmailIntakeProcessingEventInput, CreateEmailIntakeProcessingEventInput, UpdateEmailIntakeProcessingEventInput } from "../validators/email-intake-processing-event-validator";