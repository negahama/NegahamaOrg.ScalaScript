import {
  Block,
  Bypass,
  Code,
  Expression,
  isLambdaCall,
  isArrayExpr,
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
  isGroup,
  isIfExpression,
  isInfixExpr,
  isLiteral,
  isMatchExpression,
  isMethodCall,
  isStatement,
  isUnaryExpression,
  isVariable,
  isWhileStatement,
  Statement,
  Type,
  type Program,
  isClass,
  isField,
  isMethod,
  Method,
  isTupleType,
  isObjectType,
  isObjectLiteral,
  isTypeDeclaration,
  isReturnExpr,
  isContinue,
  isBreak,
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
    console.log("ERROR in Code:", code);
  }
  return result;
}

function generateStatement(stmt: Statement | undefined, indent: number): string {
  let result = "";
  if (stmt == undefined) return result;
  if (isTypeDeclaration(stmt)) {
    result += `interface ${stmt.name} ${generateType(stmt.value, false)}`;
  } else if (isVariable(stmt)) {
    if (stmt.annotate == "NotTrans") return result;
    if (stmt.kind == "var") result += "let ";
    if (stmt.kind == "val") result += "const ";
    // 단일 대입문인 경우
    // result += generateVariable(stmt.name, stmt.type, stmt.value, indent) + ";";
    result += stmt.names.map((name) => generateVariable(name, stmt.type, stmt.value, indent)).join(", ") + ";";
  } else if (isMethod(stmt)) {
    result += generateFunction(stmt, indent);
  } else if (isClass(stmt)) {
    if (stmt.annotate == "NotTrans") return result;
    result += `class ${stmt.name} `;
    result += stmt.superClass ? `extends ${stmt.superClass.$refText} {\n` : "{\n";
    stmt.members.forEach((m) => {
      if (isMethod(m)) {
        result += applyIndent(indent + 1, generateFunction(m, indent + 1, true));
      } else if (isField(m)) {
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
  } else if (isContinue(stmt)) {
    result += "continue;";
  } else if (isBreak(stmt)) {
    result += "break;";
  } else {
    console.log("ERROR in Statement:", stmt.$type);
  }
  return result;
}

function generateExpression(expr: Expression | undefined, indent: number): string {
  let result = "";
  if (expr == undefined) return result;
  if (isAssignment(expr)) {
    const name = generateExpression(expr.assign, indent);
    result += `${name} ${expr.operator} ${generateExpression(expr.value, indent)}`;
    result += isAssignment(expr.value) ? "" : ";";
  } else if (isMethodCall(expr)) {
    if (expr.previous) {
      result += generateExpression(expr.previous, indent);
      result += expr.element ? "." + expr.element.$refText : "";
    } else {
      result += expr.this ? expr.this : "";
      result += expr.element ? expr.element.$refText : "";
    }
    if (expr.explicitCall) {
      // endsWith()의 endPosition은 1부터 카운트되므로 제외
      const methodsUsingArrayIndex = [
        { methodName: "charAt", argIndices: [0] },
        { methodName: "charCodeAt", argIndices: [0] },
        { methodName: "codePointAt", argIndices: [0] },
        { methodName: "includes", argIndices: [1] },
        { methodName: "indexOf", argIndices: [1] },
        { methodName: "lastIndexOf", argIndices: [1] },
        { methodName: "slice", argIndices: [0, 1] },
        { methodName: "startsWith", argIndices: [1] },
        { methodName: "substring", argIndices: [0, 1] },
        { methodName: "at", argIndices: [0] },
      ];
      const found = methodsUsingArrayIndex.find((e) => e.methodName == expr.element?.$refText);
      if (found) {
        result += "(";
        expr.args.map((arg, index) => {
          if (index != 0) result += ", ";
          result += generateExpression(arg, indent) + (found.argIndices.includes(index) ? " - 1" : "");
        });
        result += ")";
      } else {
        result += "(" + expr.args.map((arg) => generateExpression(arg, indent)).join(", ") + ")";
      }
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
    // 삼항 연산자 처리
    if (
      expr.then != undefined &&
      expr.then.codes.length == 1 &&
      isExpression(expr.then.codes[0]) &&
      expr.else != undefined &&
      expr.else.codes.length == 1 &&
      isExpression(expr.else.codes[0]) &&
      (expr.elif == undefined || expr.elif.length == 0)
    ) {
      result += `${generateCondition(expr.condition)} ? `;
      result += generateExpression(expr.then.codes[0], indent) + " : ";
      result += generateExpression(expr.else.codes[0], indent);
      return result;
    }

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
        result +=
          generateBlock(mc.body, indent + 1, (lastCode, indent) => {
            if (isStatement(lastCode)) return generateStatement(lastCode, indent);
            else if (isExpression(lastCode)) return generateExpression(lastCode, indent) + ";";
            else return "";
          }) + "\n";
      }
    });
    result += applyIndent(indent, "}");
  } else if (isLambdaCall(expr)) {
    result += "(" + expr.bindings.map((bind) => bind.name + generateType(bind.type)).join(", ");
    result += ")" + generateType(expr.returnType) + " => ";
    result += generateBlock(expr.body, indent, (lastCode: Code, indent: number) => {
      if (isStatement(lastCode)) return generateStatement(lastCode, indent);
      else if (isExpression(lastCode)) return generateExpression(lastCode, indent);
      else return "";
    });
  } else if (isLiteral(expr)) {
    result += expr.value;
  } else if (isGroup(expr)) {
    result += "(" + generateExpression(expr.value, indent) + ")";
  } else if (isArrayLiteral(expr)) {
    result += "[" + expr.items.map((item) => item.value).join(", ") + "]";
  } else if (isObjectLiteral(expr)) {
    result += "{\n";
    expr.items.forEach((item) => {
      result += applyIndent(
        indent + 1,
        item.name + ": " + (item.value ? generateExpression(item.value, indent) : "") + ",\n"
      );
    });
    result += "}";
  } else if (isArrayExpr(expr)) {
    result += `${expr.name}[(${generateExpression(expr.index, indent)}) - 1]`;
  } else if (isInfixExpr(expr)) {
    result += `${expr.e1}.${expr.name}(${generateExpression(expr.e2, indent)})`;
  } else if (isReturnExpr(expr)) {
    result = `return ${generateExpression(expr.value, indent)};`;
  } else {
    console.log("ERROR in Expression:", expr);
  }
  return result;
}

function generateBypass(bypass: Bypass): string {
  let result = "";
  if (bypass.bypass) {
    return bypass.bypass.replaceAll("%%\r\n", "").replaceAll("\r\n%%", "").replaceAll("%%//", "").replaceAll("%%", "");
  }
  return result;
}

function generateBlock(
  body: Block,
  indent: number,
  doItForLastCode?: (lastCode: Code, indent: number) => string
): string {
  const defaultDoIt = (lastCode: Code, indent: number) => {
    if (isStatement(lastCode)) return generateStatement(lastCode, indent);
    else if (isExpression(lastCode)) return generateExpression(lastCode, indent);
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
      if (isStatement(code)) element += generateStatement(code, indent + 1);
      else if (isExpression(code)) element += generateExpression(code, indent + 1);
      else console.log("ERROR in Block:", code);
    }
    result += applyIndent(indent + 1, element + "\n");
  });
  result += applyIndent(indent, "}");
  return result;
}

