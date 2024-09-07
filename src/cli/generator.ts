import * as fs from "node:fs";
import * as path from "node:path";
import { expandToNode, joinToNode, toString } from "langium/generate";
import * as ast from "../language/generated/ast.js";
import { extractDestinationAndName } from "./cli-util.js";
import { TypesComponent } from "../components/datatype-components.js";
import { FunctionComponent, CallChainComponent, FunctionValueComponent } from "../components/methodcall-components.js";
import { ObjectComponent, ObjectValueComponent } from "../components/class-components.js";
import { AssignmentComponent, VariableComponent } from "../components/variable-components.js";
import { TryCatchStatementComponent, ForStatementComponent } from "../components/statement-components.js";
import { ArrayExpressionComponent, ArrayValueComponent } from "../components/array-components.js";
import {
  UnaryExpressionComponent,
  BinaryExpressionComponent,
  IfExpressionComponent,
  MatchExpressionComponent,
  NewExpressionComponent,
} from "../components/expression-components.js";
import chalk from "chalk";

/**
 *
 * @param program
 * @param filePath
 * @param destination
 * @returns
 */
export function generateTypeScript(program: ast.Program, filePath: string, destination: string | undefined): string {
  const data = extractDestinationAndName(filePath, destination);
  const generatedFilePath = `${path.join(data.destination, data.name)}.ts`;

  const fileNode = expandToNode`
    // This is transpiled by ScalaScript
    "use strict";

    ${joinToNode(program.codes, (code) => generateCode(code), {
      appendNewLineIfNotEmpty: true,
    })}
  `.appendNewLineIfNotEmpty();

  if (!fs.existsSync(data.destination)) {
    fs.mkdirSync(data.destination, { recursive: true });
  }
  fs.writeFileSync(generatedFilePath, toString(fileNode));
  return generatedFilePath;
}

/**
 *
 * @param code
 * @returns
 */
export function generateCode(code: ast.Code): string {
  let result = "";
  if (ast.isStatement(code)) result += generateStatement(code, 0);
  else if (ast.isExpression(code)) result += generateExpression(code, 0);
  else console.log(chalk.red("ERROR in Code:", code));
  return result;
}

/**
 *
 * @param stmt
 * @param indent
 * @returns
 */
export function generateStatement(stmt: ast.Statement | undefined, indent: number): string {
  let result = "";
  if (stmt == undefined) return result;
  if (ast.isTVariable(stmt)) {
    result += VariableComponent.transpile(stmt, indent);
  } else if (ast.isTFunction(stmt)) {
    result += FunctionComponent.transpile(stmt, indent);
  } else if (ast.isTObject(stmt)) {
    result += ObjectComponent.transpile(stmt, indent);
  } else if (ast.isDoStatement(stmt)) {
    result += `do ${generateBlock(stmt.loop, indent)} while ${generateCondition(stmt.condition, indent)}`;
  } else if (ast.isForStatement(stmt)) {
    result += ForStatementComponent.transpile(stmt, indent);
  } else if (ast.isWhileStatement(stmt)) {
    result += `while ${generateCondition(stmt.condition, indent)} ${generateBlock(stmt.loop, indent)}`;
  } else if (ast.isThrowStatement(stmt)) {
    result += `throw ${generateExpression(stmt.throw, indent)}`;
  } else if (ast.isTryCatchStatement(stmt)) {
    result += TryCatchStatementComponent.transpile(stmt, indent);
  } else if (ast.isContinue(stmt)) {
    result += "continue;";
  } else if (ast.isBreak(stmt)) {
    result += "break;";
  } else if (ast.isBypass(stmt)) {
    if (stmt.bypass) {
      result += stmt.bypass
        .replaceAll("%%\r\n", "")
        .replaceAll("\r\n%%", "")
        .replaceAll("%%//", "")
        .replaceAll("%%", "");
    }
  } else {
    console.log(chalk.red("ERROR in Statement"));
  }
  return result;
}

/**
 *
 * @param expr
 * @param indent
 * @returns
 */
