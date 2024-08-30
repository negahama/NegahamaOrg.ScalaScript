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
  static transpile(expr: ast.Expression, indent: number): string {
    let result = "";
    if (!ast.isLambdaCall(expr)) return result;

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
  static inferType(node: AstNode, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error");
    if (!ast.isLambdaCall(node)) return type;

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
  static transpile(expr: ast.Expression, indent: number): string {
    let result = "";
    if (!ast.isSimpleType(expr)) return result;

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
    if (!ast.isSimpleType(node)) return type;

    const log = enterLog("isSimpleType", undefined, indent);
    if (ast.isTupleType(node)) {
      traceLog(indent + 1, "it's TupleType");
      // type = { $type: "tuple" };
    } else if (ast.isObjectType(node)) {
      traceLog(indent + 1, "it's ObjectType");
      // type = { $type: "object" };
      // } else if (node.returnType) {
      //   const returnType = inferType(node.returnType, cache);
      //   const parameters = node.parameters.map((e, i) => ({
      //     name: e.name ?? `$${i}`,
      //     type: inferType(e.type, cache, indent + 1),
      //   }));
      //   type = createFunctionType(returnType, parameters);
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
        } else if (ast.isTypeDeclaration(ref)) {
          traceLog(indent + 1, "it's TypeDeclaration");
          // type = {
          //   $type: "type-dec",
          //   object: ref.value,
          // };
        } else {
          traceLog(indent + 1, "it's other-ref");
          // type = { $type: "other-ref" };
        }
      } else {
        traceLog(indent + 1, "it's not node.reference.ref");
      }
    } else type = TypeSystem.createErrorType("Could not infer type for this reference", node);
    exitLog(log);
    return type;
  }
}
