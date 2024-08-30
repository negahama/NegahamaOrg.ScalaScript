import { AstNode } from "langium";
import {
  isCatchStatement,
  isExpression,
  isForStatement,
  isForOf,
  isForTo,
  isForUntil,
  isLiteral,
  isStatement,
  Statement,
} from "../language/generated/ast.js";
import { TypeDescription, TypeSystem, enterLog, exitLog } from "../language/scala-script-types.js";
import { generateExpression, generateStatement } from "../cli/generator.js";
import { applyIndent, generateBlock } from "../cli/generator-util.js";

/**
 *
 */
export class ForStatementComponent {
  /**
   *
   * @param stmt
   * @param indent
   * @returns
   */
  static transpile(stmt: Statement, indent: number): string {
    let result = "";
    if (!isForStatement(stmt)) return result;

    let forIndent = indent;
    stmt.iterators.forEach((iter, idx) => {
      const name = iter.name;
      if (isForOf(iter)) {
        const text = `for (const ${name} of ${generateExpression(iter.of, indent)}) `;
        if (idx == 0) result += text;
        else result += applyIndent(forIndent, text);
      } else {
        const e1 = generateExpression(iter.e1, indent);
        const e2 = generateExpression(iter.e2, indent);
        let mark = isForTo(iter) ? "<=" : "<";
        let step = `${name}++`;
        if (iter.step) {
          if (iter.step >= 0) step = `${name} += ${iter.step}`;
          if (iter.step < 0) {
            mark = isForTo(iter) ? ">=" : ">";
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
   * //todo 중첩 for 문인 경우 타입 처리는?
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: AstNode, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error");
    if (!isForStatement(node)) return type;

    const log = enterLog("isForStatement", node.$type, indent);
    exitLog(log);
    return type;
  }
}

/**
 *
 */
export class ForOfComponent {
  /**
   *
   * @param stmt
   * @param indent
   * @returns
   */
  static transpile(stmt: Statement, indent: number): string {
    let result = "";
    if (!isForOf(stmt)) return result;

    return result;
  }

  /**
   * 이 함수는 for(a <- ary)와 같이 정의되어진 후 a를 참조하게 되면 a의 타입을 추론할때 사용된다.
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: AstNode, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error");
    if (!isForOf(node)) return type;

    const log = enterLog("isForOf", node.name, indent);
    type = TypeSystem.inferType(node.of, cache, indent + 1);
    if (TypeSystem.isArrayType(type)) type = type.elementType;
    exitLog(log);
    return type;
  }
}

/**
 *
 */
export class ForToComponent {
  /**
   *
   * @param stmt
   * @param indent
   * @returns
   */
  static transpile(stmt: Statement, indent: number): string {
    let result = "";
    if (!isForTo(stmt)) return result;

    return result;
  }

  /**
   * 이 함수는 for(a <- 1 to 10)와 같이 정의되어진 후 a를 참조하게 되면 a의 타입을 추론할때 사용된다.
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: AstNode, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error");
    if (!isForTo(node)) return type;

    const log = enterLog("isForTo", node.name, indent);
    type = TypeSystem.inferType(node.e1, cache, indent + 1);
    if (TypeSystem.isArrayType(type)) type = type.elementType;
    exitLog(log);
    return type;
  }
}

/**
 *
 */
export class ForUntilComponent {
  /**
   *
   * @param stmt
   * @param indent
   * @returns
   */
  static transpile(stmt: Statement, indent: number): string {
    let result = "";
    if (!isForUntil(stmt)) return result;

    return result;
  }

  /**
   * 이 함수는 for(a <- 1 until 10)와 같이 정의되어진 후 a를 참조하게 되면 a의 타입을 추론할때 사용된다.
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: AstNode, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error");
    if (!isForUntil(node)) return type;

    const log = enterLog("isForUntil", node.name, indent);
    type = TypeSystem.inferType(node.e1, cache, indent + 1);
    if (TypeSystem.isArrayType(type)) type = type.elementType;
    exitLog(log);
    return type;
  }
}

/**
 *
 */
export class CatchStatementComponent {
  /**
   *
   * @param stmt
   * @param indent
   * @returns
   */
  static transpile(stmt: Statement, indent: number): string {
    let result = "";
    if (!isCatchStatement(stmt)) return result;

    result += `try ${generateBlock(stmt.body, indent)}`;
    result += applyIndent(indent, "catch {\n");
    stmt.cases.forEach((mc) => {
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
    });
    result += applyIndent(indent, "}");
    result += applyIndent(indent, `finally ${generateExpression(stmt.finally, indent)}`);
    return result;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: AstNode, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error");
    if (!isCatchStatement(node)) return type;

    const log = enterLog("isCatchStatement", node.$type, indent);
    exitLog(log);
    return type;
  }
}
