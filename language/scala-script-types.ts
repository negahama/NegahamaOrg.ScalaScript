import { AstNode, AstUtils } from 'langium'
import * as ast from './generated/ast.js'
import { enterLog, exitLog, traceLog } from '../language/scala-script-util.js'
import chalk from 'chalk'

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
  | ObjectTypeDescription
  | ErrorTypeDescription

type CacheType = Map<AstNode, TypeDescription>

/**
 * Represents a description of a type that can be any value.
 *
 * @property $type - A string literal that identifies this type description as 'any'.
 */
export interface AnyTypeDescription {
  readonly $type: 'any'
}

/**
 * Represents a description of a Nil type.
 *
 * @property $type - A string literal type that is always 'nil'.
 */
export interface NilTypeDescription {
  readonly $type: 'nil'
}

/**
 * Represents a description of a string type.
 *
 * @property $type - A constant string value indicating the type, which is always 'string'.
 * @property literal - An optional literal value of type `ast.Literal`.
 */
export interface StringTypeDescription {
  readonly $type: 'string'
  readonly literal?: ast.Literal
}

/**
 * Represents a description of a number type.
 *
 * @property $type - A string literal indicating the type, which is always 'number'.
 * @property literal - An optional property representing a literal value of the number type.
 */
export interface NumberTypeDescription {
  readonly $type: 'number'
  readonly literal?: ast.Literal
}

/**
 * Represents a description of a boolean type in the ScalaScript language.
 *
 * @property $type - A string literal that identifies the type as 'boolean'.
 * @property literal - An optional AST literal associated with the boolean type.
 */
export interface BooleanTypeDescription {
  readonly $type: 'boolean'
  readonly literal?: ast.Literal
}

/**
 * Represents a description of a void type.
 *
 * @property $type - A string literal type that is always 'void'.
 */
export interface VoidTypeDescription {
  readonly $type: 'void'
}

/**
 * Describes an array type in the ScalaScript language.
 *
 * @interface ArrayTypeDescription
 * @property {string} $type - The type identifier, which is always 'array'.
 * @property {TypeDescription} elementType - The description of the type of elements contained in the array.
 */
export interface ArrayTypeDescription {
  readonly $type: 'array'
  readonly elementType: TypeDescription
}

/**
 * Represents a union type description.
 *
 * @interface UnionTypeDescription
 * @property {string} $type - The type identifier, which is always 'union'.
 * @property {TypeDescription[]} elementTypes - An array of type descriptions that are part of the union.
 */
export interface UnionTypeDescription {
  readonly $type: 'union'
  readonly elementTypes: TypeDescription[]
}

/**
 * Describes the type information for a function.
 *
 * @interface FunctionTypeDescription
 * @property {string} $type - The type identifier, which is always 'function'.
 * @property {TypeDescription} returnType - The description of the function's return type.
 * @property {FunctionParameter[]} parameters - The list of parameters that the function accepts.
 */
export interface FunctionTypeDescription {
  readonly $type: 'function'
  readonly returnType: TypeDescription
  readonly parameters: FunctionParameter[]
}

/**
 * Represents a parameter of a function.
 */
export interface FunctionParameter {
  name: string
  type: TypeDescription
}

/**
 * Represents a description of a class type.
 *
 * @interface ClassTypeDescription
 * @property {string} $type - The type identifier, which is always 'object'.
 * @property {ast.ObjectDef | ast.ObjectType | ast.ObjectValue} literal - The literal representation of the class type.
 */
export interface ObjectTypeDescription {
  readonly $type: 'object'
  readonly literal: ast.ObjectDef | ast.ObjectType | ast.ObjectValue
}

/**
 * Represents an error type description.
 *
 * @property $type - A constant string with the value 'error'.
 * @property source - An optional property representing the source of the error, which is an AstNode.
 * @property message - A string containing the error message.
 */
export interface ErrorTypeDescription {
  readonly $type: 'error'
  readonly source?: AstNode
  readonly message: string
}

/**
 * The `TypeSystem` class provides methods to create and check various type descriptions,
 * as well as infer types from AST nodes. It supports basic types like `any`, `nil`, `string`,
 * `number`, `boolean`, `void`, and more complex types like `array`, `union`, `function`, `class`,
 * and `error`. The class also includes methods to convert types to strings and to infer types
 * from AST nodes using a cache to store and retrieve type information.
 */
export class TypeSystem {
  /**
   * Creates a description object for the 'any' type.
   *
   * @returns An object representing the 'any' type.
   */
  static createAnyType(): AnyTypeDescription {
    return {
      $type: 'any',
    }
  }

  /**
   * Checks if the given item is of type `AnyTypeDescription`.
   *
   * @param item - The type description to check.
   * @returns `true` if the item is of type `AnyTypeDescription`, otherwise `false`.
   */
  static isAnyType(item: TypeDescription): item is AnyTypeDescription {
    return item.$type === 'any'
  }

  /**
   * Creates a description for the Nil type.
   *
   * @returns {NilTypeDescription} An object representing the Nil type with a `$type` property set to 'nil'.
   */
  static createNilType(): NilTypeDescription {
    return {
      $type: 'nil',
    }
  }

