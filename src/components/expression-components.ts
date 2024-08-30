import { AstNode, ValidationAcceptor } from "langium";
import {
  BinaryExpression,
  Expression,
  isBinaryExpression,
  isExpression,
  isIfExpression,
  isLiteral,
  isMatchExpression,
  isStatement,
  isUnaryExpression,
  UnaryExpression,
} from "../language/generated/ast.js";
import { TypeDescription, TypeSystem, enterLog, exitLog } from "../language/scala-script-types.js";
import { getTypeCache, isAssignable } from "../language/scala-script-validator.js";
import { applyIndent, generateBlock, generateCondition } from "../cli/generator-util.js";
import { generateExpression, generateStatement } from "../cli/generator.js";

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
  static transpile(expr: Expression, indent: number): string {
    let result = "";
    if (!isUnaryExpression(expr)) return result;

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
    result += `${op} ${generateExpression(expr.value, indent)}`;
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
    if (!isUnaryExpression(node)) return type;

    const log = enterLog("isUnaryExpression", node.operator, indent);
    if (node.operator === "!" || node.operator === "not") {
      type = TypeSystem.createBooleanType();
    } else {
      type = TypeSystem.createNumberType();
    }
    exitLog(log);
    return type;
  }

  /**
   *
   * @param unary
   * @param accept
   */
  static validationChecks(unary: UnaryExpression, accept: ValidationAcceptor): void {
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
  static transpile(expr: Expression, indent: number): string {
    let result = "";
    if (!isBinaryExpression(expr)) return result;

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
    result += `${generateExpression(expr.left, indent)} ${op} ${generateExpression(expr.right, indent)}`;
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
    if (!isBinaryExpression(node)) return type;

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
    exitLog(log);
    return type;
  }

  /**
   *
   * @param binary
   * @param accept
   */
  static validationChecks(binary: BinaryExpression, accept: ValidationAcceptor): void {
    console.log("checkBinaryOperationAllowed");
    const expr = `'${binary.left.$cstNode?.text}' '${binary.operator}' '${binary.right.$cstNode?.text}'`;
    console.log(`    expression: ${expr}`);

    const map = getTypeCache();
    const left = TypeSystem.inferType(binary.left, map);
    const right = TypeSystem.inferType(binary.right, map);
    console.log(`    type1: ${left.$type}, ${right.$type}`);
    console.log(`    type2: ${TypeSystem.typeToString(left)}, ${TypeSystem.typeToString(right)}`);
    if (!isLegalOperation(binary.operator, left, right)) {
      const msg =
        `Cannot perform operation '${binary.operator}' on values of type ` +
        `'${TypeSystem.typeToString(left)}' and '${TypeSystem.typeToString(right)}'.`;
      accept("error", msg, { node: binary });
    } else if (["==", "!="].includes(binary.operator)) {
      if (!isAssignable(right, left)) {
        const msg =
          `This comparison will always return '${binary.operator === "==" ? "false" : "true"}' ` +
          `as types '${TypeSystem.typeToString(left)}' and '${TypeSystem.typeToString(right)}' are not compatible.`;
        accept("warning", msg, {
          node: binary,
          property: "operator",
        });
      }
    }
  }
}

/**
 * 연산자가 적법한 타입을 취하는지 확인한다.
 *
 * @param operator
 * @param left
 * @param right
 * @returns
 */
export function isLegalOperation(operator: string, left: TypeDescription, right?: TypeDescription): boolean {
  if (operator === "+") {
    if (!right) return left.$type === "number";
    return left.$type === "number" && right.$type === "number";
  } else if (operator === "..") {
    if (!right) return left.$type === "string";
    return left.$type === "string" && right.$type === "string";
  } else if (["-", "+", "**", "*", "/", "%", "<", "<=", ">", ">="].includes(operator)) {
    if (!right) return left.$type === "number";
    return left.$type === "number" && right.$type === "number";
  } else if (["and", "or", "&&", "||"].includes(operator)) {
    return left.$type === "boolean" && right?.$type === "boolean";
  } else if (["not", "!"].includes(operator)) {
    // 부정(논리적 NOT) 단항 연산자는 문자열과 숫자에도 적용되는데 빈 문자열과 0 을 거짓으로 취급한다.
    return left.$type === "boolean" || left.$type === "string" || left.$type === "number";
  }
  return true;
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
  static transpile(expr: Expression, indent: number): string {
    let result = "";
    if (!isIfExpression(expr)) return result;

    // 삼항 연산자 처리
    if (
      expr.then != undefined &&
      expr.then.codes.length == 1 &&
      isExpression(expr.then.codes[0]) &&
      expr.else != undefined &&
      expr.else.codes.length == 1 &&
      isExpression(expr.else.codes[0]) &&
      (expr.elif == undefined || expr.elif.length == 0)
    ) {
      result += `${generateCondition(expr.condition)} ? `;
      result += generateExpression(expr.then.codes[0], indent) + " : ";
      result += generateExpression(expr.else.codes[0], indent);
      return result;
    }

    result += "if " + generateCondition(expr.condition) + " ";
    if (expr.then) {
      result += generateBlock(expr.then, indent);
    }
    expr.elif.forEach((elif) => {
      result += "\n" + applyIndent(indent, "else if " + generateCondition(elif.condition) + " ");
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
  static inferType(node: AstNode, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error");
    if (!isIfExpression(node)) return type;

    const log = enterLog("isIfExpression", node.$type, indent);
    exitLog(log);
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
  static transpile(expr: Expression, indent: number): string {
    let result = "";
    if (!isMatchExpression(expr)) return result;

    result += `switch (${generateExpression(expr.expr, indent)}) {\n`;
    expr.cases.forEach((mc) => {
      if (isLiteral(mc.pattern)) {
        const pattern = generateExpression(mc.pattern, indent);
        result += applyIndent(indent + 1, `case ${pattern}: `);
      } else {
        result += applyIndent(indent + 1, `default: `);
      }
      result +=
        generateBlock(mc.body, indent + 1, (lastCode, indent) => {
          if (isStatement(lastCode)) return generateStatement(lastCode, indent);
          else if (isExpression(lastCode)) return generateExpression(lastCode, indent) + ";";
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
  static inferType(node: AstNode, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error");
    if (!isMatchExpression(node)) return type;

    const log = enterLog("isMatchExpression", node.$type, indent);
    exitLog(log);
    return type;
  }
}
