import { AstNode } from "langium";
import * as ast from "../language/generated/ast.js";
import { TypeDescription, TypeSystem, enterLog, exitLog, traceLog } from "../language/scala-script-types.js";
import { generateExpression } from "../cli/generator.js";

/**
 *
 */
export class MethodCallComponent {
  /**
   *
   * @param expr
   * @param indent
   * @returns
   */
  static transpile(expr: ast.Expression, indent: number): string {
    let result = "";
    if (!ast.isMethodCall(expr)) return result;

    if (expr.previous) {
      result += generateExpression(expr.previous, indent);
      result += expr.element ? "." + expr.element.$refText : "";
    } else {
      result += expr.this ? expr.this : "";
      result += expr.element ? expr.element.$refText : "";
    }
    if (expr.explicitCall) {
      // endsWith()의 endPosition은 1부터 카운트되므로 제외
      const methodsUsingArrayIndex = [
        { methodName: "charAt", argIndices: [0] },
        { methodName: "charCodeAt", argIndices: [0] },
        { methodName: "codePointAt", argIndices: [0] },
        { methodName: "includes", argIndices: [1] },
        { methodName: "indexOf", argIndices: [1] },
        { methodName: "lastIndexOf", argIndices: [1] },
        { methodName: "slice", argIndices: [0, 1] },
        { methodName: "startsWith", argIndices: [1] },
        { methodName: "substring", argIndices: [0, 1] },
        { methodName: "at", argIndices: [0] },
      ];
      const found = methodsUsingArrayIndex.find((e) => e.methodName == expr.element?.$refText);
      if (found) {
        result += "(";
        expr.args.map((arg, index) => {
          if (index != 0) result += ", ";
          result += generateExpression(arg, indent) + (found.argIndices.includes(index) ? " - 1" : "");
        });
        result += ")";
      } else {
        result += "(" + expr.args.map((arg) => generateExpression(arg, indent)).join(", ") + ")";
      }
    }
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
    if (!ast.isMethodCall(node)) return type;

    const id = node.element?.$refText;
    const log = enterLog("isMethodCall", id, indent);
    traceLog(indent + 1, "ref 참조전:", id);
    const element = node.element?.ref;
    traceLog(indent + 1, "ref 참조후:", id);
    if (element) {
      type = TypeSystem.inferType(element, cache, indent + 1);
    } else if (node.explicitCall && node.previous) {
      const previousType = TypeSystem.inferType(node.previous, cache, indent + 1);
      if (TypeSystem.isFunctionType(previousType)) type = previousType.returnType;
      else type = TypeSystem.createErrorType("Cannot call operation on non-function type", node);
    } else type = TypeSystem.createErrorType("Could not infer type for element " + node.element?.$refText, node);
    if (node.explicitCall) {
      if (TypeSystem.isFunctionType(type)) type = type.returnType;
    }
    exitLog(log);
    return type;
  }
}
