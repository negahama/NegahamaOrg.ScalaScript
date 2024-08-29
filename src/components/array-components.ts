import { AstNode } from "langium";
import { Expression, isArrayExpression, isArrayLiteral, isArrayType } from "../language/generated/ast.js";
import { TypeDescription, TypeSystem, enterLog, exitLog } from "../language/scala-script-types.js";
import { generateExpression } from "../cli/generator.js";

/**
 *
 */
export class ArrayTypeComponent {
  /**
   *
   * @param expr
   * @param indent
   * @returns
   */
  static transpile(expr: Expression, indent: number): string {
    let result = "";
    if (!isArrayType(expr)) return result;

    return result;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: AstNode, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error");
    if (!isArrayType(node)) return type;

    const log = enterLog("isArrayType", node.elementType.$cstNode?.text, indent);
    type = TypeSystem.createArrayType(node.elementType);
    // console.log("array type:", type.$type, type.literal?.$cstNode?.text);
    exitLog(log);
    return type;
  }
}

/**
 *
 */
export class ArrayLiteralComponent {
  /**
   *
   * @param expr
   * @param indent
   * @returns
   */
  static transpile(expr: Expression, indent: number): string {
    let result = "";
    if (!isArrayLiteral(expr)) return result;

    result += "[" + expr.items.map((item) => item.value).join(", ") + "]";
    return result;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: AstNode, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error");
    if (!isArrayLiteral(node)) return type;

    const log = enterLog("isArrayLiteral", node.items.toString(), indent);
    type = TypeSystem.createArrayType();
    // console.log("array literal:", type?.$type);
    exitLog(log);
    return type;
  }
}

/**
 *
 */
export class ArrayExpressionComponent {
  /**
   *
   * @param expr
   * @param indent
   * @returns
   */
  static transpile(expr: Expression, indent: number): string {
    let result = "";
    if (!isArrayExpression(expr)) return result;

    result += `${expr.element}[(${generateExpression(expr.index, indent)}) - 1]`;
    return result;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: AstNode, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription | undefined = TypeSystem.createErrorType("internal error");
    if (!isArrayExpression(node)) return type;

    // 다른 것들은 node의 타입을 통해서 타입을 추론하지만 이것은 이름을 이용해서 추론해야만 한다.
    const log = enterLog("isArrayExpression", node.element.$refText, indent);
    type = TypeSystem.inferTypeByName(node, node.element.$refText, cache, indent + 1);
    // console.log("array expr:", type?.$type);
    if (!type) type = TypeSystem.createErrorType("internal error");
    exitLog(log);
    return type;
  }
}
