import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ServiceGovernanceProfileService } from "../services/service-governance-profile-service";
import type { ServiceGovernanceProfile } from "../models/service-governance-profile-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all ServiceGovernanceProfile records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, profileName, makerCheckerRequired, nextReviewDate, reviewFrequencyDays, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useServiceGovernanceProfileList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["serviceGovernanceProfile-list", options],
    queryFn: () => ServiceGovernanceProfileService.getAll(options),
  });
}

/**
 * Retrieve a single ServiceGovernanceProfile record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useServiceGovernanceProfile(id: string) {
  return useQuery({
    queryKey: ["serviceGovernanceProfile", id],
    queryFn: () => ServiceGovernanceProfileService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new ServiceGovernanceProfile record.
 * @remarks Form validation: use CreateServiceGovernanceProfileSchema with zodResolver for type-safe create forms
 */
export function useCreateServiceGovernanceProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ServiceGovernanceProfile, "id">) => ServiceGovernanceProfileService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["serviceGovernanceProfile-list"] });
    },
  });
}

/**
 * Update an existing ServiceGovernanceProfile record.
 * @remarks Form validation: use UpdateServiceGovernanceProfileSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateServiceGovernanceProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<ServiceGovernanceProfile, "id">>;
    }) => ServiceGovernanceProfileService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["serviceGovernanceProfile-list"] });
      client.invalidateQueries({ queryKey: ["serviceGovernanceProfile", variables.id] });
    },
  });
}

/**
 * Delete a ServiceGovernanceProfile record by its unique identifier.
 */
export function useDeleteServiceGovernanceProfile() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ServiceGovernanceProfileService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["serviceGovernanceProfile-list"] });
      client.invalidateQueries({ queryKey: ["serviceGovernanceProfile", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const ServiceGovernanceProfile_DATA_SOURCE_TYPE = 'InMemory' as const;

export { ServiceGovernanceProfileSchema, CreateServiceGovernanceProfileSchema, UpdateServiceGovernanceProfileSchema } from "../validators/service-governance-profile-validator";
export type { ServiceGovernanceProfileInput, CreateServiceGovernanceProfileInput, UpdateServiceGovernanceProfileInput } from "../validators/service-governance-profile-validator";