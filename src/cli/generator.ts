import {
  Expr,
  isBinExpr,
  isBypass,
  isExpr,
  isFunDef,
  isGroup,
  isLiteral,
  isRef,
  isStmt,
  isValDef,
  isVarDef,
  Stmt,
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

    ${joinToNode(model.statements, (statement) => generateStatementElement(statement), {
      appendNewLineIfNotEmpty: true,
    })}

    ${joinToNode(model.expressions, (expression) => generateExpressionElement(expression), {
      appendNewLineIfNotEmpty: true,
    })}
  `.appendNewLineIfNotEmpty();

  if (!fs.existsSync(data.destination)) {
    fs.mkdirSync(data.destination, { recursive: true });
  }
  fs.writeFileSync(generatedFilePath, toString(fileNode));
  return generatedFilePath;
}

function generateStatementElement(stmt: Stmt): string {
  let result = "";
  if (isVarDef(stmt)) {
    result += `let ${stmt.name}`;
    if (stmt.type) result += ": " + stmt.type;
    if (stmt.value) result += " = " + generateExpressionElement(stmt.value);
  } else if (isValDef(stmt)) {
    result += `const ${stmt.name}`;
    if (stmt.type) result += ": " + stmt.type;
    if (stmt.value) result += " = " + generateExpressionElement(stmt.value);
  } else if (isFunDef(stmt)) {
    result += `function ${stmt.name}(`;
    stmt.params.forEach((param, index) => {
      if (index != 0) result += ", ";
      result += param.name;
      if (param.type) result += ": " + param.type;
    });
    result += ")";
    if (stmt.returnType) result += ": " + stmt.returnType;
    result += " " + generateBlockElement(stmt.body);
  } else {
    console.log(stmt.$type);
  }
  return result;
}

function generateExpressionElement(expr: Expr): string {
  let result = "";
  if (isBinExpr(expr)) {
    result += generateExpressionElement(expr.e1);
    result += " " + expr.op + " ";
    result += generateExpressionElement(expr.e2);
  } else if (isGroup(expr)) {
    result += "(" + generateExpressionElement(expr.group) + ")";
  } else if (isRef(expr)) {
    // result += `${expr.value.ref?.name}`;
    result += `${expr.value}`;
  } else if (isLiteral(expr)) {
    result += expr.value;
  } else if (isBypass(expr)) {
    result += generateBypassElement(expr.bypass);
  } else {
    console.log(expr.$type);
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

function generateBlockElement(body: (Expr | Stmt)[]): string {
  let result = "";
  body.forEach((expr, index) => {
    if (index == body.length - 1) {
      result += "return ";
    }
    if (isStmt(expr)) result += generateStatementElement(expr) + ";\n";
    else if (isExpr(expr)) result += generateExpressionElement(expr) + ";\n";
    else {
      console.log("ERROR:", body);
    }
  });
  return "{\n" + result + "}";
}
