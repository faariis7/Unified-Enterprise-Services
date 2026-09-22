import { NodeType } from './node-type';
export declare class RawExpressionNode {
    readonly expression: string;
    readonly type = NodeType.RAW_EXPRESSION;
    constructor(expression: string);
}
