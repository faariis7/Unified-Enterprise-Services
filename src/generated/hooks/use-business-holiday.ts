import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BusinessHolidayService } from "../services/business-holiday-service";
import type { BusinessHoliday } from "../models/business-holiday-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all BusinessHoliday records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, name1, holidayDate, statusKey
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useBusinessHolidayList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["businessHoliday-list", options],
    queryFn: () => BusinessHolidayService.getAll(options),
  });
}

/**
 * Retrieve a single BusinessHoliday record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useBusinessHoliday(id: string) {
  return useQuery({
    queryKey: ["businessHoliday", id],
    queryFn: () => BusinessHolidayService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new BusinessHoliday record.
 * @remarks Form validation: use CreateBusinessHolidaySchema with zodResolver for type-safe create forms
 */
export function useCreateBusinessHoliday() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<BusinessHoliday, "id">) => BusinessHolidayService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["businessHoliday-list"] });
    },
  });
}

/**
 * Update an existing BusinessHoliday record.
 * @remarks Form validation: use UpdateBusinessHolidaySchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateBusinessHoliday() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<BusinessHoliday, "id">>;
    }) => BusinessHolidayService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["businessHoliday-list"] });
      client.invalidateQueries({ queryKey: ["businessHoliday", variables.id] });
    },
  });
}

/**
 * Delete a BusinessHoliday record by its unique identifier.
 */
export function useDeleteBusinessHoliday() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => BusinessHolidayService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["businessHoliday-list"] });
      client.invalidateQueries({ queryKey: ["businessHoliday", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const BusinessHoliday_DATA_SOURCE_TYPE = 'InMemory' as const;

export { BusinessHolidaySchema, CreateBusinessHolidaySchema, UpdateBusinessHolidaySchema } from "../validators/business-holiday-validator";
export type { BusinessHolidayInput, CreateBusinessHolidayInput, UpdateBusinessHolidayInput } from "../validators/business-holiday-validator";