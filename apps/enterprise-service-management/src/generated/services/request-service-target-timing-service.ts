import { getClient } from '../../../app-gen-sdk/data';
import type { RequestServiceTargetTiming } from '../models/request-service-target-timing-model';
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const DATA_SOURCE_NAME = 'RequestServiceTargetTiming';

export class RequestServiceTargetTimingService {
  static async create(record: Omit<RequestServiceTargetTiming, 'id'>): Promise<RequestServiceTargetTiming> {
    const result = await getClient().createRecordAsync(DATA_SOURCE_NAME, record);
    if (!result.success) throw result.error;
    return result.data as RequestServiceTargetTiming;
  }

  static async update(
    id: string,
    changedFields: Partial<Omit<RequestServiceTargetTiming, 'id'>>
  ): Promise<RequestServiceTargetTiming> {
    const result = await getClient().updateRecordAsync(DATA_SOURCE_NAME, id, changedFields);
    if (!result.success) throw result.error;
    return result.data as RequestServiceTargetTiming;
  }

  static async delete(id: string): Promise<void> {
    const result = await getClient().deleteRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
  }

  static async get(id: string): Promise<RequestServiceTargetTiming> {
    const result = await getClient().retrieveRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
    return result.data as RequestServiceTargetTiming;
  }

  static async getAll(options?: IOperationOptions): Promise<RequestServiceTargetTiming[]> {
    const result = await getClient().retrieveMultipleRecordsAsync(DATA_SOURCE_NAME, options);
    if (!result.success) throw result.error;
    return result.data as RequestServiceTargetTiming[];
  }
}