export function generateExpression(expr: ast.Expression | undefined, indent: number): string {
  let result = "";
  if (expr == undefined) return result;
  if (ast.isAssignment(expr)) {
    result += AssignmentComponent.transpile(expr, indent);
  } else if (ast.isCallChain(expr)) {
    result += CallChainComponent.transpile(expr, indent);
  } else if (ast.isIfExpression(expr)) {
    result += IfExpressionComponent.transpile(expr, indent);
  } else if (ast.isMatchExpression(expr)) {
    result += MatchExpressionComponent.transpile(expr, indent);
  } else if (ast.isGroupExpression(expr)) {
    result += "(" + generateExpression(expr.value, indent) + ")";
  } else if (ast.isUnaryExpression(expr)) {
    result += UnaryExpressionComponent.transpile(expr, indent);
  } else if (ast.isBinaryExpression(expr)) {
    result += BinaryExpressionComponent.transpile(expr, indent);
  } else if (ast.isInfixExpression(expr)) {
    result += `${expr.e1}.${expr.name}(${generateExpression(expr.e2, indent)})`;
  } else if (ast.isReturnExpression(expr)) {
    if (expr.value) result += `return ${generateExpression(expr.value, indent)};`;
    else result += "return";
  } else if (ast.isNewExpression(expr)) {
    result += NewExpressionComponent.transpile(expr, indent);
  } else if (ast.isArrayExpression(expr)) {
    result += ArrayExpressionComponent.transpile(expr, indent);
  } else if (ast.isArrayValue(expr)) {
    result += ArrayValueComponent.transpile(expr, indent);
  } else if (ast.isObjectValue(expr)) {
    result += ObjectValueComponent.transpile(expr, indent);
  } else if (ast.isFunctionValue(expr)) {
    result += FunctionValueComponent.transpile(expr, indent);
  } else if (ast.isLiteral(expr)) {
    // nil 만 undefined로 변경한다.
    result += expr.value == "nil" ? "undefined" : expr.value;
  } else {
    console.log(chalk.red("ERROR in Expression:", expr));
  }
  return result;
}

/**
 *
 * @param body
 * @param indent
 * @param doItForLastCode
 * @returns
 */
export function generateBlock(
  body: ast.Block,
  indent: number,
  doItForLastCode?: (lastCode: ast.Code, indent: number) => string
): string {
  const defaultDoIt = (lastCode: ast.Code, indent: number) => {
    if (ast.isStatement(lastCode)) return generateStatement(lastCode, indent);
    else if (ast.isExpression(lastCode)) return generateExpression(lastCode, indent);
    else return "";
  };

  // 단일 expression으로 되어져 있어도 괄호로 둘러싸인 형태로 변환된다.
  // 괄호 내부의 모든 코드는 indent가 하나 증가되어진 상태로 처리되어야 한다.
  let result = "{\n";
  body.codes.forEach((code, index) => {
    let element = "";
    if (index == body.codes.length - 1) {
      if (doItForLastCode == undefined) element += defaultDoIt(code, indent + 1);
      else element += doItForLastCode(code, indent + 1);
    } else {
      if (ast.isStatement(code)) element += generateStatement(code, indent + 1);
      else if (ast.isExpression(code)) element += generateExpression(code, indent + 1);
      else console.log(chalk.red("ERROR in Block:", code));
    }
    result += applyIndent(indent + 1, element + "\n");
  });
  result += applyIndent(indent, "}");
  return result;
}

/**
 *
 * @param type
 * @param indent
 * @returns
 */
export function generateTypes(type: ast.Types | undefined, indent: number): string {
  if (!type) return "";
  const result = TypesComponent.transpile(type, indent);
  return result ? ": " + result : "";
}

/**
 *
 * @param condition
 * @param indent
 * @returns
 */
export function generateCondition(condition: ast.Expression, indent: number): string {
  const e = generateExpression(condition, indent);
  return ast.isGroupExpression(condition) ? e : "(" + e + ")";
}

/**
 *
 * @param lv
 * @param s
 * @returns
 */
export function applyIndent(lv: number, s: string) {
  return "  ".repeat(lv) + s;
}
