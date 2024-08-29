import { AstNode, ValidationAcceptor } from "langium";
import { Class, isBypass, isClass, isField, isMethod, Statement } from "../language/generated/ast.js";
import { TypeDescription, TypeSystem, enterLog, exitLog } from "../language/scala-script-types.js";
import { applyIndent, generateFunction, generateVariable } from "../cli/generator-util.js";
import { generateStatement } from "../cli/generator.js";

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
  static transpile(stmt: Statement, indent: number): string {
    let result = "";
    if (!isClass(stmt)) return result;

    if (stmt.annotate == "NotTrans") return result;
    result += `class ${stmt.name} `;
    result += stmt.superClass ? `extends ${stmt.superClass.$refText} {\n` : "{\n";
    stmt.statements.forEach((m) => {
      if (isMethod(m)) {
        result += applyIndent(indent + 1, generateFunction(m, indent + 1, true));
      } else if (isField(m)) {
        result += applyIndent(indent + 1, generateVariable(m.name, m.type, m.value, indent) + ";");
      } else if (isBypass(m)) {
        // result += applyIndent(indent + 1, generateBypass(m));
        result += generateStatement(m, indent + 1);
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
  static inferType(node: AstNode, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error");
    if (!isClass(node)) return type;

    const log = enterLog("isClass", node.name, indent);
    type = TypeSystem.createClassType(node);
    exitLog(log);
    return type;
  }

  /**
   *
   * @param declaration
   * @param accept
   */
  static validationChecks(declaration: Class, accept: ValidationAcceptor): void {
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
  static transpile(stmt: Statement, indent: number): string {
    let result = "";
    if (!isField(stmt)) return result;

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
    if (!isField(node)) return type;

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
  static transpile(stmt: Statement, indent: number): string {
    let result = "";
    if (!isMethod(stmt)) return result;

    result += generateFunction(stmt, indent);
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
    if (!isMethod(node)) return type;

    const log = enterLog("isMethod", node.name, indent);
    const returnType = TypeSystem.inferType(node.returnType, cache, indent + 1);
    const parameters = node.parameters.map((e) => ({
      name: e.name,
      type: TypeSystem.inferType(e.type, cache, indent + 2),
    }));
    type = TypeSystem.createFunctionType(returnType, parameters);
    exitLog(log);
    return type;
  }
}
