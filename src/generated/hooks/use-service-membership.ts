import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ServiceMembershipService } from "../services/service-membership-service";
import type { ServiceMembership } from "../models/service-membership-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all ServiceMembership records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, membershipLabel, createdAt, endDate, roleKey, serviceCode, startDate, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useServiceMembershipList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["serviceMembership-list", options],
    queryFn: () => ServiceMembershipService.getAll(options),
  });
}

/**
 * Retrieve a single ServiceMembership record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useServiceMembership(id: string) {
  return useQuery({
    queryKey: ["serviceMembership", id],
    queryFn: () => ServiceMembershipService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new ServiceMembership record.
 * @remarks Form validation: use CreateServiceMembershipSchema with zodResolver for type-safe create forms
 */
export function useCreateServiceMembership() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<ServiceMembership, "id">) => ServiceMembershipService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["serviceMembership-list"] });
    },
  });
}

/**
 * Update an existing ServiceMembership record.
 * @remarks Form validation: use UpdateServiceMembershipSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateServiceMembership() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<ServiceMembership, "id">>;
    }) => ServiceMembershipService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["serviceMembership-list"] });
      client.invalidateQueries({ queryKey: ["serviceMembership", variables.id] });
    },
  });
}

/**
 * Delete a ServiceMembership record by its unique identifier.
 */
export function useDeleteServiceMembership() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => ServiceMembershipService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["serviceMembership-list"] });
      client.invalidateQueries({ queryKey: ["serviceMembership", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const ServiceMembership_DATA_SOURCE_TYPE = 'InMemory' as const;

export { ServiceMembershipSchema, CreateServiceMembershipSchema, UpdateServiceMembershipSchema } from "../validators/service-membership-validator";
export type { ServiceMembershipInput, CreateServiceMembershipInput, UpdateServiceMembershipInput } from "../validators/service-membership-validator";