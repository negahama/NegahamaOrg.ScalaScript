import { AstNode, ValidationAcceptor } from "langium";
import * as ast from "../language/generated/ast.js";
import { TypeDescription, TypeSystem, enterLog, exitLog } from "../language/scala-script-types.js";
import { applyIndent, generateExpression, generateStatement } from "../cli/generator.js";
import { FunctionComponent } from "./function-components.js";
import { VariableComponent } from "./variable-components.js";
import chalk from "chalk";

/**
 *
 */
export class ObjectComponent {
  /**
   *
   * @param stmt
   * @param indent
   * @returns
   */
  static transpile(stmt: ast.TObject, indent: number): string {
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
        result += applyIndent(indent + 1, FunctionComponent.transpile(m, indent + 1, true));
      } else if (ast.isTVariable(m)) {
        result += applyIndent(indent + 1, VariableComponent.transpile(m, indent, true));
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
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: ast.TObject, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    const log = enterLog("isTObject", node.name, indent);
    const type = TypeSystem.createClassType(node);
    exitLog(log);
    return type;
  }

  /**
   *
   * @param declaration
   * @param accept
   */
  static validationChecks(declaration: ast.TObject, accept: ValidationAcceptor): void {
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
export class ObjectTypeComponent {
  /**
   *
   * @param expr
   * @param indent
   * @returns
   */
  static transpile(expr: ast.ObjectType, indent: number): string {
    let result = "{ ";
    expr.elements.forEach((e) => {
      if (ast.isTFunction(e)) {
        result += FunctionComponent.transpile(e, indent, true);
      } else if (ast.isTVariable(e)) {
        result += VariableComponent.transpile(e, indent, true);
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
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: ast.ObjectType, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    const log = enterLog("isObjectType", node.$cstNode?.text, indent);
    const type = TypeSystem.createClassType(node);
    exitLog(log);
    return type;
  }
}

/**
 *
 */
export class ObjectValueComponent {
  /**
   *
   * @param expr
   * @param indent
   * @returns
   */
  static transpile(expr: ast.ObjectValue, indent: number): string {
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
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(node: ast.ObjectValue, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    const log = enterLog("isObjectValue", node.$cstNode?.text, indent);
    const type = TypeSystem.createClassType(node);
    exitLog(log);
    return type;
  }
}
