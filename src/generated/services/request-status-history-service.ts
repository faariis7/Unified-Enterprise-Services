import { getClient } from '../../../app-gen-sdk/data';
import type { RequestStatusHistory } from '../models/request-status-history-model';
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const DATA_SOURCE_NAME = 'RequestStatusHistory';

export class RequestStatusHistoryService {
  static async create(record: Omit<RequestStatusHistory, 'id'>): Promise<RequestStatusHistory> {
    const result = await getClient().createRecordAsync(DATA_SOURCE_NAME, record);
    if (!result.success) throw result.error;
    return result.data as RequestStatusHistory;
  }

  static async update(
    id: string,
    changedFields: Partial<Omit<RequestStatusHistory, 'id'>>
  ): Promise<RequestStatusHistory> {
    const result = await getClient().updateRecordAsync(DATA_SOURCE_NAME, id, changedFields);
    if (!result.success) throw result.error;
    return result.data as RequestStatusHistory;
  }

  static async delete(id: string): Promise<void> {
    const result = await getClient().deleteRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
  }

  static async get(id: string): Promise<RequestStatusHistory> {
    const result = await getClient().retrieveRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
    return result.data as RequestStatusHistory;
  }

  static async getAll(options?: IOperationOptions): Promise<RequestStatusHistory[]> {
    const result = await getClient().retrieveMultipleRecordsAsync(DATA_SOURCE_NAME, options);
    if (!result.success) throw result.error;
    return result.data as RequestStatusHistory[];
  }
}