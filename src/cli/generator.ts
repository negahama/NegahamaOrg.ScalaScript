import {
  Code,
  Expression,
  isArrayLiteral,
  isAssignment,
  isBinaryExpression,
  isBypass,
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

    ${joinToNode(model.codes, (code) => generateCodeElement(code), {
      appendNewLineIfNotEmpty: true,
    })}
  `.appendNewLineIfNotEmpty();

  if (!fs.existsSync(data.destination)) {
    fs.mkdirSync(data.destination, { recursive: true });
  }
  fs.writeFileSync(generatedFilePath, toString(fileNode));
  return generatedFilePath;
}

function generateCodeElement(code: Code): string {
  let result = "";
  if (isStatement(code)) result += generateStatementElement(code);
  else if (isExpression(code)) result += generateExpressionElement(code);
  else {
    console.log(code);
  }
  return result;
}

function generateStatementElement(stmt: Statement, indent: number = 0): string {
  let result = "";
  if (isVarDefinition(stmt)) {
    result += `let ${stmt.name}`;
    if (stmt.type) result += ": " + stmt.type;
    if (stmt.value) result += " = " + generateExpressionElement(stmt.value);
    result += ";";
  } else if (isValDefinition(stmt)) {
    result += `const ${stmt.name}`;
    if (stmt.type) result += ": " + stmt.type;
    if (stmt.value) result += " = " + generateExpressionElement(stmt.value);
    result += ";";
  } else if (isFunDefinition(stmt)) {
    result += `function ${stmt.name}(`;
    stmt.params.forEach((param, index) => {
      if (index != 0) result += ", ";
      result += param.name;
      if (param.type) result += ": " + param.type;
    });
    result += ")";
    if (stmt.returnType) result += ": " + stmt.returnType;
    result += " " + generateBlockElement(stmt.body, indent + 1, true);
  } else if (isForStatement(stmt)) {
    let forIndent = indent;
    stmt.iterators.forEach((iter, idx) => {
      const name = iter.name;
      if (isForOf(iter)) {
        result += applyIndent(forIndent, `for (const ${name} of ${generateExpressionElement(iter.of)}) `);
      } else if (isForTo(iter)) {
        const e1 = generateExpressionElement(iter.e1);
        const e2 = generateExpressionElement(iter.e2);
        result += applyIndent(forIndent, `for (let ${name} = ${e1}; ${name} <= ${e2}; ${name}++) `);
      } else if (isForUntil(iter)) {
        const e1 = generateExpressionElement(iter.e1);
        const e2 = generateExpressionElement(iter.e2);
        result += applyIndent(forIndent, `for (let ${name} = ${e1}; ${name} < ${e2}; ${name}++) `);
      }
      if (idx < stmt.iterators.length - 1) result += "{\n";
      forIndent++;
    });
    result += generateBlockElement(stmt.body, forIndent);
    for (let i = forIndent - 1; i > indent; i--) {
      result += "\n" + applyIndent(i - 1, "}");
    }
  } else if (isBypass(stmt)) {
    result += generateBypassElement(stmt.bypass);
  } else {
    console.log(stmt.$type);
  }
  return result;
}

function generateExpressionElement(expr: Expression, indent: number = 0): string {
  let result = "";
  if (isAssignment(expr)) {
    result += `${expr.name} ${expr.operator} ${generateExpressionElement(expr.value)};`;
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
    result += `${generateExpressionElement(expr.left)} ${op} ${generateExpressionElement(expr.right)}`;
  } else if (isIfExpression(expr)) {
    result += "if (" + generateExpressionElement(expr.condition) + ") ";
    if (expr.then) {
      if (isExpression(expr.then.body)) {
        result += `{ ${generateExpressionElement(expr.then.body)} }`;
        // result += "{\n";
        // result += applyIndent(indent + 1, generateExpressionElement(expr.then.body));
        // result += "\n" + applyIndent(indent, "}");
      } else {
        if (expr.then.body != undefined) result += generateBlockElement(expr.then.body, indent + 1);
      }
    }
    expr.elif.forEach((elif) => {
      result += "\nelse if (" + generateExpressionElement(elif.condition) + ") ";
      if (elif.elif) {
        if (isExpression(elif.elif.body)) {
          result += `{ ${generateExpressionElement(elif.elif.body)} }`;
          // result += "{\n";
          // result += applyIndent(indent + 1, generateExpressionElement(elif.elif.body));
          // result += "\n" + applyIndent(indent, "}");
        } else {
          if (elif.elif.body != undefined) result += generateBlockElement(elif.elif.body, indent + 1);
        }
      }
    });
    if (expr.else) {
      result += "\nelse ";
      if (isExpression(expr.else.body)) {
        result += `{ ${generateExpressionElement(expr.else.body)} }`;
        // result += "{\n";
        // result += applyIndent(indent + 1, generateExpressionElement(expr.else.body));
        // result += "\n" + applyIndent(indent, "}");
      } else {
        if (expr.else.body != undefined) result += generateBlockElement(expr.else.body, indent + 1);
      }
    }
  } else if (isFunCall(expr)) {
    result += expr.def + "(";
    expr.args.forEach((arg, index) => {
      if (index != 0) result += ", ";
      result += generateExpressionElement(arg);
    });
    result += ")";
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
    result += "(" + generateExpressionElement(expr.group) + ")";
  } else if (isRef(expr)) {
    // result += `${expr.value.ref?.name}`;
    result += `${expr.value}`;
  } else {
    console.log(expr);
  }
  return result;
}

function generateBypassElement(bypass: string): string {
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

function generateBlockElement(
  body: (Expression | Statement)[],
  indent: number,
  supportReturn: boolean = false
): string {
  let result = "{\n";
  body.forEach((expr, index) => {
    let element = "";
    if (isStatement(expr)) element += generateStatementElement(expr, indent) + "\n";
    else if (isExpression(expr)) element += generateExpressionElement(expr, indent) + "\n";
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

function applyIndent(lv: number, s: string) {
  return "  ".repeat(lv) + s;
}
