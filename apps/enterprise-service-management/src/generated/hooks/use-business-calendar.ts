import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { BusinessCalendarService } from "../services/business-calendar-service";
import type { BusinessCalendar } from "../models/business-calendar-model";
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Retrieve all BusinessCalendar records with optional filtering and sorting.
 * @param options Optional filtering and sorting options
 *   Available properties for sorting: id, name1, calendarCode, statusKey, timeZone, weeklyScheduleCode
 *   Filtering supports OData syntax, e.g., "status eq 'active'"
 */
export function useBusinessCalendarList(options?: IOperationOptions) {
  return useQuery({
    queryKey: ["businessCalendar-list", options],
    queryFn: () => BusinessCalendarService.getAll(options),
  });
}

/**
 * Retrieve a single BusinessCalendar record by its unique identifier.
 * @param id The id of the record (must be a valid UUID)
 */
export function useBusinessCalendar(id: string) {
  return useQuery({
    queryKey: ["businessCalendar", id],
    queryFn: () => BusinessCalendarService.get(id),
    enabled: !!id && UUID_REGEX.test(id),
  });
}

/**
 * Create a new BusinessCalendar record.
 * @remarks Form validation: use CreateBusinessCalendarSchema with zodResolver for type-safe create forms
 */
export function useCreateBusinessCalendar() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<BusinessCalendar, "id">) => BusinessCalendarService.create(data),
    onSuccess: () => {
      client.invalidateQueries({ queryKey: ["businessCalendar-list"] });
    },
  });
}

/**
 * Update an existing BusinessCalendar record.
 * @remarks Form validation: use UpdateBusinessCalendarSchema.partial().omit({ id: true }) with zodResolver for edit forms (matches changedFields input)
 */
export function useUpdateBusinessCalendar() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      changedFields,
    }: {
      id: string;
      changedFields: Partial<Omit<BusinessCalendar, "id">>;
    }) => BusinessCalendarService.update(id, changedFields),
    onSuccess: (_data, variables) => {
      client.invalidateQueries({ queryKey: ["businessCalendar-list"] });
      client.invalidateQueries({ queryKey: ["businessCalendar", variables.id] });
    },
  });
}

/**
 * Delete a BusinessCalendar record by its unique identifier.
 */
export function useDeleteBusinessCalendar() {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => BusinessCalendarService.delete(id),
    onSuccess: (_data, id) => {
      client.invalidateQueries({ queryKey: ["businessCalendar-list"] });
      client.invalidateQueries({ queryKey: ["businessCalendar", id] });
    },
  });
}

/** Data source type for this table — drives InMemoryDataBanner visibility. */
export const BusinessCalendar_DATA_SOURCE_TYPE = 'InMemory' as const;

export { BusinessCalendarSchema, CreateBusinessCalendarSchema, UpdateBusinessCalendarSchema } from "../validators/business-calendar-validator";
export type { BusinessCalendarInput, CreateBusinessCalendarInput, UpdateBusinessCalendarInput } from "../validators/business-calendar-validator";