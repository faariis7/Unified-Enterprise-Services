import { z } from 'zod';

/**
 * Zod schema for SavedReportConfiguration validation
 */
export const SavedReportConfigurationSchema = z.object({
  id: z.string().uuid(),
  configurationName: z.string().min(1, { message: "Configuration Name is required" }),
  aggregationKey: z.enum(['Count', 'Sum', 'Average', 'Minimum', 'Maximum', 'None']),
  customFieldDefinition: z.object({ id: z.string().uuid(), label: z.string() }).optional(),
  dateScopeKey: z.enum(['Last30Days', 'Last90Days', 'ThisYear', 'Custom']),
  dimensionKey: z.string().min(1, { message: "Dimension Key is required" }),
  filtersJSON: z.string().min(1, { message: "Filters JSON is required" }),
  layoutJSON: z.string().min(1, { message: "Layout JSON is required" }),
  measureKey: z.string().min(1, { message: "Measure Key is required" }),
  savedReportDefinition: z.object({ id: z.string().uuid(), name1: z.string() }),
  sortingJSON: z.string().min(1, { message: "Sorting JSON is required" }),
  visualizationKey: z.enum(['Summary', 'Table', 'Bar', 'Line', 'Donut']),
});

/**
 * Schema for creating a new SavedReportConfiguration (omits system-generated ID)
 */
export const CreateSavedReportConfigurationSchema = SavedReportConfigurationSchema.omit({ id: true });

/**
 * Schema for updating an existing SavedReportConfiguration
 */
export const UpdateSavedReportConfigurationSchema = SavedReportConfigurationSchema;

export type SavedReportConfigurationInput = z.infer<typeof SavedReportConfigurationSchema>;
export type CreateSavedReportConfigurationInput = z.infer<typeof CreateSavedReportConfigurationSchema>;
export type UpdateSavedReportConfigurationInput = z.infer<typeof UpdateSavedReportConfigurationSchema>;