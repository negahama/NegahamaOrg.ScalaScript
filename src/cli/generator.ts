import {
  Block,
  Bypass,
  Code,
  Expression,
  isAnonymousCall,
  isArrayLiteral,
  isAssignment,
  isBinaryExpression,
  isBypass,
  isDoStatement,
  isExpression,
  isForOf,
  isForStatement,
  isForTo,
  isLambdaType,
  isFunctionDeclaration,
  isGroup,
  isIfExpression,
  isInfixExpr,
  isLiteral,
  isMatchExpression,
  isMemberCall,
  isStatement,
  isUnaryExpression,
  isVariableDeclaration,
  isWhileStatement,
  Statement,
  Type,
  type Program,
  isClass,
  isFieldMember,
  isMethodMember,
  FunctionDeclaration,
  MethodMember,
} from "../language/generated/ast.js";
import { expandToNode, joinToNode, toString } from "langium/generate";
import * as fs from "node:fs";
import * as path from "node:path";
import { extractDestinationAndName } from "./cli-util.js";

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

function generateCode(code: Code): string {
  let result = "";
  if (isStatement(code)) result += generateStatement(code, 0);
  else if (isExpression(code)) result += generateExpression(code, 0);
  else {
    console.log("ERROR:", code);
  }
  return result;
}

function generateStatement(stmt: Statement | undefined, indent: number): string {
  let result = "";
  if (stmt == undefined) return result;
  if (isVariableDeclaration(stmt)) {
    if (stmt.kind == "var") result += "let ";
    if (stmt.kind == "val") result += "const ";
    stmt.names.forEach((name, idx) => {
      result += (idx != 0 ? ", " : "") + generateVariable(name, stmt.type, stmt.value, indent);
    });
    result += ";";
  } else if (isFunctionDeclaration(stmt)) {
    result += generateFunction(stmt, indent);
  } else if (isClass(stmt)) {
    result += `class ${stmt.name} `;
    result += stmt.superClass ? `extends ${stmt.superClass.$refText} {\n` : "{\n";
    stmt.members.forEach((m) => {
      if (isMethodMember(m)) {
        result += applyIndent(indent + 1, generateFunction(m, indent + 1));
      } else if (isFieldMember(m)) {
        result += applyIndent(indent + 1, generateVariable(m.name, m.type, m.value, indent) + ";");
      }
      result += "\n";
    });
    result += "}";
  } else if (isDoStatement(stmt)) {
    result = `do ${generateBlock(stmt.loop, indent)} while ${generateCondition(stmt.condition)}`;
  } else if (isForStatement(stmt)) {
    let forIndent = indent;
    stmt.iterators.forEach((iter, idx) => {
      const name = iter.name;
      if (isForOf(iter)) {
        result += applyIndent(forIndent, `for (const ${name} of ${generateExpression(iter.of, indent)}) `);
      } else {
        const mark = isForTo(iter) ? "<=" : "<";
        const e1 = generateExpression(iter.e1, indent);
        const e2 = generateExpression(iter.e2, indent);
        result += applyIndent(forIndent, `for (let ${name} = ${e1}; ${name} ${mark} ${e2}; ${name}++) `);
      }
      if (idx < stmt.iterators.length - 1) {
        result += "{\n";
        forIndent++;
      }
    });
    result += generateBlock(stmt.loop, forIndent);
    for (let i = forIndent; i > indent; i--) {
      result += "\n" + applyIndent(i - 1, "}");
    }
  } else if (isWhileStatement(stmt)) {
    result = `while ${generateCondition(stmt.condition)} ${generateBlock(stmt.loop, indent)}`;
  } else if (isBypass(stmt)) {
    result += generateBypass(stmt);
  } else {
    console.log("ERROR:", stmt.$type);
  }
  return result;
}

