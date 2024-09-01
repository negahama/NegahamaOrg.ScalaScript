import { AstNode, ValidationAcceptor } from "langium";
import * as ast from "../language/generated/ast.js";
import { TypeDescription, TypeSystem, enterLog, exitLog } from "../language/scala-script-types.js";
import { getTypeCache, isAssignable } from "../language/scala-script-validator.js";
import { generateExpression } from "../cli/generator.js";
import { AllTypesComponent } from "./datatype-components.js";

/**
 *
 */
export class VariableComponent {
  /**
   *
   * @param stmt
   * @param indent
   * @returns
   */
  static transpile(stmt: ast.Variable, indent: number): string {
    const generateVariable = (name: string, v: ast.Variable, indent: number) => {
      return (
        name +
        AllTypesComponent.transpile(v.type, indent) +
        (v.value ? " = " + generateExpression(v.value, indent) : "")
      );
    };

    let result = "";
    if (stmt.annotate == "NotTrans") return result;
    if (stmt.kind == "var") result += "let ";
    if (stmt.kind == "val") result += "const ";
    result += stmt.names.map((name) => generateVariable(name, stmt, indent)).join(", ") + ";";
    return result;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: ast.Variable, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error");
    const log = enterLog("isVariable", node.names.toString(), indent);
    if (node.type) {
      type = TypeSystem.inferType(node.type, cache, indent + 1);
    } else if (node.value) {
      type = TypeSystem.inferType(node.value, cache, indent + 1);
    } else {
      type = TypeSystem.createErrorType("No type hint for this element", node);
    }
    exitLog(log);
    return type;
  }

  /**
   *
   * @param expr
   * @param accept
   */
  static validationChecks(expr: ast.Variable, accept: ValidationAcceptor): void {
    // console.log("checkVariableDeclaration");
    // const text = AstUtils.getDocument(expr).parseResult.value.$cstNode?.text;
    // const text = (AstUtils.getDocument(expr).parseResult.value.$cstNode as RootCstNode).fullText;
    // console.log(text);
    // const thenKeyword = GrammarUtils.findNodeForKeyword(expr.$cstNode, "=");
    // if (thenKeyword) {
    //   const index = thenKeyword.offset;
    //   const previousChar = text.charAt(index - 1);
    //   if (previousChar !== ' ') {
    //     acceptor('error', ...);
    //   }
    // }

    // console.log("    expr.names:", expr.names);
    // console.log("    expr.type:", `'${expr.type?.$cstNode?.text}'`);
    // console.log("    expr.value:", `${expr.value?.$type}, '${expr.value?.$cstNode?.text}'`);
    if (expr.type == undefined) {
      if (ast.isLiteral(expr.value)) {
        // console.log("    expr.value:", expr.value.$type, expr.value.value, typeof expr.value.value);
      }
    }
    if (expr.type && expr.value) {
      const map = getTypeCache();
      const left = TypeSystem.inferType(expr.type, map);
      const right = TypeSystem.inferType(expr.value, map);
      // console.log("    left:", left.$type);
      // console.log("    right:", right.$type);
      if (!isAssignable(right, left)) {
        accept(
          "error",
          `Type '${TypeSystem.typeToString(right)}' is not assignable to type '${TypeSystem.typeToString(left)}'.`,
          {
            node: expr,
            property: "value",
          }
        );
      }
    } else if (!expr.type && !expr.value) {
      accept("error", "Variables require a type hint or an assignment at creation", {
        node: expr,
        property: "names",
      });
    }
  }
}

/**
 *
 */
export class AssignmentComponent {
  /**
   *
   * @param expr
   * @param indent
   * @returns
   */
  static transpile(expr: ast.Assignment, indent: number): string {
    let result = "";
    const name = generateExpression(expr.assign, indent);
    result += `${name} ${expr.operator} ${generateExpression(expr.value, indent)}`;
    result += ast.isAssignment(expr.value) ? "" : ";";
    return result;
  }

  /**
   * //todo 다중 대입문이 아니면 이게 호출되지 않는 이유?
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: ast.Assignment, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error");
    const log = enterLog("isAssignment", node.operator, indent);
    if (node.assign) {
      type = TypeSystem.inferType(node.assign, cache, indent + 1);
    } else if (node.value) {
      type = TypeSystem.inferType(node.value, cache, indent + 1);
    } else {
      type = TypeSystem.createErrorType("No type hint for this element", node);
    }
    exitLog(log);
    return type;
  }

  /**
   *
   * @param expr
   * @param accept
   */
  static validationChecks(expr: ast.Assignment, accept: ValidationAcceptor): void {
    // console.log("checkAssignment");
    // console.log(`    left: ${expr.assign.$container.$type}, ${expr.assign.$type}, ${expr.assign.$cstNode?.text}`);
    // console.log(`    right: ${expr.value.$container.$type}, ${expr.value.$type}, ${expr.value.$cstNode?.text}`);
    const map = getTypeCache();
    const left = TypeSystem.inferType(expr.assign, map);
    const right = TypeSystem.inferType(expr.value, map);
    if (!isAssignable(right, left)) {
      const msg = `Type '${TypeSystem.typeToString(right)}' is not assignable to type '${TypeSystem.typeToString(
        left
      )}'.`;
      accept("error", msg, {
        node: expr,
        property: "value",
      });
    }
  }
}
