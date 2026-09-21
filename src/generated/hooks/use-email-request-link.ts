import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { EmailRequestLinkService } from "../services/email-request-link-service";
import type { EmailRequestLink } from "../models/email-request-link-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all EmailRequestLink records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, linkName, conversationID, internetMessageID, linkedAt, relationshipTypeKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useEmailRequestLinkList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["emailRequestLink-list", options],
    queryFn: () => EmailRequestLinkService.getAll(options),
  });
}

/**
 * Retrieve a single EmailRequestLink record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useEmailRequestLink(id: string) {
  return useQuery({
    queryKey: ["emailRequestLink", id],
    queryFn: () => EmailRequestLinkService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new EmailRequestLink record.
 * @remarks Form validation: use CreateEmailRequestLinkSchema with zodResolver for type-safe create forms
 */
export function useCreateEmailRequestLink() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<EmailRequestLink, "id">) => EmailRequestLinkService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["emailRequestLink-list"] });
    },
  });
}

/**
 * Update an existing EmailRequestLink record.
 * @remarks Form validation: use UpdateEmailRequestLinkSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateEmailRequestLink() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<EmailRequestLink, "id">>;
    }) => EmailRequestLinkService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["emailRequestLink-list"] });
      client.invalidateQueries({ queryKey: ["emailRequestLink", variables.id] });
    },
  });
}

/**
 * Delete a EmailRequestLink record by its unique identifier.
 */
export function useDeleteEmailRequestLink() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => EmailRequestLinkService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["emailRequestLink-list"] });
      client.invalidateQueries({ queryKey: ["emailRequestLink", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const EmailRequestLink_DATA_SOURCE_TYPE = 'InMemory' as const;

export { EmailRequestLinkSchema, CreateEmailRequestLinkSchema, UpdateEmailRequestLinkSchema } from "../validators/email-request-link-validator";
export type { EmailRequestLinkInput, CreateEmailRequestLinkInput, UpdateEmailRequestLinkInput } from "../validators/email-request-link-validator";