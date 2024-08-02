import {
  Code,
  Expression,
  isAssignment,
  isBinaryExpression,
  isBypass,
  isExpression,
  isForStatement,
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

function generateStatementElement(stmt: Statement): string {
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
    result += " " + generateBlockElement(stmt.body, true);
  } else if (isForStatement(stmt)) {
    const name = stmt.iterator.name;
    const e1 = generateExpressionElement(stmt.iterator.e1);
    const e2 = generateExpressionElement(stmt.iterator.e2);
    result += `for (let ${name} = ${e1}; ${name} <= ${e2}; ${name}++)`;
    result += " " + generateBlockElement(stmt.body);
  } else if (isBypass(stmt)) {
    result += generateBypassElement(stmt.bypass);
  } else {
    console.log(stmt.$type);
  }
  return result;
}

function generateExpressionElement(expr: Expression): string {
  let result = "";
  if (isAssignment(expr)) {
    result += `${expr.name} ${expr.operator} ` + generateExpressionElement(expr.value);
    result += ";";
  } else if (isBinaryExpression(expr)) {
    result += generateExpressionElement(expr.left);
    switch (expr.operator) {
      case "and": {
        result += " && ";
        break;
      }
      case "or": {
        result += " || ";
        break;
      }
      default: {
        result += " " + expr.operator + " ";
      }
    }
    result += generateExpressionElement(expr.right);
  } else if (isIfExpression(expr)) {
    result += "if (" + generateExpressionElement(expr.condition) + ") ";
    if (expr.then) {
      if (isExpression(expr.then.body)) {
        result += "{ ";
        result += generateExpressionElement(expr.then.body);
        result += " }";
      } else {
        if (expr.then.body != undefined) result += generateBlockElement(expr.then.body);
      }
    }
    expr.elif.forEach((elif) => {
      result += "\nelse if (" + generateExpressionElement(elif.condition) + ") ";
      if (elif.elif) {
        if (isExpression(elif.elif.body)) {
          result += "{ ";
          result += generateExpressionElement(elif.elif.body);
          result += " }";
        } else {
          if (elif.elif.body != undefined) result += generateBlockElement(elif.elif.body);
        }
      }
    });
    if (expr.else) {
      result += "\nelse ";
      if (isExpression(expr.else.body)) {
        result += "{ ";
        result += generateExpressionElement(expr.else.body);
        result += " }";
      } else {
        if (expr.else.body != undefined) result += generateBlockElement(expr.else.body);
      }
    }
  } else if (isFunCall(expr)) {
    result += expr.def + "(";
    expr.args.forEach((arg, index) => {
      if (index != 0) result += ", ";
      result += generateExpressionElement(arg);
    });
    result += ")";
  } else if (isGroup(expr)) {
    result += "(" + generateExpressionElement(expr.group) + ")";
  } else if (isRef(expr)) {
    // result += `${expr.value.ref?.name}`;
    result += `${expr.value}`;
  } else if (isLiteral(expr)) {
    result += expr.value;
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

function generateBlockElement(body: (Expression | Statement)[], supportReturn: boolean = false): string {
  let result = "";
  body.forEach((expr, index) => {
    if (supportReturn) {
      if (index == body.length - 1) {
        result += "return ";
      }
    }
    if (isStatement(expr)) result += generateStatementElement(expr) + "\n";
    else if (isExpression(expr)) result += generateExpressionElement(expr) + "\n";
    else {
      console.log("ERROR:", body);
    }
  });
  return "{\n" + result + "}";
}
