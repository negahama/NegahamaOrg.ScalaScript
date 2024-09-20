import * as fs from "node:fs";
import * as path from "node:path";
import { expandToNode, joinToNode, toString } from "langium/generate";
import * as ast from "../../language/generated/ast.js";
import { extractDestinationAndName } from "./cli-util.js";
import chalk from "chalk";

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
function generateCode(code: ast.Code): string {
  let result = "";
  if (ast.isStatement(code)) result += generateStatement(code, 0);
  else if (ast.isExpression(code)) result += generateExpression(code, 0, true);
  else console.log(chalk.red("ERROR in Code:", code));
  return result;
}

/**
 *
 * @param stmt
 * @param indent
 * @returns
 */
function generateStatement(stmt: ast.Statement | undefined, indent: number): string {
  let result = "";
  if (stmt == undefined) return result;
  if (ast.isVariableDef(stmt)) {
    result += transpileVariableDef(stmt, indent);
  } else if (ast.isFunctionDef(stmt)) {
    result += transpileFunctionDef(stmt, indent);
  } else if (ast.isObjectDef(stmt)) {
    result += transpileObjectDef(stmt, indent);
  } else if (ast.isDoStatement(stmt)) {
    result += `do ${generateBlock(stmt.loop, indent)} while ${generateCondition(stmt.condition, indent)}`;
  } else if (ast.isForStatement(stmt)) {
    result += transpileForStatement(stmt, indent);
  } else if (ast.isWhileStatement(stmt)) {
    result += `while ${generateCondition(stmt.condition, indent)} ${generateBlock(stmt.loop, indent)}`;
  } else if (ast.isThrowStatement(stmt)) {
    result += `throw ${generateExpression(stmt.throw, indent)}`;
  } else if (ast.isTryCatchStatement(stmt)) {
    result += transpileTryCatchStatement(stmt, indent);
  } else if (ast.isContinue(stmt)) {
    result += "continue;";
  } else if (ast.isBreak(stmt)) {
    result += "break;";
  } else if (ast.isBypass(stmt)) {
    if (stmt.bypass) {
      result += stmt.bypass.replaceAll("%%\r\n", "").replaceAll("\r\n%%", "").replaceAll("%%", "");
    }
  } else {
    console.log(chalk.red("ERROR in Statement"));
  }
  return result;
}

/**
 *
 * @param expr
 * @param indent
 * @returns
 */
function generateExpression(expr: ast.Expression | undefined, indent: number, semicolon: boolean = false): string {
  let result = "";
  if (expr == undefined) return result;
  if (ast.isAssignment(expr)) {
    result += transpileAssignment(expr, indent);
  } else if (ast.isLogicalNot(expr)) {
    result += transpileLogicalNot(expr, indent);
  } else if (ast.isCallChain(expr)) {
    result += transpileCallChain(expr, indent);
  } else if (ast.isIfExpression(expr)) {
    result += transpileIfExpression(expr, indent);
  } else if (ast.isMatchExpression(expr)) {
    result += transpileMatchExpression(expr, indent);
  } else if (ast.isGroupExpression(expr)) {
    result += "(" + generateExpression(expr.value, indent) + ")";
  } else if (ast.isUnaryExpression(expr)) {
    result += transpileUnaryExpression(expr, indent);
  } else if (ast.isBinaryExpression(expr)) {
    result += transpileBinaryExpression(expr, indent);
  } else if (ast.isInfixExpression(expr)) {
    result += `${expr.e1}.${expr.name}(${generateExpression(expr.e2, indent)})`;
  } else if (ast.isReturnExpression(expr)) {
    if (expr.value) result += `return ${generateExpression(expr.value, indent)}`;
    else result += "return";
  } else if (ast.isSpreadExpression(expr)) {
    return "..." + expr.spread.$refText;
  } else if (ast.isNewExpression(expr)) {
    result += transpileNewExpression(expr, indent);
  } else if (ast.isArrayExpression(expr)) {
    result += `${expr.element.$refText}[${generateArrayIndex(expr.index, indent)}]`;
  } else if (ast.isArrayValue(expr)) {
    result += "[" + expr.items.map((item) => generateExpression(item.item, indent)).join(", ") + "]";
  } else if (ast.isObjectValue(expr)) {
    result += transpileObjectValue(expr, indent);
  } else if (ast.isFunctionValue(expr)) {
    result += transpileFunctionValue(expr, indent);
  } else if (ast.isLiteral(expr)) {
    // nil 만 undefined로 변경한다.
    result += expr.value == "nil" ? "undefined" : expr.value;
  } else {
    console.log(chalk.red("ERROR in Expression:", expr));
  }

  // semi colon 처리
  if (ast.isIfExpression(expr)) semicolon = false;
  return result + (semicolon ? ";" : "");
}

