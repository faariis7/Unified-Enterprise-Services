import { getClient } from '../../../app-gen-sdk/data';
import type { AutomationActionExecution } from '../models/automation-action-execution-model';
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const DATA_SOURCE_NAME = 'AutomationActionExecution';

export class AutomationActionExecutionService {
  static async create(record: Omit<AutomationActionExecution, 'id'>): Promise<AutomationActionExecution> {
    const result = await getClient().createRecordAsync(DATA_SOURCE_NAME, record);
    if (!result.success) throw result.error;
    return result.data as AutomationActionExecution;
  }

  static async update(
    id: string,
    changedFields: Partial<Omit<AutomationActionExecution, 'id'>>
  ): Promise<AutomationActionExecution> {
    const result = await getClient().updateRecordAsync(DATA_SOURCE_NAME, id, changedFields);
    if (!result.success) throw result.error;
    return result.data as AutomationActionExecution;
  }

  static async delete(id: string): Promise<void> {
    const result = await getClient().deleteRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
  }

  static async get(id: string): Promise<AutomationActionExecution> {
    const result = await getClient().retrieveRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
    return result.data as AutomationActionExecution;
  }

  static async getAll(options?: IOperationOptions): Promise<AutomationActionExecution[]> {
    const result = await getClient().retrieveMultipleRecordsAsync(DATA_SOURCE_NAME, options);
    if (!result.success) throw result.error;
    return result.data as AutomationActionExecution[];
  }
}