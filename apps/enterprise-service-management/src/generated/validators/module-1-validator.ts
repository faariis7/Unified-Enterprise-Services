import { z } from 'zod';

/**
 * Zod schema for Module_1 validation
 */
export const Module_1Schema = z.object({
  id: z.string().uuid(),
  moduleName: z.string().min(1, { message: "ModuleName is required" }),
  description: z.string().min(1, { message: "Description is required" }),
  globalStatusKey: z.enum(['Active', 'Inactive']),
  icon: z.string().min(1, { message: "Icon is required" }),
  isCoreModule: z.boolean(),
  moduleCode: z.string().min(1, { message: "ModuleCode is required" }),
  requiredPermission: z.string().optional(),
  route: z.string().min(1, { message: "Route is required" }),
  sortOrder: z.number().int(),
});

/**
 * Schema for creating a new Module_1 (omits system-generated ID)
 */
export const CreateModule_1Schema = Module_1Schema.omit({ id: true });

/**
 * Schema for updating an existing Module_1
 */
export const UpdateModule_1Schema = Module_1Schema;

export type Module_1Input = z.infer<typeof Module_1Schema>;
export type CreateModule_1Input = z.infer<typeof CreateModule_1Schema>;
export type UpdateModule_1Input = z.infer<typeof UpdateModule_1Schema>;