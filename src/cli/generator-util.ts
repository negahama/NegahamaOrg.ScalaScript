import {
  Bypass,
  Block,
  Code,
  Type,
  Expression,
  Method,
  isStatement,
  isExpression,
  isGroupExpression,
  isLambdaType,
  isArrayType,
  isTupleType,
  isSimpleType,
  isObjectType,
  isPrimitiveType,
} from "../language/generated/ast.js";
import { generateStatement, generateExpression } from "./generator.js";

/**
 *
 * @param bypass
 * @returns
 */
export function generateBypass(bypass: Bypass): string {
  let result = "";
  if (bypass.bypass) {
    return bypass.bypass.replaceAll("%%\r\n", "").replaceAll("\r\n%%", "").replaceAll("%%//", "").replaceAll("%%", "");
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

/**
 *
 * @param name
 * @param type
 * @param value
 * @param indent
 * @returns
 */
export function generateVariable(
  name: string,
  type: Type | undefined,
  value: Expression | undefined,
  indent: number
): string {
  return name + generateType(type) + (value ? " = " + generateExpression(value, indent) : "");
}

/**
 *
 * @param fun
 * @param indent
 * @param isClassMethod
 * @returns
 */
export function generateFunction(fun: Method, indent: number, isClassMethod: boolean = false): string {
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

/**
 *
 * @param condition
 * @returns
 */
export function generateCondition(condition: Expression): string {
  const e = generateExpression(condition, 0);
  return isGroupExpression(condition) ? e : "(" + e + ")";
}

/**
 *
 * @param type
 * @param includeColon
 * @returns
 */
export function generateType(type: Type | undefined, includeColon: boolean = true): string {
  const typeonly = (t: Type | undefined) => {
    if (t == undefined) return "";
    if (isSimpleType(t)) {
      if (t.reference) {
        return t.reference.$refText;
      } else if (isPrimitiveType(t)) {
        return t.type;
      }
    } else if (isArrayType(t)) {
      if (t.elementType.reference) {
        return t.elementType.reference.$refText + "[]";
      } else if (isPrimitiveType(t.elementType)) {
        return t.elementType.type + "[]";
      }
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

/**
 *
 * @param lv
 * @param s
 * @returns
 */
export function applyIndent(lv: number, s: string) {
  return "  ".repeat(lv) + s;
}
