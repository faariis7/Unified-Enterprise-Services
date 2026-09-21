import { z } from 'zod';

/**
 * Zod schema for ContractDocument validation
 */
export const ContractDocumentSchema = z.object({
  id: z.string().uuid(),
  fileName: z.string().min(1, { message: "File Name is required" }),
  contentType: z.string().min(1, { message: "Content Type is required" }),
  contract: z.object({ id: z.string().uuid(), title: z.string() }),
  documentType: z.string().min(1, { message: "Document Type is required" }),
  fileSizeBytes: z.number().int(),
  replacementDocument: z.object({ id: z.string().uuid(), fileName: z.string() }).optional(),
  statusKey: z.enum(['Current', 'Replaced', 'Removed']),
  storageReferenceURL: z.string().url().min(1, { message: "Storage Reference URL is required" }),
  uploadedDate: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/, "DateTime must be in ISO format").min(1, { message: "Uploaded Date is required" }),
  uploaderPerson: z.object({ id: z.string().uuid(), displayName: z.string() }),
  versionNumber: z.number().int(),
  workspace: z.object({ id: z.string().uuid(), workspaceName: z.string() }),
});

/**
 * Schema for creating a new ContractDocument (omits system-generated ID)
 */
export const CreateContractDocumentSchema = ContractDocumentSchema.omit({ id: true });

/**
 * Schema for updating an existing ContractDocument
 */
export const UpdateContractDocumentSchema = ContractDocumentSchema;

export type ContractDocumentInput = z.infer<typeof ContractDocumentSchema>;
export type CreateContractDocumentInput = z.infer<typeof CreateContractDocumentSchema>;
export type UpdateContractDocumentInput = z.infer<typeof UpdateContractDocumentSchema>;