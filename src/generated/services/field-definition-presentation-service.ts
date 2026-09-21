import { getClient } from '../../../app-gen-sdk/data';
import type { FieldDefinitionPresentation } from '../models/field-definition-presentation-model';
import type { IOperationOptions } from '../../../app-gen-sdk/data/common/types';

const DATA_SOURCE_NAME = 'FieldDefinitionPresentation';

export class FieldDefinitionPresentationService {
  static async create(record: Omit<FieldDefinitionPresentation, 'id'>): Promise<FieldDefinitionPresentation> {
    const result = await getClient().createRecordAsync(DATA_SOURCE_NAME, record);
    if (!result.success) throw result.error;
    return result.data as FieldDefinitionPresentation;
  }

  static async update(
    id: string,
    changedFields: Partial<Omit<FieldDefinitionPresentation, 'id'>>
  ): Promise<FieldDefinitionPresentation> {
    const result = await getClient().updateRecordAsync(DATA_SOURCE_NAME, id, changedFields);
    if (!result.success) throw result.error;
    return result.data as FieldDefinitionPresentation;
  }

  static async delete(id: string): Promise<void> {
    const result = await getClient().deleteRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
  }

  static async get(id: string): Promise<FieldDefinitionPresentation> {
    const result = await getClient().retrieveRecordAsync(DATA_SOURCE_NAME, id);
    if (!result.success) throw result.error;
    return result.data as FieldDefinitionPresentation;
  }

  static async getAll(options?: IOperationOptions): Promise<FieldDefinitionPresentation[]> {
    const result = await getClient().retrieveMultipleRecordsAsync(DATA_SOURCE_NAME, options);
    if (!result.success) throw result.error;
    return result.data as FieldDefinitionPresentation[];
  }
}