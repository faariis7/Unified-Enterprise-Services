import type { ExpressionNode } from '../ast/expression-node';
import type { LiteralNode } from '../ast/literal-node';
import type { ModuleReferenceNode } from '../ast/module-reference-node';
import type { RuntimeEnumDeclarationNode } from '../ast/runtime-enum-declaration-node';
import type { TemplateNode } from '../ast/template-node';
import { IdentifierStyle } from './identifier-style';
export type SymbolEntry = [id: string, symbol: SymbolNode];
type SymbolMap = Record<string, SymbolNode | undefined>;
type SymbolNameMap = Record<string, string | undefined>;
export type SymbolNode = {
    node: ExpressionNode | TemplateNode;
    type: SymbolType.DEFINITION;
} | {
    node: ModuleReferenceNode;
    type: SymbolType.MODULE_REFERENCE;
} | {
    node: RuntimeEnumDeclarationNode;
    type: SymbolType.RUNTIME_ENUM_DEFINITION;
} | {
    node: LiteralNode<string>;
    type: SymbolType.RUNTIME_ENUM_MEMBER;
} | {
    type: SymbolType.TABLE;
};
export declare const enum SymbolType {
    DEFINITION = "Definition",
    MODULE_REFERENCE = "ModuleReference",
    RUNTIME_ENUM_DEFINITION = "RuntimeEnumDefinition",
    RUNTIME_ENUM_MEMBER = "RuntimeEnumMember",
    TABLE = "Table"
}
export declare class SymbolCollection {
    readonly identifierStyle: IdentifierStyle;
    readonly symbolNames: SymbolNameMap;
    readonly symbols: SymbolMap;
    constructor(options?: {
        entries?: SymbolEntry[];
        identifierStyle?: IdentifierStyle;
    });
    entries(): {
        id: string;
        name: string;
        symbol: SymbolNode;
    }[];
    get(id: string): SymbolNode | undefined;
    getName(id: string): string | undefined;
    has(id: string): boolean;
    set(id: string, symbol: SymbolNode): string;
}
export {};
