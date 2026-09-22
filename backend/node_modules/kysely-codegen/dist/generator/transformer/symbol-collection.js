"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SymbolCollection = exports.SymbolType = void 0;
const case_converter_1 = require("../utils/case-converter");
const identifier_style_1 = require("./identifier-style");
var SymbolType;
(function (SymbolType) {
    SymbolType["DEFINITION"] = "Definition";
    SymbolType["MODULE_REFERENCE"] = "ModuleReference";
    SymbolType["RUNTIME_ENUM_DEFINITION"] = "RuntimeEnumDefinition";
    SymbolType["RUNTIME_ENUM_MEMBER"] = "RuntimeEnumMember";
    SymbolType["TABLE"] = "Table";
})(SymbolType || (exports.SymbolType = SymbolType = {}));
class SymbolCollection {
    constructor(options) {
        this.symbolNames = {};
        this.symbols = {};
        this.identifierStyle =
            options?.identifierStyle ?? identifier_style_1.IdentifierStyle.KYSELY_PASCAL_CASE;
        const entries = options?.entries?.sort(([a], [b]) => a.localeCompare(b)) ?? [];
        for (const [id, symbol] of entries) {
            this.set(id, symbol);
        }
    }
    entries() {
        return Object.entries(this.symbols)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([id, symbol]) => ({
            id,
            name: this.symbolNames[id],
            symbol: symbol,
        }));
    }
    get(id) {
        return this.symbols[id];
    }
    getName(id) {
        return this.symbolNames[id];
    }
    has(id) {
        return this.symbols[id] !== undefined;
    }
    set(id, symbol) {
        let symbolName = this.symbolNames[id];
        if (symbolName) {
            return symbolName;
        }
        const symbolNames = new Set(Object.values(this.symbolNames));
        const caseConverter = this.identifierStyle === identifier_style_1.IdentifierStyle.SCREAMING_SNAKE_CASE
            ? case_converter_1.toScreamingSnakeCase
            : case_converter_1.toKyselyPascalCase;
        symbolName = caseConverter(id.replaceAll(/[^\w$]/g, '_'));
        if (symbolNames.has(symbolName)) {
            let suffix = 2;
            while (symbolNames.has(`${symbolName}${suffix}`)) {
                suffix++;
            }
            symbolName += suffix;
        }
        if (/^\d/.test(symbolName)) {
            symbolName = `_${symbolName}`;
        }
        this.symbols[id] = symbol;
        this.symbolNames[id] = symbolName;
        return symbolName;
    }
}
exports.SymbolCollection = SymbolCollection;
//# sourceMappingURL=symbol-collection.js.map