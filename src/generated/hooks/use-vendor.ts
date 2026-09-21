import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { VendorService } from "../services/vendor-service";
import type { Vendor } from "../models/vendor-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all Vendor records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, vendorName, category, createdAt, primaryContactEmail, primaryContactName, primaryContactPhone, registrationAndTaxReference, riskRatingKey, statusKey, updatedAt, vendorCode
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useVendorList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["vendor-list", options],
    queryFn: () => VendorService.getAll(options),
  });
}

/**
 * Retrieve a single Vendor record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useVendor(id: string) {
  return useQuery({
    queryKey: ["vendor", id],
    queryFn: () => VendorService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new Vendor record.
 * @remarks Form validation: use CreateVendorSchema with zodResolver for type-safe create forms
 */
export function useCreateVendor() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<Vendor, "id">) => VendorService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["vendor-list"] });
    },
  });
}

/**
 * Update an existing Vendor record.
 * @remarks Form validation: use UpdateVendorSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateVendor() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<Vendor, "id">>;
    }) => VendorService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["vendor-list"] });
      client.invalidateQueries({ queryKey: ["vendor", variables.id] });
    },
  });
}

/**
 * Delete a Vendor record by its unique identifier.
 */
export function useDeleteVendor() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => VendorService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["vendor-list"] });
      client.invalidateQueries({ queryKey: ["vendor", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const Vendor_DATA_SOURCE_TYPE = 'InMemory' as const;

export { VendorSchema, CreateVendorSchema, UpdateVendorSchema } from "../validators/vendor-validator";
export type { VendorInput, CreateVendorInput, UpdateVendorInput } from "../validators/vendor-validator";