  /**
   * Checks if the given item is of type `NilTypeDescription`.
   *
   * @param item - The type description to check.
   * @returns True if the item is of type `NilTypeDescription`, otherwise false.
   */
  static isNilType(item: TypeDescription): item is NilTypeDescription {
    return item.$type === 'nil'
  }

  /**
   * Creates a description for a string type.
   *
   * @param literal - An optional AST literal that represents the string value.
   * @returns An object describing the string type, including its literal value if provided.
   */
  static createStringType(literal?: ast.Literal): StringTypeDescription {
    return {
      $type: 'string',
      literal,
    }
  }

  /**
   * Checks if the given TypeDescription is of type StringTypeDescription.
   *
   * @param item - The TypeDescription to check.
   * @returns True if the item is of type StringTypeDescription, otherwise false.
   */
  static isStringType(item: TypeDescription): item is StringTypeDescription {
    return item.$type === 'string'
  }

  /**
   * Creates a description for a number type.
   *
   * @param literal - An optional AST literal that represents the number type.
   * @returns An object representing the number type description.
   */
  static createNumberType(literal?: ast.Literal): NumberTypeDescription {
    return {
      $type: 'number',
      literal,
    }
  }

  /**
   * Determines if the given type description is a number type.
   *
   * @param item - The type description to check.
   * @returns True if the type description is a number type, otherwise false.
   */
  static isNumberType(item: TypeDescription): item is NumberTypeDescription {
    return item.$type === 'number'
  }

  /**
   * Creates a description for a boolean type.
   *
   * @param literal - An optional AST literal that represents the boolean value.
   * @returns An object representing the boolean type description.
   */
  static createBooleanType(literal?: ast.Literal): BooleanTypeDescription {
    return {
      $type: 'boolean',
      literal,
    }
  }

  /**
   * Determines if the given type description is a boolean type.
   *
   * @param item - The type description to check.
   * @returns True if the type description is a boolean type, otherwise false.
   */
  static isBooleanType(item: TypeDescription): item is BooleanTypeDescription {
    return item.$type === 'boolean'
  }

  /**
   * Creates a description object for the void type.
   *
   * @returns {VoidTypeDescription} An object representing the void type.
   */
  static createVoidType(): VoidTypeDescription {
    return {
      $type: 'void',
    }
  }

  /**
   * Determines if the given type description is a void type.
   *
   * @param item - The type description to check.
   * @returns True if the type description is a void type, otherwise false.
   */
  static isVoidType(item: TypeDescription): item is VoidTypeDescription {
    return item.$type === 'void'
  }

  /**
   * Creates an ArrayTypeDescription object with the specified element type.
   *
   * @param elementType - The type description of the elements in the array.
   * @returns An ArrayTypeDescription object with the specified element type.
   */
  static createArrayType(elementType: TypeDescription): ArrayTypeDescription {
    return {
      $type: 'array',
      elementType,
    }
  }

  /**
   * Checks if the given type description is an array type.
   *
   * @param item - The type description to check.
   * @returns True if the type description is an array type, otherwise false.
   */
  static isArrayType(item: TypeDescription): item is ArrayTypeDescription {
    return item.$type === 'array'
  }

  /**
   * Creates a union type description from the provided element types.
   *
   * @param elementTypes - An array of `TypeDescription` objects that represent the types to be included in the union.
   * @returns A `UnionTypeDescription` object representing the union of the provided types.
   */
  static createUnionType(elementTypes: TypeDescription[]): UnionTypeDescription {
    return {
      $type: 'union',
      elementTypes,
    }
  }

  /**
   * Determines if the given type description is a union type.
   *
   * @param item - The type description to check.
   * @returns True if the type description is a union type, otherwise false.
   */
  static isUnionType(item: TypeDescription): item is UnionTypeDescription {
    return item.$type === 'union'
  }

  /**
   * Creates a description of a function type.
   *
   * @param returnType - The type description of the function's return type.
   * @param parameters - An array of function parameters, each described by a `FunctionParameter`.
   * @returns An object representing the function type description.
   */
  static createFunctionType(returnType: TypeDescription, parameters: FunctionParameter[]): FunctionTypeDescription {
    return {
      $type: 'function',
      returnType,
      parameters,
    }
  }

  /**
   * Determines if the given type description is a function type.
   *
   * @param item - The type description to check.
   * @returns True if the type description is a function type, otherwise false.
   */
  static isFunctionType(item: TypeDescription): item is FunctionTypeDescription {
    return item.$type === 'function'
  }

  /**
   * Creates a ClassTypeDescription object from the given literal.
   *
   * @param literal - The AST node representing the object definition, type, or value.
   * @returns An object describing the class type.
   */
  static createObjectType(literal: ast.ObjectDef | ast.ObjectType | ast.ObjectValue): ObjectTypeDescription {
    return {
      $type: 'object',
      literal,
    }
  }