/**
 *
 * @param body
 * @param indent
 * @param doItForLastCode
 * @returns
 */
function generateBlock(
  body: ast.Block,
  indent: number,
  doItForLastCode?: (lastCode: ast.Code, indent: number) => string
): string {
  const defaultDoIt = (lastCode: ast.Code, indent: number) => {
    if (ast.isStatement(lastCode)) return generateStatement(lastCode, indent);
    else if (ast.isExpression(lastCode)) return generateExpression(lastCode, indent, true);
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
      if (ast.isStatement(code)) element += generateStatement(code, indent + 1);
      else if (ast.isExpression(code)) element += generateExpression(code, indent + 1, true);
      else console.log(chalk.red("ERROR in Block:", code));
    }
    result += applyIndent(indent + 1, element + "\n");
  });
  result += applyIndent(indent, "}");
  return result;
}

/**
 * 이것은 가장 많이 사용되는 타입 표기 형태인 ': type' 을 지원한다.
 * 실제 타입을 표기하는 transpileTypes()과 하나로 합칠 수 없는 것은 타입을 표기하는 다른 방법들이 있기 때문이다.
 *
 * @param type
 * @param indent
 * @returns
 */
function generateTypes(type: ast.Types | undefined, indent: number): string {
  if (!type) return "";
  const result = transpileTypes(type, indent);
  return result ? ": " + result : "";
}

/**
 *
 * @param condition
 * @param indent
 * @returns
 */
function generateCondition(condition: ast.Expression, indent: number): string {
  const e = generateExpression(condition, indent);
  return ast.isGroupExpression(condition) || ast.isUnaryExpression(condition) ? e : "(" + e + ")";
}

/**
 * 배열은 1 부터 카운트되기 때문에 TypeScript로 변환될 때는 -1을 해 주어야 한다.
 * 이때 숫자로 되어져 있으면 -1을 한 값을 바로 사용하고 그렇지 않으면 -1을 추가해 준다.
 * IntegerLiteral 인지의 여부를 판별하기 위해서는 여러 단계를 거쳐야만 한다.
 *
 * @param expr
 * @param indent
 */
function generateArrayIndex(expr: ast.Expression | undefined, indent: number): string {
  if (ast.isUnaryExpression(expr) && ast.isLiteral(expr.value) && typeof expr.value.value == "number") {
    return (expr.value.value - 1).toString();
  }
  return generateExpression(expr, indent) + " - 1";
}

/**
 *
 * @param lv
 * @param s
 * @returns
 */
function applyIndent(lv: number, s: string) {
  return "  ".repeat(lv) + s;
}

/**
 *
 * @param stmt
 * @param indent
 * @returns
 */
function transpileVariableDef(stmt: ast.VariableDef, indent: number, isClassMember: boolean = false): string {
  let result = "";
  if (stmt.annotate == "NotTrans") return result;
  if (stmt.export) result += "export ";
  if (stmt.private) result += "private ";
  if (stmt.static) result += "static ";
  if (!isClassMember) {
    if (stmt.kind == "var") result += "let ";
    if (stmt.kind == "val") result += "const ";
  }
  result += stmt.name + (stmt.nullable ? "?" : "") + generateTypes(stmt.type, indent);
  result += stmt.value ? " = " + generateExpression(stmt.value, indent) : "";
  result += ";";
  return result;
}

/**
 *
 * @param stmt
 * @param indent
 * @param isClassMethod
 * @returns
 */
