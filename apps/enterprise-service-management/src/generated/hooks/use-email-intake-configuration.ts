import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EmailIntakeConfigurationService } from "../services/email-intake-configuration-service";
import type { EmailIntakeConfiguration } from "../models/email-intake-configuration-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all EmailIntakeConfiguration records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, configurationName, enabled, folderName, lastSyncAt, mailboxAddress, markAsRead, unknownSenderBehaviorKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useEmailIntakeConfigurationList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["emailIntakeConfiguration-list", options],
    queryFn: () => EmailIntakeConfigurationService.getAll(options),
  });
}

/**
 * Retrieve a single EmailIntakeConfiguration record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useEmailIntakeConfiguration(id: string) {
  return useQuery({
    queryKey: ["emailIntakeConfiguration", id],
    queryFn: () => EmailIntakeConfigurationService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new EmailIntakeConfiguration record.
 * @remarks Form validation: use CreateEmailIntakeConfigurationSchema with zodResolver for type-safe create forms
 */
export function useCreateEmailIntakeConfiguration() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<EmailIntakeConfiguration, "id">) => EmailIntakeConfigurationService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["emailIntakeConfiguration-list"] });
    },
  });
}

/**
 * Update an existing EmailIntakeConfiguration record.
 * @remarks Form validation: use UpdateEmailIntakeConfigurationSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateEmailIntakeConfiguration() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<EmailIntakeConfiguration, "id">>;
    }) => EmailIntakeConfigurationService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["emailIntakeConfiguration-list"] });
      client.invalidateQueries({ queryKey: ["emailIntakeConfiguration", variables.id] });
    },
  });
}

/**
 * Delete a EmailIntakeConfiguration record by its unique identifier.
 */
export function useDeleteEmailIntakeConfiguration() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => EmailIntakeConfigurationService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["emailIntakeConfiguration-list"] });
      client.invalidateQueries({ queryKey: ["emailIntakeConfiguration", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const EmailIntakeConfiguration_DATA_SOURCE_TYPE = 'InMemory' as const;

export { EmailIntakeConfigurationSchema, CreateEmailIntakeConfigurationSchema, UpdateEmailIntakeConfigurationSchema } from "../validators/email-intake-configuration-validator";
export type { EmailIntakeConfigurationInput, CreateEmailIntakeConfigurationInput, UpdateEmailIntakeConfigurationInput } from "../validators/email-intake-configuration-validator";