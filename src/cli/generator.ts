import {
  Code,
  Expr,
  isAssign,
  isBinExpr,
  isBypass,
  isCompare,
  isExpr,
  isFunCall,
  isFunDef,
  isGroup,
  isIfExpr,
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
  if (isStmt(code)) result += generateStatementElement(code);
  else if (isExpr(code)) result += generateExpressionElement(code);
  else {
    console.log(code);
  }
  return result;
}

function generateStatementElement(stmt: Stmt): string {
  let result = "";
  if (isVarDef(stmt)) {
    result += `let ${stmt.name}`;
    if (stmt.type) result += ": " + stmt.type;
    if (stmt.value) result += " = " + generateExpressionElement(stmt.value);
    result += ";";
  } else if (isValDef(stmt)) {
    result += `const ${stmt.name}`;
    if (stmt.type) result += ": " + stmt.type;
    if (stmt.value) result += " = " + generateExpressionElement(stmt.value);
    result += ";";
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
  } else if (isBypass(stmt)) {
    result += generateBypassElement(stmt.bypass);
  } else {
    console.log(stmt.$type);
  }
  return result;
}

function generateExpressionElement(expr: Expr): string {
  let result = "";
  if (isAssign(expr)) {
    result += `${expr.name} = ` + generateExpressionElement(expr.value);
    result += ";";
  } else if (isCompare(expr)) {
    result += generateExpressionElement(expr.e1);
    result += ` ${expr.op} `;
    result += generateExpressionElement(expr.e2);
  } else if (isIfExpr(expr)) {
    result += "if (" + generateExpressionElement(expr.condition) + ") ";
    if (expr.then) {
      if (isExpr(expr.then.body)) {
        result += "{ ";
        result += generateExpressionElement(expr.then.body);
        result += " }";
      } else {
        if (expr.then.body != undefined) result += generateBlockElement(expr.then.body);
      }
    }
    if (expr.else) {
      result += " else ";
      if (isExpr(expr.else.body)) {
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
  } else if (isBinExpr(expr)) {
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
    if (isStmt(expr)) result += generateStatementElement(expr) + "\n";
    else if (isExpr(expr)) result += generateExpressionElement(expr) + "\n";
    else {
      console.log("ERROR:", body);
    }
  });
  return "{\n" + result + "}";
}
