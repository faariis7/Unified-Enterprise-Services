import { getClient } from '../../../app-gen-sdk/data';
import type { RequestNotification } from '../models/request-notification-model';
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const DATA_SOURCE_NAME = 'RequestNotification';

export class RequestNotificationService {
  static async create(record: Omit<RequestNotification, 'id'>): Promise<RequestNotification> {
    const result = await getClient().createRecordAsync(DATA_SOURCE_NAME, record);
    if (!result.success) throw result.error;
    return result.data as RequestNotification;
  }

  static async update(
    id: string,
    changedFields: Partial<Omit<RequestNotification, 'id'>>
  ): Promise<RequestNotification> {
    const result = await getClient().updateRecordAsync(DATA_SOURCE_NAME, id, changedFields);
    if (!result.success) throw result.error;
    return result.data as RequestNotification;
  }

  static async delete(id: string): Promise<void> {
    const result = await getClient().deleteRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
  }

  static async get(id: string): Promise<RequestNotification> {
    const result = await getClient().retrieveRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
    return result.data as RequestNotification;
  }

  static async getAll(options?: IOperationOptions): Promise<RequestNotification[]> {
    const result = await getClient().retrieveMultipleRecordsAsync(DATA_SOURCE_NAME, options);
    if (!result.success) throw result.error;
    return result.data as RequestNotification[];
  }
}