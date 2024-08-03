import {
  Binding,
  Bypass,
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
  isFunCallChain,
  isFunDefinition,
  isGroup,
  isIfExpression,
  isLiteral,
  isMatchExpression,
  isRef,
  isReturnStatement,
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
  const genVariable = (bind: Binding, value: Expression): string => {
    let result = bind.name;
    if (bind.type) result += ": " + bind.type;
    if (value) result += " = " + generateExpression(value);
    return result;
  };

  let result = "";
  if (isVarDefinition(stmt)) {
    result = "let " + genVariable(stmt.bind, stmt.value) + ";";
  } else if (isValDefinition(stmt)) {
    result = "const " + genVariable(stmt.bind, stmt.value) + ";";
  } else if (isFunDefinition(stmt)) {
    const params = stmt.params.map((param, index) => {
      return (index != 0 ? " " : "") + param.bind.name + (param.bind.type ? ": " + param.bind.type : "");
    });
    result += `function ${stmt.name}(${params})` + (stmt.returnType ? ": " + stmt.returnType : "") + " ";
    result += generateBlock(stmt.body, indent + 1);
  } else if (isDoStatement(stmt)) {
    result = `do ${generateExprOrBlock(stmt.loop.body, indent)} while ${generateCondition(stmt.condition)}`;
  } else if (isWhileStatement(stmt)) {
    result = `while ${generateCondition(stmt.condition)} ${generateExprOrBlock(stmt.loop.body, indent)}`;
  } else if (isForStatement(stmt)) {
    let forIndent = indent;
    stmt.iterators.forEach((iter, idx) => {
      const name = iter.name;
      if (isForOf(iter)) {
        result += applyIndent(forIndent, `for (const ${name} of ${generateExpression(iter.of)}) `);
      } else {
        const mark = isForTo(iter) ? "<=" : "<";
        const e1 = generateExpression(iter.e1);
        const e2 = generateExpression(iter.e2);
        result += applyIndent(forIndent, `for (let ${name} = ${e1}; ${name} ${mark} ${e2}; ${name}++) `);
      }
      if (idx < stmt.iterators.length - 1) result += "{\n";
      forIndent++;
    });
    result += generateBlock(stmt.body, forIndent);
    for (let i = forIndent - 1; i > indent; i--) {
      result += "\n" + applyIndent(i - 1, "}");
    }
  } else if (isReturnStatement(stmt)) {
    result += "return";
    if (stmt.value) {
      result += " " + generateExpression(stmt.value);
    }
  } else if (isBypass(stmt)) {
    result += generateBypass(stmt);
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
    result += "if " + generateCondition(expr.condition) + " ";
    if (expr.then) {
      result += generateExprOrBlock(expr.then.body, indent);
    }
    expr.elif.forEach((elif) => {
      result += "\nelse if " + generateCondition(elif.condition) + " ";
      if (elif.elif) {
        result += generateExprOrBlock(elif.elif.body, indent);
      }
    });
    if (expr.else) {
      result += "\nelse " + generateExprOrBlock(expr.else.body, indent);
    }
  } else if (isFunCallChain(expr)) {
    expr.calls.forEach((call, idx) => {
      result += (idx != 0 ? "." : "") + call.def + "(";
      call.args.forEach((arg, index) => {
        result += (index != 0 ? ", " : "") + generateExpression(arg);
      });
      result += ")";
    });
  } else if (isMatchExpression(expr)) {
    result += `switch (${expr.name}) {\n`;
    expr.cases.forEach((mc) => {
      if (isBypass(mc)) {
        result += generateBypass(mc) + "\n";
      } else {
        if (isLiteral(mc.pattern)) {
          const pattern = generateExpression(mc.pattern);
          result += applyIndent(indent + 1, `case ${pattern}: `);
        } else {
          result += applyIndent(indent + 1, `default: `);
        }
        result += generateExprOrBlock(mc.body.body, indent) + "\n";
      }
    });
    result += "}";
  } else if (isAnonyFunCall(expr)) {
    result += "(";
    if (expr.params) {
      expr.params.bindings.forEach((bind, idx) => {
        result += (idx != 0 ? ", " : "") + bind.name + bind.type ? ": " + bind.type : "";
      });
    } else if (expr.param) {
      result += expr.param;
    }
    result += ")" + (expr.returnType ? ": " + expr.returnType : "");
    result += " => " + generateExprOrBlock(expr.body.body, indent + 1);
  } else if (isArrayLiteral(expr)) {
    result += "[";
    result += expr.items.map((item) => {
      return item.value;
    });
    result += "]";
  } else if (isLiteral(expr)) {
    result += expr.value;
  } else if (isGroup(expr)) {
    result += "(" + generateExpression(expr.value) + ")";
  } else if (isRef(expr)) {
    // result += `${expr.value.ref?.name}`;
    result += `${expr.value}`;
  } else {
    console.log(expr);
  }
  return result;
}

function generateBypass(bypass: Bypass, indent: number = 0): string {
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

function generateBlock(body: (Expression | Statement)[], indent: number): string {
  let result = "{\n";
  body.forEach((expr, index) => {
    let element = "";
    if (isStatement(expr)) element += generateStatement(expr, indent) + "\n";
    else if (isExpression(expr)) element += generateExpression(expr, indent) + "\n";
    else {
      console.log("ERROR:", body);
    }

    result += applyIndent(indent, element);
  });
  result += applyIndent(indent - 1, "}");
  return result;
}

function generateExprOrBlock(body: Expression | (Expression | Statement)[] | undefined, indent: number): string {
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

function generateCondition(condition: Expression, indent: number = 0): string {
  const e = generateExpression(condition);
  return isGroup(condition) ? e : "(" + e + ")";
}

function applyIndent(lv: number, s: string) {
  return "  ".repeat(lv) + s;
}
