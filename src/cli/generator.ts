import {
  Code,
  Expression,
  isAnonyFunCall,
  isArrayLiteral,
  isAssignment,
  isBinaryExpression,
  isBypass,
  isDoStatement,
  isExpression,
  isForOf,
  isForStatement,
  isForTo,
  isForUntil,
  isFunCall,
  isFunDefinition,
  isGroup,
  isIfExpression,
  isLiteral,
  isRef,
  isStatement,
  isValDefinition,
  isVarDefinition,
  isWhileStatement,
  Statement,
  type Model,
} from "../language/generated/ast.js";
import { expandToNode, joinToNode, toString } from "langium/generate";
import * as fs from "node:fs";
import * as path from "node:path";
import { extractDestinationAndName } from "./cli-util.js";

export function generateTypeScript(model: Model, filePath: string, destination: string | undefined): string {
  const data = extractDestinationAndName(filePath, destination);
  const generatedFilePath = `${path.join(data.destination, data.name)}.ts`;

  const fileNode = expandToNode`
    // This is transpiled by ScalaScript
    "use strict";

    ${joinToNode(model.codes, (code) => generateCode(code), {
      appendNewLineIfNotEmpty: true,
    })}
  `.appendNewLineIfNotEmpty();

  if (!fs.existsSync(data.destination)) {
    fs.mkdirSync(data.destination, { recursive: true });
  }
  fs.writeFileSync(generatedFilePath, toString(fileNode));
  return generatedFilePath;
}

function generateCode(code: Code): string {
  let result = "";
  if (isStatement(code)) result += generateStatement(code);
  else if (isExpression(code)) result += generateExpression(code);
  else {
    console.log(code);
  }
  return result;
}

function generateStatement(stmt: Statement, indent: number = 0): string {
  let result = "";
  if (isVarDefinition(stmt)) {
    result += `let ${stmt.bind.name}`;
    if (stmt.bind.type) result += ": " + stmt.bind.type;
    if (stmt.value) result += " = " + generateExpression(stmt.value);
    result += ";";
  } else if (isValDefinition(stmt)) {
    result += `const ${stmt.bind.name}`;
    if (stmt.bind.type) result += ": " + stmt.bind.type;
    if (stmt.value) result += " = " + generateExpression(stmt.value);
    result += ";";
  } else if (isFunDefinition(stmt)) {
    result += `function ${stmt.name}(`;
    stmt.params.forEach((param, index) => {
      if (index != 0) result += ", ";
      result += param.bind.name;
      if (param.bind.type) result += ": " + param.bind.type;
    });
    result += ")";
    if (stmt.returnType) result += ": " + stmt.returnType;
    result += " " + generateBlock(stmt.body, indent + 1, true);
  } else if (isDoStatement(stmt)) {
    result += "do ";
    result += generateExprOrBlock(stmt.loop.body, indent);
    result += ` while (${generateExpression(stmt.condition)})`;
  } else if (isWhileStatement(stmt)) {
    result += `while (${generateExpression(stmt.condition)}) `;
    result += generateExprOrBlock(stmt.loop.body, indent);
  } else if (isForStatement(stmt)) {
    let forIndent = indent;
    stmt.iterators.forEach((iter, idx) => {
      const name = iter.name;
      if (isForOf(iter)) {
        result += applyIndent(forIndent, `for (const ${name} of ${generateExpression(iter.of)}) `);
      } else if (isForTo(iter)) {
        const e1 = generateExpression(iter.e1);
        const e2 = generateExpression(iter.e2);
        result += applyIndent(forIndent, `for (let ${name} = ${e1}; ${name} <= ${e2}; ${name}++) `);
      } else if (isForUntil(iter)) {
        const e1 = generateExpression(iter.e1);
        const e2 = generateExpression(iter.e2);
        result += applyIndent(forIndent, `for (let ${name} = ${e1}; ${name} < ${e2}; ${name}++) `);
      }
      if (idx < stmt.iterators.length - 1) result += "{\n";
      forIndent++;
    });
    result += generateBlock(stmt.body, forIndent);
    for (let i = forIndent - 1; i > indent; i--) {
      result += "\n" + applyIndent(i - 1, "}");
    }
  } else if (isBypass(stmt)) {
    result += generateBypass(stmt.bypass);
  } else {
    console.log(stmt.$type);
  }
  return result;
}

