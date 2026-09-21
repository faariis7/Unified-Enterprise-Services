import { getClient } from '../../../app-gen-sdk/data';
import type { GlobalRoleAssignment } from '../models/global-role-assignment-model';
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const DATA_SOURCE_NAME = 'GlobalRoleAssignment';

export class GlobalRoleAssignmentService {
  static async create(record: Omit<GlobalRoleAssignment, 'id'>): Promise<GlobalRoleAssignment> {
    const result = await getClient().createRecordAsync(DATA_SOURCE_NAME, record);
    if (!result.success) throw result.error;
    return result.data as GlobalRoleAssignment;
  }

  static async update(
    id: string,
    changedFields: Partial<Omit<GlobalRoleAssignment, 'id'>>
  ): Promise<GlobalRoleAssignment> {
    const result = await getClient().updateRecordAsync(DATA_SOURCE_NAME, id, changedFields);
    if (!result.success) throw result.error;
    return result.data as GlobalRoleAssignment;
  }

  static async delete(id: string): Promise<void> {
    const result = await getClient().deleteRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
  }

  static async get(id: string): Promise<GlobalRoleAssignment> {
    const result = await getClient().retrieveRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
    return result.data as GlobalRoleAssignment;
  }

  static async getAll(options?: IOperationOptions): Promise<GlobalRoleAssignment[]> {
    const result = await getClient().retrieveMultipleRecordsAsync(DATA_SOURCE_NAME, options);
    if (!result.success) throw result.error;
    return result.data as GlobalRoleAssignment[];
  }
}