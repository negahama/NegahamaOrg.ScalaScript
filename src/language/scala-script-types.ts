import { AstNode, AstUtils } from "langium";
import * as ast from "./generated/ast.js";
import { SimpleTypeComponent } from "../components/datatype-components.js";
import { MethodCallComponent } from "../components/methodcall-components.js";
import { AssignmentComponent, VariableComponent } from "../components/variable-components.js";
import { ClassComponent, FieldComponent, MethodComponent } from "../components/class-components.js";
import { ForOfComponent, ForToComponent, ForUntilComponent } from "../components/statement-components.js";
import { BinaryExpressionComponent, UnaryExpressionComponent } from "../components/expression-components.js";
import { ArrayExpressionComponent, ArrayLiteralComponent, ArrayTypeComponent } from "../components/array-components.js";

/**
 *
 * @param procKind
 * @param procId
 * @param indent
 * @returns
 */
var _enableLog_ = false;
export function enableLog(enable: boolean) {
  _enableLog_ = enable;
}
export function enterLog(procKind: string, procId: string | undefined, indent: number): string {
  const space = "    ".repeat(indent);
  if (_enableLog_) console.log(space + `Enter ${procKind}, ${procId}`);
  return space + `Exit ${procKind}, ${procId}`;
}

/**
 *
 * @param indent
 * @param msg
 * @param optionalParams
 */
export function traceLog(indent: number, msg: string, ...optionalParams: any[]) {
  if (_enableLog_) console.log("    ".repeat(indent) + msg, ...optionalParams);
}

/**
 *
 * @param log
 */
export function exitLog(log: string) {
  if (_enableLog_) console.log(log);
}

/**
 *
 */
export type TypeDescription =
  | VoidTypeDescription
  | BooleanTypeDescription
  | StringTypeDescription
  | NumberTypeDescription
  | ArrayTypeDescription
  | FunctionTypeDescription
  | ClassTypeDescription
  | ErrorTypeDescription;

/**
 *
 */
export interface VoidTypeDescription {
  readonly $type: "void";
}

/**
 *
 */
export interface BooleanTypeDescription {
  readonly $type: "boolean";
  readonly literal?: ast.BooleanExpression;
}

/**
 *
 */
export interface StringTypeDescription {
  readonly $type: "string";
  readonly literal?: ast.StringExpression;
}

/**
 *
 */
export interface NumberTypeDescription {
  readonly $type: "number";
  readonly literal?: ast.NumberExpression;
}

/**
 *
 */
export interface ArrayTypeDescription {
  readonly $type: "array";
  readonly elementType: TypeDescription;
}

/**
 *
 */
export interface FunctionTypeDescription {
  readonly $type: "function";
  readonly returnType: TypeDescription;
  readonly parameters: FunctionParameter[];
}

/**
 *
 */
export interface FunctionParameter {
  name: string;
  type: TypeDescription;
}

/**
 *
 */
export interface ClassTypeDescription {
  readonly $type: "class";
  readonly literal: ast.Class;
}

/**
 *
 */
export interface ErrorTypeDescription {
  readonly $type: "error";
  readonly source?: AstNode;
  readonly message: string;
}

/**
 *
 */
export class TypeSystem {
  /**
   *
   * @returns
   */
  static createVoidType(): VoidTypeDescription {
    return {
      $type: "void",
    };
  }

  /**
   *
   * @param item
   * @returns
   */
  static isVoidType(item: TypeDescription): item is VoidTypeDescription {
    return item.$type === "void";
  }

  /**
   *
   * @param literal
   * @returns
   */
  static createBooleanType(literal?: ast.BooleanExpression): BooleanTypeDescription {
    return {
      $type: "boolean",
      literal,
    };
  }

  /**
   *
   * @param item
   * @returns
   */
  static isBooleanType(item: TypeDescription): item is BooleanTypeDescription {
    return item.$type === "boolean";
  }

  /**
   *
   * @param literal
   * @returns
   */
  static createStringType(literal?: ast.StringExpression): StringTypeDescription {
    return {
      $type: "string",
      literal,
    };
  }

  /**
   *
   * @param item
   * @returns
   */
  static isStringType(item: TypeDescription): item is StringTypeDescription {
    return item.$type === "string";
  }

