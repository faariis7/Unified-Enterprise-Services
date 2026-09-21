import { z } from 'zod';

/**
 * Zod schema for BusinessHoliday validation
 */
export const BusinessHolidaySchema = z.object({
  id: z.string().uuid(),
  name1: z.string().min(1, { message: "Name is required" }),
  businessCalendar: z.object({ id: z.string().uuid(), name1: z.string() }),
  holidayDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format").min(1, { message: "Holiday Date is required" }),
  statusKey: z.enum(['Active', 'Inactive']),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new BusinessHoliday (omits system-generated ID)
 */
export const CreateBusinessHolidaySchema = BusinessHolidaySchema.omit({ id: true });

/**
 * Schema for updating an existing BusinessHoliday
 */
export const UpdateBusinessHolidaySchema = BusinessHolidaySchema;

export type BusinessHolidayInput = z.infer<typeof BusinessHolidaySchema>;
export type CreateBusinessHolidayInput = z.infer<typeof CreateBusinessHolidaySchema>;
export type UpdateBusinessHolidayInput = z.infer<typeof UpdateBusinessHolidaySchema>;