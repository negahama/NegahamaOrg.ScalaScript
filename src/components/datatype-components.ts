import { AstNode } from "langium";
import * as ast from "../language/generated/ast.js";
import { TypeDescription, TypeSystem, enterLog, exitLog, traceLog } from "../language/scala-script-types.js";
import { generateExpression, generateStatement } from "../cli/generator.js";
import { generateBlock, generateType } from "../cli/generator-util.js";

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
    result += "(" + expr.bindings.map((bind) => bind.name + generateType(bind.type)).join(", ");
    result += ")" + generateType(expr.returnType) + " => ";
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
export class SimpleTypeComponent {
  /**
   *
   * @param expr
   * @param indent
   * @returns
   */
  static transpile(expr: ast.SimpleType, indent: number): string {
    return "";
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
      type = TypeSystem.createClassType(node);
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
