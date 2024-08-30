import * as fs from "node:fs";
import * as path from "node:path";
import { expandToNode, joinToNode, toString } from "langium/generate";
import {
  type Program,
  Code,
  Statement,
  Expression,
  isStatement,
  isExpression,
  isTypeDeclaration,
  isVariable,
  isMethod,
  isClass,
  isBypass,
  isDoStatement,
  isForStatement,
  isWhileStatement,
  isThrowStatement,
  isCatchStatement,
  isContinue,
  isBreak,
  isAssignment,
  isMethodCall,
  isLambdaCall,
  isArrayExpression,
  isGroupExpression,
  isUnaryExpression,
  isBinaryExpression,
  isMatchExpression,
  isIfExpression,
  isInfixExpression,
  isReturnExpression,
  isLiteral,
  isArrayLiteral,
  isObjectLiteral,
} from "../language/generated/ast.js";
import { extractDestinationAndName } from "./cli-util.js";
import { applyIndent, generateBlock, generateCondition, generateType } from "./generator-util.js";
import { LambdaCallComponent } from "../components/datatype-components.js";
import { MethodCallComponent } from "../components/methodcall-components.js";
import { ClassComponent, MethodComponent } from "../components/class-components.js";
import { AssignmentComponent, VariableComponent } from "../components/variable-components.js";
import { CatchStatementComponent, ForStatementComponent } from "../components/statement-components.js";
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
export function generateTypeScript(program: Program, filePath: string, destination: string | undefined): string {
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
export function generateCode(code: Code): string {
  let result = "";
  if (isStatement(code)) result += generateStatement(code, 0);
  else if (isExpression(code)) result += generateExpression(code, 0);
  else console.log("ERROR in Code:", code);
  return result;
}

/**
 *
 * @param stmt
 * @param indent
 * @returns
 */
export function generateStatement(stmt: Statement | undefined, indent: number): string {
  let result = "";
  if (stmt == undefined) return result;
  if (isTypeDeclaration(stmt)) {
    result += `interface ${stmt.name} ${generateType(stmt.value, false)}`;
  } else if (isVariable(stmt)) {
    result += VariableComponent.transpile(stmt, indent);
  } else if (isMethod(stmt)) {
    result += MethodComponent.transpile(stmt, indent);
  } else if (isClass(stmt)) {
    result += ClassComponent.transpile(stmt, indent);
  } else if (isDoStatement(stmt)) {
    result += `do ${generateBlock(stmt.loop, indent)} while ${generateCondition(stmt.condition)}`;
  } else if (isForStatement(stmt)) {
    result += ForStatementComponent.transpile(stmt, indent);
  } else if (isWhileStatement(stmt)) {
    result += `while ${generateCondition(stmt.condition)} ${generateBlock(stmt.loop, indent)}`;
  } else if (isThrowStatement(stmt)) {
    result += `throw ${generateExpression(stmt.throw, indent)}`;
  } else if (isCatchStatement(stmt)) {
    result += CatchStatementComponent.transpile(stmt, indent);
  } else if (isContinue(stmt)) {
    result += "continue;";
  } else if (isBreak(stmt)) {
    result += "break;";
  } else if (isBypass(stmt)) {
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
export function generateExpression(expr: Expression | undefined, indent: number): string {
  let result = "";
  if (expr == undefined) return result;
  if (isAssignment(expr)) {
    result += AssignmentComponent.transpile(expr, indent);
  } else if (isIfExpression(expr)) {
    result += IfExpressionComponent.transpile(expr, indent);
  } else if (isMatchExpression(expr)) {
    result += MatchExpressionComponent.transpile(expr, indent);
  } else if (isLambdaCall(expr)) {
    result += LambdaCallComponent.transpile(expr, indent);
  } else if (isMethodCall(expr)) {
    result += MethodCallComponent.transpile(expr, indent);
  } else if (isUnaryExpression(expr)) {
    result += UnaryExpressionComponent.transpile(expr, indent);
  } else if (isBinaryExpression(expr)) {
    result += BinaryExpressionComponent.transpile(expr, indent);
  } else if (isArrayExpression(expr)) {
    result += ArrayExpressionComponent.transpile(expr, indent);
  } else if (isGroupExpression(expr)) {
    result += "(" + generateExpression(expr.value, indent) + ")";
  } else if (isLiteral(expr)) {
    result += expr.value;
  } else if (isArrayLiteral(expr)) {
    result += ArrayLiteralComponent.transpile(expr, indent);
  } else if (isObjectLiteral(expr)) {
    result += "{\n";
    expr.items.forEach((item) => {
      result += applyIndent(
        indent + 1,
        item.name + ": " + (item.value ? generateExpression(item.value, indent) : "") + ",\n"
      );
    });
    result += "}";
  } else if (isInfixExpression(expr)) {
    result += `${expr.e1}.${expr.name}(${generateExpression(expr.e2, indent)})`;
  } else if (isReturnExpression(expr)) {
    result = `return ${generateExpression(expr.value, indent)};`;
  } else {
    console.log("ERROR in Expression:", expr);
  }
  return result;
}