  /**
   *
   * @param literal
   * @returns
   */
  static createNumberType(literal?: ast.NumberExpression): NumberTypeDescription {
    return {
      $type: "number",
      literal,
    };
  }

  /**
   *
   * @param item
   * @returns
   */
  static isNumberType(item: TypeDescription): item is NumberTypeDescription {
    return item.$type === "number";
  }

  /**
   *
   * @param elementType
   * @returns
   */
  static createArrayType(elementType: TypeDescription): ArrayTypeDescription {
    return {
      $type: "array",
      elementType,
    };
  }

  /**
   *
   * @param item
   * @returns
   */
  static isArrayType(item: TypeDescription): item is ArrayTypeDescription {
    return item.$type === "array";
  }

  /**
   *
   * @param returnType
   * @param parameters
   * @returns
   */
  static createFunctionType(returnType: TypeDescription, parameters: FunctionParameter[]): FunctionTypeDescription {
    return {
      $type: "function",
      parameters,
      returnType,
    };
  }

  /**
   *
   * @param item
   * @returns
   */
  static isFunctionType(item: TypeDescription): item is FunctionTypeDescription {
    return item.$type === "function";
  }

  /**
   *
   * @param literal
   * @returns
   */
  static createClassType(literal: ast.Class): ClassTypeDescription {
    return {
      $type: "class",
      literal,
    };
  }

  /**
   *
   * @param item
   * @returns
   */
  static isClassType(item: TypeDescription): item is ClassTypeDescription {
    return item.$type === "class";
  }

  /**
   *
   * @param message
   * @param source
   * @returns
   */
  static createErrorType(message: string, source?: AstNode): ErrorTypeDescription {
    return {
      $type: "error",
      message,
      source,
    };
  }

  /**
   *
   * @param item
   * @returns
   */
  static isErrorType(item: TypeDescription): item is ErrorTypeDescription {
    return item.$type === "error";
  }

