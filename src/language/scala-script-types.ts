import { AstNode } from "langium";
import * as ast from "./generated/ast.js";
import { enterLog, exitLog } from "../language/scala-script-util.js";
import { TypesComponent, SimpleTypeComponent } from "../components/datatype-components.js";
import { AssignmentComponent, VariableComponent } from "../components/variable-components.js";
import { ObjectComponent, ObjectValueComponent } from "../components/class-components.js";
import { ArrayExpressionComponent, ArrayValueComponent } from "../components/array-components.js";
import { ForOfComponent, ForToComponent, ForUntilComponent } from "../components/statement-components.js";
import { FunctionComponent, CallChainComponent, FunctionValueComponent } from "../components/function-components.js";
import {
  UnaryExpressionComponent,
  BinaryExpressionComponent,
  NewExpressionComponent,
} from "../components/expression-components.js";

/**
 *
 */
export type TypeDescription =
  | AnyTypeDescription
  | NilTypeDescription
  | StringTypeDescription
  | NumberTypeDescription
  | BooleanTypeDescription
  | VoidTypeDescription
  | ArrayTypeDescription
  | UnionTypeDescription
  | FunctionTypeDescription
  | ClassTypeDescription
  | ErrorTypeDescription;

/**
 *
 */
export interface AnyTypeDescription {
  readonly $type: "any";
}

/**
 *
 */
export interface NilTypeDescription {
  readonly $type: "nil";
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
export interface BooleanTypeDescription {
  readonly $type: "boolean";
  readonly literal?: ast.BooleanExpression;
}

/**
 *
 */
export interface VoidTypeDescription {
  readonly $type: "void";
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
export interface UnionTypeDescription {
  readonly $type: "union";
  readonly elementTypes: TypeDescription[];
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
  readonly literal: ast.TObject | ast.ObjectType | ast.ObjectValue;
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
  static createAnyType(): AnyTypeDescription {
    return {
      $type: "any",
    };
  }

  /**
   *
   * @param item
   * @returns
   */
  static isAnyType(item: TypeDescription): item is AnyTypeDescription {
    return item.$type === "any";
  }

  /**
   *
   * @returns
   */
  static createNilType(): NilTypeDescription {
    return {
      $type: "nil",
    };
  }

