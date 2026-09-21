import { getClient } from '../../../app-gen-sdk/data';
import type { FormSection } from '../models/form-section-model';
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const DATA_SOURCE_NAME = 'FormSection';

export class FormSectionService {
  static async create(record: Omit<FormSection, 'id'>): Promise<FormSection> {
    const result = await getClient().createRecordAsync(DATA_SOURCE_NAME, record);
    if (!result.success) throw result.error;
    return result.data as FormSection;
  }

  static async update(
    id: string,
    changedFields: Partial<Omit<FormSection, 'id'>>
  ): Promise<FormSection> {
    const result = await getClient().updateRecordAsync(DATA_SOURCE_NAME, id, changedFields);
    if (!result.success) throw result.error;
    return result.data as FormSection;
  }

  static async delete(id: string): Promise<void> {
    const result = await getClient().deleteRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
  }

  static async get(id: string): Promise<FormSection> {
    const result = await getClient().retrieveRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
    return result.data as FormSection;
  }

  static async getAll(options?: IOperationOptions): Promise<FormSection[]> {
    const result = await getClient().retrieveMultipleRecordsAsync(DATA_SOURCE_NAME, options);
    if (!result.success) throw result.error;
    return result.data as FormSection[];
  }
}