function transpileFunctionDef(stmt: ast.FunctionDef, indent: number, isClassMethod: boolean = false): string {
  let result = "";
  if (stmt.annotate == "NotTrans") return result;
  if (stmt.export) result += "export ";
  if (stmt.private) result += "private ";
  if (stmt.static) result += "static ";

  if (!isClassMethod) result += "function ";
  result += `${stmt.name}${transpileFunctionArgs(stmt.params, indent)}${generateTypes(stmt.returnType, indent)} `;
  result += stmt.body ? transpileFunctionBody(stmt.body, indent, true) : "";
  return result;
}

/**
 * function type은 TypeScript로 변환될 때 (arg: number) => number 형태로 변환된다.
 *
 * @param expr
 * @param indent
 * @returns
 */
function transpileFunctionType(expr: ast.FunctionType, indent: number): string {
  const result = transpileFunctionArgs(expr.bindings, indent);
  // 함수의 리턴 타입을 표기하는 방식이 다르기 때문에 generateTypes()을 사용하지 않는다.
  return result + (expr.returnType ? ` => ${transpileTypes(expr.returnType, indent)}` : "");
}

/**
 * function value는 TypeScript로 변환될 때 (arg: number): number => { ... } 형태로 변환된다.
 *
 * @param expr
 * @param indent
 * @returns
 */
function transpileFunctionValue(expr: ast.FunctionValue, indent: number): string {
  const result = transpileFunctionArgs(expr.bindings, indent) + generateTypes(expr.returnType, indent);
  return result + " => " + transpileFunctionBody(expr.body, indent);
}

/**
 *
 * @param args
 * @param indent
 * @returns
 */
function transpileFunctionArgs(args: ast.TypeBinding[] | ast.Parameter[], indent: number) {
  return (
    "(" +
    args
      .map((arg) => {
        if (ast.isTypeBinding(arg)) return arg.name + generateTypes(arg.type, indent);
        else if (ast.isParameter(arg)) {
          let p = (arg.spread ? "..." : "") + arg.name;
          p += (arg.nullable ? "?" : "") + generateTypes(arg.type, indent);
          p += arg.value ? ` = ${generateExpression(arg.value, indent)}` : "";
          return p;
        } else return "internal error";
      })
      .join(", ") +
    ")"
  );
}

/**
 *
 * @param body
 * @param indent
 * @param isDefinition
 * @returns
 */
function transpileFunctionBody(body: ast.Block, indent: number, isDefinition: boolean = false): string {
  let result = "";
  if (!isDefinition) {
    // 함수가 정의되는 경우에는 단일 식인지의 여부와 관계없이 블럭으로 처리되어야 한다.
    // 단일 expression을 괄호로 표시하면 numbers.find(n => n == 0) 과 같은 구문에 항상 return을 사용해야 하는 불편이 있다.
    // 따라서 expression이 하나이면 괄호를 사용하지 않지만 이것도 return 문과 같이 사용되면 괄호를 사용해야 한다
    // return처럼 단일 expression으로 처리할 수 없는 것들은 assignment, if, match등이 있다.
    if (body.codes.length == 0) console.error("block is empty");
    if (body.codes.length == 1) {
      const lastCode = body.codes[0];
      if (ast.isExpression(lastCode)) {
        if (
          !(
            ast.isAssignment(lastCode) ||
            ast.isIfExpression(lastCode) ||
            ast.isMatchExpression(lastCode) ||
            ast.isReturnExpression(lastCode)
          )
        )
          return result + generateExpression(lastCode, indent);
      }
    }
  }

  // generateBlock에 전달되는 indent는 function level인데 generateBlock에서는 이를 모두 +1 해서 쓰고 있다.
  result += generateBlock(body, indent, (lastCode: ast.Code, indent: number) => {
    if (ast.isStatement(lastCode)) return generateStatement(lastCode, indent);
    else if (ast.isExpression(lastCode)) return generateExpression(lastCode, indent, true);
    else return "";
  });
  return result;
}

/**
 *
 * @param stmt
 * @param indent
 * @returns
 */
