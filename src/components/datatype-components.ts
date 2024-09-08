import { AstNode } from "langium";
import * as ast from "../language/generated/ast.js";
import { TypeDescription, TypeSystem } from "../language/scala-script-types.js";
import { enterLog, exitLog, traceLog } from "../language/scala-script-util.js";
import { ObjectTypeComponent } from "./class-components.js";
import { ArrayTypeComponent } from "./array-components.js";
import { FunctionTypeComponent } from "./function-components.js";

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
    let type: TypeDescription;
    const log = enterLog("isAllTypes", `'${node.$cstNode?.text}'`, indent);
    const ts = node.types.map((t) => SimpleTypeComponent.inferType(t, cache, indent));
    // 실제 Union 타입이 아니면 처리를 단순화하기 위해 개별 타입으로 리턴한다.
    if (ts.length == 0) type = TypeSystem.createErrorType("internal error", node);
    else if (ts.length == 1) type = ts[0];
    else type = TypeSystem.createUnionType(ts);
    exitLog(log, type);
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
      result += ElementTypeComponent.transpile(expr, indent);
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
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    const log = enterLog("isSimpleType", `'${node.$cstNode?.text}'`, indent);
    if (ast.isArrayType(node)) {
      type = ArrayTypeComponent.inferType(node, cache, indent + 1);
    } else if (ast.isObjectType(node)) {
      type = ObjectTypeComponent.inferType(node, cache, indent + 1);
    } else if (ast.isElementType(node)) {
      type = ElementTypeComponent.inferType(node, cache, indent + 1);
    }
    exitLog(log, type);
    return type;
  }
}

/**
 *
 */
export class ElementTypeComponent {
  /**
   *
   * @param expr
   * @param indent
   * @returns
   */
  static transpile(expr: ast.ElementType, indent: number): string {
    let result = "";
    if (ast.isFunctionType(expr)) {
      result += FunctionTypeComponent.transpile(expr, indent);
    } else if (ast.isPrimitiveType(expr)) {
      result += PrimitiveTypeComponent.transpile(expr, indent);
    } else if (expr.reference) {
      return expr.reference.$refText;
    } else result += "internal error";
    return result;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: ast.ElementType, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    const log = enterLog("isElementType", `'${node.$cstNode?.text}'`, indent);
    if (ast.isFunctionType(node)) {
      type = FunctionTypeComponent.inferType(node, cache, indent);
    } else if (ast.isPrimitiveType(node)) {
      type = PrimitiveTypeComponent.inferType(node, cache, indent);
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
    exitLog(log, type);
    return type;
  }
}

/**
 *
 */
export class PrimitiveTypeComponent {
  /**
   *
   * @param expr
   * @param indent
   * @returns
   */
  static transpile(expr: ast.PrimitiveType, indent: number): string {
    // nil 만 undefined로 바꿔준다.
    if (expr.type == "nil") return "undefined";
    return expr.type;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: ast.PrimitiveType, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    const log = enterLog("isPrimitiveType", `'${node.$cstNode?.text}'`, indent);
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
    exitLog(log, type);
    return type;
  }
}