  /**
   * Determines if the given `TypeDescription` item is of type `ClassTypeDescription`.
   *
   * @param item - The `TypeDescription` item to check.
   * @returns A boolean indicating whether the item is a `ClassTypeDescription`.
   */
  static isObjectType(item: TypeDescription): item is ObjectTypeDescription {
    return item.$type === 'object'
  }

  /**
   * Creates an error type description object.
   *
   * @param message - The error message.
   * @param source - Optional. The source AST node where the error occurred.
   * @returns An object describing the error type.
   */
  static createErrorType(message: string, source?: AstNode): ErrorTypeDescription {
    return {
      $type: 'error',
      message,
      source,
    }
  }

  /**
   * Determines if the given type description is an error type.
   *
   * @param item - The type description to check.
   * @returns True if the type description is an error type, otherwise false.
   */
  static isErrorType(item: TypeDescription): item is ErrorTypeDescription {
    return item.$type === 'error'
  }

  /**
   * Converts a `TypeDescription` object to its string representation.
   *
   * @param item - The `TypeDescription` object to convert.
   * @returns A string representation of the `TypeDescription`.
   *          - If the type is a class type, returns the text of the class node or 'unknown' if not available.
   *          - If the type is a function type, returns a string in the format of `(param1: type1, param2: type2, ...) -> returnType`.
   *          - Otherwise, returns the type as a string.
   */
  static typeToString(item: TypeDescription): string {
    if (TypeSystem.isObjectType(item)) {
      return item.literal.$cstNode?.text ?? 'unknown'
    } else if (TypeSystem.isFunctionType(item)) {
      const params = item.parameters.map(e => `${e.name}: ${TypeSystem.typeToString(e.type)}`).join(', ')
      return `(${params}) -> ${TypeSystem.typeToString(item.returnType)}`
    } else {
      return item.$type
    }
  }

  /**
   * Infers the type of a given AST node.
   *
   * @param node - The AST node for which the type is to be inferred. Can be undefined.
   * @param cache - A cache to store and retrieve previously inferred types to avoid redundant computations.
   * @returns The inferred type description of the given node.
   *
   * This function performs type inference based on the type of the AST node. It handles various node types such as
   * types, element types, primitive types, variable definitions, function definitions, object definitions, call chains,
   * parameters, assignment bindings, loops, expressions, and literals.
   *
   * If the node is undefined, an error type is returned. If the type inference encounters a recursive definition,
   * an error type is cached and returned to prevent infinite recursion.
   *
   * The function logs the entry and exit points for debugging purposes.
   */
  static inferType(node: AstNode | undefined, cache: CacheType): TypeDescription {
    const rootLog = enterLog('inferType', `'${node?.$cstNode?.text}', node is ${node?.$type}`)

    let type: TypeDescription | undefined
    if (!node) {
      type = TypeSystem.createErrorType('Could not infer type for undefined', node)
      exitLog(rootLog, type, 'Exit(node is undefined)')
      return type
    }

    const existing = cache.get(node)
    if (existing) {
      exitLog(rootLog, type, 'Exit(node is cached)')
      return existing
    }

    // Prevent recursive inference errors
    cache.set(node, TypeSystem.createErrorType('Recursive definition', node))

    if (ast.isTypes(node)) {
      type = TypeSystem.inferTypeTypes(node, cache)
    } else if (ast.isVariableDef(node)) {
      type = TypeSystem.inferTypeVariableDef(node, cache)
    } else if (ast.isFunctionDef(node)) {
      type = TypeSystem.inferTypeFunctionDef(node, cache)
    } else if (ast.isObjectDef(node)) {
      type = TypeSystem.inferTypeObjectDef(node, cache)
    } else if (ast.isCallChain(node)) {
      type = TypeSystem.inferTypeCallChain(node, cache)
    } else if (ast.isParameter(node)) {
      type = TypeSystem.inferTypeParameter(node, cache)
    } else if (ast.isAssignBinding(node)) {
      type = TypeSystem.inferTypeAssignBinding(node, cache)
    } else if (ast.isForOf(node)) {
      type = TypeSystem.inferTypeForOf(node, cache)
    } else if (ast.isForTo(node)) {
      type = TypeSystem.inferTypeForTo(node, cache)
    } else if (ast.isAssignment(node)) {
      type = TypeSystem.inferTypeAssignment(node, cache)
    } else if (ast.isLogicalNot(node)) {
      type = TypeSystem.inferTypeLogicalNot(node, cache)
    } else if (ast.isIfExpression(node)) {
      type = TypeSystem.inferTypeIfExpression(node, cache)
    } else if (ast.isMatchExpression(node)) {
      type = TypeSystem.inferTypeMatchExpression(node, cache)
    } else if (ast.isGroupExpression(node)) {
      type = TypeSystem.inferTypeGroupExpression(node, cache)
    } else if (ast.isUnaryExpression(node)) {
      type = TypeSystem.inferTypeUnaryExpression(node, cache)
    } else if (ast.isBinaryExpression(node)) {
      type = TypeSystem.inferTypeBinaryExpression(node, cache)
    } else if (ast.isReturnExpression(node)) {
      type = TypeSystem.inferTypeReturnExpression(node, cache)
    } else if (ast.isNewExpression(node)) {
      type = TypeSystem.inferTypeNewExpression(node, cache)
    } else if (ast.isArrayValue(node)) {
      type = TypeSystem.inferTypeArrayValue(node, cache)
    } else if (ast.isObjectValue(node)) {
      type = TypeSystem.inferTypeObjectValue(node, cache)
    } else if (ast.isFunctionValue(node)) {
      type = TypeSystem.inferTypeFunctionValue(node, cache)
    } else if (ast.isLiteral(node)) {
      type = TypeSystem.inferTypeLiteral(node, cache)
    } else if (ast.isBlock(node)) {
      type = TypeSystem.inferTypeBlock(node, cache)
    }

    if (!type) {
      type = TypeSystem.createErrorType('Could not infer type for ' + node.$type, node)
    }

    cache.set(node, type)
    exitLog(rootLog, type)
    return type
  }