function transpileObjectDef(stmt: ast.ObjectDef, indent: number): string {
  let result = "";
  if (stmt.annotate == "NotTrans") return result;
  if (stmt.export) result += "export ";

  // interface가 되는 조건
  // body 에 함수나 할당문이 있을 경우 또는 변수 선언문에서 값으로 초기화하는 경우가 아닌 경우
  let isInterface = true;
  stmt.body.elements.forEach((m) => {
    if (ast.isFunctionDef(m) || ast.isAssignment(m)) isInterface = false;
    if (ast.isVariableDef(m) && m.value) isInterface = false;
  });

  if (isInterface) {
    result += `interface ${stmt.name} {\n`;
  } else {
    result += `class ${stmt.name} `;
    result += stmt.superClass ? `extends ${stmt.superClass.$refText} {\n` : "{\n";
  }
  stmt.body.elements.forEach((m) => {
    if (ast.isFunctionDef(m)) {
      result += applyIndent(indent + 1, transpileFunctionDef(m, indent + 1, true));
    } else if (ast.isVariableDef(m)) {
      result += applyIndent(indent + 1, transpileVariableDef(m, indent + 1, true));
    } else if (ast.isBypass(m)) {
      result += applyIndent(indent + 1, generateStatement(m, indent + 1));
    } else {
      console.log(chalk.red("internal error"));
    }
    result += "\n";
  });
  result += "}";
  return result;
}

/**
 *
 * @param stmt
 * @param indent
 * @returns
 */
function transpileForStatement(stmt: ast.ForStatement, indent: number): string {
  let result = "";
  let forIndent = indent;
  stmt.iterators.forEach((iter, idx) => {
    const name = iter.name;
    if (ast.isForOf(iter)) {
      const text = `for (const ${name} of ${generateExpression(iter.of, indent)}) `;
      if (idx == 0) result += text;
      else result += applyIndent(forIndent, text);
    } else {
      const e1 = generateExpression(iter.e1, indent);
      const e2 = generateExpression(iter.e2, indent);
      let mark = iter.to == "to" ? "<=" : "<";
      let step = `${name}++`;
      if (iter.step) {
        if (iter.step >= 0) step = `${name} += ${iter.step}`;
        if (iter.step < 0) {
          mark = iter.to == "to" ? ">=" : ">";
          step = `${name} -= ${-iter.step}`;
        }
      }
      const text = `for (let ${name} = ${e1}; ${name} ${mark} ${e2}; ${step}) `;
      if (idx == 0) result += text;
      else result += applyIndent(forIndent, text);
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
  return result;
}

/**
 *
 * @param stmt
 * @param indent
 * @returns
 */
function transpileTryCatchStatement(stmt: ast.TryCatchStatement, indent: number): string {
  let result = "";
  result += `try ${generateBlock(stmt.body, indent)}`;
  result += applyIndent(indent, "catch {\n");
  stmt.cases.forEach((mc) => {
    if (ast.isLiteral(mc.pattern)) {
      const pattern = generateExpression(mc.pattern, indent);
      result += applyIndent(indent + 1, `case ${pattern}: `);
    } else {
      result += applyIndent(indent + 1, `default: `);
    }
    if (mc.body) {
      result += generateBlock(mc.body, indent + 1, (lastCode, indent) => {
        if (ast.isStatement(lastCode)) return generateStatement(lastCode, indent);
        else if (ast.isExpression(lastCode)) return generateExpression(lastCode, indent, true);
        else return "";
      });
    }
    result += "\n";
  });
  result += applyIndent(indent, "}");
  result += applyIndent(indent, `finally ${generateExpression(stmt.finally, indent)}`);
  return result;
}

/**
 *
 * @param expr
 * @param indent
 * @returns
 */
function transpileAssignment(expr: ast.Assignment, indent: number): string {
  let result = "";
  const name = generateExpression(expr.assign, indent);
  result += `${name} ${expr.operator} ${generateExpression(expr.value, indent)}`;

  // n++ 을 대신해서 n += 1 이 argument로 사용되거나 할 때는 semi colon을 표시하면 안되므로 지원하지 않는다
  // result += ast.isAssignment(expr.value) ? "" : ";";
  return result;
}

/**
 *
 * @param expr
 * @param indent
 * @returns
 */
function transpileLogicalNot(expr: ast.LogicalNot, indent: number): string {
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
  return `${op} ${generateExpression(expr.value, indent)}`;
}

/**
 *
 * @param expr
 * @param indent
 * @returns
 */
function transpileCallChain(expr: ast.CallChain, indent: number): string {
  let result = "";
  if (expr.previous) {
    result += generateExpression(expr.previous, indent);
    result += expr.element ? "." + expr.element.$refText : "";
  } else {
    result += expr.this ? expr.this : "";
    result += expr.element ? expr.element.$refText : "";
  }
  if (expr.isFunction) {
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
        result += found.argIndices.includes(index) ? generateArrayIndex(arg, indent) : generateExpression(arg, indent);
      });
      result += ")";
    } else {
      result += "(" + expr.args.map((arg) => generateExpression(arg, indent)).join(", ") + ")";
    }

    const methodsReturningArrayIndex = [
      { methodName: "findIndex" },
      { methodName: "findLastIndex" },
      { methodName: "indexOf" },
      { methodName: "lastIndexOf" },
    ];
    const found2 = methodsReturningArrayIndex.find((e) => e.methodName == expr.element?.$refText);
    if (found2) {
      result = "(" + result + " + 1)";
    }
  }
  if (expr.isArray) {
    result += "[" + generateArrayIndex(expr.index, indent) + "]";
  }
  if (expr.assertion) result += expr.assertion;
  return result;
}

