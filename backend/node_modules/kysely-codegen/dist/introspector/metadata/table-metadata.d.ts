import type { ColumnMetadataOptions } from './column-metadata';
import { ColumnMetadata } from './column-metadata';
export type TableMetadataOptions = {
    columns: ColumnMetadataOptions[];
    isPartition?: boolean;
    isView?: boolean;
    name: string;
    schema?: string;
};
export declare class TableMetadata {
    readonly columns: ColumnMetadata[];
    readonly isPartition: boolean;
    readonly isView: boolean;
    readonly name: string;
    readonly schema: string | undefined;
    constructor(options: TableMetadataOptions);
}
