import { AstNode } from "langium";
import * as ast from "../language/generated/ast.js";
import { TypeDescription, TypeSystem } from "../language/scala-script-types.js";
import { enterLog, exitLog } from "../language/scala-script-util.js";
import { generateExpression } from "../cli/generator.js";
import { SimpleTypeComponent } from "./datatype-components.js";

/**
 * ArrayType: elementType=SimpleType '[' ']';
 * example: val ary: **string[]** = [ ... ]
 */
export class ArrayTypeComponent {
  /**
   *
   * @param expr
   * @param indent
   * @returns
   */
  static transpile(expr: ast.ArrayType, indent: number): string {
    return SimpleTypeComponent.transpile(expr.elementType, indent) + "[]";
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: ast.ArrayType, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    const log = enterLog("isArrayType", `'${node.elementType.$cstNode?.text}'`, indent);
    const type = TypeSystem.createArrayType(TypeSystem.inferType(node.elementType, cache, indent));
    exitLog(log, type);
    return type;
  }
}

/**
 * ArrayValue: '[' items+=Literal (',' items+=Literal )* ']';
 * example: val ary = **[ 1, 2, 3 ]**
 */
export class ArrayValueComponent {
  /**
   *
   * @param expr
   * @param indent
   * @returns
   */
  static transpile(expr: ast.ArrayValue, indent: number): string {
    return (
      "[" +
      expr.items
        .map((item) => {
          if (item.item) return item.item.value;
          else if (item.spread) return "..." + item.spread.$refText;
          else return "error";
        })
        .join(", ") +
      "]"
    );
  }

  /**
   * //todo 모두 동일한 타입을 가지는지 검사해야 한다.
   * //todo 또한 함수의 경우 CallChain에서 처리되는데 이것도 거기서 처리되어야 하지 않을까
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: ast.ArrayValue, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    const log = enterLog("isArrayValue", node.items.toString(), indent);
    // item이 없는 경우 즉 [] 으로 표현되는 빈 배열의 경우 any type으로 취급한다.
    if (node.items.length > 0) {
      type = TypeSystem.createArrayType(TypeSystem.inferType(node.items[0], cache, indent));
    } else type = TypeSystem.createAnyType();
    exitLog(log, type);
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
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    // 다른 것들은 node의 타입을 통해서 타입을 추론하지만 이것은 ref을 이용해서 추론해야만 한다.
    const log = enterLog("isArrayExpression", `'${node.element.$refText}'`, indent);
    const ref = node.element.ref;
    type = TypeSystem.inferType(ref, cache, indent + 1);
    if (TypeSystem.isArrayType(type)) type = type.elementType;
    exitLog(log, type);
    return type;
  }
}
