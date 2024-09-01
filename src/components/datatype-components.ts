import { AstNode } from "langium";
import * as ast from "../language/generated/ast.js";
import { TypeDescription, TypeSystem, enterLog, exitLog, traceLog } from "../language/scala-script-types.js";
import { generateBlock, generateExpression, generateStatement } from "../cli/generator.js";
import { ClassTypeComponent } from "./class-components.js";

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

/**
 *
 */
export class AllTypesComponent {
  /**
   *
   * @param expr
   * @param indent
   * @returns
   */
  static transpile(expr: ast.AllTypes | undefined, indent: number): string {
    const typeonly = (t: ast.AllTypes | undefined) => {
      if (t == undefined) return "";
      if (ast.isSimpleType(t)) {
        if (t.reference) {
          return t.reference.$refText;
        } else if (ast.isPrimitiveType(t)) {
          return t.type;
        }
      } else if (ast.isArrayType(t)) {
        if (t.elementType.reference) {
          return t.elementType.reference.$refText + "[]";
        } else if (ast.isPrimitiveType(t.elementType)) {
          return t.elementType.type + "[]";
        }
      }
      return "";
    };

    let result = "";
    if (expr == undefined) return result;
    result += ": ";
    if (ast.isLambdaType(expr)) {
      const list = expr.bindings.map((bind) => bind.name + ": " + typeonly(bind.type)).join(", ");
      result += `(${list})` + (expr.returnType ? ` => ${typeonly(expr.returnType)}` : "");
    } else if (ast.isArrayType(expr)) {
      result += typeonly(expr);
    } else if (ast.isSimpleType(expr)) {
      result += SimpleTypeComponent.transpile(expr, 0);
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
  static inferType(node: ast.AllTypes, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error");
    const log = enterLog("isAllTypes", undefined, indent);
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
    const typeonly = (t: ast.AllTypes | undefined) => {
      if (t == undefined) return "";
      if (ast.isSimpleType(t)) {
        if (t.reference) {
          return t.reference.$refText;
        } else if (ast.isPrimitiveType(t)) {
          return t.type;
        }
      } else if (ast.isArrayType(t)) {
        if (t.elementType.reference) {
          return t.elementType.reference.$refText + "[]";
        } else if (ast.isPrimitiveType(t.elementType)) {
          return t.elementType.type + "[]";
        }
      }
      return "";
    };

    let result = "";
    if (ast.isTupleType(expr)) {
      const list = expr.types.map((t) => typeonly(t)).join(", ");
      result += `[${list}]`;
    } else if (ast.isClassType(expr)) {
      result += ClassTypeComponent.transpile(expr, indent);
    } else result += typeonly(expr);
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
    const log = enterLog("isSimpleType", undefined, indent);
    if (ast.isTupleType(node)) {
      traceLog(indent + 1, "it's TupleType");
      console.log("it's TupleType, Not support yet");
    } else if (ast.isClassType(node)) {
      type = ClassTypeComponent.inferType(node, cache, indent);
    } else if (ast.isPrimitiveType(node)) {
      traceLog(indent + 1, "Type is primitive");
      if (node.type === "number") {
        type = TypeSystem.createNumberType();
      } else if (node.type === "string") {
        type = TypeSystem.createStringType();
      } else if (node.type === "boolean") {
        type = TypeSystem.createBooleanType();
      } else if (node.type === "void") {
        type = TypeSystem.createVoidType();
      }
    } else if (node.reference) {
      traceLog(indent + 1, "Type is reference");
      if (node.reference.ref) {
        const ref = node.reference.ref;
        if (ast.isClass(ref)) {
          type = TypeSystem.createClassType(ref);
        } else {
          traceLog(indent + 1, "node.reference.ref is not class");
        }
      } else {
        traceLog(indent + 1, "node.reference.ref is not valid");
      }
    } else type = TypeSystem.createErrorType("Could not infer type for this reference", node);
    exitLog(log);
    return type;
  }
}
