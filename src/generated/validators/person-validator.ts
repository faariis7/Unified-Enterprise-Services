import { z } from 'zod';

/**
 * Zod schema for Person validation
 */
export const PersonSchema = z.object({
  id: z.string().uuid(),
  displayName: z.string().min(1, { message: "Display Name is required" }),
  active: z.boolean(),
  departmentCode: z.string().min(1, { message: "Department Code is required" }),
  email: z.string().email().min(1, { message: "Email is required" }),
  externalObjectID: z.string().min(1, { message: "External Object ID is required" }),
  siteCode: z.string().min(1, { message: "Site Code is required" }),
  statusKey: z.enum(['Active', 'Inactive', 'Suspended']),
});

/**
 * Schema for creating a new Person (omits system-generated ID)
 */
export const CreatePersonSchema = PersonSchema.omit({ id: true });

/**
 * Schema for updating an existing Person
 */
export const UpdatePersonSchema = PersonSchema;

export type PersonInput = z.infer<typeof PersonSchema>;
export type CreatePersonInput = z.infer<typeof CreatePersonSchema>;
export type UpdatePersonInput = z.infer<typeof UpdatePersonSchema>;