/**
 *
 * @param expr
 * @param indent
 * @returns
 */
function transpileIfExpression(expr: ast.IfExpression, indent: number): string {
  let result = "";
  // 삼항 연산자 처리 조건
  // else if 문 없이 then, else 문만 있어야 한다.
  // then, else 모두 중괄호 없어야 하며 식이 하나만 있어야 한다.
  // 하나의 식은 return 이 아니어야 한다.
  if (
    expr.then &&
    !expr.then.isBracket &&
    expr.then.codes.length == 1 &&
    ast.isExpression(expr.then.codes[0]) &&
    !ast.isReturnExpression(expr.then.codes[0]) &&
    expr.else &&
    !expr.else.isBracket &&
    expr.else.codes.length == 1 &&
    ast.isExpression(expr.else.codes[0]) &&
    !ast.isReturnExpression(expr.else.codes[0]) &&
    (expr.elif == undefined || expr.elif.length == 0)
  ) {
    result += `${generateCondition(expr.condition, indent)} ? `;

    // then 절에 해당하는 부분은 세미콜론을 포함하지 않아야 한다.
    let then = generateExpression(expr.then.codes[0], indent);
    if (then.endsWith(";")) {
      then = then.slice(0, then.lastIndexOf(";"));
    }

    result += then + " : ";
    result += generateExpression(expr.else.codes[0], indent);
    return result;
  }

  result += "if " + generateCondition(expr.condition, indent) + " ";
  if (expr.then) {
    result += generateBlock(expr.then, indent);
  }
  expr.elif.forEach((elif) => {
    result += "\n" + applyIndent(indent, "else if " + generateCondition(elif.condition, indent) + " ");
    if (elif.elif) {
      result += generateBlock(elif.elif, indent);
    }
  });
  if (expr.else) {
    result += "\n" + applyIndent(indent, "else " + generateBlock(expr.else, indent));
  }
  return result;
}

/**
 *
 * @param expr
 * @param indent
 * @returns
 */
function transpileMatchExpression(expr: ast.MatchExpression, indent: number): string {
  let result = "";
  result += `switch (${generateExpression(expr.expr, indent)}) {\n`;
  expr.cases.forEach((mc) => {
    if (ast.isLiteral(mc.pattern)) {
      const pattern = generateExpression(mc.pattern, indent);
      result += applyIndent(indent + 1, `case ${pattern}: `);
    } else {
      result += applyIndent(indent + 1, `default: `);
    }
    if (mc.body) {
      result += generateBlock(mc.body, indent + 1, (lastCode, indent) => {
        if (ast.isStatement(lastCode)) return generateStatement(lastCode, indent);
        else if (ast.isExpression(lastCode)) return generateExpression(lastCode, indent, true);
        else return "";
      });
    }
    result += "\n";
  });
  result += applyIndent(indent, "}");
  return result;
}

/**
 *
 * @param expr
 * @param indent
 * @returns
 */