  /**
   *
   * @param item
   * @returns
   */
  static typeToString(item: TypeDescription): string {
    if (this.isClassType(item)) {
      return item.literal.name;
    } else if (this.isFunctionType(item)) {
      const params = item.parameters.map((e) => `${e.name}: ${this.typeToString(e.type)}`).join(", ");
      return `(${params}) => ${this.typeToString(item.returnType)}`;
    } else {
      return item.$type;
    }
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferType(
    node: AstNode | undefined,
    cache: Map<AstNode, TypeDescription>,
    indent: number = 0
  ): TypeDescription {
    const rootLog = enterLog("inferType", `node is ${node?.$type}`, indent);

    let type: TypeDescription | undefined;
    if (!node) {
      exitLog(rootLog.replace("Exit", "Exit1"));
      return this.createErrorType("Could not infer type for undefined", node);
    }

    const existing = cache.get(node);
    if (existing) {
      exitLog(rootLog.replace("Exit", "Exit2"));
      return existing;
    }

    // Prevent recursive inference errors
    cache.set(node, this.createErrorType("Recursive definition", node));

    if (ast.isMethodCall(node)) {
      type = MethodCallComponent.inferType(node, cache, indent);
    } else if (ast.isVariable(node)) {
      type = VariableComponent.inferType(node, cache, indent);
    } else if (ast.isClass(node)) {
      type = ClassComponent.inferType(node, cache, indent);
    } else if (ast.isField(node)) {
      type = FieldComponent.inferType(node, cache, indent);
    } else if (ast.isMethod(node)) {
      type = MethodComponent.inferType(node, cache, indent);
    } else if (ast.isParameter(node)) {
      const log = enterLog("isParameter", node.name, indent);
      if (node.type) {
        type = TypeSystem.inferType(node.type, cache, indent + 1);
      } else if (node.value) {
        type = TypeSystem.inferType(node.value, cache, indent + 1);
      }
      exitLog(log);
    } else if (ast.isBinding(node)) {
      const log = enterLog("isBinding", node.name, indent);
      if (node.type) {
        type = TypeSystem.inferType(node.type, cache, indent + 1);
      }
      exitLog(log);
    } else if (ast.isSimpleType(node)) {
      type = SimpleTypeComponent.inferType(node, cache, indent);
    } else if (ast.isArrayType(node)) {
      // isArrayType은 isSimpleType보다 나중에 검사되어야 한다.
      type = ArrayTypeComponent.inferType(node, cache, indent);
    } else if (ast.isArrayLiteral(node)) {
      type = ArrayLiteralComponent.inferType(node, cache, indent);
    } else if (ast.isArrayExpression(node)) {
      type = ArrayExpressionComponent.inferType(node, cache, indent);
    } else if (ast.isForOf(node)) {
      type = ForOfComponent.inferType(node, cache, indent);
    } else if (ast.isForTo(node)) {
      type = ForToComponent.inferType(node, cache, indent);
    } else if (ast.isForUntil(node)) {
      type = ForUntilComponent.inferType(node, cache, indent);
    } else if (ast.isAssignment(node)) {
      type = AssignmentComponent.inferType(node, cache, indent);
    } else if (ast.isLambdaType(node)) {
      const log = enterLog("isLambdaType", undefined, indent);
      //type = { $type: "lambda" };
      exitLog(log);
    } else if (ast.isStringExpression(node)) {
      const log = enterLog("isStringExpression", node.value, indent);
      type = this.createStringType(node);
      exitLog(log);
    } else if (ast.isNumberExpression(node)) {
      const log = enterLog("isNumberExpression", node.value.toString(), indent);
      type = this.createNumberType(node);
      exitLog(log);
    } else if (ast.isBooleanExpression(node)) {
      const log = enterLog("isBooleanExpression", node.value.toString(), indent);
      type = this.createBooleanType(node);
      exitLog(log);
    } else if (ast.isVoidExpression(node)) {
      const log = enterLog("isVoidExpression", node.value, indent);
      type = this.createVoidType();
      exitLog(log);
    } else if (ast.isBinaryExpression(node)) {
      type = BinaryExpressionComponent.inferType(node, cache, indent);
    } else if (ast.isUnaryExpression(node)) {
      type = UnaryExpressionComponent.inferType(node, cache, indent);
    } else if (ast.isGroupExpression(node)) {
      const log = enterLog("isGroup", node.$cstNode?.text, indent);
      type = TypeSystem.inferType(node.value, cache, indent + 1);
      exitLog(log);
    } else if (ast.isReturnExpression(node)) {
      const log = enterLog("isReturnExpr", undefined, indent);
      if (!node.value) {
        type = this.createVoidType();
      } else {
        type = TypeSystem.inferType(node.value, cache, indent + 1);
      }
      exitLog(log);
    }
    if (!type) {
      type = this.createErrorType("Could not infer type for " + node.$type, node);
    }

    cache.set(node, type);
    exitLog(rootLog.replace("Exit", "Exit3") + `, type: ${this.typeToString(type)}`);
    return type;
  }

  /**
   *
   * @param node
   * @param name
   * @param cache
   * @param indent
   * @returns
   */
  static inferTypeByName(
    node: AstNode | undefined,
    name: string,
    cache: Map<AstNode, TypeDescription>,
    indent: number = 0
  ): TypeDescription {
    const rootLog = enterLog("inferTypeByName", `node is ${node?.$type}, name is ${name}`, indent);
    if (node == undefined)
      return this.createErrorType("Could not infer type because node is undefined in inferTypeByName", node);

    let type: TypeDescription = this.createErrorType("Could not find name in inferTypeByName", node);
    const precomputed = AstUtils.getDocument(node).precomputedScopes;
    if (precomputed) {
      let currentNode: AstNode | undefined = node;
      do {
        // console.log("  currNode:", currentNode?.$type);
        const allDescriptions = precomputed.get(currentNode);
        if (allDescriptions.length > 0) {
          const found = allDescriptions.find((d) => d.name == name && d.type == "Variable");
          if (found) {
            // console.log("     found:", found.name, found.type);
            type = TypeSystem.inferType(found.node, cache, indent + 1);
          }
        }
        currentNode = currentNode?.$container;
      } while (currentNode);
    }

    exitLog(rootLog);
    return type;
  }

  /**
   *
   * @param classItem
   * @returns
   */
  static getClassChain(classItem: ast.Class): ast.Class[] {
    const set = new Set<ast.Class>();
    let value: ast.Class | undefined = classItem;
    while (value && !set.has(value)) {
      set.add(value);
      value = value.superClass?.ref;
    }
    // Sets preserve insertion order
    return Array.from(set);
  }
}