  /**
   *
   * @param item
   * @returns
   */
  static isNilType(item: TypeDescription): item is NilTypeDescription {
    return item.$type === "nil";
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
   * @param elementType
   * @returns
   */
  static createUnionType(elementTypes: TypeDescription[]): UnionTypeDescription {
    return {
      $type: "union",
      elementTypes,
    };
  }

  /**
   *
   * @param item
   * @returns
   */
  static isUnionType(item: TypeDescription): item is UnionTypeDescription {
    return item.$type === "union";
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
  static createClassType(literal: ast.TObject | ast.ObjectType | ast.ObjectValue): ClassTypeDescription {
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
      return item.literal.$cstNode?.text ?? "unknown";
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
    const rootLog = enterLog("inferType", `'${node?.$cstNode?.text}', node is ${node?.$type}`, indent);

    let type: TypeDescription | undefined;
    if (!node) {
      exitLog(rootLog.replace("Exit0", "Exit1"), type);
      return this.createErrorType("Could not infer type for undefined", node);
    }

    const existing = cache.get(node);
    if (existing) {
      exitLog(rootLog.replace("Exit0", "Exit2"), type);
      return existing;
    }

    // Prevent recursive inference errors
    cache.set(node, this.createErrorType("Recursive definition", node));

    if (ast.isTypes(node)) {
      type = TypesComponent.inferType(node, cache, indent);
    } else if (ast.isPrimitiveType(node)) {
      //todo - 따로 분리된 이유는
      type = SimpleTypeComponent.inferType(node, cache, indent);
    } else if (ast.isTVariable(node)) {
      type = VariableComponent.inferType(node, cache, indent);
    } else if (ast.isTFunction(node)) {
      type = FunctionComponent.inferType(node, cache, indent);
    } else if (ast.isCallChain(node)) {
      type = CallChainComponent.inferType(node, cache, indent);
    } else if (ast.isTObject(node)) {
      type = ObjectComponent.inferType(node, cache, indent);
    } else if (ast.isParameter(node)) {
      // Parameter를 type이나 value로 타입을 알 수 없을 경우는 any type으로 취급한다.
      const log = enterLog("isParameter", node.name, indent);
      if (node.type) {
        type = TypeSystem.inferType(node.type, cache, indent + 1);
      } else if (node.value) {
        type = TypeSystem.inferType(node.value, cache, indent + 1);
      } else {
        type = TypeSystem.createAnyType();
      }
      exitLog(log, type);
    } else if (ast.isTypeBinding(node)) {
      const log = enterLog("isTypeBinding", node.name, indent);
      // Binding에 type 정보가 없으면 any type으로 취급한다.
      if (node.type) {
        type = TypeSystem.inferType(node.type, cache, indent + 1);
      } else {
        type = TypeSystem.createAnyType();
      }
      exitLog(log, type);
    } else if (ast.isAssignBinding(node)) {
      const log = enterLog("isAssignBinding", node.name, indent);
      //todo 원래 타입은?
      // Assign Binding에는 value가 없을수는 없지만 없으면 nil type으로 취급한다.
      if (node.value) {
        type = TypeSystem.inferType(node.value, cache, indent + 1);
      } else {
        type = TypeSystem.createNilType();
      }
      exitLog(log, type);
    } else if (ast.isForOf(node)) {
      type = ForOfComponent.inferType(node, cache, indent);
    } else if (ast.isForTo(node)) {
      type = ForToComponent.inferType(node, cache, indent);
    } else if (ast.isForUntil(node)) {
      type = ForUntilComponent.inferType(node, cache, indent);
    } else if (ast.isAssignment(node)) {
      type = AssignmentComponent.inferType(node, cache, indent);
    } else if (ast.isArrayExpression(node)) {
      type = ArrayExpressionComponent.inferType(node, cache, indent);
    } else if (ast.isGroupExpression(node)) {
      const log = enterLog("isGroup", `'${node.$cstNode?.text}'`, indent);
      type = TypeSystem.inferType(node.value, cache, indent + 1);
      exitLog(log, type);
    } else if (ast.isUnaryExpression(node)) {
      type = UnaryExpressionComponent.inferType(node, cache, indent);
    } else if (ast.isBinaryExpression(node)) {
      type = BinaryExpressionComponent.inferType(node, cache, indent);
    } else if (ast.isReturnExpression(node)) {
      const log = enterLog("isReturnExpr", undefined, indent);
      if (!node.value) {
        type = this.createVoidType();
      } else {
        type = TypeSystem.inferType(node.value, cache, indent + 1);
      }
      exitLog(log, type);
    } else if (ast.isNewExpression(node)) {
      type = NewExpressionComponent.inferType(node, cache, indent);
    } else if (ast.isArrayValue(node)) {
      type = ArrayValueComponent.inferType(node, cache, indent);
    } else if (ast.isObjectValue(node)) {
      type = ObjectValueComponent.inferType(node, cache, indent);
    } else if (ast.isFunctionValue(node)) {
      type = FunctionValueComponent.inferType(node, cache, indent);
    } else if (ast.isLiteral(node)) {
      const log = enterLog("isLiteralExpression", `'${node.$cstNode?.text}'`, indent);
      if (ast.isAnyExpression(node)) type = this.createAnyType();
      else if (ast.isNilExpression(node)) type = this.createNilType();
      else if (ast.isVoidExpression(node)) type = this.createVoidType();
      else if (ast.isStringExpression(node)) type = this.createStringType(node);
      else if (ast.isNumberExpression(node)) type = this.createNumberType(node);
      else if (ast.isBooleanExpression(node)) type = this.createBooleanType(node);
      exitLog(log, type);
    }

    if (!type) {
      type = this.createErrorType("Could not infer type for " + node.$type, node);
    }

    cache.set(node, type);
    exitLog(rootLog.replace("Exit0", "Exit3"), type);
    return type;
  }

  /**
   *
   * @param classItem
   * @returns
   */
  static getClassChain(classItem: ast.TObject): ast.TObject[] {
    const set = new Set<ast.TObject>();
    let value: ast.TObject | undefined = classItem;
    while (value && !set.has(value)) {
      set.add(value);
      value = value.superClass?.ref;
    }
    // Sets preserve insertion order
    return Array.from(set);
  }
}
