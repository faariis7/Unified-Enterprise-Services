import { getClient } from '../../../app-gen-sdk/data';
import type { BusinessRuleOverride } from '../models/business-rule-override-model';
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const DATA_SOURCE_NAME = 'BusinessRuleOverride';

export class BusinessRuleOverrideService {
  static async create(record: Omit<BusinessRuleOverride, 'id'>): Promise<BusinessRuleOverride> {
    const result = await getClient().createRecordAsync(DATA_SOURCE_NAME, record);
    if (!result.success) throw result.error;
    return result.data as BusinessRuleOverride;
  }

  static async update(
    id: string,
    changedFields: Partial<Omit<BusinessRuleOverride, 'id'>>
  ): Promise<BusinessRuleOverride> {
    const result = await getClient().updateRecordAsync(DATA_SOURCE_NAME, id, changedFields);
    if (!result.success) throw result.error;
    return result.data as BusinessRuleOverride;
  }

  static async delete(id: string): Promise<void> {
    const result = await getClient().deleteRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
  }

  static async get(id: string): Promise<BusinessRuleOverride> {
    const result = await getClient().retrieveRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
    return result.data as BusinessRuleOverride;
  }

  static async getAll(options?: IOperationOptions): Promise<BusinessRuleOverride[]> {
    const result = await getClient().retrieveMultipleRecordsAsync(DATA_SOURCE_NAME, options);
    if (!result.success) throw result.error;
    return result.data as BusinessRuleOverride[];
  }
}