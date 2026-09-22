"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.transform = void 0;
const alias_declaration_node_1 = require("../ast/alias-declaration-node");
const array_expression_node_1 = require("../ast/array-expression-node");
const export_statement_node_1 = require("../ast/export-statement-node");
const generic_expression_node_1 = require("../ast/generic-expression-node");
const identifier_node_1 = require("../ast/identifier-node");
const import_clause_node_1 = require("../ast/import-clause-node");
const import_statement_node_1 = require("../ast/import-statement-node");
const interface_declaration_node_1 = require("../ast/interface-declaration-node");
const literal_node_1 = require("../ast/literal-node");
const node_type_1 = require("../ast/node-type");
const object_expression_node_1 = require("../ast/object-expression-node");
const property_node_1 = require("../ast/property-node");
const raw_expression_node_1 = require("../ast/raw-expression-node");
const runtime_enum_declaration_node_1 = require("../ast/runtime-enum-declaration-node");
const union_expression_node_1 = require("../ast/union-expression-node");
const runtime_enums_style_1 = require("../generator/runtime-enums-style");
const case_converter_1 = require("../utils/case-converter");
const definitions_1 = require("./definitions");
const identifier_style_1 = require("./identifier-style");
const imports_1 = require("./imports");
const symbol_collection_1 = require("./symbol-collection");
const collectSymbol = (name, context) => {
    const definition = context.definitions[name];
    if (definition) {
        if (context.symbols.has(name)) {
            return;
        }
        context.symbols.set(name, {
            node: definition,
            type: symbol_collection_1.SymbolType.DEFINITION,
        });
        collectSymbols(definition, context);
        return;
    }
    const moduleReference = context.imports[name];
    if (moduleReference) {
        if (context.symbols.has(name)) {
            return;
        }
        context.symbols.set(name, {
            node: moduleReference,
            type: symbol_collection_1.SymbolType.MODULE_REFERENCE,
        });
    }
};
const collectSymbols = (node, context) => {
    switch (node.type) {
        case node_type_1.NodeType.ARRAY_EXPRESSION:
            collectSymbols(node.values, context);
            break;
        case node_type_1.NodeType.EXTENDS_CLAUSE:
            collectSymbols(node.extendsType, context);
            collectSymbols(node.trueType, context);
            collectSymbols(node.falseType, context);
            break;
        case node_type_1.NodeType.GENERIC_EXPRESSION: {
            collectSymbol(node.name, context);
            for (const arg of node.args) {
                collectSymbols(arg, context);
            }
            break;
        }
        case node_type_1.NodeType.IDENTIFIER:
            collectSymbol(node.name, context);
            break;
        case node_type_1.NodeType.INFER_CLAUSE:
            break;
        case node_type_1.NodeType.LITERAL:
            break;
        case node_type_1.NodeType.MAPPED_TYPE:
            collectSymbols(node.value, context);
            break;
        case node_type_1.NodeType.OBJECT_EXPRESSION:
            for (const property of node.properties) {
                collectSymbols(property.value, context);
            }
            break;
        case node_type_1.NodeType.RAW_EXPRESSION:
            collectSymbol(node.expression, context);
            break;
        case node_type_1.NodeType.TEMPLATE:
            collectSymbols(node.expression, context);
            break;
        case node_type_1.NodeType.UNION_EXPRESSION:
            for (const arg of node.args) {
                collectSymbols(arg, context);
            }
            break;
    }
};
const createContext = (options) => {
    return {
        camelCase: !!options.camelCase,
        defaultScalar: options.dialect.adapter.defaultScalar ?? new identifier_node_1.IdentifierNode('unknown'),
        defaultSchemas: options.defaultSchemas && options.defaultSchemas.length > 0
            ? options.defaultSchemas
            : options.dialect.adapter.defaultSchemas,
        definitions: {
            ...definitions_1.GLOBAL_DEFINITIONS,
            ...options.dialect.adapter.definitions,
        },
        enums: options.metadata.enums,
        imports: {
            ...imports_1.GLOBAL_IMPORTS,
            ...options.dialect.adapter.imports,
        },
        metadata: options.metadata,
        overrides: options.overrides,
        runtimeEnums: !!options.runtimeEnums,
        runtimeEnumsStyle: options.runtimeEnumsStyle,
        scalars: {
            ...options.dialect.adapter.scalars,
        },
        symbols: new symbol_collection_1.SymbolCollection(),
    };
};
const createDatabaseExportNode = (context) => {
    const tableProperties = [];
    for (const table of context.metadata.tables) {
        const identifier = getTableIdentifier(table, context);
        const symbolName = context.symbols.getName(identifier);
        if (symbolName) {
            const value = new identifier_node_1.IdentifierNode(symbolName);
            const tableProperty = new property_node_1.PropertyNode(identifier, value);
            tableProperties.push(tableProperty);
        }
    }
    tableProperties.sort((a, b) => a.key.localeCompare(b.key));
    const body = new object_expression_node_1.ObjectExpressionNode(tableProperties);
    const argument = new interface_declaration_node_1.InterfaceDeclarationNode('DB', body);
    return new export_statement_node_1.ExportStatementNode(argument);
};
const createRuntimeEnumDefinitionNodes = (context) => {
    const exportStatements = [];
    for (const { symbol } of context.symbols.entries()) {
        if (symbol.type !== symbol_collection_1.SymbolType.RUNTIME_ENUM_DEFINITION) {
            continue;
        }
        const exportStatement = new export_statement_node_1.ExportStatementNode(symbol.node);
        exportStatements.push(exportStatement);
    }
    return exportStatements.sort((a, b) => {
        return a.argument.name.localeCompare(b.argument.name);
    });
};
const createDefinitionNodes = (context) => {
    const definitionNodes = [];
    for (const { name, symbol } of context.symbols.entries()) {
        if (symbol.type !== symbol_collection_1.SymbolType.DEFINITION) {
            continue;
        }
        const argument = new alias_declaration_node_1.AliasDeclarationNode(name, symbol.node);
        const definitionNode = new export_statement_node_1.ExportStatementNode(argument);
        definitionNodes.push(definitionNode);
    }
    return definitionNodes.sort((a, b) => a.argument.name.localeCompare(b.argument.name));
};
const createImportNodes = (context) => {
    var _a;
    const imports = {};
    const importNodes = [];
    for (const { id, name, symbol } of context.symbols.entries()) {
        if (symbol.type !== symbol_collection_1.SymbolType.MODULE_REFERENCE) {
            continue;
        }
        (imports[_a = symbol.node.name] ?? (imports[_a] = [])).push(new import_clause_node_1.ImportClauseNode(id, name === id ? null : name));
    }
    for (const [moduleName, symbolImports] of Object.entries(imports)) {
        importNodes.push(new import_statement_node_1.ImportStatementNode(moduleName, symbolImports));
    }
    return importNodes.sort((a, b) => a.moduleName.localeCompare(b.moduleName));
};
const getTableIdentifier = (table, context) => {
    const name = table.schema &&
        context.defaultSchemas.length > 0 &&
        !context.defaultSchemas.includes(table.schema)
        ? `${table.schema}.${table.name}`
        : table.name;
    return transformName(name, context);
};
const transformColumn = (column, context, tableName) => {
    const columnName = `${tableName}.${column.name}`;
    const columnOverride = context.overrides?.columns?.[columnName];
    if (columnOverride !== undefined) {
        const node = typeof columnOverride === 'string'
            ? new raw_expression_node_1.RawExpressionNode(columnOverride)
            : columnOverride;
        collectSymbols(node, context);
        return node;
    }
    let args = transformColumnToArgs(column, context);
    if (column.isArray) {
        const unionizedArgs = unionize(args);
        const isSimpleNode = unionizedArgs.type === node_type_1.NodeType.IDENTIFIER &&
            ['boolean', 'number', 'string'].includes(unionizedArgs.name);
        args = isSimpleNode
            ? [new array_expression_node_1.ArrayExpressionNode(unionizedArgs)]
            : [new generic_expression_node_1.GenericExpressionNode('ArrayType', [unionizedArgs])];
    }
    if (column.isNullable) {
        args.push(new identifier_node_1.IdentifierNode('null'));
    }
    let node = unionize(args);
    const isGenerated = column.hasDefaultValue || column.isAutoIncrementing;
    if (isGenerated) {
        node = new generic_expression_node_1.GenericExpressionNode('Generated', [node]);
    }
    collectSymbols(node, context);
    return node;
};
const transformColumnToArgs = (column, context) => {
    const dataType = column.dataType.toLowerCase();
    const scalarNode = context.scalars[dataType];
    if (scalarNode) {
        return [scalarNode];
    }
    // Used as a unique identifier for the data type:
    const dataTypeId = `${column.dataTypeSchema ?? context.defaultSchemas}.${dataType}`;
    // Used for serializing the name of the symbol:
    const symbolId = column.dataTypeSchema &&
        context.defaultSchemas.length > 0 &&
        !context.defaultSchemas.includes(column.dataTypeSchema)
        ? `${column.dataTypeSchema}.${dataType}`
        : dataType;
    const enumValues = context.enums.get(dataTypeId);
    if (enumValues) {
        if (context.runtimeEnums) {
            const symbol = {
                node: new runtime_enum_declaration_node_1.RuntimeEnumDeclarationNode(symbolId, enumValues, {
                    identifierStyle: context.runtimeEnumsStyle === runtime_enums_style_1.RuntimeEnumsStyle.SCREAMING_SNAKE_CASE
                        ? identifier_style_1.IdentifierStyle.SCREAMING_SNAKE_CASE
                        : identifier_style_1.IdentifierStyle.KYSELY_PASCAL_CASE,
                }),
                type: symbol_collection_1.SymbolType.RUNTIME_ENUM_DEFINITION,
            };
            symbol.node.name = context.symbols.set(symbolId, symbol);
            const node = new identifier_node_1.IdentifierNode(symbol.node.name);
            return [node];
        }
        const symbolName = context.symbols.set(symbolId, {
            node: unionize(transformEnum(enumValues)),
            type: symbol_collection_1.SymbolType.DEFINITION,
        });
        const node = new identifier_node_1.IdentifierNode(symbolName);
        return [node];
    }
    const symbolName = context.symbols.getName(symbolId);
    if (symbolName) {
        const node = new identifier_node_1.IdentifierNode(symbolName ?? 'unknown');
        return [node];
    }
    if (column.enumValues) {
        return transformEnum(column.enumValues);
    }
    return [context.defaultScalar];
};
const transformEnum = (enumValues) => {
    return enumValues.map((enumValue) => new literal_node_1.LiteralNode(enumValue));
};
const transformName = (name, context) => {
    return context.camelCase ? (0, case_converter_1.toKyselyCamelCase)(name) : name;
};
const transformTables = (context) => {
    const tableNodes = [];
    for (const table of context.metadata.tables) {
        const tableProperties = [];
        for (const column of table.columns) {
            const key = transformName(column.name, context);
            const value = transformColumn(column, context, table.name);
            const comment = column.comment;
            const tableProperty = new property_node_1.PropertyNode(key, value, comment);
            tableProperties.push(tableProperty);
        }
        const expression = new object_expression_node_1.ObjectExpressionNode(tableProperties);
        const identifier = getTableIdentifier(table, context);
        const symbolName = context.symbols.set(identifier, {
            type: symbol_collection_1.SymbolType.TABLE,
        });
        const tableNode = new export_statement_node_1.ExportStatementNode(new interface_declaration_node_1.InterfaceDeclarationNode(symbolName, expression));
        tableNodes.push(tableNode);
    }
    tableNodes.sort((a, b) => a.argument.name.localeCompare(b.argument.name));
    return tableNodes;
};
const unionize = (args) => {
    switch (args.length) {
        case 0:
            return new identifier_node_1.IdentifierNode('never');
        case 1:
            return args[0];
        default:
            return new union_expression_node_1.UnionExpressionNode(args);
    }
};
const transform = (options) => {
    const context = createContext(options);
    const tableNodes = transformTables(context);
    const importNodes = createImportNodes(context);
    const runtimeEnumDefinitionNodes = createRuntimeEnumDefinitionNodes(context);
    const definitionNodes = createDefinitionNodes(context);
    const databaseNode = createDatabaseExportNode(context);
    return [
        ...importNodes,
        ...runtimeEnumDefinitionNodes,
        ...definitionNodes,
        ...tableNodes,
        databaseNode,
    ];
};
exports.transform = transform;
//# sourceMappingURL=transform.js.map