  /**
   * Infers the type of the given AST node and returns a TypeDescription.
   *
   * @param node - The AST node representing the types to infer.
   * @param cache - A cache object to store and retrieve type information.
   * @returns A TypeDescription representing the inferred type.
   *
   * The function processes the types within the node and simplifies the result:
   * - If there are no types, it returns an error type.
   * - If there is only one type, it returns that type.
   * - If there are multiple types, it returns a union type.
   */
  static inferTypeTypes(node: ast.Types, cache: CacheType): TypeDescription {
    let type: TypeDescription
    const log = enterLog('inferAllTypes', `'${node.$cstNode?.text}'`)
    const ts = node.types.map(t => TypeSystem.inferTypeSimpleType(t, cache))
    // 실제 Union 타입이 아니면 처리를 단순화하기 위해 개별 타입으로 리턴한다.
    if (ts.length == 0) type = TypeSystem.createErrorType('internal error', node)
    else if (ts.length == 1) type = ts[0]
    else type = TypeSystem.createUnionType(ts)
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of a given SimpleType node.
   *
   * @param node - The SimpleType node to infer the type for.
   * @param cache - A cache to store and retrieve type information.
   * @returns The inferred TypeDescription for the given SimpleType node.
   *
   * This function determines the type of the provided SimpleType node by checking its specific kind.
   * It handles array types, object types, function types, primitive types, and reference types.
   * If the type cannot be determined, it returns an error type.
   */
  static inferTypeSimpleType(node: ast.SimpleType, cache: CacheType): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType('internal error', node)
    const log = enterLog('inferSimpleType', `'${node.$cstNode?.text}'`)
    if (ast.isArrayType(node)) {
      type = TypeSystem.createArrayType(TypeSystem.inferTypeSimpleType(node.elementType, cache))
    } else if (ast.isObjectType(node)) {
      type = TypeSystem.createObjectType(node)
    } else if (ast.isElementType(node)) {
      if (ast.isFunctionType(node)) {
        const returnType = TypeSystem.inferTypeTypes(node.returnType, cache)
        const parameters = node.params.map(e => ({
          name: e.name,
          type: TypeSystem.inferType(e.type, cache),
        }))
        type = TypeSystem.createFunctionType(returnType, parameters)
      } else if (ast.isPrimitiveType(node)) {
        if (node.type === 'any') {
          type = TypeSystem.createAnyType()
        } else if (node.type === 'nil') {
          type = TypeSystem.createNilType()
        } else if (node.type === 'string') {
          type = TypeSystem.createStringType()
        } else if (node.type === 'number') {
          type = TypeSystem.createNumberType()
        } else if (node.type === 'boolean') {
          type = TypeSystem.createBooleanType()
        } else if (node.type === 'void') {
          type = TypeSystem.createVoidType()
        }
      } else if (node.reference) {
        traceLog('Type is reference')
        if (node.reference.ref) {
          const ref = node.reference.ref
          if (ast.isObjectDef(ref)) {
            type = TypeSystem.createObjectType(ref)
          } else {
            traceLog('node.reference.ref is not class')
          }
        } else {
          traceLog('node.reference.ref is not valid')
        }
      }
    }
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of a variable definition node.
   *
   * @param node - The variable definition node to infer the type for.
   * @param cache - The cache to use for type inference.
   * @returns The inferred type description of the variable definition.
   */
  static inferTypeVariableDef(node: ast.VariableDef, cache: CacheType): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType('internal error', node)
    const log = enterLog('inferVariableDef', node.name)
    if (node.type) {
      type = TypeSystem.inferType(node.type, cache)
    } else if (node.value) {
      type = TypeSystem.inferType(node.value, cache)
    } else {
      type = TypeSystem.createErrorType('No type hint for this element', node)
    }
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of a function definition node.
   *
   * @param node - The function definition node to infer the type for.
   * @param cache - The cache used for type inference.
   * @returns The inferred type description of the function.
   */
  static inferTypeFunctionDef(node: ast.FunctionDef, cache: CacheType): TypeDescription {
    const log = enterLog('inferFunctionDef', node.name)
    const returnType = TypeSystem.getFunctionReturnType(node.returnType, node.body, cache)
    const parameters = node.params.map(e => ({
      name: e.name,
      type: TypeSystem.inferType(e.type, cache),
    }))
    const type = TypeSystem.createFunctionType(returnType, parameters)
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of an object definition node and returns a TypeDescription.
   *
   * @param node - The object definition node to infer the type from.
   * @param cache - The cache to use for type inference.
   * @returns The inferred TypeDescription of the object definition node.
   */
  static inferTypeObjectDef(node: ast.ObjectDef, cache: CacheType): TypeDescription {
    const log = enterLog('inferObjectDef', node.name)
    const type = TypeSystem.createObjectType(node)
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of a call chain node in the AST.
   *
   * This function analyzes the given call chain node and determines its type based on various conditions,
   * such as whether the node represents an array, a function, or special keywords like 'this' or 'super'.
   * It uses the provided cache to optimize type inference and logs the process for debugging purposes.
   *
   * @param node - The call chain node to infer the type for.
   * @param cache - A cache object to store and retrieve inferred types.
   * @returns The inferred type description of the call chain node.
   */
  static inferTypeCallChain(node: ast.CallChain, cache: CacheType): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType('internal error', node)
    const id = `element='${node.element?.$refText}', cst='${node?.$cstNode?.text}'`
    const log = enterLog('inferCallChain', id)
    traceLog(chalk.redBright('ref 참조전:'), id)
    const element = node.element?.ref
    traceLog(chalk.green('ref 참조후:'), id)

    if (element) {
      type = TypeSystem.inferType(element, cache)

      // CallChain이 변수, 함수, 배열등을 모두 포함할 수 있다.
      // 이것의 타입이 무엇인가를 결정할 때는 context가 중요하다.
      // 예를들어 `var n: number = someFunction()`는 `someFunction`의 타입이 `() -> number` 라는 것이
      // 중요한 것이 아니라 number를 리턴한다는 것이 중요하다. 하지만 좌변에 있을 경우에는 예를들어
      // 아래와 같은 경우 f의 타입은 `number`가 아니라 `() -> number[]` 이어야 한다.
      // var f: () -> number[]
      // f = () => { return 1 }
      // 이와 같은 차이는 해당 CallChain이 함수 호출인가 아닌가에 달려있다.
      // 즉 ()을 사용해서 함수가 호출되는 경우는 함수의 리턴 타입이 중요하고
      // 그렇지 않으면 함수 자체의 타입이 중요하다.

      // 배열 호출이면 배열 요소가 리턴되어야 한다.
      if (TypeSystem.isArrayType(type) && node.isArray) {
        traceLog('배열 호출이면 배열 요소가 리턴되어야 한다', type.elementType.$type)
        type = type.elementType
      }

      // 함수 호출이면 함수 리턴 타입이 리턴되어야 한다
      if (TypeSystem.isFunctionType(type) && node.isFunction) {
        traceLog('함수 호출이면 함수 리턴 타입이 리턴되어야 한다', type.returnType.$type)
        type = type.returnType
      }
    }

    // this, super인 경우
    else if (node.$cstNode?.text == 'this' || node.$cstNode?.text == 'super') {
      const classItem = AstUtils.getContainerOfType(node, ast.isObjectDef)
      if (classItem) {
        traceLog(`'this' refers ${classItem.name}`)
        type = TypeSystem.createObjectType(classItem)
      } else {
        console.error(chalk.red('this or super is empty in types.ts'))
      }
    }

    // node.element.ref가 없는 경우
    else {
      // 그냥 에러로 처리할 수도 있지만 최대한 추론해 본다.
      // previous가 함수이면 이것의 리턴 타입을 자신의 타입으로 리턴하게 하고
      // previous가 배열이면 배열의 element 타입을 자신의 타입으로 취한다.
      if (node.previous) {
        const previousType = TypeSystem.inferType(node.previous, cache)
        console.log(chalk.red('여기는 정확히 어떨 때 호출되는가?', id))
        console.log(chalk.green(`  previous: ${node.previous?.$cstNode?.text}'s type: ${previousType.$type}`))
        if (TypeSystem.isFunctionType(previousType)) type = previousType.returnType
        else if (TypeSystem.isArrayType(previousType)) type = previousType.elementType
        else type = TypeSystem.createErrorType('Could not infer type for element ' + node.element?.$refText, node)
        exitLog(log, type)
        return type
      }

      type = TypeSystem.createErrorType('Could not infer type for element ' + node.element?.$refText, node)
    }

    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of a given parameter node. If the type of the parameter
   * cannot be determined from its type or value, it defaults to `any` type.
   *
   * @param node - The parameter node to infer the type for.
   * @param cache - A cache used for type inference.
   * @returns The inferred type description of the parameter.
   */
  static inferTypeParameter(node: ast.Parameter, cache: CacheType): TypeDescription {
    // Parameter를 type이나 value로 타입을 알 수 없을 경우는 any type으로 취급한다.
    let type: TypeDescription = TypeSystem.createErrorType('internal error', node)
    const log = enterLog('inferParameter', node.name)
    if (node.type) {
      type = TypeSystem.inferType(node.type, cache)
    } else if (node.value) {
      type = TypeSystem.inferType(node.value, cache)
    } else {
      type = TypeSystem.createAnyType()
    }
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of an assignment binding node.
   *
   * This function determines the type of the value assigned in the given
   * assignment binding node. If the node has a value, it infers the type
   * of that value using the provided cache. If the node does not have a
   * value, it assigns a 'nil' type to the node.
   *
   * @param node - The assignment binding node to infer the type for.
   * @param cache - The cache used for type inference.
   * @returns The inferred type description of the assignment binding node.
   */
  static inferTypeAssignBinding(node: ast.AssignBinding, cache: CacheType): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType('internal error', node)
    const log = enterLog('inferAssignBinding', node.name)
    //todo 원래 타입은?
    // Assign Binding에는 value가 없을수는 없지만 없으면 nil type으로 취급한다.
    if (node.value) {
      type = TypeSystem.inferType(node.value, cache)
    } else {
      type = TypeSystem.createNilType()
    }
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of the elements in a `for...of` loop.
   * 이 함수는 for(a <- ary)와 같이 정의되어진 후 a를 참조하게 되면 a의 타입을 추론할때 사용된다.
   *
   * @param node - The AST node representing the `for...of` loop.
   * @param cache - The cache used for type inference.
   * @returns The inferred type of the elements being iterated over.
   */
  static inferTypeForOf(node: ast.ForOf, cache: CacheType): TypeDescription {
    const log = enterLog('inferForOf', node.name)
    let type = TypeSystem.inferType(node.of, cache)
    if (TypeSystem.isArrayType(type)) type = type.elementType
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type for a `ForTo` node.
   * 이 함수는 for(a <- 1 (to | until) 10)와 같이 정의되어진 후 a를 참조하게 되면 a의 타입을 추론할때 사용된다.
   *
   * @param node - The `ForTo` AST node to infer the type for.
   * @param cache - The cache to use for type inference.
   * @returns The inferred type description.
   */
  static inferTypeForTo(node: ast.ForTo, cache: CacheType): TypeDescription {
    const log = enterLog('inferForTo', node.name)
    let type = TypeSystem.inferType(node.e1, cache)
    if (TypeSystem.isArrayType(type)) type = type.elementType
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of an assignment node.
   * 대입문이라고 해서 이 함수가 매번 호출되는 것은 아니다. 왜냐하면 타입을 추론하는 것은 validator에서 하는데
   * ScalaScriptValidator의 checkAssignment()에서 좌변과 우변을 따로 추론하기 때문이다. 따라서 이 함수가 호출되는 경우는
   * 다중 대입문처럼 한쪽에 대입문이 있는 경우(a = b = 0)이거나 대입문 형식이 아닌데 대입문인 경우({ num: no += 1 })들이다.
   *
   * @param node - The assignment node to infer the type for.
   * @param cache - A cache to store and retrieve type information.
   * @returns The inferred type description of the assignment node.
   */
  static inferTypeAssignment(node: ast.Assignment, cache: CacheType): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType('internal error', node)
    const log = enterLog('inferAssignment', node.operator)
    if (node.assign) {
      type = TypeSystem.inferType(node.assign, cache)
    } else if (node.value) {
      type = TypeSystem.inferType(node.value, cache)
    } else {
      type = TypeSystem.createErrorType('No type hint for this element', node)
    }
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of a logical NOT operation in the AST.
   *
   * @param node - The AST node representing the logical NOT operation.
   * @param cache - The cache used for type inference.
   * @returns The inferred type description of the logical NOT operation.
   */
  static inferTypeLogicalNot(node: ast.LogicalNot, cache: CacheType): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType('internal error', node)
    const log = enterLog('inferLogicalNot', node.operator)
    if (node.operator === '!' || node.operator === 'not') {
      type = TypeSystem.createBooleanType()
    }
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of an IfExpression node.
   *
   * @param node - The IfExpression AST node to infer the type for.
   * @param cache - The cache to use for type inference.
   * @returns The inferred type description of the IfExpression node.
   */
  static inferTypeIfExpression(node: ast.IfExpression, cache: CacheType): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType('internal error', node)
    const log = enterLog('inferIfExpression', node.$type)
    if (!node.then) {
      console.error(chalk.red('IfExpression has no then node'))
      exitLog(log, type)
      return type
    }
    type = TypeSystem.inferType(node.then, cache)

    // IfExpression에 else가 있으면 then과 else의 타입을 비교해서 union type으로 만든다.
    // 그렇지 않은 모든 경우는 then의 타입을 그대로 사용한다.
    if (node.else) {
      const elseType = TypeSystem.inferType(node.else, cache)
      if (type.$type != elseType.$type) {
        type = TypeSystem.createUnionType([type, elseType])
      }
    }
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of a MatchExpression node.
   *
   * @param node - The MatchExpression AST node to infer the type for.
   * @param cache - The cache to use for type inference.
   * @returns The inferred type description of the MatchExpression node.
   */
  static inferTypeMatchExpression(node: ast.MatchExpression, cache: CacheType): TypeDescription {
    const log = enterLog('inferMatchExpression', node.$type)
    const type = TypeSystem.createErrorType('internal error', node)
    //todo
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of a function value node.
   *
   * @param node - The function value AST node to infer the type for.
   * @param cache - The cache to use for type inference.
   * @returns The inferred type description of the function value.
   */
  static inferTypeGroupExpression(node: ast.GroupExpression, cache: CacheType): TypeDescription {
    const log = enterLog('inferGroup', `'${node.$cstNode?.text}'`)
    const type = TypeSystem.inferType(node.value, cache)
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of a unary expression node.
   *
   * @param node - The unary expression AST node to infer the type for.
   * @param cache - The cache to use for type inference.
   * @returns The inferred type description of the unary expression.
   */
  static inferTypeUnaryExpression(node: ast.UnaryExpression, cache: CacheType): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType('internal error', node)
    const log = enterLog('inferUnaryExpression', node.operator ? node.operator : '+')
    if (node.operator && node.operator === 'typeof') {
      type = TypeSystem.createStringType()
    } else {
      type = TypeSystem.inferType(node.value, cache)
    }
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of a binary expression node.
   *
   * @param node - The binary expression AST node to infer the type for.
   * @param cache - A cache object to store intermediate type information.
   * @returns The inferred type description of the binary expression.
   *
   * The function handles different binary operators and infers the type based on the operator:
   * - Logical operators (`and`, `or`, `&&`, `||`, `<`, `<=`, `>`, `>=`, `==`, `!=`) result in a boolean type.
   * - Arithmetic operators (`-`, `+`, `**`, `*`, `/`, `%`) result in a number type.
   * - The range operator (`..`) results in a string type if either operand is a string.
   * - The `instanceof` operator results in an any type.
   *
   * If the type cannot be inferred, an error type is returned.
   */
  static inferTypeBinaryExpression(node: ast.BinaryExpression, cache: CacheType): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType('internal error', node)
    const log = enterLog('inferBinaryExpression', node.operator)
    type = TypeSystem.createErrorType('Could not infer type from binary expression', node)
    if (['and', 'or', '&&', '||', '<', '<=', '>', '>=', '==', '!='].includes(node.operator)) {
      type = TypeSystem.createBooleanType()
    } else if (['-', '+', '**', '*', '/', '%'].includes(node.operator)) {
      type = TypeSystem.createNumberType()
    } else if (['..'].includes(node.operator)) {
      const left = TypeSystem.inferType(node.left, cache)
      const right = TypeSystem.inferType(node.right, cache)
      if (TypeSystem.isStringType(left) || TypeSystem.isStringType(right)) {
        type = TypeSystem.createStringType()
      }
    } else if (node.operator === 'instanceof') {
      //todo instanceof 의 결과는 일단 any type으로 처리한다.
      type = TypeSystem.createAnyType()
    }
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of a return expression node.
   *
   * @param node - The return expression node to infer the type from.
   * @param cache - A cache to store and retrieve type information.
   * @returns The inferred type description of the return expression.
   */
  static inferTypeReturnExpression(node: ast.ReturnExpression, cache: CacheType): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType('internal error', node)
    const log = enterLog('inferReturnExpr')
    if (!node.value) {
      type = TypeSystem.createVoidType()
    } else {
      type = TypeSystem.inferType(node.value, cache)
    }
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of a new expression node.
   *
   * @param node - The AST node representing the new expression.
   * @param cache - The cache used for type inference.
   * @returns The inferred type description of the new expression.
   */
  static inferTypeNewExpression(node: ast.NewExpression, cache: CacheType): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType('internal error', node)
    const log = enterLog('inferNewExpression', node.class.$refText)
    if (node.class.ref) {
      type = TypeSystem.createObjectType(node.class.ref)
    }
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of an array value node.
   *
   * This function determines the type of an array value node in the AST. If the array is empty,
   * it assigns the `any` type to it. Otherwise, it infers the type of the first item in the array
   * and creates an array type based on that.
   *
   * @param node - The AST node representing the array value.
   * @param cache - A cache used for type inference.
   * @returns The inferred type description of the array value.
   */
  //todo 모두 동일한 타입을 가지는지 검사해야 한다.
  //todo 또한 함수의 경우 CallChain에서 처리되는데 이것도 거기서 처리되어야 하지 않을까
  static inferTypeArrayValue(node: ast.ArrayValue, cache: CacheType): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType('internal error', node)
    const log = enterLog('inferArrayValue', node.items.toString())
    // item이 없는 경우 즉 [] 으로 표현되는 빈 배열의 경우 any type으로 취급한다.
    if (node.items.length > 0) {
      type = TypeSystem.createArrayType(TypeSystem.inferType(node.items[0], cache))
    } else type = TypeSystem.createAnyType()
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of an object value node.
   *
   * @param node - The AST node representing the object value.
   * @param cache - The cache used for type inference.
   * @returns The inferred type description of the object value.
   */
  static inferTypeObjectValue(node: ast.ObjectValue, cache: CacheType): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType('internal error', node)
    const log = enterLog('inferObjectValue', `'${node.$cstNode?.text}'`)
    type = TypeSystem.createObjectType(node)
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of a function value node.
   *
   * @param node - The AST node representing the function value.
   * @param cache - The cache used for type inference.
   * @returns The inferred type description of the function value.
   */
  static inferTypeFunctionValue(node: ast.FunctionValue, cache: CacheType): TypeDescription {
    const log = enterLog('inferFunctionValue', node.$type, node.$cstNode?.text)
    const returnType = TypeSystem.getFunctionReturnType(node.returnType, node.body, cache)
    const parameters = node.params.map(e => ({
      name: e.name,
      type: TypeSystem.inferType(e.type, cache),
    }))
    const type = TypeSystem.createFunctionType(returnType, parameters)
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of a given literal node.
   *
   * @param node - The AST literal node to infer the type from.
   * @param cache - The cache used for type inference.
   * @returns The inferred type description of the literal node.
   */
  static inferTypeLiteral(node: ast.Literal, cache: CacheType): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType('internal error', node)
    const log = enterLog('inferLiteral', `'${node.$cstNode?.text}'`)
    if (typeof node.value == 'string') {
      switch (node.value) {
        case 'any':
          type = TypeSystem.createAnyType()
          break
        case 'nil':
          type = TypeSystem.createNilType()
          break
        case 'void':
          type = TypeSystem.createVoidType()
          break
        case 'true':
        case 'false':
          type = TypeSystem.createBooleanType()
          break
        default:
          type = TypeSystem.createStringType(node)
      }
    } else {
      type = TypeSystem.createNumberType(node)
    }
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of a given block node.
   *
   * @param node - The AST block node to infer the type from.
   * @param cache - The cache used for type inference.
   * @returns The inferred type description of the block node.
   *
   * This function handles two cases:
   * 1. If the block is composed of multiple expressions (isBracket is true):
   *    - If there are no return statements, it infers the type as void.
   *    - If there are return statements, it infers the type based on the return statements.
   * 2. If the block is a single expression:
   *    - It infers the type of the single expression.
   *
   * Logs the process of type inference and any errors encountered.
   */
  static inferTypeBlock(node: ast.Block, cache: CacheType): TypeDescription {
    let type: TypeDescription = TypeSystem.createErrorType('internal error', node)
    const log = enterLog('inferBlock', node.$type, node.$cstNode?.text)
    // Block이 여러 식으로 구성된 경우
    if (node.isBracket) {
      // 함수의 바디에 명시된 return 문이 없어도 void type으로 간주한다.
      const returnStatements = AstUtils.streamAllContents(node).filter(ast.isReturnExpression).toArray()
      if (returnStatements.length == 0) type = TypeSystem.createVoidType()
      else {
        //todo 여러 타입을 return할 수 있지만 일단은 모두 단일 타입을 리턴하는 것으로 가정하고 이 타입을 return
        for (const returnStatement of returnStatements) {
          type = TypeSystem.inferType(returnStatement, cache)
        }
      }
    } else {
      // Block이 단일 식인 경우 이 식의 타입을 리턴한다.
      if (node.codes.length == 1) type = TypeSystem.inferType(node.codes[0], cache)
      else {
        console.error(chalk.red('Block is not bracket but has multiple codes'))
      }
    }
    exitLog(log, type)
    return type
  }

  //-----------------------------------------------------------------------------
  // helper functions
  //-----------------------------------------------------------------------------

  /**
   * Infers the return type of a given function definition node.
   *
   * @param node - The function definition node to infer the return type from.
   * @param cache - A cache object to store and retrieve type information.
   * @returns The inferred return type of the function.
   *
   * The function follows these steps to infer the return type:
   * 1. If the function has an explicitly specified return type, it uses that type.
   * 2. If the function body is absent, it assumes the return type is void.
   * 3. If there are no return statements in the function body, it assumes the return type is void.
   * 4. If there are multiple return statements, it currently assumes all return the same type and uses that type.
   * 5. If an error occurs during type inference, it returns an error type.
   */
  static getFunctionReturnType(
    returnType: ast.Types | undefined,
    body: ast.Block | undefined,
    cache: CacheType
  ): TypeDescription {
    // 명시된 리턴 타입이 있으면 이를 근거로 한다.
    if (returnType) return TypeSystem.inferType(returnType, cache)

    // 함수의 바디가 없으면 void type으로 간주한다
    if (!body) return TypeSystem.createVoidType()

    return TypeSystem.inferTypeBlock(body, cache)
  }

  /**
   * Retrieves the chain of superclasses for a given class item.
   *
   * @param classItem - The class item for which to retrieve the superclass chain.
   * @returns An array of `ast.ObjectDef` representing the chain of superclasses,
   *          starting from the given class item and following the `superClass` references.
   */
  static getClassChain(classItem: ast.ObjectDef): ast.ObjectDef[] {
    const set = new Set<ast.ObjectDef>()
    let value: ast.ObjectDef | undefined = classItem
    while (value && !set.has(value)) {
      set.add(value)
      value = value.superClass?.ref
    }
    // Sets preserve insertion order
    return Array.from(set)
  }
}
