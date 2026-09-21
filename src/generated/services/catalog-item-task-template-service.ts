import { getClient } from '../../../app-gen-sdk/data';
import type { CatalogItemTaskTemplate } from '../models/catalog-item-task-template-model';
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const DATA_SOURCE_NAME = 'CatalogItemTaskTemplate';

export class CatalogItemTaskTemplateService {
  static async create(record: Omit<CatalogItemTaskTemplate, 'id'>): Promise<CatalogItemTaskTemplate> {
    const result = await getClient().createRecordAsync(DATA_SOURCE_NAME, record);
    if (!result.success) throw result.error;
    return result.data as CatalogItemTaskTemplate;
  }

  static async update(
    id: string,
    changedFields: Partial<Omit<CatalogItemTaskTemplate, 'id'>>
  ): Promise<CatalogItemTaskTemplate> {
    const result = await getClient().updateRecordAsync(DATA_SOURCE_NAME, id, changedFields);
    if (!result.success) throw result.error;
    return result.data as CatalogItemTaskTemplate;
  }

  static async delete(id: string): Promise<void> {
    const result = await getClient().deleteRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
  }

  static async get(id: string): Promise<CatalogItemTaskTemplate> {
    const result = await getClient().retrieveRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
    return result.data as CatalogItemTaskTemplate;
  }

  static async getAll(options?: IOperationOptions): Promise<CatalogItemTaskTemplate[]> {
    const result = await getClient().retrieveMultipleRecordsAsync(DATA_SOURCE_NAME, options);
    if (!result.success) throw result.error;
    return result.data as CatalogItemTaskTemplate[];
  }
}