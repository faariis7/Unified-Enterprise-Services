import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EmailIntakeMessageService } from "../services/email-intake-message-service";
import type { EmailIntakeMessage } from "../models/email-intake-message-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all EmailIntakeMessage records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, messageName, attemptCount, bodyPreview, conversationID, hasAttachments, internetMessageID, lastError, microsoftMessageID, outcomeDetail, processedAt, processingStatusKey, receivedAt, senderEmail, senderName, subject
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useEmailIntakeMessageList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["emailIntakeMessage-list", options],
    queryFn: () => EmailIntakeMessageService.getAll(options),
  });
}

/**
 * Retrieve a single EmailIntakeMessage record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useEmailIntakeMessage(id: string) {
  return useQuery({
    queryKey: ["emailIntakeMessage", id],
    queryFn: () => EmailIntakeMessageService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new EmailIntakeMessage record.
 * @remarks Form validation: use CreateEmailIntakeMessageSchema with zodResolver for type-safe create forms
 */
export function useCreateEmailIntakeMessage() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<EmailIntakeMessage, "id">) => EmailIntakeMessageService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["emailIntakeMessage-list"] });
    },
  });
}

/**
 * Update an existing EmailIntakeMessage record.
 * @remarks Form validation: use UpdateEmailIntakeMessageSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateEmailIntakeMessage() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<EmailIntakeMessage, "id">>;
    }) => EmailIntakeMessageService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["emailIntakeMessage-list"] });
      client.invalidateQueries({ queryKey: ["emailIntakeMessage", variables.id] });
    },
  });
}

/**
 * Delete a EmailIntakeMessage record by its unique identifier.
 */
export function useDeleteEmailIntakeMessage() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => EmailIntakeMessageService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["emailIntakeMessage-list"] });
      client.invalidateQueries({ queryKey: ["emailIntakeMessage", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const EmailIntakeMessage_DATA_SOURCE_TYPE = 'InMemory' as const;

export { EmailIntakeMessageSchema, CreateEmailIntakeMessageSchema, UpdateEmailIntakeMessageSchema } from "../validators/email-intake-message-validator";
export type { EmailIntakeMessageInput, CreateEmailIntakeMessageInput, UpdateEmailIntakeMessageInput } from "../validators/email-intake-message-validator";