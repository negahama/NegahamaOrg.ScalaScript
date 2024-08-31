import { AstNode } from "langium";
import * as ast from "../language/generated/ast.js";
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
  static transpile(expr: ast.ArrayType, indent: number): string {
    return "";
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: ast.ArrayType, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    const log = enterLog("isArrayType", node.elementType.$cstNode?.text, indent);
    const type = TypeSystem.createArrayType(TypeSystem.inferType(node.elementType, cache, indent));
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
  static transpile(expr: ast.ArrayLiteral, indent: number): string {
    return "[" + expr.items.map((item) => item.value).join(", ") + "]";
  }

  /**
   * //todo 모두 동일한 타입을 가지는지 검사해야 한다.
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: ast.ArrayLiteral, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error");
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
  static transpile(expr: ast.ArrayExpression, indent: number): string {
    return `${expr.element.$refText}[(${generateExpression(expr.index, indent)}) - 1]`;
  }

  /**
   * ArrayExpression의 타입은 array가 아니라 element-type이다.
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: ast.ArrayExpression, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error");
    // 다른 것들은 node의 타입을 통해서 타입을 추론하지만 이것은 이름을 이용해서 추론해야만 한다.
    const log = enterLog("isArrayExpression", node.element.$refText, indent);
    type = TypeSystem.inferTypeByName(node, node.element.$refText, cache, indent + 1);
    if (TypeSystem.isArrayType(type)) type = type.elementType;
    exitLog(log);
    return type;
  }
}
