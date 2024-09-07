import { AstNode, AstUtils, ValidationAcceptor } from "langium";
import * as ast from "../language/generated/ast.js";
import { TypeDescription, TypeSystem, enterLog, exitLog, traceLog } from "../language/scala-script-types.js";
import { generateBlock, generateExpression, generateStatement, generateTypes } from "../cli/generator.js";
import { getTypeCache } from "../language/scala-script-validator.js";

/**
 *
 */
export class FunctionComponent {
  /**
   *
   * @param stmt
   * @param indent
   * @param isClassMethod
   * @returns
   */
  static transpile(stmt: ast.TFunction, indent: number, isClassMethod: boolean = false): string {
    const params = stmt.params
      .map((param) => {
        let p = param.name + (param.nullable ? "?" : "") + generateTypes(param.type, indent);
        p += param.value ? ` = ${generateExpression(param.value, indent)}` : "";
        return p;
      })
      .join(", ");

    let result = "";
    if (stmt.annotate == "NotTrans") return result;
    if (ast.isTFunction(stmt)) {
      if (stmt.export) result += "export ";
      if (stmt.private) result += "private ";
      if (stmt.static) result += "static ";
    }
    if (!isClassMethod) result += "function ";
    result += `${stmt.name}(${params})${generateTypes(stmt.returnType, indent)} `;
    // generateBlock에 전달되는 indent는 function level인데 generateBlock에서는 이를 모두 +1 해서 쓰고 있다.
    // 그래서 익명 함수가 받는 indent는 +1되어진 것이다.
    result += stmt.body
      ? generateBlock(stmt.body, indent, (lastCode: ast.Code, indent: number) => {
          if (ast.isStatement(lastCode)) return generateStatement(lastCode, indent);
          else if (ast.isExpression(lastCode)) return generateExpression(lastCode, indent);
          else return "";
        })
      : "";
    return result;
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
    const parameters = node.params.map((e) => ({
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
export function checkMethodReturnType(method: ast.TFunction, accept: ValidationAcceptor): void {
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
    //todo
    // for (const returnStatement of returnStatements) {
    //   const returnValueType = TypeSystem.inferType(returnStatement, map);
    //   if (!isAssignable(returnValueType, expectedType)) {
    //     const msg = `Type '${TypeSystem.typeToString(
    //       returnValueType
    //     )}' is not assignable to type '${TypeSystem.typeToString(expectedType)}'.`;
    //     accept("error", msg, {
    //       node: returnStatement,
    //     });
    //   }
    // }
  }
}

/**
 *
 */
export class CallChainComponent {
  /**
   *
   * @param expr
   * @param indent
   * @returns
   */
  static transpile(expr: ast.CallChain, indent: number): string {
    let result = "";
    if (expr.previous) {
      result += generateExpression(expr.previous, indent);
      result += expr.element ? "." + expr.element.$refText : "";
    } else {
      result += expr.this ? expr.this : "";
      result += expr.element ? expr.element.$refText : "";
    }
    if (expr.isFunction) {
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
    if (expr.isArray) {
      result += "[" + generateExpression(expr.index, indent) + "]";
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
  static inferType(node: ast.CallChain, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error");
    const id = node.element?.$refText;
    const log = enterLog("isCallChain", id, indent);
    traceLog(indent + 1, "ref 참조전:", id);
    const element = node.element?.ref;
    traceLog(indent + 1, "ref 참조후:", id);
    if (element) {
      type = TypeSystem.inferType(element, cache, indent + 1);
    } else if (node.isFunction && node.previous) {
      const previousType = TypeSystem.inferType(node.previous, cache, indent + 1);
      if (TypeSystem.isFunctionType(previousType)) type = previousType.returnType;
      else type = TypeSystem.createErrorType("Cannot call operation on non-function type", node);
    } else if (node.isArray) {
      //todo 해당 배열의 자료형이 무엇인지 어떻게 알아낼 수 있을까
      type = TypeSystem.createArrayType(TypeSystem.createAnyType());
    } else type = TypeSystem.createErrorType("Could not infer type for element " + node.element?.$refText, node);
    if (node.isFunction) {
      if (TypeSystem.isFunctionType(type)) type = type.returnType;
    }
    exitLog(log);
    return type;
  }
}

/**
 *
 */
export class FunctionValueComponent {
  /**
   *
   * @param expr
   * @param indent
   * @returns
   */
  static transpile(expr: ast.FunctionValue, indent: number): string {
    let result = "";
    result += "(" + expr.bindings.map((bind) => bind.name + generateTypes(bind.type, indent)).join(", ");
    result += ")" + generateTypes(expr.returnType, indent) + " => ";
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
  static inferType(node: ast.FunctionValue, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error");
    const log = enterLog("isFunctionValue", node.$type, indent);
    if (node.returnType) type = TypeSystem.inferType(node.returnType, cache, indent);
    exitLog(log);
    return type;
  }
}
