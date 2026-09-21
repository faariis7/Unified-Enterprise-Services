import { getClient } from '../../../app-gen-sdk/data';
import type { FieldValidationRule } from '../models/field-validation-rule-model';
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const DATA_SOURCE_NAME = 'FieldValidationRule';

export class FieldValidationRuleService {
  static async create(record: Omit<FieldValidationRule, 'id'>): Promise<FieldValidationRule> {
    const result = await getClient().createRecordAsync(DATA_SOURCE_NAME, record);
    if (!result.success) throw result.error;
    return result.data as FieldValidationRule;
  }

  static async update(
    id: string,
    changedFields: Partial<Omit<FieldValidationRule, 'id'>>
  ): Promise<FieldValidationRule> {
    const result = await getClient().updateRecordAsync(DATA_SOURCE_NAME, id, changedFields);
    if (!result.success) throw result.error;
    return result.data as FieldValidationRule;
  }

  static async delete(id: string): Promise<void> {
    const result = await getClient().deleteRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
  }

  static async get(id: string): Promise<FieldValidationRule> {
    const result = await getClient().retrieveRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
    return result.data as FieldValidationRule;
  }

  static async getAll(options?: IOperationOptions): Promise<FieldValidationRule[]> {
    const result = await getClient().retrieveMultipleRecordsAsync(DATA_SOURCE_NAME, options);
    if (!result.success) throw result.error;
    return result.data as FieldValidationRule[];
  }
}