function generateVariable(name: string, type: Type | undefined, value: Expression | undefined, indent: number): string {
  return name + generateType(type) + (value ? " = " + generateExpression(value, indent) : "");
}

function generateFunction(fun: Method, indent: number, isClassMethod: boolean = false): string {
  const params = fun.parameters.map((param) => param.name + generateType(param.type)).join(", ");
  let result = "";
  if (fun.annotate == "NotTrans") return result;
  if (!isClassMethod) result += "function ";
  result += `${fun.name}(${params})${generateType(fun.returnType)} `;
  // generateBlock에 전달되는 indent는 function level인데 generateBlock에서는 이를 모두 +1 해서 쓰고 있다.
  // 그래서 익명 함수가 받는 indent는 +1되어진 것이다.
  result += fun.body
    ? generateBlock(fun.body, indent, (lastCode: Code, indent: number) => {
        if (isStatement(lastCode)) return generateStatement(lastCode, indent);
        else if (isExpression(lastCode)) return generateExpression(lastCode, indent);
        else return "";
      })
    : "";
  return result;
}

function generateCondition(condition: Expression): string {
  const e = generateExpression(condition, 0);
  return isGroup(condition) ? e : "(" + e + ")";
}

function generateType(type: Type | undefined, includeColon: boolean = true): string {
  const typeonly = (t: Type | undefined) => {
    if (t == undefined) return "";
    if (t.reference) {
      return t.reference.$refText + (t.isArray ? "[]" : "");
    } else if (t.primitive) {
      return t.primitive + (t.isArray ? "[]" : "");
    }
    return "";
  };

  let result = "";
  if (type == undefined) return result;
  result += includeColon ? ": " : "";
  if (isLambdaType(type)) {
    const list = type.bindings.map((bind) => bind.name + ": " + typeonly(bind.type)).join(", ");
    result += `(${list})` + (type.returnType ? ` => ${typeonly(type.returnType)}` : "");
  } else if (isTupleType(type)) {
    const list = type.types.map((t) => typeonly(t)).join(", ");
    result += `[${list}]`;
  } else if (isObjectType(type)) {
    const list = type.elements.map((e) => e.name + ": " + typeonly(e.type)).join(", ");
    result += `{${list}}`;
  } else result += typeonly(type);
  return result;
}

function applyIndent(lv: number, s: string) {
  return "  ".repeat(lv) + s;
}
