import { AstNode } from "langium";
import * as ast from "../language/generated/ast.js";
import { TypeDescription, TypeSystem, enterLog, exitLog, traceLog } from "../language/scala-script-types.js";
import { ObjectTypeComponent } from "./class-components.js";
import { ArrayTypeComponent } from "./array-components.js";
import { generateTypes } from "../cli/generator.js";

/**
 *
 */
export class TypesComponent {
  /**
   *
   * @param expr
   * @param indent
   * @returns
   */
  static transpile(expr: ast.Types | undefined, indent: number): string {
    let result = "";
    if (expr == undefined) return result;
    expr.types.forEach((t, index) => {
      if (index != 0) result += " | ";
      result += SimpleTypeComponent.transpile(t, indent);
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
  static inferType(node: ast.Types, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error");
    const log = enterLog("isAllTypes", node.$cstNode?.text, indent);
    node.types.forEach((t, index) => {
      //todo - union type의 type은 무엇이어야 하는가?
      // 일단은 nil 인 경우는 스킵하고 가장 마지막의 타입을 사용
      const n = SimpleTypeComponent.inferType(t, cache, indent);
      if (TypeSystem.isNilType(n)) return;
      else type = n;
    });
    exitLog(log);
    return type;
  }
}

/**
 *
 */
export class SimpleTypeComponent {
  /**
   *
   * @param expr
   * @param indent
   * @returns
   */
  static transpile(expr: ast.SimpleType, indent: number): string {
    let result = "";
    if (ast.isArrayType(expr)) {
      result += ArrayTypeComponent.transpile(expr, indent);
    } else if (ast.isObjectType(expr)) {
      result += ObjectTypeComponent.transpile(expr, indent);
    } else if (ast.isElementType(expr)) {
      if (ast.isFunctionType(expr)) {
        const list = expr.bindings
          .map((bind) => {
            return bind.name + generateTypes(bind.type, indent);
          })
          .join(", ");
        result += `(${list})` + (expr.returnType ? ` => ${TypesComponent.transpile(expr.returnType, indent)}` : "");
      } else if (ast.isPrimitiveType(expr)) {
        // nil 만 undefined로 바꿔준다.
        if (expr.type == "nil") return "undefined";
        return expr.type;
      } else if (expr.reference) {
        return expr.reference.$refText;
      } else result += "internal error";
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
  static inferType(node: ast.SimpleType, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error");
    const log = enterLog("isSimpleType", node.$cstNode?.text, indent);
    if (ast.isArrayType(node)) {
      traceLog(indent + 1, "Type is array");
      type = ArrayTypeComponent.inferType(node, cache, indent);
    } else if (ast.isObjectType(node)) {
      traceLog(indent + 1, "Type is compound");
      type = ObjectTypeComponent.inferType(node, cache, indent);
    } else if (ast.isElementType(node)) {
      traceLog(indent + 1, "Type is element");
      if (ast.isFunctionType(node)) {
        traceLog(indent + 1, "Type is function");
      } else if (ast.isPrimitiveType(node)) {
        traceLog(indent + 1, "Type is primitive");
        if (node.type === "any") {
          type = TypeSystem.createAnyType();
        } else if (node.type === "nil") {
          type = TypeSystem.createNilType();
        } else if (node.type === "string") {
          type = TypeSystem.createStringType();
        } else if (node.type === "number") {
          type = TypeSystem.createNumberType();
        } else if (node.type === "boolean") {
          type = TypeSystem.createBooleanType();
        } else if (node.type === "void") {
          type = TypeSystem.createVoidType();
        }
      } else if (node.reference) {
        traceLog(indent + 1, "Type is reference");
        if (node.reference.ref) {
          const ref = node.reference.ref;
          if (ast.isTObject(ref)) {
            type = TypeSystem.createClassType(ref);
          } else {
            traceLog(indent + 1, "node.reference.ref is not class");
          }
        } else {
          traceLog(indent + 1, "node.reference.ref is not valid");
        }
      }
    } else type = TypeSystem.createErrorType("Could not infer type for this reference", node);
    exitLog(log);
    return type;
  }
}
