import { AstNode, ValidationAcceptor } from "langium";
import * as ast from "../language/generated/ast.js";
import { TypeDescription, TypeSystem, enterLog, exitLog } from "../language/scala-script-types.js";
import { applyIndent, generateExpression, generateFunction, generateStatement } from "../cli/generator.js";
import { checkMethodReturnType } from "./methodcall-components.js";
import { AllTypesComponent } from "./datatype-components.js";

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
    if (stmt.elements.find((m) => ast.isMethod(m))) isInterface = false;
    if (isInterface) {
      result += `interface ${stmt.name} {\n`;
    } else {
      result += `class ${stmt.name} `;
      result += stmt.superClass ? `extends ${stmt.superClass.$refText} {\n` : "{\n";
    }
    stmt.elements.forEach((m) => {
      if (ast.isMethod(m)) {
        result += applyIndent(indent + 1, MethodComponent.transpile(m, indent + 1));
      } else if (ast.isField(m)) {
        result += applyIndent(indent + 1, FieldComponent.transpile(m, indent) + ";");
      } else if (ast.isBypass(m)) {
        result += applyIndent(indent + 1, generateStatement(m, indent + 1));
      } else {
        console.log("internal error");
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
    let result = stmt.name + AllTypesComponent.transpile(stmt.type, indent);
    result += stmt.value ? " = " + generateExpression(stmt.value, indent) : "";
    return result;
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
    return generateFunction(stmt, indent, true);
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
export class ClassTypeComponent {
  /**
   *
   * @param expr
   * @param indent
   * @returns
   */
  static transpile(expr: ast.ClassType, indent: number): string {
    let result = "";
    expr.elements.forEach((e) => {
      if (ast.isMethod(e)) {
        result += MethodComponent.transpile(e, 1);
      } else if (ast.isField(e)) {
        result += FieldComponent.transpile(e, 1) + ";";
      } else if (ast.isBypass(e)) {
        result += generateStatement(e, 1);
      } else {
        console.log("internal error");
      }
    });
    return result;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: ast.ClassType, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    const log = enterLog("isClassType", undefined, indent);
    // console.log("class type:", node.$cstNode?.text);
    const type = TypeSystem.createClassType(node);
    exitLog(log);
    return type;
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
    expr.elements.forEach((item) => {
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
