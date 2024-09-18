import { AstNode, AstUtils } from "langium";
import * as ast from "./generated/ast.js";
import { enterLog, exitLog, traceLog } from "../language/scala-script-util.js";
import chalk from "chalk";

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

type CacheType = Map<AstNode, TypeDescription>;

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
  readonly literal?: ast.Literal;
}

/**
 *
 */
export interface NumberTypeDescription {
  readonly $type: "number";
  readonly literal?: ast.Literal;
}

/**
 *
 */
export interface BooleanTypeDescription {
  readonly $type: "boolean";
  readonly literal?: ast.Literal;
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
  readonly literal: ast.ObjectDef | ast.ObjectType | ast.ObjectValue;
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
  static createStringType(literal?: ast.Literal): StringTypeDescription {
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
  static createNumberType(literal?: ast.Literal): NumberTypeDescription {
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
  static createBooleanType(literal?: ast.Literal): BooleanTypeDescription {
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
      returnType,
      parameters,
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
  static createClassType(literal: ast.ObjectDef | ast.ObjectType | ast.ObjectValue): ClassTypeDescription {
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
      return `(${params})-> ${this.typeToString(item.returnType)}`;
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
  static inferType(node: AstNode | undefined, cache: CacheType, indent: number = 0): TypeDescription {
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
    } else if (ast.isElementType(node)) {
      // 따로 분리된 이유는 Array의 element type이 object type과 element type으로 되어져 있기 때문이다
      type = TypeSystem.inferTypeSimpleType(node, cache, indent);
    } else if (ast.isPrimitiveType(node)) {
      //todo - 따로 분리된 이유는
      type = TypeSystem.inferTypeSimpleType(node, cache, indent);
    } else if (ast.isVariableDef(node)) {
      type = TypeSystem.inferTypeVariableDef(node, cache, indent);
    } else if (ast.isFunctionDef(node)) {
      type = TypeSystem.inferTypeFunctionDef(node, cache, indent);
    } else if (ast.isObjectDef(node)) {
      type = TypeSystem.inferTypeObjectDef(node, cache, indent);
    } else if (ast.isCallChain(node)) {
      type = TypeSystem.inferTypeCallChain(node, cache, indent);
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
    } else if (ast.isAssignment(node)) {
      type = TypeSystem.inferTypeAssignment(node, cache, indent);
    } else if (ast.isLogicalNot(node)) {
      type = TypeSystem.inferTypeLogicalNot(node, cache, indent);
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
      const log = enterLog("isObjectValue", `'${node.$cstNode?.text}'`, indent);
      type = TypeSystem.createClassType(node);
      exitLog(log, type);
    } else if (ast.isFunctionValue(node)) {
      const log = enterLog("isFunctionValue", node.$type, indent);
      type = TypeSystem.inferFunctionSimpleType(node, cache, indent);
      exitLog(log, type);
    } else if (ast.isLiteral(node)) {
      const log = enterLog("isLiteral", `'${node.$cstNode?.text}'`, indent);
      if (typeof node.value == "string") {
        switch (node.value) {
          case "any":
            type = TypeSystem.createAnyType();
            break;
          case "nil":
            type = TypeSystem.createNilType();
            break;
          case "void":
            type = TypeSystem.createVoidType();
            break;
          case "true":
          case "false":
            type = TypeSystem.createBooleanType();
            break;
          default:
            type = TypeSystem.createStringType(node);
        }
      } else {
        type = TypeSystem.createNumberType(node);
      }
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
  static getClassChain(classItem: ast.ObjectDef): ast.ObjectDef[] {
    const set = new Set<ast.ObjectDef>();
    let value: ast.ObjectDef | undefined = classItem;
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
  static inferTypeTypes(node: ast.Types, cache: CacheType, indent: number): TypeDescription {
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
  static inferTypeSimpleType(node: ast.SimpleType, cache: CacheType, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    const log = enterLog("isSimpleType", `'${node.$cstNode?.text}'`, indent);
    if (ast.isArrayType(node)) {
      type = TypeSystem.createArrayType(TypeSystem.inferType(node.elementType, cache, indent));
    } else if (ast.isObjectType(node)) {
      type = TypeSystem.createClassType(node);
    } else if (ast.isElementType(node)) {
      if (ast.isFunctionType(node)) {
        type = TypeSystem.inferFunctionSimpleType(node, cache, indent);
      } else if (ast.isPrimitiveType(node)) {
        type = TypeSystem.inferTypePrimitiveType(node, cache, indent);
      } else if (node.reference) {
        traceLog(indent + 1, "Type is reference");
        if (node.reference.ref) {
          const ref = node.reference.ref;
          if (ast.isObjectDef(ref)) {
            type = TypeSystem.createClassType(ref);
          } else {
            traceLog(indent + 1, "node.reference.ref is not class");
          }
        } else {
          traceLog(indent + 1, "node.reference.ref is not valid");
        }
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
  static inferTypeVariableDef(node: ast.VariableDef, cache: CacheType, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    const log = enterLog("isVariableDef", node.name.toString(), indent);
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
  static inferTypeFunctionDef(node: ast.FunctionDef, cache: CacheType, indent: number): TypeDescription {
    const log = enterLog("isFunction", node.name, indent);
    const returnType = TypeSystem.inferFunctionReturnType(node, cache, indent);
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
  static inferFunctionReturnType(node: ast.FunctionDef, cache: CacheType, indent: number): TypeDescription {
    // 명시된 리턴 타입이 있으면 이를 근거로 한다.
    if (node.returnType) return TypeSystem.inferType(node.returnType, cache, indent + 1);

    // 함수의 바디가 없으면 void type으로 간주한다
    if (!node.body) return TypeSystem.createVoidType();

    // 함수의 바디에 명시된 return 문이 없어도 void type으로 간주한다.
    const returnStatements = AstUtils.streamAllContents(node.body).filter(ast.isReturnExpression).toArray();
    if (returnStatements.length == 0) return TypeSystem.createVoidType();

    // 여러 타입을 return할 수 있지만 일단은 모두 단일 타입을 리턴하는 것으로 가정하고 이 타입을 return
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    for (const returnStatement of returnStatements) {
      type = TypeSystem.inferType(returnStatement, cache, indent + 1);
    }
    return type;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferFunctionSimpleType(
    node: ast.FunctionValue | ast.FunctionType,
    cache: CacheType,
    indent: number
  ): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    const returnType = TypeSystem.inferType(node.returnType, cache, indent + 1);
    const parameters = node.bindings.map((e) => {
      if (e.spread) {
        //todo ...optionalParams 같은 경우 일단은 any type을 리턴한다.
        return { name: e.spread.$refText, type: TypeSystem.createAnyType() };
      } else {
        return { name: e.name!, type: TypeSystem.inferType(e.type, cache, indent + 2) };
      }
    });
    type = TypeSystem.createFunctionType(returnType, parameters);
    return type;
  }

  /**
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferTypeCallChain(node: ast.CallChain, cache: CacheType, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    const id = `element='${node.element?.$refText}', cst='${node?.$cstNode?.text}'`;
    const log = enterLog("isCallChain", id, indent);
    traceLog(indent + 1, "ref 참조전:", id);
    const element = node.element?.ref;
    traceLog(indent + 1, "ref 참조후:", id);

    if (element) {
      type = TypeSystem.inferType(element, cache, indent + 1);

      // 배열 호출이면 배열 요소가 리턴되어야 한다.
      if (TypeSystem.isArrayType(type) && node.isArray) {
        traceLog(indent + 1, "배열 호출이면 배열 요소가 리턴되어야 한다", type.elementType.$type);
        type = type.elementType;
      }

      // 함수 호출이면 함수 리턴 타입이 리턴되어야 한다
      if (TypeSystem.isFunctionType(type) && node.isFunction) {
        traceLog(indent + 1, "함수 호출이면 함수 리턴 타입이 리턴되어야 한다", type.returnType.$type);
        type = type.returnType;
      }
    }

    // this, super인 경우
    else if (node.$cstNode?.text == "this" || node.$cstNode?.text == "super") {
      const classItem = AstUtils.getContainerOfType(node, ast.isObjectDef);
      if (classItem) {
        traceLog(indent + 1, `'this' refers ${classItem.name}`);
        type = TypeSystem.createClassType(classItem);
      } else {
        console.error("this or super: empty");
      }
    }

    //todo 함수인 경우, 여기는 정확히 어떨 때 호출되는가?
    else if (node.isFunction && node.previous) {
      console.log(chalk.red("여기는 정확히 어떨 때 호출되는가?", node.$cstNode?.text));
      const previousType = TypeSystem.inferType(node.previous, cache, indent + 1);
      if (TypeSystem.isFunctionType(previousType)) type = previousType.returnType;
      else type = TypeSystem.createErrorType("Cannot call operation on non-function type", node);
    }

    // 배열인 경우
    else if (node.isArray) {
      //todo 해당 배열의 자료형이 무엇인지 어떻게 알아낼 수 있을까
      type = TypeSystem.createArrayType(TypeSystem.createAnyType());
    }

    // 아무것도 아닌 경우
    else {
      type = TypeSystem.createErrorType("Could not infer type for element " + node.element?.$refText, node);
    }

    if (TypeSystem.isFunctionType(type)) type = type.returnType;

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
  static inferTypeObjectDef(node: ast.ObjectDef, cache: CacheType, indent: number): TypeDescription {
    const log = enterLog("isObjectDef", node.name, indent);
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
  static inferTypeForOf(node: ast.ForOf, cache: CacheType, indent: number): TypeDescription {
    const log = enterLog("isForOf", node.name, indent);
    let type = TypeSystem.inferType(node.of, cache, indent + 1);
    if (TypeSystem.isArrayType(type)) type = type.elementType;
    exitLog(log, type);
    return type;
  }

  /**
   * 이 함수는 for(a <- 1 (to | until) 10)와 같이 정의되어진 후 a를 참조하게 되면 a의 타입을 추론할때 사용된다.
   *
   * @param node
   * @param cache
   * @param indent
   * @returns
   */
  static inferTypeForTo(node: ast.ForTo, cache: CacheType, indent: number): TypeDescription {
    const log = enterLog("isForTo", node.name, indent);
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
  static inferTypeAssignment(node: ast.Assignment, cache: CacheType, indent: number): TypeDescription {
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
  static inferTypeLogicalNot(node: ast.LogicalNot, cache: CacheType, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    const log = enterLog("isLogicalNot", node.operator, indent);
    if (node.operator === "!" || node.operator === "not") {
      type = TypeSystem.createBooleanType();
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
  static inferTypeIfExpression(node: ast.IfExpression, cache: CacheType, indent: number): TypeDescription {
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
  static inferTypeMatchExpression(node: ast.MatchExpression, cache: CacheType, indent: number): TypeDescription {
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
  static inferTypeArrayExpression(node: ast.ArrayExpression, cache: CacheType, indent: number): TypeDescription {
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
  static inferTypeUnaryExpression(node: ast.UnaryExpression, cache: CacheType, indent: number): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType("internal error", node);
    const log = enterLog("isUnaryExpression", node.operator, indent);
    if (node.operator && node.operator === "typeof") {
      type = TypeSystem.createStringType();
    } else {
      type = TypeSystem.inferType(node.value, cache, indent);
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
  static inferTypeBinaryExpression(node: ast.BinaryExpression, cache: CacheType, indent: number): TypeDescription {
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
  static inferTypeNewExpression(node: ast.NewExpression, cache: CacheType, indent: number): TypeDescription {
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
  static inferTypeArrayValue(node: ast.ArrayValue, cache: CacheType, indent: number): TypeDescription {
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
  static inferTypePrimitiveType(node: ast.PrimitiveType, cache: CacheType, indent: number): TypeDescription {
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
}