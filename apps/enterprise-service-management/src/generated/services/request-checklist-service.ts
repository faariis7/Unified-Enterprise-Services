import { getClient } from '../../../app-gen-sdk/data';
import type { RequestChecklist } from '../models/request-checklist-model';
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const DATA_SOURCE_NAME = 'RequestChecklist';

export class RequestChecklistService {
  static async create(record: Omit<RequestChecklist, 'id'>): Promise<RequestChecklist> {
    const result = await getClient().createRecordAsync(DATA_SOURCE_NAME, record);
    if (!result.success) throw result.error;
    return result.data as RequestChecklist;
  }

  static async update(
    id: string,
    changedFields: Partial<Omit<RequestChecklist, 'id'>>
  ): Promise<RequestChecklist> {
    const result = await getClient().updateRecordAsync(DATA_SOURCE_NAME, id, changedFields);
    if (!result.success) throw result.error;
    return result.data as RequestChecklist;
  }

  static async delete(id: string): Promise<void> {
    const result = await getClient().deleteRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
  }

  static async get(id: string): Promise<RequestChecklist> {
    const result = await getClient().retrieveRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
    return result.data as RequestChecklist;
  }

  static async getAll(options?: IOperationOptions): Promise<RequestChecklist[]> {
    const result = await getClient().retrieveMultipleRecordsAsync(DATA_SOURCE_NAME, options);
    if (!result.success) throw result.error;
    return result.data as RequestChecklist[];
  }
}