import { z } from 'zod';

/**
 * Zod schema for DashboardWidget validation
 */
export const DashboardWidgetSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, { message: "Title is required" }),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Created At is required" }),
  dashboardDefinition: z.object({ id: z.string().uuid(), name1: z.string() }),
  isDeleted: z.boolean(),
  savedReportDefinition: z.object({ id: z.string().uuid(), name1: z.string() }),
  sortOrder: z.number().int(),
  widthKey: z.enum(['Full', 'Half', 'Third']),
});

/**
 * Schema for creating a new DashboardWidget (omits system-generated ID)
 */
export const CreateDashboardWidgetSchema = DashboardWidgetSchema.omit({ id: true });

/**
 * Schema for updating an existing DashboardWidget
 */
export const UpdateDashboardWidgetSchema = DashboardWidgetSchema;

export type DashboardWidgetInput = z.infer<typeof DashboardWidgetSchema>;
export type CreateDashboardWidgetInput = z.infer<typeof CreateDashboardWidgetSchema>;
export type UpdateDashboardWidgetInput = z.infer<typeof UpdateDashboardWidgetSchema>;