function generateExpression(expr: Expression, indent: number = 0): string {
  let result = "";
  if (isAssignment(expr)) {
    result += `${expr.name} ${expr.operator} ${generateExpression(expr.value)};`;
  } else if (isBinaryExpression(expr)) {
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
      default: {
        op = expr.operator;
      }
    }
    result += `${generateExpression(expr.left)} ${op} ${generateExpression(expr.right)}`;
  } else if (isIfExpression(expr)) {
    result += "if (" + generateExpression(expr.condition) + ") ";
    if (expr.then) {
      result += generateExprOrBlock(expr.then.body, indent);
    }
    expr.elif.forEach((elif) => {
      result += "\nelse if (" + generateExpression(elif.condition) + ") ";
      if (elif.elif) {
        result += generateExprOrBlock(elif.elif.body, indent);
      }
    });
    if (expr.else) {
      result += "\nelse ";
      result += generateExprOrBlock(expr.else.body, indent);
    }
  } else if (isFunCall(expr)) {
    result += expr.def + "(";
    expr.args.forEach((arg, index) => {
      if (index != 0) result += ", ";
      result += generateExpression(arg);
    });
    result += ")";
  } else if (isAnonyFunCall(expr)) {
    result += "(";
    expr.params.bindings.forEach((bind, idx) => {
      if (idx != 0) result += ", ";
      result += bind.name;
      if (bind.type) result += ": " + bind.type;
    });
    result += ")";
    if (expr.returnType) result += ": " + expr.returnType;
    result += " => ";
    result += generateExprOrBlock(expr.body.body, indent + 1);
  } else if (isArrayLiteral(expr)) {
    result += "[";
    expr.items.forEach((item, idx) => {
      if (idx != 0) result += ", ";
      result += item.value;
    });
    result += "]";
  } else if (isLiteral(expr)) {
    result += expr.value;
  } else if (isGroup(expr)) {
    result += "(" + generateExpression(expr.group) + ")";
  } else if (isRef(expr)) {
    // result += `${expr.value.ref?.name}`;
    result += `${expr.value}`;
  } else {
    console.log(expr);
  }
  return result;
}

function generateBypass(bypass: string): string {
  let result = "";
  bypass
    .split("%%")
    .filter((s) => s != "")
    .forEach((s) => {
      // %%의 다음 줄부터 본문이 입력하기 때문에 s의 처음과 끝에 new line 문자가 존재하는데 이를 제거한다.
      let ns = s;
      if (s.startsWith("\r\n")) ns = ns.slice(2);
      ns = ns.trimEnd();
      result += ns;
    });
  return result;
}

function generateBlock(body: (Expression | Statement)[], indent: number, supportReturn: boolean = false): string {
  let result = "{\n";
  body.forEach((expr, index) => {
    let element = "";
    if (isStatement(expr)) element += generateStatement(expr, indent) + "\n";
    else if (isExpression(expr)) element += generateExpression(expr, indent) + "\n";
    else {
      console.log("ERROR:", body);
    }

    if (supportReturn && index == body.length - 1) {
      result += applyIndent(indent, "return ");
    } else result += applyIndent(indent, "");
    result += element;
  });
  result += applyIndent(indent - 1, "}");
  return result;
}

function generateExprOrBlock(
  body: Expression | (Expression | Statement)[] | undefined,
  indent: number,
  supportReturn: boolean = false
): string {
  let result = "";
  if (isExpression(body)) {
    result += `{ ${generateExpression(body)} }`;
    // result += "{\n";
    // result += applyIndent(indent + 1, generateExpressionElement(body));
    // result += "\n" + applyIndent(indent, "}");
  } else {
    if (body != undefined) result += generateBlock(body, indent + 1);
  }
  return result;
}

function applyIndent(lv: number, s: string) {
  return "  ".repeat(lv) + s;
}
