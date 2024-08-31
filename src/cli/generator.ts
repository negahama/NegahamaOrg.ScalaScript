import * as fs from "node:fs";
import * as path from "node:path";
import { expandToNode, joinToNode, toString } from "langium/generate";
import * as ast from "../language/generated/ast.js";
import { extractDestinationAndName } from "./cli-util.js";
import { generateBlock, generateCondition } from "./generator-util.js";
import { LambdaCallComponent } from "../components/datatype-components.js";
import { FunctionComponent, MethodCallComponent } from "../components/methodcall-components.js";
import { ClassComponent, ClassLiteralComponent } from "../components/class-components.js";
import { AssignmentComponent, VariableComponent } from "../components/variable-components.js";
import { TryCatchStatementComponent, ForStatementComponent } from "../components/statement-components.js";
import { ArrayExpressionComponent, ArrayLiteralComponent } from "../components/array-components.js";
import {
  UnaryExpressionComponent,
  BinaryExpressionComponent,
  IfExpressionComponent,
  MatchExpressionComponent,
} from "../components/expression-components.js";

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
  else console.log("ERROR in Code:", code);
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
  if (ast.isVariable(stmt)) {
    result += VariableComponent.transpile(stmt, indent);
  } else if (ast.isTFunction(stmt)) {
    result += FunctionComponent.transpile(stmt, indent);
  } else if (ast.isClass(stmt)) {
    result += ClassComponent.transpile(stmt, indent);
  } else if (ast.isDoStatement(stmt)) {
    result += `do ${generateBlock(stmt.loop, indent)} while ${generateCondition(stmt.condition)}`;
  } else if (ast.isForStatement(stmt)) {
    result += ForStatementComponent.transpile(stmt, indent);
  } else if (ast.isWhileStatement(stmt)) {
    result += `while ${generateCondition(stmt.condition)} ${generateBlock(stmt.loop, indent)}`;
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
    console.log("ERROR in Statement");
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
  } else if (ast.isLambdaCall(expr)) {
    result += LambdaCallComponent.transpile(expr, indent);
  } else if (ast.isMethodCall(expr)) {
    result += MethodCallComponent.transpile(expr, indent);
  } else if (ast.isIfExpression(expr)) {
    result += IfExpressionComponent.transpile(expr, indent);
  } else if (ast.isMatchExpression(expr)) {
    result += MatchExpressionComponent.transpile(expr, indent);
  } else if (ast.isUnaryExpression(expr)) {
    result += UnaryExpressionComponent.transpile(expr, indent);
  } else if (ast.isBinaryExpression(expr)) {
    result += BinaryExpressionComponent.transpile(expr, indent);
  } else if (ast.isGroupExpression(expr)) {
    result += "(" + generateExpression(expr.value, indent) + ")";
  } else if (ast.isInfixExpression(expr)) {
    result += `${expr.e1}.${expr.name}(${generateExpression(expr.e2, indent)})`;
  } else if (ast.isReturnExpression(expr)) {
    result = `return ${generateExpression(expr.value, indent)};`;
  } else if (ast.isArrayExpression(expr)) {
    result += ArrayExpressionComponent.transpile(expr, indent);
  } else if (ast.isArrayLiteral(expr)) {
    result += ArrayLiteralComponent.transpile(expr, indent);
  } else if (ast.isClassLiteral(expr)) {
    result += ClassLiteralComponent.transpile(expr, indent);
  } else if (ast.isLiteral(expr)) {
    result += expr.value;
  } else {
    console.log("ERROR in Expression:", expr);
  }
  return result;
}
