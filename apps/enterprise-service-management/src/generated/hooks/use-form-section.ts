import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { FormSectionService } from "../services/form-section-service";
import type { FormSection } from "../models/form-section-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all FormSection records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, title, createdAt, description, instructions, isDeleted, sortOrder, updatedAt
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useFormSectionList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["formSection-list", options],
    queryFn: () => FormSectionService.getAll(options),
  });
}

/**
 * Retrieve a single FormSection record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useFormSection(id: string) {
  return useQuery({
    queryKey: ["formSection", id],
    queryFn: () => FormSectionService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new FormSection record.
 * @remarks Form validation: use CreateFormSectionSchema with zodResolver for type-safe create forms
 */
export function useCreateFormSection() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<FormSection, "id">) => FormSectionService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["formSection-list"] });
    },
  });
}

/**
 * Update an existing FormSection record.
 * @remarks Form validation: use UpdateFormSectionSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateFormSection() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<FormSection, "id">>;
    }) => FormSectionService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["formSection-list"] });
      client.invalidateQueries({ queryKey: ["formSection", variables.id] });
    },
  });
}

/**
 * Delete a FormSection record by its unique identifier.
 */
export function useDeleteFormSection() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => FormSectionService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["formSection-list"] });
      client.invalidateQueries({ queryKey: ["formSection", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const FormSection_DATA_SOURCE_TYPE = 'InMemory' as const;

export { FormSectionSchema, CreateFormSectionSchema, UpdateFormSectionSchema } from "../validators/form-section-validator";
export type { FormSectionInput, CreateFormSectionInput, UpdateFormSectionInput } from "../validators/form-section-validator";