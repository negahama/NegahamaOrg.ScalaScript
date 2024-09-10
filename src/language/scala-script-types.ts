import { AstNode } from "langium";
import * as ast from "./generated/ast.js";
import { enterLog, exitLog, traceLog } from "../language/scala-script-util.js";

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
      type = TypeSystem.inferTypeTypes(node, cache, indent);
    } else if (ast.isPrimitiveType(node)) {
      //todo - 따로 분리된 이유는
      type = TypeSystem.inferTypeSimpleType(node, cache, indent);
    } else if (ast.isTVariable(node)) {
      type = TypeSystem.inferTypeVariable(node, cache, indent);
    } else if (ast.isTFunction(node)) {
      type = TypeSystem.inferTypeFunction(node, cache, indent);
    } else if (ast.isCallChain(node)) {
      type = TypeSystem.inferTypeCallChain(node, cache, indent);
    } else if (ast.isTObject(node)) {
      type = TypeSystem.inferTypeObject(node, cache, indent);
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
      type = TypeSystem.inferTypeForOf(node, cache, indent);
    } else if (ast.isForTo(node)) {
      type = TypeSystem.inferTypeForTo(node, cache, indent);
    } else if (ast.isForUntil(node)) {
      type = TypeSystem.inferTypeForUntil(node, cache, indent);
    } else if (ast.isAssignment(node)) {
      type = TypeSystem.inferTypeAssignment(node, cache, indent);
    } else if (ast.isIfExpression(node)) {
      type = TypeSystem.inferTypeIfExpression(node, cache, indent);
    } else if (ast.isMatchExpression(node)) {
      type = TypeSystem.inferTypeMatchExpression(node, cache, indent);
    } else if (ast.isArrayExpression(node)) {
      type = TypeSystem.inferTypeArrayExpression(node, cache, indent);
    } else if (ast.isGroupExpression(node)) {
      const log = enterLog("isGroup", `'${node.$cstNode?.text}'`, indent);
      type = TypeSystem.inferType(node.value, cache, indent + 1);
      exitLog(log, type);
    } else if (ast.isUnaryExpression(node)) {
      type = TypeSystem.inferTypeUnaryExpression(node, cache, indent);
    } else if (ast.isBinaryExpression(node)) {
      type = TypeSystem.inferTypeBinaryExpression(node, cache, indent);
    } else if (ast.isReturnExpression(node)) {
      const log = enterLog("isReturnExpr", undefined, indent);
      if (!node.value) {
        type = this.createVoidType();
      } else {
        type = TypeSystem.inferType(node.value, cache, indent + 1);
      }
      exitLog(log, type);
    } else if (ast.isNewExpression(node)) {
      type = TypeSystem.inferTypeNewExpression(node, cache, indent);
    } else if (ast.isArrayValue(node)) {
      type = TypeSystem.inferTypeArrayValue(node, cache, indent);
    } else if (ast.isObjectValue(node)) {
      type = TypeSystem.inferTypeObjectValue(node, cache, indent);
    } else if (ast.isFunctionValue(node)) {
      type = TypeSystem.inferTypeFunctionValue(node, cache, indent);
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

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferTypeTypes(node: ast.Types, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription;
    const log = enterLog("isAllTypes", `'${node.$cstNode?.text}'`, indent);
    const ts = node.types.map((t) => this.inferTypeSimpleType(t, cache, indent));
    // 실제 Union 타입이 아니면 처리를 단순화하기 위해 개별 타입으로 리턴한다.
    if (ts.length == 0) type = TypeSystem.createErrorType("internal error", node);
    else if (ts.length == 1) type = ts[0];
    else type = TypeSystem.createUnionType(ts);
    exitLog(log, type);
    return type;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferTypeSimpleType(
    node: ast.SimpleType,
    cache: Map<AstNode, TypeDescription>,
    indent: number
  ): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    const log = enterLog("isSimpleType", `'${node.$cstNode?.text}'`, indent);
    if (ast.isArrayType(node)) {
      type = TypeSystem.inferTypeArrayType(node, cache, indent + 1);
    } else if (ast.isObjectType(node)) {
      type = TypeSystem.inferTypeObjectType(node, cache, indent + 1);
    } else if (ast.isElementType(node)) {
      type = TypeSystem.inferTypeElementType(node, cache, indent + 1);
    }
    exitLog(log, type);
    return type;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferTypeVariable(node: ast.TVariable, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    const log = enterLog("isTVariable", node.name.toString(), indent);
    if (node.type) {
      type = TypeSystem.inferType(node.type, cache, indent + 1);
    } else if (node.value) {
      type = TypeSystem.inferType(node.value, cache, indent + 1);
    } else {
      type = TypeSystem.createErrorType("No type hint for this element", node);
    }
    exitLog(log, type);
    return type;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferTypeFunction(node: ast.TFunction, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    const log = enterLog("isFunction", node.name, indent);
    const returnType = TypeSystem.inferType(node.returnType, cache, indent + 1);
    const parameters = node.params.map((e) => ({
      name: e.name,
      type: TypeSystem.inferType(e.type, cache, indent + 2),
    }));
    const type = TypeSystem.createFunctionType(returnType, parameters);
    exitLog(log, type);
    return type;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferTypeCallChain(
    node: ast.CallChain,
    cache: Map<AstNode, TypeDescription>,
    indent: number
  ): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    const id = node.element?.$refText;
    const log = enterLog("isCallChain", id, indent);
    traceLog(indent + 1, "ref 참조전:", id);
    const element = node.element?.ref;
    traceLog(indent + 1, "ref 참조후:", id);
    if (element) {
      type = TypeSystem.inferType(element, cache, indent + 1);
    } else if (node.isFunction && node.previous) {
      const previousType = TypeSystem.inferType(node.previous, cache, indent + 1);
      if (TypeSystem.isFunctionType(previousType)) type = previousType.returnType;
      else type = TypeSystem.createErrorType("Cannot call operation on non-function type", node);
    } else if (node.isArray) {
      //todo 해당 배열의 자료형이 무엇인지 어떻게 알아낼 수 있을까
      type = TypeSystem.createArrayType(TypeSystem.createAnyType());
    } else type = TypeSystem.createErrorType("Could not infer type for element " + node.element?.$refText, node);
    if (node.isFunction) {
      if (TypeSystem.isFunctionType(type)) type = type.returnType;
    }
    exitLog(log, type);
    return type;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferTypeObject(node: ast.TObject, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    const log = enterLog("isTObject", node.name, indent);
    const type = TypeSystem.createClassType(node);
    exitLog(log, type);
    return type;
  }

  /**
   * 이 함수는 for(a <- ary)와 같이 정의되어진 후 a를 참조하게 되면 a의 타입을 추론할때 사용된다.
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferTypeForOf(node: ast.ForOf, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    const log = enterLog("isForOf", node.name, indent);
    let type = TypeSystem.inferType(node.of, cache, indent + 1);
    if (TypeSystem.isArrayType(type)) type = type.elementType;
    exitLog(log, type);
    return type;
  }

  /**
   * 이 함수는 for(a <- 1 to 10)와 같이 정의되어진 후 a를 참조하게 되면 a의 타입을 추론할때 사용된다.
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferTypeForTo(node: ast.ForTo, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    const log = enterLog("isForTo", node.name, indent);
    let type = TypeSystem.inferType(node.e1, cache, indent + 1);
    if (TypeSystem.isArrayType(type)) type = type.elementType;
    exitLog(log, type);
    return type;
  }

  /**
   * 이 함수는 for(a <- 1 until 10)와 같이 정의되어진 후 a를 참조하게 되면 a의 타입을 추론할때 사용된다.
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferTypeForUntil(node: ast.ForUntil, cache: Map<AstNode, TypeDescription>, indent: number): TypeDescription {
    const log = enterLog("isForUntil", node.name, indent);
    let type = TypeSystem.inferType(node.e1, cache, indent + 1);
    if (TypeSystem.isArrayType(type)) type = type.elementType;
    exitLog(log, type);
    return type;
  }

  /**
   * //todo 다중 대입문이 아니면 이게 호출되지 않는 이유?
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferTypeAssignment(
    node: ast.Assignment,
    cache: Map<AstNode, TypeDescription>,
    indent: number
  ): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    const log = enterLog("isAssignment", node.operator, indent);
    if (node.assign) {
      type = TypeSystem.inferType(node.assign, cache, indent + 1);
    } else if (node.value) {
      type = TypeSystem.inferType(node.value, cache, indent + 1);
    } else {
      type = TypeSystem.createErrorType("No type hint for this element", node);
    }
    exitLog(log, type);
    return type;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferTypeIfExpression(
    node: ast.IfExpression,
    cache: Map<AstNode, TypeDescription>,
    indent: number
  ): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    const log = enterLog("isIfExpression", node.$type, indent);
    //todo 삼항연산자의 경우 inferType이 호출될 수 있다... 일단은 any type return
    type = TypeSystem.createAnyType();
    exitLog(log, type);
    return type;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferTypeMatchExpression(
    node: ast.MatchExpression,
    cache: Map<AstNode, TypeDescription>,
    indent: number
  ): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    const log = enterLog("isMatchExpression", node.$type, indent);
    exitLog(log, type);
    return type;
  }

  /**
   * ArrayExpression의 타입은 array가 아니라 element-type이다.
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferTypeArrayExpression(
    node: ast.ArrayExpression,
    cache: Map<AstNode, TypeDescription>,
    indent: number
  ): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    // 다른 것들은 node의 타입을 통해서 타입을 추론하지만 이것은 ref을 이용해서 추론해야만 한다.
    const log = enterLog("isArrayExpression", `'${node.element.$refText}'`, indent);
    const ref = node.element.ref;
    type = TypeSystem.inferType(ref, cache, indent + 1);
    if (TypeSystem.isArrayType(type)) type = type.elementType;
    exitLog(log, type);
    return type;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferTypeUnaryExpression(
    node: ast.UnaryExpression,
    cache: Map<AstNode, TypeDescription>,
    indent: number
  ): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    const log = enterLog("isUnaryExpression", node.operator, indent);
    if (node.operator === "!" || node.operator === "not") {
      type = TypeSystem.createBooleanType();
    } else if (node.operator === "typeof") {
      type = TypeSystem.createStringType();
    } else {
      type = TypeSystem.createNumberType();
    }
    exitLog(log, type);
    return type;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferTypeBinaryExpression(
    node: ast.BinaryExpression,
    cache: Map<AstNode, TypeDescription>,
    indent: number
  ): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    const log = enterLog("isBinaryExpression", node.operator, indent);
    type = TypeSystem.createErrorType("Could not infer type from binary expression", node);
    if (["and", "or", "&&", "||", "<", "<=", ">", ">=", "==", "!="].includes(node.operator)) {
      type = TypeSystem.createBooleanType();
    } else if (["-", "+", "**", "*", "/", "%"].includes(node.operator)) {
      type = TypeSystem.createNumberType();
    } else if ([".."].includes(node.operator)) {
      const left = TypeSystem.inferType(node.left, cache, indent + 1);
      const right = TypeSystem.inferType(node.right, cache, indent + 1);
      if (TypeSystem.isStringType(left) || TypeSystem.isStringType(right)) {
        type = TypeSystem.createStringType();
      }
    } else if (node.operator === "instanceof") {
      //todo instanceof 의 결과는 일단 any type으로 처리한다.
      type = TypeSystem.createAnyType();
    }
    exitLog(log, type);
    return type;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferTypeNewExpression(
    node: ast.NewExpression,
    cache: Map<AstNode, TypeDescription>,
    indent: number
  ): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    const log = enterLog("isNewExpression", node.$type, indent);
    if (node.class.ref) {
      type = TypeSystem.createClassType(node.class.ref);
    }
    exitLog(log, type);
    return type;
  }

  /**
   * //todo 모두 동일한 타입을 가지는지 검사해야 한다.
   * //todo 또한 함수의 경우 CallChain에서 처리되는데 이것도 거기서 처리되어야 하지 않을까
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferTypeArrayValue(
    node: ast.ArrayValue,
    cache: Map<AstNode, TypeDescription>,
    indent: number
  ): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    const log = enterLog("isArrayValue", node.items.toString(), indent);
    // item이 없는 경우 즉 [] 으로 표현되는 빈 배열의 경우 any type으로 취급한다.
    if (node.items.length > 0) {
      type = TypeSystem.createArrayType(TypeSystem.inferType(node.items[0], cache, indent));
    } else type = TypeSystem.createAnyType();
    exitLog(log, type);
    return type;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferTypeObjectValue(
    node: ast.ObjectValue,
    cache: Map<AstNode, TypeDescription>,
    indent: number
  ): TypeDescription {
    const log = enterLog("isObjectValue", `'${node.$cstNode?.text}'`, indent);
    const type = TypeSystem.createClassType(node);
    exitLog(log, type);
    return type;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferTypeFunctionValue(
    node: ast.FunctionValue,
    cache: Map<AstNode, TypeDescription>,
    indent: number
  ): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    const log = enterLog("isFunctionValue", node.$type, indent);
    if (node.returnType) type = TypeSystem.inferType(node.returnType, cache, indent);
    exitLog(log, type);
    return type;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferTypeArrayType(
    node: ast.ArrayType,
    cache: Map<AstNode, TypeDescription>,
    indent: number
  ): TypeDescription {
    const log = enterLog("isArrayType", `'${node.elementType.$cstNode?.text}'`, indent);
    const type = TypeSystem.createArrayType(TypeSystem.inferType(node.elementType, cache, indent));
    exitLog(log, type);
    return type;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferTypeObjectType(
    node: ast.ObjectType,
    cache: Map<AstNode, TypeDescription>,
    indent: number
  ): TypeDescription {
    const log = enterLog("isObjectType", `'${node.$cstNode?.text}'`, indent);
    const type = TypeSystem.createClassType(node);
    exitLog(log, type);
    return type;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferTypeElementType(
    node: ast.ElementType,
    cache: Map<AstNode, TypeDescription>,
    indent: number
  ): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    const log = enterLog("isElementType", `'${node.$cstNode?.text}'`, indent);
    if (ast.isFunctionType(node)) {
      type = TypeSystem.inferTypeFunctionType(node, cache, indent);
    } else if (ast.isPrimitiveType(node)) {
      type = TypeSystem.inferTypePrimitiveType(node, cache, indent);
    } else if (node.reference) {
      traceLog(indent + 1, "Type is reference");
      if (node.reference.ref) {
        const ref = node.reference.ref;
        if (ast.isTObject(ref)) {
          type = TypeSystem.createClassType(ref);
        } else {
          traceLog(indent + 1, "node.reference.ref is not class");
        }
      } else {
        traceLog(indent + 1, "node.reference.ref is not valid");
      }
    }
    exitLog(log, type);
    return type;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferTypePrimitiveType(
    node: ast.PrimitiveType,
    cache: Map<AstNode, TypeDescription>,
    indent: number
  ): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    const log = enterLog("isPrimitiveType", `'${node.$cstNode?.text}'`, indent);
    if (node.type === "any") {
      type = TypeSystem.createAnyType();
    } else if (node.type === "nil") {
      type = TypeSystem.createNilType();
    } else if (node.type === "string") {
      type = TypeSystem.createStringType();
    } else if (node.type === "number") {
      type = TypeSystem.createNumberType();
    } else if (node.type === "boolean") {
      type = TypeSystem.createBooleanType();
    } else if (node.type === "void") {
      type = TypeSystem.createVoidType();
    }
    exitLog(log, type);
    return type;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferTypeFunctionType(
    node: ast.FunctionType,
    cache: Map<AstNode, TypeDescription>,
    indent: number
  ): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    const log = enterLog("isFunctionType", `'${node.$cstNode?.text}'`, indent);
    const returnType = TypeSystem.inferType(node.returnType, cache, indent + 1);
    const parameters = node.bindings.map((e) => ({
      name: e.name,
      type: TypeSystem.inferType(e.type, cache, indent + 2),
    }));
    type = TypeSystem.createFunctionType(returnType, parameters);
    exitLog(log, type);
    return type;
  }
}