function transpileUnaryExpression(expr: ast.UnaryExpression, indent: number): string {
  if (expr.operator) return `${expr.operator} ${generateExpression(expr.value, indent)}`;
  else return generateExpression(expr.value, indent);
}

/**
 *
 * @param expr
 * @param indent
 * @returns
 */
function transpileBinaryExpression(expr: ast.BinaryExpression, indent: number): string {
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
  return `${generateExpression(expr.left, indent)} ${op} ${generateExpression(expr.right, indent)}`;
}

/**
 *
 * @param expr
 * @param indent
 * @returns
 */
function transpileNewExpression(expr: ast.NewExpression, indent: number): string {
  let result = `new ${expr.class.$refText}`;
  if (expr.generic) {
    result += "<";
    expr.generic.types.forEach((t, index) => {
      if (index != 0) result += ", ";
      result += transpileSimpleType(t, indent);
    });
    result += ">";
  }
  result += "(";
  expr.args.map((arg, index) => {
    if (index != 0) result += ", ";
    result += generateExpression(arg, indent);
  });
  result += ")";
  return result;
}

/**
 *
 * @param expr
 * @param indent
 * @returns
 */
function transpileObjectValue(expr: ast.ObjectValue, indent: number): string {
  let result = "{\n";
  expr.elements.forEach((item) => {
    if (item.spread) {
      result += applyIndent(indent + 1, `${item.$cstNode?.text},\n`);
    } else {
      result += applyIndent(
        indent + 1,
        item.name + ": " + (item.value ? generateExpression(item.value, indent + 1) : "") + ",\n"
      );
    }
  });
  result += applyIndent(indent, "}");
  return result;
}

/**
 *
 * @param expr
 * @param indent
 * @returns
 */
function transpileTypes(expr: ast.Types | undefined, indent: number): string {
  let result = "";
  if (expr == undefined) return result;
  expr.types.forEach((t, index) => {
    if (index != 0) result += " | ";
    result += transpileSimpleType(t, indent);
  });
  return result;
}

/**
 *
 * @param expr
 * @param indent
 * @returns
 */
function transpileSimpleType(expr: ast.SimpleType, indent: number): string {
  let result = "";
  if (ast.isArrayType(expr)) {
    result += transpileArrayType(expr, indent);
  } else if (ast.isObjectType(expr)) {
    result += transpileObjectType(expr, indent);
  } else if (ast.isElementType(expr)) {
    result += transpileElementType(expr, indent);
  }
  return result;
}

/**
 *
 * @param expr
 * @param indent
 * @returns
 */
function transpileArrayType(expr: ast.ArrayType, indent: number): string {
  return transpileSimpleType(expr.elementType, indent) + "[]";
}

/**
 *
 * @param expr
 * @param indent
 * @returns
 */
function transpileObjectType(expr: ast.ObjectType, indent: number): string {
  let result = "{ ";
  expr.elements.forEach((e) => {
    if (ast.isFunctionDef(e)) {
      result += transpileFunctionDef(e, indent, true);
    } else if (ast.isVariableDef(e)) {
      result += transpileVariableDef(e, indent, true);
    } else if (ast.isBypass(e)) {
      result += generateStatement(e, indent);
    } else {
      console.log(chalk.red("internal error"));
    }
  });
  result += " }";
  return result;
}

/**
 *
 * @param expr
 * @param indent
 * @returns
 */
function transpileElementType(expr: ast.ElementType, indent: number): string {
  let result = "";
  if (ast.isFunctionType(expr)) {
    result += transpileFunctionType(expr, indent);
  } else if (ast.isPrimitiveType(expr)) {
    result += transpilePrimitiveType(expr, indent);
  } else if (expr.reference) {
    result += expr.reference.$refText;
    if (expr.generic) {
      result += "<";
      expr.generic.types.forEach((t, index) => {
        if (index != 0) result += ", ";
        result += transpileSimpleType(t, indent);
      });
      result += ">";
    }
  } else result += "internal error";
  return result;
}

/**
 *
 * @param expr
 * @param indent
 * @returns
 */
function transpilePrimitiveType(expr: ast.PrimitiveType, indent: number): string {
  // nil 만 undefined로 바꿔준다.
  if (expr.type == "nil") return "undefined";
  return expr.type;
}
