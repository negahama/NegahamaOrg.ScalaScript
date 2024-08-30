import { AstNode, ValidationAcceptor } from "langium";
import {
  Assignment,
  Expression,
  isAssignment,
  isLiteral,
  isVariable,
  Statement,
  Variable,
} from "../language/generated/ast.js";
import { TypeDescription, TypeSystem, enterLog, exitLog } from "../language/scala-script-types.js";
import { getTypeCache, isAssignable } from "../language/scala-script-validator.js";
import { generateExpression } from "../cli/generator.js";
import { generateVariable } from "../cli/generator-util.js";

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
  static transpile(stmt: Statement, indent: number): string {
    let result = "";
    if (!isVariable(stmt)) return result;

    if (stmt.annotate == "NotTrans") return result;
    if (stmt.kind == "var") result += "let ";
    if (stmt.kind == "val") result += "const ";
    result += stmt.names.map((name) => generateVariable(name, stmt.type, stmt.value, indent)).join(", ") + ";";
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
    if (!isVariable(node)) return type;

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
  static validationChecks(expr: Variable, accept: ValidationAcceptor): void {
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
      if (isLiteral(expr.value)) {
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
  static transpile(expr: Expression, indent: number): string {
    let result = "";
    if (!isAssignment(expr)) return result;

    const name = generateExpression(expr.assign, indent);
    result += `${name} ${expr.operator} ${generateExpression(expr.value, indent)}`;
    result += isAssignment(expr.value) ? "" : ";";
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
  static inferType(node: AstNode, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error");
    if (!isAssignment(node)) return type;

    const log = enterLog("isAssignment", node.operator, indent);
    if (node.assign) {
      type = TypeSystem.inferType(node.assign, cache, indent + 1);
    } else if (node.value) {
      type = TypeSystem.inferType(node.value, cache, indent + 1);
    } else {
      type = TypeSystem.createErrorType("No type hint for this element", node);
    }
    // console.log("AssignmentComponent.inferType:", type.$type);
    exitLog(log);
    return type;
  }

  /**
   *
   * @param expr
   * @param accept
   */
  static validationChecks(expr: Assignment, accept: ValidationAcceptor): void {
    // console.log("checkAssignment");
    const map = getTypeCache();
    // console.log(`    left: ${expr.assign.$container.$type}, ${expr.assign.$type}, ${expr.assign.$cstNode?.text}`);
    const left = TypeSystem.inferType(expr.assign, map);
    // console.log(`    left: ${left.$type}`);
    // console.log(`    right: ${expr.value.$container.$type}, ${expr.value.$type}, ${expr.value.$cstNode?.text}`);
    const right = TypeSystem.inferType(expr.value, map);
    // console.log(`    right: ${right.$type}`);
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
  }
}
