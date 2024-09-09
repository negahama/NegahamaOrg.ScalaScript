import { AstNode, ValidationAcceptor } from "langium";
import * as ast from "../language/generated/ast.js";
import { TypeDescription, TypeSystem } from "../language/scala-script-types.js";
import { enterLog, exitLog } from "../language/scala-script-util.js";
import { getTypeCache, isLegalOperation } from "../language/scala-script-validator.js";
import {
  generateExpression,
  generateStatement,
  applyIndent,
  generateBlock,
  generateCondition,
} from "../cli/generator.js";
import { SimpleTypeComponent } from "./datatype-components.js";

/**
 *
 */
export class UnaryExpressionComponent {
  /**
   *
   * @param expr
   * @param indent
   * @returns
   */
  static transpile(expr: ast.UnaryExpression, indent: number): string {
    let op = "";
    switch (expr.operator) {
      case "not": {
        op = "!";
        break;
      }
      default: {
        op = expr.operator;
      }
    }
    return `${op} ${generateExpression(expr.value, indent)}`;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: ast.UnaryExpression, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    const log = enterLog("isUnaryExpression", node.operator, indent);
    if (node.operator === "!" || node.operator === "not") {
      type = TypeSystem.createBooleanType();
    } else if (node.operator === "typeof" || node.operator === "instanceof") {
      type = TypeSystem.createStringType();
    } else {
      type = TypeSystem.createNumberType();
    }
    exitLog(log, type);
    return type;
  }

  /**
   *
   * @param unary
   * @param accept
   */
  static validationChecks(unary: ast.UnaryExpression, accept: ValidationAcceptor): void {
    // console.log("checkUnaryOperationAllowed");
    const item = TypeSystem.inferType(unary.value, getTypeCache());
    if (!isLegalOperation(unary.operator, item)) {
      accept(
        "error",
        `Cannot perform operation '${unary.operator}' on value of type '${TypeSystem.typeToString(item)}'.`,
        {
          node: unary,
        }
      );
    }
  }
}

/**
 *
 */
export class BinaryExpressionComponent {
  /**
   *
   * @param expr
   * @param indent
   * @returns
   */
  static transpile(expr: ast.BinaryExpression, indent: number): string {
    let op = "";
    switch (expr.operator) {
      case "and": {
        op = "&&";
        break;
      }
      case "or": {
        op = "||";
        break;
      }
      case "..": {
        op = "+";
        break;
      }
      default: {
        op = expr.operator;
      }
    }
    return `${generateExpression(expr.left, indent)} ${op} ${generateExpression(expr.right, indent)}`;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: ast.BinaryExpression, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    const log = enterLog("isBinaryExpression", node.operator, indent);
    type = TypeSystem.createErrorType("Could not infer type from binary expression", node);
    if (["and", "or", "&&", "||", "<", "<=", ">", ">=", "==", "!="].includes(node.operator)) {
      type = TypeSystem.createBooleanType();
    } else if (["-", "+", "**", "*", "/", "%"].includes(node.operator)) {
      type = TypeSystem.createNumberType();
    } else if ([".."].includes(node.operator)) {
      const left = TypeSystem.inferType(node.left, cache, indent + 1);
      const right = TypeSystem.inferType(node.right, cache, indent + 1);
      if (TypeSystem.isStringType(left) || TypeSystem.isStringType(right)) {
        type = TypeSystem.createStringType();
      }
    }
    exitLog(log, type);
    return type;
  }

  /**
   *
   * @param binary
   * @param accept
   */
  static validationChecks(binary: ast.BinaryExpression, accept: ValidationAcceptor): void {
    // console.log("checkBinaryOperationAllowed");
    // const expr = `'${binary.left.$cstNode?.text}' '${binary.operator}' '${binary.right.$cstNode?.text}'`;
    // console.log(`    expression: ${expr}`);

    const map = getTypeCache();
    const left = TypeSystem.inferType(binary.left, map);
    const right = TypeSystem.inferType(binary.right, map);
    // console.log(`    type1: ${left.$type}, ${right.$type}`);
    // console.log(`    type2: ${TypeSystem.typeToString(left)}, ${TypeSystem.typeToString(right)}`);
    if (!isLegalOperation(binary.operator, left, right)) {
      const msg =
        `Cannot perform operation '${binary.operator}' on values of type ` +
        `'${TypeSystem.typeToString(left)}' and '${TypeSystem.typeToString(right)}'.`;
      accept("error", msg, { node: binary });
    } else if (["==", "!="].includes(binary.operator)) {
      if (!isLegalOperation(binary.operator, left, right)) {
        const msg = `This comparison will always return '${
          binary.operator === "==" ? "false" : "true"
        }' as types '${TypeSystem.typeToString(left)}' and '${TypeSystem.typeToString(right)}' are not compatible.`;
        accept("warning", msg, {
          node: binary,
          property: "operator",
        });
      }
    }
  }
}

