import { getClient } from '../../../app-gen-sdk/data';
import type { BusinessRuleDefinition } from '../models/business-rule-definition-model';
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const DATA_SOURCE_NAME = 'BusinessRuleDefinition';

export class BusinessRuleDefinitionService {
  static async create(record: Omit<BusinessRuleDefinition, 'id'>): Promise<BusinessRuleDefinition> {
    const result = await getClient().createRecordAsync(DATA_SOURCE_NAME, record);
    if (!result.success) throw result.error;
    return result.data as BusinessRuleDefinition;
  }

  static async update(
    id: string,
    changedFields: Partial<Omit<BusinessRuleDefinition, 'id'>>
  ): Promise<BusinessRuleDefinition> {
    const result = await getClient().updateRecordAsync(DATA_SOURCE_NAME, id, changedFields);
    if (!result.success) throw result.error;
    return result.data as BusinessRuleDefinition;
  }

  static async delete(id: string): Promise<void> {
    const result = await getClient().deleteRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
  }

  static async get(id: string): Promise<BusinessRuleDefinition> {
    const result = await getClient().retrieveRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
    return result.data as BusinessRuleDefinition;
  }

  static async getAll(options?: IOperationOptions): Promise<BusinessRuleDefinition[]> {
    const result = await getClient().retrieveMultipleRecordsAsync(DATA_SOURCE_NAME, options);
    if (!result.success) throw result.error;
    return result.data as BusinessRuleDefinition[];
  }
}