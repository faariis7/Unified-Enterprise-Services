import { getClient } from '../../../app-gen-sdk/data';
import type { RequestAssignmentHistory } from '../models/request-assignment-history-model';
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const DATA_SOURCE_NAME = 'RequestAssignmentHistory';

export class RequestAssignmentHistoryService {
  static async create(record: Omit<RequestAssignmentHistory, 'id'>): Promise<RequestAssignmentHistory> {
    const result = await getClient().createRecordAsync(DATA_SOURCE_NAME, record);
    if (!result.success) throw result.error;
    return result.data as RequestAssignmentHistory;
  }

  static async update(
    id: string,
    changedFields: Partial<Omit<RequestAssignmentHistory, 'id'>>
  ): Promise<RequestAssignmentHistory> {
    const result = await getClient().updateRecordAsync(DATA_SOURCE_NAME, id, changedFields);
    if (!result.success) throw result.error;
    return result.data as RequestAssignmentHistory;
  }

  static async delete(id: string): Promise<void> {
    const result = await getClient().deleteRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
  }

  static async get(id: string): Promise<RequestAssignmentHistory> {
    const result = await getClient().retrieveRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
    return result.data as RequestAssignmentHistory;
  }

  static async getAll(options?: IOperationOptions): Promise<RequestAssignmentHistory[]> {
    const result = await getClient().retrieveMultipleRecordsAsync(DATA_SOURCE_NAME, options);
    if (!result.success) throw result.error;
    return result.data as RequestAssignmentHistory[];
  }
}