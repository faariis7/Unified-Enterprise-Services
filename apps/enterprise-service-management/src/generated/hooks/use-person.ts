import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { PersonService } from "../services/person-service";
import type { Person } from "../models/person-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all Person records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, displayName, active, departmentCode, email, externalObjectID, siteCode, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function usePersonList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["person-list", options],
    queryFn: () => PersonService.getAll(options),
  });
}

/**
 * Retrieve a single Person record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function usePerson(id: string) {
  return useQuery({
    queryKey: ["person", id],
    queryFn: () => PersonService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new Person record.
 * @remarks Form validation: use CreatePersonSchema with zodResolver for type-safe create forms
 */
export function useCreatePerson() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Person, "id">) => PersonService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["person-list"] });
    },
  });
}

/**
 * Update an existing Person record.
 * @remarks Form validation: use UpdatePersonSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdatePerson() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<Person, "id">>;
    }) => PersonService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["person-list"] });
      client.invalidateQueries({ queryKey: ["person", variables.id] });
    },
  });
}

/**
 * Delete a Person record by its unique identifier.
 */
export function useDeletePerson() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => PersonService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["person-list"] });
      client.invalidateQueries({ queryKey: ["person", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const Person_DATA_SOURCE_TYPE = 'InMemory' as const;

export { PersonSchema, CreatePersonSchema, UpdatePersonSchema } from "../validators/person-validator";
export type { PersonInput, CreatePersonInput, UpdatePersonInput } from "../validators/person-validator";