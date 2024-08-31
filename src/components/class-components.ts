import { AstNode, ValidationAcceptor } from "langium";
import * as ast from "../language/generated/ast.js";
import { TypeDescription, TypeSystem, enterLog, exitLog } from "../language/scala-script-types.js";
import { applyIndent, generateFunction, generateVariable } from "../cli/generator-util.js";
import { generateExpression, generateStatement } from "../cli/generator.js";
import { checkMethodReturnType } from "./methodcall-components.js";

/**
 *
 */
export class ClassComponent {
  /**
   *
   * @param stmt
   * @param indent
   * @returns
   */
  static transpile(stmt: ast.Class, indent: number): string {
    let result = "";
    if (stmt.annotate == "NotTrans") return result;
    let isInterface = true;
    if (stmt.statements.find((m) => ast.isMethod(m))) isInterface = false;
    if (isInterface) {
      result += `interface ${stmt.name} {\n`;
      stmt.statements.forEach((m) => {
        if (ast.isField(m)) {
          result += applyIndent(indent + 1, generateVariable(m.name, m.type, m.value, indent) + ";");
        }
        result += "\n";
      });
      result += "}";
      return result;
    }
    result += `class ${stmt.name} `;
    result += stmt.superClass ? `extends ${stmt.superClass.$refText} {\n` : "{\n";
    stmt.statements.forEach((m) => {
      if (ast.isMethod(m)) {
        result += applyIndent(indent + 1, generateFunction(m, indent + 1, true));
      } else if (ast.isField(m)) {
        result += applyIndent(indent + 1, generateVariable(m.name, m.type, m.value, indent) + ";");
      } else if (ast.isBypass(m)) {
        result += applyIndent(indent + 1, generateStatement(m, indent + 1));
      }
      result += "\n";
    });
    result += "}";
    return result;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: ast.Class, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    const log = enterLog("isClass", node.name, indent);
    const type = TypeSystem.createClassType(node);
    exitLog(log);
    return type;
  }

  /**
   *
   * @param declaration
   * @param accept
   */
  static validationChecks(declaration: ast.Class, accept: ValidationAcceptor): void {
    // TODO: implement classes
    // console.log("checkClassDeclaration");
    // accept("error", "Classes are currently unsupported.", {
    //   node: declaration,
    //   property: "name",
    // });
  }
}

/**
 *
 */
export class FieldComponent {
  /**
   *
   * @param stmt
   * @param indent
   * @returns
   */
  static transpile(stmt: ast.Field, indent: number): string {
    return "";
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: ast.Field, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error");
    const log = enterLog("isField", node.name, indent);
    if (node.type) {
      type = TypeSystem.inferType(node.type, cache, indent + 1);
    }
    exitLog(log);
    return type;
  }
}

/**
 *
 */
export class MethodComponent {
  /**
   *
   * @param stmt
   * @param indent
   * @returns
   */
  static transpile(stmt: ast.Method, indent: number): string {
    return generateFunction(stmt, indent);
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: ast.Method, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    const log = enterLog("isMethod", node.name, indent);
    const returnType = TypeSystem.inferType(node.returnType, cache, indent + 1);
    const parameters = node.parameters.map((e) => ({
      name: e.name,
      type: TypeSystem.inferType(e.type, cache, indent + 2),
    }));
    const type = TypeSystem.createFunctionType(returnType, parameters);
    exitLog(log);
    return type;
  }

  /**
   *
   * @param method
   * @param accept
   */
  static validationChecks(method: ast.Method, accept: ValidationAcceptor): void {
    checkMethodReturnType(method, accept);
  }
}

/**
 *
 */
export class ClassLiteralComponent {
  /**
   *
   * @param expr
   * @param indent
   * @returns
   */
  static transpile(expr: ast.ClassLiteral, indent: number): string {
    let result = "{\n";
    expr.items.forEach((item) => {
      result += applyIndent(
        indent + 1,
        item.name + ": " + (item.value ? generateExpression(item.value, indent) : "") + ",\n"
      );
    });
    result += "}";
    return result;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: ast.ClassLiteral, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    const log = enterLog("isClassLiteral", undefined, indent);
    // console.log("object literal:", node.$cstNode?.text);
    const type = TypeSystem.createClassType(node);
    exitLog(log);
    return type;
  }
}
