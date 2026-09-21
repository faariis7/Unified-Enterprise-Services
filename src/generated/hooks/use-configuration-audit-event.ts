import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ConfigurationAuditEventService } from "../services/configuration-audit-event-service";
import type { ConfigurationAuditEvent } from "../models/configuration-audit-event-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all ConfigurationAuditEvent records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, configurationAuditEventName, actionKey, newValue, occurredAt, previousValue, scopeKey, settingKey, sourceKey, targetRecordID
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useConfigurationAuditEventList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["configurationAuditEvent-list", options],
    queryFn: () => ConfigurationAuditEventService.getAll(options),
  });
}

/**
 * Retrieve a single ConfigurationAuditEvent record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useConfigurationAuditEvent(id: string) {
  return useQuery({
    queryKey: ["configurationAuditEvent", id],
    queryFn: () => ConfigurationAuditEventService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new ConfigurationAuditEvent record.
 * @remarks Form validation: use CreateConfigurationAuditEventSchema with zodResolver for type-safe create forms
 */
export function useCreateConfigurationAuditEvent() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ConfigurationAuditEvent, "id">) => ConfigurationAuditEventService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["configurationAuditEvent-list"] });
    },
  });
}

/**
 * Update an existing ConfigurationAuditEvent record.
 * @remarks Form validation: use UpdateConfigurationAuditEventSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateConfigurationAuditEvent() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<ConfigurationAuditEvent, "id">>;
    }) => ConfigurationAuditEventService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["configurationAuditEvent-list"] });
      client.invalidateQueries({ queryKey: ["configurationAuditEvent", variables.id] });
    },
  });
}

/**
 * Delete a ConfigurationAuditEvent record by its unique identifier.
 */
export function useDeleteConfigurationAuditEvent() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ConfigurationAuditEventService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["configurationAuditEvent-list"] });
      client.invalidateQueries({ queryKey: ["configurationAuditEvent", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const ConfigurationAuditEvent_DATA_SOURCE_TYPE = 'InMemory' as const;

export { ConfigurationAuditEventSchema, CreateConfigurationAuditEventSchema, UpdateConfigurationAuditEventSchema } from "../validators/configuration-audit-event-validator";
export type { ConfigurationAuditEventInput, CreateConfigurationAuditEventInput, UpdateConfigurationAuditEventInput } from "../validators/configuration-audit-event-validator";