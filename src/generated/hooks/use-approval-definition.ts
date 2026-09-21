import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ApprovalDefinitionService } from "../services/approval-definition-service";
import type { ApprovalDefinition } from "../models/approval-definition-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all ApprovalDefinition records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, name1, catalogItemCode, completionRuleKey, description, escalationMinutes, executionModeKey, expirationMinutes, reminderMinutes, serviceCode, statusKey, targetReference, targetTypeKey, version
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useApprovalDefinitionList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["approvalDefinition-list", options],
    queryFn: () => ApprovalDefinitionService.getAll(options),
  });
}

/**
 * Retrieve a single ApprovalDefinition record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useApprovalDefinition(id: string) {
  return useQuery({
    queryKey: ["approvalDefinition", id],
    queryFn: () => ApprovalDefinitionService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new ApprovalDefinition record.
 * @remarks Form validation: use CreateApprovalDefinitionSchema with zodResolver for type-safe create forms
 */
export function useCreateApprovalDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ApprovalDefinition, "id">) => ApprovalDefinitionService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["approvalDefinition-list"] });
    },
  });
}

/**
 * Update an existing ApprovalDefinition record.
 * @remarks Form validation: use UpdateApprovalDefinitionSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateApprovalDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<ApprovalDefinition, "id">>;
    }) => ApprovalDefinitionService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["approvalDefinition-list"] });
      client.invalidateQueries({ queryKey: ["approvalDefinition", variables.id] });
    },
  });
}

/**
 * Delete a ApprovalDefinition record by its unique identifier.
 */
export function useDeleteApprovalDefinition() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ApprovalDefinitionService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["approvalDefinition-list"] });
      client.invalidateQueries({ queryKey: ["approvalDefinition", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const ApprovalDefinition_DATA_SOURCE_TYPE = 'InMemory' as const;

export { ApprovalDefinitionSchema, CreateApprovalDefinitionSchema, UpdateApprovalDefinitionSchema } from "../validators/approval-definition-validator";
export type { ApprovalDefinitionInput, CreateApprovalDefinitionInput, UpdateApprovalDefinitionInput } from "../validators/approval-definition-validator";