function generateExpression(expr: Expression | undefined, indent: number): string {
  let result = "";
  if (expr == undefined) return result;
  if (isAssignment(expr)) {
    result += `${expr.assign} ${expr.operator} ${generateExpression(expr.value, indent)}`;
    result += isAssignment(expr.value) ? "" : ";";
  } else if (isMemberCall(expr)) {
    if (expr.previous) {
      result += generateExpression(expr.previous, indent);
      result += expr.element ? "." + expr.element : "";
    } else {
      result += expr.element ? expr.element : "";
    }
    if (expr.explicitCall) {
      result += "(";
      expr.args.forEach((arg, index) => {
        result += (index != 0 ? ", " : "") + generateExpression(arg, indent);
      });
      result += ")";
    }
  } else if (isUnaryExpression(expr)) {
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
      case "..": {
        op = "+";
        break;
      }
      default: {
        op = expr.operator;
      }
    }
    result += `${generateExpression(expr.left, indent)} ${op} ${generateExpression(expr.right, indent)}`;
  } else if (isIfExpression(expr)) {
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
  } else if (isMatchExpression(expr)) {
    result += `switch (${expr.name}) {\n`;
    expr.cases.forEach((mc) => {
      if (isBypass(mc)) {
        result += generateBypass(mc) + "\n";
      } else {
        if (isLiteral(mc.pattern)) {
          const pattern = generateExpression(mc.pattern, indent);
          result += applyIndent(indent + 1, `case ${pattern}: `);
        } else {
          result += applyIndent(indent + 1, `default: `);
        }
        result += generateBlock(mc.body, indent) + "\n";
      }
    });
    result += applyIndent(indent, "}");
  } else if (isAnonymousCall(expr)) {
    result += "(";
    expr.bindings.forEach((bind, idx) => {
      result += (idx != 0 ? ", " : "") + bind.name + generateType(bind.type);
    });
    result += ")" + generateType(expr.returnType);
    result += " => " + generateBlock(expr.body, indent);
  } else if (isLiteral(expr)) {
    result += expr.value;
  } else if (isGroup(expr)) {
    result += "(" + generateExpression(expr.value, indent) + ")";
  } else if (isArrayLiteral(expr)) {
    result += "[";
    result += expr.items.map((item) => {
      return item.value;
    });
    result += "]";
  } else if (isInfixExpr(expr)) {
    result += `${expr.e1}.${expr.name}(${generateExpression(expr.e2, indent)})`;
  } else {
    console.log("ERROR:", expr);
  }
  return result;
}

function generateBypass(bypass: Bypass): string {
  let result = "";
  if (bypass.bypass) {
    bypass.bypass
      .split("%%")
      .filter((s) => s != "")
      .forEach((s) => {
        // %%의 다음 줄부터 본문이 입력하기 때문에 s의 처음과 끝에 new line 문자가 존재하는데 이를 제거한다.
        let ns = s;
        if (s.startsWith("\r\n")) ns = ns.slice(2);
        ns = ns.trimEnd();
        result += ns;
      });
  }
  if (bypass.comment) {
    result += bypass.comment;
  }
  return result;
}

function generateBlock(body: Block, indent: number, isFunctionBody: boolean = false): string {
  let result = "";
  if (body.expression) {
    result += isFunctionBody
      ? `{ return ${generateExpression(body.expression, indent)} }`
      : `{ ${generateExpression(body.expression, indent)} }`;
    // result += "{\n";
    // result += applyIndent(indent + 1, generateExpressionElement(body));
    // result += "\n" + applyIndent(indent, "}");
  } else {
    result += "{\n";
    body.codes.forEach((code, index) => {
      let element = "";
      if (isStatement(code)) element += generateStatement(code, indent + 1) + "\n";
      else if (isExpression(code)) {
        if (isFunctionBody && index == body.codes.length - 1) element += "return ";
        element += generateExpression(code, indent + 1) + "\n";
      } else {
        console.log("ERROR:", code);
      }
      result += applyIndent(indent + 1, element);
    });
    result += applyIndent(indent, "}");
  }
  return result;
}

function generateVariable(name: string, type: Type | undefined, value: Expression | undefined, indent: number): string {
  return name + generateType(type) + (value ? " = " + generateExpression(value, indent) : "");
}

function generateFunction(fun: FunctionDeclaration | MethodMember, indent: number): string {
  let result = "";
  const params = fun.parameters.map((param, index) => {
    return (index != 0 ? " " : "") + param.name + generateType(param.type);
  });
  if (isFunctionDeclaration(fun)) result += "function ";
  result += `${fun.name}(${params})${generateType(fun.returnType)} `;
  result += fun.body ? generateBlock(fun.body, indent, true) : "";
  return result;
}

function generateCondition(condition: Expression): string {
  const e = generateExpression(condition, 0);
  return isGroup(condition) ? e : "(" + e + ")";
}

function generateType(type: Type | undefined): string {
  let result = "";
  if (type == undefined) return result;
  if (isLambdaType(type)) {
    result += ": (";
    type.args.forEach((arg, idx) => {
      result += (idx != 0 ? ", " : "") + arg.name + generateType(arg.type);
    });
    result += ")" + (type.returnType ? ` => ${type.returnType.type}` : "");
  } else if (type.isArray) {
    result += ": " + type.type + "[]";
  } else {
    result += ": " + type.type;
  }
  return result;
}

function applyIndent(lv: number, s: string) {
  return "  ".repeat(lv) + s;
}
