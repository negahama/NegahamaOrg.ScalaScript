import { AstNode } from "langium";
import { Expression, isArrayExpression, isArrayLiteral, isArrayType } from "../language/generated/ast.js";
import { TypeDescription, TypeSystem, enterLog, exitLog } from "../language/scala-script-types.js";
import { generateExpression } from "../cli/generator.js";

/**
 * ArrayType: elementType=SimpleType '[' ']';
 * example: val ary: **string[]** = [ ... ]
 */
export class ArrayTypeComponent {
  /**
   * //todo 여기가 호출되지 않는 이유는?
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
    type = TypeSystem.createArrayType(TypeSystem.inferType(node.elementType, cache, indent));
    exitLog(log);
    return type;
  }
}

/**
 * ArrayLiteral: '[' items+=Literal (',' items+=Literal )* ']';
 * example: val ary = **[ 1, 2, 3 ]**
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
   * //todo 모두 동일한 타입을 가지는지 검사해야 한다.
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
    if (node.items.length > 0) {
      type = TypeSystem.createArrayType(TypeSystem.inferType(node.items[0], cache, indent));
    }
    exitLog(log);
    return type;
  }
}

/**
 * ArrayExpression: element=[NamedElement:Id] '[' index=Expression ']';
 * example: a = **ary[10]**
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

    result += `${expr.element.$refText}[(${generateExpression(expr.index, indent)}) - 1]`;
    return result;
  }

  /**
   * ArrayExpression의 타입은 array가 아니라 element-type이다.
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: AstNode, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error");
    if (!isArrayExpression(node)) return type;

    // 다른 것들은 node의 타입을 통해서 타입을 추론하지만 이것은 이름을 이용해서 추론해야만 한다.
    const log = enterLog("isArrayExpression", node.element.$refText, indent);
    type = TypeSystem.inferTypeByName(node, node.element.$refText, cache, indent + 1);
    if (TypeSystem.isArrayType(type)) type = type.elementType;
    exitLog(log);
    return type;
  }
}
