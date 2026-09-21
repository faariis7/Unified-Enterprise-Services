import { z } from 'zod';

/**
 * Zod schema for Vendor validation
 */
export const VendorSchema = z.object({
  id: z.string().uuid(),
  vendorName: z.string().min(1, { message: "Vendor Name is required" }),
  category: z.string().min(1, { message: "Category is required" }),
  createdAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Created At is required" }),
  createdBy: z.object({ id: z.string().uuid(), displayName: z.string() }),
  primaryContactEmail: z.string().email().min(1, { message: "Primary Contact Email is required" }),
  primaryContactName: z.string().min(1, { message: "Primary Contact Name is required" }),
  primaryContactPhone: z.string().min(1, { message: "Primary Contact Phone is required" }),
  registrationAndTaxReference: z.string().min(1, { message: "Registration and Tax Reference is required" }),
  riskRatingKey: z.enum(['Low', 'Medium', 'High', 'Critical']),
  statusKey: z.enum(['Active', 'Inactive', 'Suspended']),
  updatedAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Updated At is required" }),
  updatedBy: z.object({ id: z.string().uuid(), displayName: z.string() }),
  vendorCode: z.string().min(1, { message: "Vendor Code is required" }),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new Vendor (omits system-generated ID)
 */
export const CreateVendorSchema = VendorSchema.omit({ id: true });

/**
 * Schema for updating an existing Vendor
 */
export const UpdateVendorSchema = VendorSchema;

export type VendorInput = z.infer<typeof VendorSchema>;
export type CreateVendorInput = z.infer<typeof CreateVendorSchema>;
export type UpdateVendorInput = z.infer<typeof UpdateVendorSchema>;