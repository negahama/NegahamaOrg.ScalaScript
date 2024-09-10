import * as fs from "node:fs";
import * as path from "node:path";
import { expandToNode, joinToNode, toString } from "langium/generate";
import * as ast from "../language/generated/ast.js";
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
export function generateCode(code: ast.Code): string {
  let result = "";
  if (ast.isStatement(code)) result += generateStatement(code, 0);
  else if (ast.isExpression(code)) result += generateExpression(code, 0);
  else console.log(chalk.red("ERROR in Code:", code));
  return result;
}

/**
 *
 * @param stmt
 * @param indent
 * @returns
 */
export function generateStatement(stmt: ast.Statement | undefined, indent: number): string {
  let result = "";
  if (stmt == undefined) return result;
  if (ast.isTVariable(stmt)) {
    result += transpileVariable(stmt, indent);
  } else if (ast.isTFunction(stmt)) {
    result += transpileFunction(stmt, indent);
  } else if (ast.isTObject(stmt)) {
    result += transpileObject(stmt, indent);
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
      result += stmt.bypass
        .replaceAll("%%\r\n", "")
        .replaceAll("\r\n%%", "")
        .replaceAll("%%//", "")
        .replaceAll("%%", "");
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
export function generateExpression(expr: ast.Expression | undefined, indent: number): string {
  let result = "";
  if (expr == undefined) return result;
  if (ast.isAssignment(expr)) {
    result += transpileAssignment(expr, indent);
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
    if (expr.value) result += `return ${generateExpression(expr.value, indent)};`;
    else result += "return";
  } else if (ast.isNewExpression(expr)) {
    result += transpileNewExpression(expr, indent);
  } else if (ast.isArrayExpression(expr)) {
    result += transpileArrayExpression(expr, indent);
  } else if (ast.isArrayValue(expr)) {
    result += transpileArrayValue(expr, indent);
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
  return result;
}

/**
 *
 * @param body
 * @param indent
 * @param doItForLastCode
 * @returns
 */
export function generateBlock(
  body: ast.Block,
  indent: number,
  doItForLastCode?: (lastCode: ast.Code, indent: number) => string
): string {
  const defaultDoIt = (lastCode: ast.Code, indent: number) => {
    if (ast.isStatement(lastCode)) return generateStatement(lastCode, indent);
    else if (ast.isExpression(lastCode)) return generateExpression(lastCode, indent);
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
      else if (ast.isExpression(code)) element += generateExpression(code, indent + 1);
      else console.log(chalk.red("ERROR in Block:", code));
    }
    result += applyIndent(indent + 1, element + "\n");
  });
  result += applyIndent(indent, "}");
  return result;
}

/**
 *
 * @param type
 * @param indent
 * @returns
 */
export function generateTypes(type: ast.Types | undefined, indent: number): string {
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
export function generateCondition(condition: ast.Expression, indent: number): string {
  const e = generateExpression(condition, indent);
  return ast.isGroupExpression(condition) ? e : "(" + e + ")";
}

/**
 *
 * @param lv
 * @param s
 * @returns
 */
export function applyIndent(lv: number, s: string) {
  return "  ".repeat(lv) + s;
}

/**
 *
 * @param stmt
 * @param indent
 * @returns
 */
export function transpileVariable(stmt: ast.TVariable, indent: number, isClassMember: boolean = false): string {
  let result = "";
  if (stmt.annotate == "NotTrans") return result;
  if (stmt.private) result += "private ";
  if (stmt.static) result += "static ";
  if (!isClassMember) {
    if (stmt.kind == "var") result += "let ";
    if (stmt.kind == "val") result += "const ";
  }
  result += stmt.name + generateTypes(stmt.type, indent);
  if (stmt.value) {
    let i = indent;
    if (ast.isObjectValue(stmt.value)) i++;
    result += " = " + generateExpression(stmt.value, i);
  }
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
export function transpileFunction(stmt: ast.TFunction, indent: number, isClassMethod: boolean = false): string {
  const params = stmt.params
    .map((param) => {
      let p = (param.spread ? "..." : "") + param.name;
      p += (param.nullable ? "?" : "") + generateTypes(param.type, indent);
      p += param.value ? ` = ${generateExpression(param.value, indent)}` : "";
      return p;
    })
    .join(", ");

  let result = "";
  if (stmt.annotate == "NotTrans") return result;
  if (ast.isTFunction(stmt)) {
    if (stmt.export) result += "export ";
    if (stmt.private) result += "private ";
    if (stmt.static) result += "static ";
  }
  if (!isClassMethod) result += "function ";
  result += `${stmt.name}(${params})${generateTypes(stmt.returnType, indent)} `;
  // generateBlock에 전달되는 indent는 function level인데 generateBlock에서는 이를 모두 +1 해서 쓰고 있다.
  // 그래서 익명 함수가 받는 indent는 +1되어진 것이다.
  result += stmt.body
    ? generateBlock(stmt.body, indent, (lastCode: ast.Code, indent: number) => {
        if (ast.isStatement(lastCode)) return generateStatement(lastCode, indent);
        else if (ast.isExpression(lastCode)) return generateExpression(lastCode, indent);
        else return "";
      })
    : "";
  return result;
}

/**
 *
 * @param stmt
 * @param indent
 * @returns
 */
export function transpileObject(stmt: ast.TObject, indent: number): string {
  let result = "";
  if (stmt.annotate == "NotTrans") return result;
  if (stmt.export) result += "export ";
  let isInterface = true;
  if (stmt.body.elements.find((m) => ast.isTFunction(m))) isInterface = false;
  if (isInterface) {
    result += `interface ${stmt.name} {\n`;
  } else {
    result += `class ${stmt.name} `;
    result += stmt.superClass ? `extends ${stmt.superClass.$refText} {\n` : "{\n";
  }
  stmt.body.elements.forEach((m) => {
    if (ast.isTFunction(m)) {
      result += applyIndent(indent + 1, transpileFunction(m, indent + 1, true));
    } else if (ast.isTVariable(m)) {
      result += applyIndent(indent + 1, transpileVariable(m, indent, true));
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
export function transpileForStatement(stmt: ast.ForStatement, indent: number): string {
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
      let mark = ast.isForTo(iter) ? "<=" : "<";
      let step = `${name}++`;
      if (iter.step) {
        if (iter.step >= 0) step = `${name} += ${iter.step}`;
        if (iter.step < 0) {
          mark = ast.isForTo(iter) ? ">=" : ">";
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
export function transpileTryCatchStatement(stmt: ast.TryCatchStatement, indent: number): string {
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
        else if (ast.isExpression(lastCode)) return generateExpression(lastCode, indent) + ";";
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
export function transpileAssignment(expr: ast.Assignment, indent: number): string {
  let result = "";
  const name = generateExpression(expr.assign, indent);
  result += `${name} ${expr.operator} ${generateExpression(expr.value, indent)}`;
  result += ast.isAssignment(expr.value) ? "" : ";";
  return result;
}

/**
 *
 * @param expr
 * @param indent
 * @returns
 */
export function transpileCallChain(expr: ast.CallChain, indent: number): string {
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
        result += generateExpression(arg, indent) + (found.argIndices.includes(index) ? " - 1" : "");
      });
      result += ")";
    } else {
      result += "(" + expr.args.map((arg) => generateExpression(arg, indent)).join(", ") + ")";
    }
  }
  if (expr.isArray) {
    result += "[" + generateExpression(expr.index, indent) + "]";
  }
  return result;
}

/**
 *
 * @param expr
 * @param indent
 * @returns
 */
export function transpileIfExpression(expr: ast.IfExpression, indent: number): string {
  let result = "";
  // 삼항 연산자 처리
  if (
    expr.then &&
    !expr.then.isBracket &&
    expr.then.codes.length == 1 &&
    ast.isExpression(expr.then.codes[0]) &&
    expr.else &&
    !expr.else.isBracket &&
    expr.else.codes.length == 1 &&
    ast.isExpression(expr.else.codes[0]) &&
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
export function transpileMatchExpression(expr: ast.MatchExpression, indent: number): string {
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
        else if (ast.isExpression(lastCode)) return generateExpression(lastCode, indent) + ";";
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
export function transpileUnaryExpression(expr: ast.UnaryExpression, indent: number): string {
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
export function transpileBinaryExpression(expr: ast.BinaryExpression, indent: number): string {
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
export function transpileNewExpression(expr: ast.NewExpression, indent: number): string {
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
export function transpileArrayExpression(expr: ast.ArrayExpression, indent: number): string {
  return `${expr.element.$refText}[(${generateExpression(expr.index, indent)}) - 1]`;
}

/**
 *
 * @param expr
 * @param indent
 * @returns
 */
export function transpileArrayValue(expr: ast.ArrayValue, indent: number): string {
  return (
    "[" +
    expr.items
      .map((item) => {
        if (item.item) return generateExpression(item.item, indent);
        else if (item.spread) return "..." + item.spread.$refText;
        else return "error";
      })
      .join(", ") +
    "]"
  );
}

/**
 *
 * @param expr
 * @param indent
 * @returns
 */
export function transpileObjectValue(expr: ast.ObjectValue, indent: number): string {
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
export function transpileFunctionValue(expr: ast.FunctionValue, indent: number): string {
  let result = "";
  result += "(" + expr.bindings.map((bind) => bind.name + generateTypes(bind.type, indent)).join(", ");
  result += ")" + generateTypes(expr.returnType, indent) + " => ";
  result += generateBlock(expr.body, indent, (lastCode: ast.Code, indent: number) => {
    if (ast.isStatement(lastCode)) return generateStatement(lastCode, indent);
    else if (ast.isExpression(lastCode)) return generateExpression(lastCode, indent);
    else return "";
  });
  return result;
}

/**
 *
 * @param expr
 * @param indent
 * @returns
 */
export function transpileTypes(expr: ast.Types | undefined, indent: number): string {
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
export function transpileSimpleType(expr: ast.SimpleType, indent: number): string {
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
export function transpileArrayType(expr: ast.ArrayType, indent: number): string {
  return transpileSimpleType(expr.elementType, indent) + "[]";
}

/**
 *
 * @param expr
 * @param indent
 * @returns
 */
export function transpileObjectType(expr: ast.ObjectType, indent: number): string {
  let result = "{ ";
  expr.elements.forEach((e) => {
    if (ast.isTFunction(e)) {
      result += transpileFunction(e, indent, true);
    } else if (ast.isTVariable(e)) {
      result += transpileVariable(e, indent, true);
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
export function transpileElementType(expr: ast.ElementType, indent: number): string {
  let result = "";
  if (ast.isFunctionType(expr)) {
    result += transpileFunctionType(expr, indent);
  } else if (ast.isPrimitiveType(expr)) {
    result += transpilePrimitiveType(expr, indent);
  } else if (expr.reference) {
    return expr.reference.$refText;
  } else result += "internal error";
  return result;
}

/**
 *
 * @param expr
 * @param indent
 * @returns
 */
export function transpileFunctionType(expr: ast.FunctionType, indent: number): string {
  const list = expr.bindings
    .map((bind) => {
      return bind.name + generateTypes(bind.type, indent);
    })
    .join(", ");
  return `(${list})` + (expr.returnType ? ` => ${transpileTypes(expr.returnType, indent)}` : "");
}

/**
 *
 * @param expr
 * @param indent
 * @returns
 */
export function transpilePrimitiveType(expr: ast.PrimitiveType, indent: number): string {
  // nil 만 undefined로 바꿔준다.
  if (expr.type == "nil") return "undefined";
  return expr.type;
}
