import { getClient } from '../../../app-gen-sdk/data';
import type { ServiceGovernanceProfileAudit } from '../models/service-governance-profile-audit-model';
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const DATA_SOURCE_NAME = 'ServiceGovernanceProfileAudit';

export class ServiceGovernanceProfileAuditService {
  static async create(record: Omit<ServiceGovernanceProfileAudit, 'id'>): Promise<ServiceGovernanceProfileAudit> {
    const result = await getClient().createRecordAsync(DATA_SOURCE_NAME, record);
    if (!result.success) throw result.error;
    return result.data as ServiceGovernanceProfileAudit;
  }

  static async update(
    id: string,
    changedFields: Partial<Omit<ServiceGovernanceProfileAudit, 'id'>>
  ): Promise<ServiceGovernanceProfileAudit> {
    const result = await getClient().updateRecordAsync(DATA_SOURCE_NAME, id, changedFields);
    if (!result.success) throw result.error;
    return result.data as ServiceGovernanceProfileAudit;
  }

  static async delete(id: string): Promise<void> {
    const result = await getClient().deleteRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
  }

  static async get(id: string): Promise<ServiceGovernanceProfileAudit> {
    const result = await getClient().retrieveRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
    return result.data as ServiceGovernanceProfileAudit;
  }

  static async getAll(options?: IOperationOptions): Promise<ServiceGovernanceProfileAudit[]> {
    const result = await getClient().retrieveMultipleRecordsAsync(DATA_SOURCE_NAME, options);
    if (!result.success) throw result.error;
    return result.data as ServiceGovernanceProfileAudit[];
  }
}