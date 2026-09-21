import { z } from 'zod';

/**
 * Zod schema for BusinessCalendar validation
 */
export const BusinessCalendarSchema = z.object({
  id: z.string().uuid(),
  name1: z.string().min(1, { message: "Name is required" }),
  calendarCode: z.string().min(1, { message: "Calendar Code is required" }),
  statusKey: z.enum(['Active', 'Inactive']),
  timeZone: z.number(),
  weeklyScheduleCode: z.string().min(1, { message: "Weekly Schedule Code is required" }),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new BusinessCalendar (omits system-generated ID)
 */
export const CreateBusinessCalendarSchema = BusinessCalendarSchema.omit({ id: true });

/**
 * Schema for updating an existing BusinessCalendar
 */
export const UpdateBusinessCalendarSchema = BusinessCalendarSchema;

export type BusinessCalendarInput = z.infer<typeof BusinessCalendarSchema>;
export type CreateBusinessCalendarInput = z.infer<typeof CreateBusinessCalendarSchema>;
export type UpdateBusinessCalendarInput = z.infer<typeof UpdateBusinessCalendarSchema>;