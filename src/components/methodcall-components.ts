import { AstNode, AstUtils, ValidationAcceptor } from "langium";
import * as ast from "../language/generated/ast.js";
import { TypeDescription, TypeSystem, enterLog, exitLog, traceLog } from "../language/scala-script-types.js";
import { generateBlock, generateExpression, generateFunction, generateStatement } from "../cli/generator.js";
import { getTypeCache, isAssignable } from "../language/scala-script-validator.js";
import { AllTypesComponent } from "./datatype-components.js";

/**
 *
 */
export class FunctionComponent {
  /**
   *
   * @param stmt
   * @param indent
   * @returns
   */
  static transpile(stmt: ast.TFunction, indent: number): string {
    return generateFunction(stmt, indent);
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: ast.TFunction, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    const log = enterLog("isFunction", node.name, indent);
    const returnType = TypeSystem.inferType(node.returnType, cache, indent + 1);
    const parameters = node.parameters.map((e) => ({
      name: e.name,
      type: TypeSystem.inferType(e.type, cache, indent + 2),
    }));
    const type = TypeSystem.createFunctionType(returnType, parameters);
    exitLog(log);
    return type;
  }

  /**
   *
   * @param method
   * @param accept
   */
  static validationChecks(method: ast.TFunction, accept: ValidationAcceptor): void {
    checkMethodReturnType(method, accept);
  }
}

/**
 *
 * @param method
 * @param accept
 * @returns
 */
export function checkMethodReturnType(method: ast.TFunction | ast.Method, accept: ValidationAcceptor): void {
  // console.log("checkMethodReturnType");
  if (method.body && method.returnType) {
    const map = getTypeCache();
    const returnStatements = AstUtils.streamAllContents(method.body).filter(ast.isReturnExpression).toArray();
    const expectedType = TypeSystem.inferType(method.returnType, map);
    if (returnStatements.length === 0 && !TypeSystem.isVoidType(expectedType)) {
      accept("error", "A function whose declared type is not 'void' must return a value.", {
        node: method.returnType,
      });
      return;
    }
    for (const returnStatement of returnStatements) {
      const returnValueType = TypeSystem.inferType(returnStatement, map);
      if (!isAssignable(returnValueType, expectedType)) {
        const msg = `Type '${TypeSystem.typeToString(
          returnValueType
        )}' is not assignable to type '${TypeSystem.typeToString(expectedType)}'.`;
        accept("error", msg, {
          node: returnStatement,
        });
      }
    }
  }
}

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
  static transpile(expr: ast.MethodCall, indent: number): string {
    let result = "";
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
  static inferType(node: ast.MethodCall, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error");
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

/**
 *
 */
export class LambdaCallComponent {
  /**
   *
   * @param expr
   * @param indent
   * @returns
   */
  static transpile(expr: ast.LambdaCall, indent: number): string {
    let result = "";
    result += "(" + expr.bindings.map((bind) => bind.name + AllTypesComponent.transpile(bind.type, indent)).join(", ");
    result += ")" + AllTypesComponent.transpile(expr.returnType, indent) + " => ";
    result += generateBlock(expr.body, indent, (lastCode: ast.Code, indent: number) => {
      if (ast.isStatement(lastCode)) return generateStatement(lastCode, indent);
      else if (ast.isExpression(lastCode)) return generateExpression(lastCode, indent);
      else return "";
    });
    return result;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: ast.LambdaCall, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    return TypeSystem.createErrorType("internal error");
  }
}