/**
 *
 */
export class IfExpressionComponent {
  /**
   *
   * @param expr
   * @param indent
   * @returns
   */
  static transpile(expr: ast.IfExpression, indent: number): string {
    let result = "";
    // 삼항 연산자 처리
    if (
      expr.then &&
      !expr.then.isBracket &&
      expr.then.codes.length == 1 &&
      ast.isExpression(expr.then.codes[0]) &&
      expr.else &&
      !expr.else.isBracket &&
      expr.else.codes.length == 1 &&
      ast.isExpression(expr.else.codes[0]) &&
      (expr.elif == undefined || expr.elif.length == 0)
    ) {
      result += `${generateCondition(expr.condition, indent)} ? `;

      // then 절에 해당하는 부분은 세미콜론을 포함하지 않아야 한다.
      let then = generateExpression(expr.then.codes[0], indent);
      if (then.endsWith(";")) {
        then = then.slice(0, then.lastIndexOf(";"));
      }

      result += then + " : ";
      result += generateExpression(expr.else.codes[0], indent);
      return result;
    }

    result += "if " + generateCondition(expr.condition, indent) + " ";
    if (expr.then) {
      result += generateBlock(expr.then, indent);
    }
    expr.elif.forEach((elif) => {
      result += "\n" + applyIndent(indent, "else if " + generateCondition(elif.condition, indent) + " ");
      if (elif.elif) {
        result += generateBlock(elif.elif, indent);
      }
    });
    if (expr.else) {
      result += "\n" + applyIndent(indent, "else " + generateBlock(expr.else, indent));
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
  static inferType(node: ast.IfExpression, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    const log = enterLog("isIfExpression", node.$type, indent);
    //todo 삼항연산자의 경우 inferType이 호출될 수 있다... 일단은 any type return
    type = TypeSystem.createAnyType();
    exitLog(log, type);
    return type;
  }
}

/**
 *
 */
export class MatchExpressionComponent {
  /**
   *
   * @param expr
   * @param indent
   * @returns
   */
  static transpile(expr: ast.MatchExpression, indent: number): string {
    let result = "";
    result += `switch (${generateExpression(expr.expr, indent)}) {\n`;
    expr.cases.forEach((mc) => {
      if (ast.isLiteral(mc.pattern)) {
        const pattern = generateExpression(mc.pattern, indent);
        result += applyIndent(indent + 1, `case ${pattern}: `);
      } else {
        result += applyIndent(indent + 1, `default: `);
      }
      result +=
        generateBlock(mc.body, indent + 1, (lastCode, indent) => {
          if (ast.isStatement(lastCode)) return generateStatement(lastCode, indent);
          else if (ast.isExpression(lastCode)) return generateExpression(lastCode, indent) + ";";
          else return "";
        }) + "\n";
    });
    result += applyIndent(indent, "}");
    return result;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: ast.MatchExpression, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    const log = enterLog("isMatchExpression", node.$type, indent);
    exitLog(log, type);
    return type;
  }
}

/**
 *
 */
export class NewExpressionComponent {
  /**
   *
   * @param expr
   * @param indent
   * @returns
   */
  static transpile(expr: ast.NewExpression, indent: number): string {
    let result = `new ${expr.class.$refText}`;
    if (expr.generic) {
      result += "<";
      expr.generic.types.forEach((t, index) => {
        if (index != 0) result += ", ";
        result += SimpleTypeComponent.transpile(t, indent);
      });
      result += ">";
    }
    result += "(";
    expr.args.map((arg, index) => {
      if (index != 0) result += ", ";
      result += generateExpression(arg, indent);
    });
    result += ")";
    return result;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: ast.NewExpression, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    const log = enterLog("isNewExpression", node.$type, indent);
    if (node.class.ref) {
      type = TypeSystem.createClassType(node.class.ref);
    }
    exitLog(log, type);
    return type;
  }
}
