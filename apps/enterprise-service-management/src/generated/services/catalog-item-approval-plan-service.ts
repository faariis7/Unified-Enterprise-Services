import { getClient } from '../../../app-gen-sdk/data';
import type { CatalogItemApprovalPlan } from '../models/catalog-item-approval-plan-model';
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const DATA_SOURCE_NAME = 'CatalogItemApprovalPlan';

export class CatalogItemApprovalPlanService {
  static async create(record: Omit<CatalogItemApprovalPlan, 'id'>): Promise<CatalogItemApprovalPlan> {
    const result = await getClient().createRecordAsync(DATA_SOURCE_NAME, record);
    if (!result.success) throw result.error;
    return result.data as CatalogItemApprovalPlan;
  }

  static async update(
    id: string,
    changedFields: Partial<Omit<CatalogItemApprovalPlan, 'id'>>
  ): Promise<CatalogItemApprovalPlan> {
    const result = await getClient().updateRecordAsync(DATA_SOURCE_NAME, id, changedFields);
    if (!result.success) throw result.error;
    return result.data as CatalogItemApprovalPlan;
  }

  static async delete(id: string): Promise<void> {
    const result = await getClient().deleteRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
  }

  static async get(id: string): Promise<CatalogItemApprovalPlan> {
    const result = await getClient().retrieveRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
    return result.data as CatalogItemApprovalPlan;
  }

  static async getAll(options?: IOperationOptions): Promise<CatalogItemApprovalPlan[]> {
    const result = await getClient().retrieveMultipleRecordsAsync(DATA_SOURCE_NAME, options);
    if (!result.success) throw result.error;
    return result.data as CatalogItemApprovalPlan[];
  }
}