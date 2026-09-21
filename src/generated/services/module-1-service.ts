import { getClient } from '../../../app-gen-sdk/data';
import type { Module_1 } from '../models/module-1-model';
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const DATA_SOURCE_NAME = 'Module_1';

export class Module_1Service {
  static async create(record: Omit<Module_1, 'id'>): Promise<Module_1> {
    const result = await getClient().createRecordAsync(DATA_SOURCE_NAME, record);
    if (!result.success) throw result.error;
    return result.data as Module_1;
  }

  static async update(
    id: string,
    changedFields: Partial<Omit<Module_1, 'id'>>
  ): Promise<Module_1> {
    const result = await getClient().updateRecordAsync(DATA_SOURCE_NAME, id, changedFields);
    if (!result.success) throw result.error;
    return result.data as Module_1;
  }

  static async delete(id: string): Promise<void> {
    const result = await getClient().deleteRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
  }

  static async get(id: string): Promise<Module_1> {
    const result = await getClient().retrieveRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
    return result.data as Module_1;
  }

  static async getAll(options?: IOperationOptions): Promise<Module_1[]> {
    const result = await getClient().retrieveMultipleRecordsAsync(DATA_SOURCE_NAME, options);
    if (!result.success) throw result.error;
    return result.data as Module_1[];
  }
}