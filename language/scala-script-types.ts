import { AstNode, AstUtils } from 'langium'
import * as ast from './generated/ast.js'
import { enterLog, exitLog, findVariableDefWithName, traceLog } from '../language/scala-script-util.js'
import chalk from 'chalk'

/**
 *
 */
export class TypeDescription {
  constructor(readonly $type = '') {}

  toString(): string {
    return this.$type
  }

  isEqual(other: TypeDescription): boolean {
    return this.$type === other.$type
  }

  isAssignableTo(other: TypeDescription): boolean {
    if (other.$type == 'any') return true
    if (other.$type == 'union') {
      const union = other as UnionTypeDescription
      if (union.elementTypes.some(e => e.isEqual(this))) return true
    }
    return this.isEqual(other)
  }
}

type CacheType = Map<AstNode, TypeDescription>

/**
 * Represents a description of a type that can be any value.
 *
 * @property $type - A string literal that identifies this type description as 'any'.
 */
export class AnyTypeDescription extends TypeDescription {
  constructor() {
    super('any')
  }

  override isEqual(other: TypeDescription): boolean {
    return true
  }

  override isAssignableTo(other: TypeDescription): boolean {
    return true
  }
}

/**
 * Represents a description of a Nil type.
 *
 * @property $type - A string literal type that is always 'nil'.
 */
export class NilTypeDescription extends TypeDescription {
  constructor() {
    super('nil')
  }
}

/**
 * Represents a description of a void type.
 *
 * @property $type - A string literal type that is always 'void'.
 */
export class VoidTypeDescription extends TypeDescription {
  constructor() {
    super('void')
  }
}

/**
 * Represents a description of a string type.
 *
 * @property $type - A constant string value indicating the type, which is always 'string'.
 * @property literal - An optional literal value of type `ast.Literal`.
 */
export class StringTypeDescription extends TypeDescription {
  constructor(public literal?: ast.Literal) {
    super('string')
  }
}

/**
 * Represents a description of a number type.
 *
 * @property $type - A string literal indicating the type, which is always 'number'.
 * @property literal - An optional property representing a literal value of the number type.
 */
export class NumberTypeDescription extends TypeDescription {
  constructor(public literal?: ast.Literal) {
    super('number')
  }
}

/**
 * Represents a description of a boolean type in the ScalaScript language.
 *
 * @property $type - A string literal that identifies the type as 'boolean'.
 * @property literal - An optional AST literal associated with the boolean type.
 */
export class BooleanTypeDescription extends TypeDescription {
  constructor(public literal?: ast.Literal) {
    super('boolean')
  }
}

/**
 * Represents a union type description.
 *
 * @interface UnionTypeDescription
 * @property {string} $type - The type identifier, which is always 'union'.
 * @property {TypeDescription[]} elementTypes - An array of type descriptions that are part of the union.
 */
export class UnionTypeDescription extends TypeDescription {
  constructor(public elementTypes: TypeDescription[]) {
    super('union')
  }

  override toString(): string {
    return `${this.$type}(${this.elementTypes.map(t => t.toString()).join(' | ')})`
  }

  override isEqual(other: TypeDescription): boolean {
    if (other.$type !== 'union') return false
    const otherUnion = other as UnionTypeDescription
    // Union 타입은 순서가 중요하지 않다.
    const set1 = TypeSystem.getNormalizedType(this.elementTypes)
    const set2 = TypeSystem.getNormalizedType(otherUnion.elementTypes)
    return set1.length == set2.length && set1.every(value => set2.find(e => value.isEqual(e)))
  }

  /**
   * union type을 구성하는 타입 중에 하나라도 other에 할당 가능한 타입이 있으면 true를 리턴한다.
   * 이것은 다음과 같은 경우를 가능하게 하기 위한 것이다.
   * var u: string | number
   * if (typeof u == 'number') n = u else s = u
   */
  override isAssignableTo(other: TypeDescription): boolean {
    if (other.$type == 'any') return true
    if (other.$type == 'union') {
      const union = other as UnionTypeDescription
      if (this.elementTypes.some(e => union.isContain(e))) return true
    } else {
      if (this.elementTypes.some(e => e.isEqual(other))) return true
    }
    return false
  }

  isContain(type: TypeDescription): boolean {
    return this.elementTypes.some(e => e.isEqual(type))
  }
}

/**
 * Describes an array type in the ScalaScript language.
 *
 * @interface ArrayTypeDescription
 * @property {string} $type - The type identifier, which is always 'array'.
 * @property {TypeDescription} elementType - The description of the type of elements contained in the array.
 */
export class ArrayTypeDescription extends TypeDescription {
  constructor(public elementType: TypeDescription) {
    super('array')
  }

  override toString(): string {
    return `${this.$type}<${this.elementType.toString()}>`
  }

  override isEqual(other: TypeDescription): boolean {
    if (other.$type !== 'array') return false
    const otherArray = other as ArrayTypeDescription
    return this.elementType.isEqual(otherArray.elementType)
  }
}

/**
 * Describes the type information for a function.
 *
 * @interface FunctionTypeDescription
 * @property {string} $type - The type identifier, which is always 'function'.
 * @property {TypeDescription} returnType - The description of the function's return type.
 * @property {FunctionParameter[]} parameters - The list of parameters that the function accepts.
 */
export class FunctionTypeDescription extends TypeDescription {
  constructor(public returnType: TypeDescription, public parameters: FunctionParameter[]) {
    super('function')
  }

  override toString(): string {
    const params = this.parameters.map(e => `${e.name}: ${e.type.toString()}`).join(', ')
    return `(${params}) -> ${this.returnType.toString()}`
  }

  override isEqual(other: TypeDescription): boolean {
    if (other.$type !== 'function') return false
    const otherFunction = other as FunctionTypeDescription
    if (!this.returnType.isEqual(otherFunction.returnType)) return false
    if (this.parameters.length !== otherFunction.parameters.length) return false
    return this.parameters.every((p, i) => p.type.isEqual(otherFunction.parameters[i].type))
  }
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
export class ObjectTypeDescription extends TypeDescription {
  constructor(public literal: ast.ObjectDef | ast.ObjectType | ast.ObjectValue) {
    super('object')
  }

  override toString(): string {
    if (this.literal && ast.isObjectDef(this.literal)) return this.literal.name
    else return this.literal.$cstNode?.text ?? 'unknown'
  }

  override isEqual(other: TypeDescription): boolean {
    //todo
    return other.$type === 'object'
  }
}

/**
 * Represents an error type description.
 *
 * @property $type - A constant string with the value 'error'.
 * @property source - An optional property representing the source of the error, which is an AstNode.
 * @property message - A string containing the error message.
 */
export class ErrorTypeDescription extends TypeDescription {
  constructor(public message: string, public source?: AstNode) {
    super('error')
  }
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
   * Creates a primitive type description based on the provided type and optional literal.
   *
   * @param type - The type of the primitive. Can be 'any', 'nil', 'void', 'string', 'number', or 'boolean'.
   * @param literal - An optional literal value associated with the type.
   * @returns A TypeDescription object representing the specified primitive type.
   *          If the type is unknown, returns an error type description.
   */
  static createPrimitiveType(type: string, literal?: ast.Literal): TypeDescription {
    switch (type) {
      case 'any':
        return new AnyTypeDescription()
      case 'nil':
        return new NilTypeDescription()
      case 'void':
        return new VoidTypeDescription()
      case 'string':
        return new StringTypeDescription(literal)
      case 'number':
        return new NumberTypeDescription(literal)
      case 'boolean':
        return new BooleanTypeDescription(literal)
      default:
        return new ErrorTypeDescription(`Unknown primitive type: ${type}`)
    }
  }

  /**
   * Creates a union type description from the provided element types.
   *
   * @param types - An array of `TypeDescription` objects that represent the types to be included in the union.
   * @returns A `UnionTypeDescription` object representing the union of the provided types.
   */
  static createUnionType(types: TypeDescription[]): TypeDescription {
    // Union 타입은 중복된 타입을 제거해야 하는데 Set을 사용해서 이를 처리할 수 없다.
    // 중복된 타입을 제거한 후에도 union 타입인 경우에만 union을 리턴하고 아니면 단일 타입을 리턴한다.
    const normalized = TypeSystem.getNormalizedType(types)
    if (normalized.length == 0) return new ErrorTypeDescription('no types in union')
    else if (normalized.length == 1) return normalized[0]
    else return new UnionTypeDescription(normalized)
  }

  /**
   * Creates a description of a function type.
   *
   * @param params - An array of parameters for the function.
   * @param ret - The return type of the function (optional).
   * @param body - The body of the function (optional).
   * @returns A description of the function type.
   *
   * The function follows these steps to infer the return type:
   * 1. If the function has an explicitly specified return type, it uses that type.
   * 2. If the function body is absent, it assumes the return type is void.
   * 3. If there are no return statements in the function body, it assumes the return type is void.
   * 4. If there are multiple return statements, it currently assumes all return the same type and uses that type.
   * 5. If an error occurs during type inference, it returns an error type.
   */
  static createFunctionType(params: ast.Parameter[], ret?: ast.Types, body?: ast.Block): FunctionTypeDescription {
    const cache = new Map<AstNode, TypeDescription>()
    // 명시된 리턴 타입이 있으면 이를 근거로 한다.
    // 명시된 리턴 타입도 없고 함수의 바디도 없으면 void type으로 간주한다
    let returnType: TypeDescription = new VoidTypeDescription()
    if (ret) returnType = TypeSystem.inferType(ret, cache)
    else if (body) returnType = TypeSystem.inferTypeBlock(body, cache)

    const parameters = params.map(e => ({
      name: e.name,
      type: TypeSystem.inferType(e.type, cache),
    }))

    return new FunctionTypeDescription(returnType, parameters)
  }

  /**
   * Checks if the given item is of type `AnyTypeDescription`.
   *
   * @param item - The type description to check.
   * @returns `true` if the item is of type `AnyTypeDescription`, otherwise `false`.
   */
  static isAnyType(item: TypeDescription): boolean {
    return item.$type === 'any'
  }

  /**
   * Checks if the given item is of type `NilTypeDescription`.
   *
   * @param item - The type description to check.
   * @returns True if the item is of type `NilTypeDescription`, otherwise false.
   */
  static isNilType(item: TypeDescription): boolean {
    return item.$type === 'nil'
  }

  /**
   * Determines if the given type description is a void type.
   *
   * @param item - The type description to check.
   * @returns True if the type description is a void type, otherwise false.
   */
  static isVoidType(item: TypeDescription): boolean {
    return item.$type === 'void'
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
   * Determines if the given type description is a number type.
   *
   * @param item - The type description to check.
   * @returns True if the type description is a number type, otherwise false.
   */
  static isNumberType(item: TypeDescription): item is NumberTypeDescription {
    return item.$type === 'number'
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
   * Determines if the given type description is a union type.
   *
   * @param item - The type description to check.
   * @returns True if the type description is a union type, otherwise false.
   */
  static isUnionType(item: TypeDescription): item is UnionTypeDescription {
    return item.$type === 'union'
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
   * Determines if the given type description is a function type.
   *
   * @param item - The type description to check.
   * @returns True if the type description is a function type, otherwise false.
   */
  static isFunctionType(item: TypeDescription): item is FunctionTypeDescription {
    return item.$type === 'function'
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
   * Determines if the given type description is an error type.
   *
   * @param item - The type description to check.
   * @returns True if the type description is an error type, otherwise false.
   */
  static isErrorType(item: TypeDescription): item is ErrorTypeDescription {
    return item.$type === 'error'
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
    const log = enterLog('inferType', `'${node?.$cstNode?.text}', node is ${node?.$type}`)

    let type: TypeDescription | undefined
    if (!node) {
      type = new ErrorTypeDescription('Could not infer type for undefined', node)
      exitLog(log, type, 'Exit(node is undefined)')
      return type
    }

    const existing = cache.get(node)
    if (existing) {
      exitLog(log, type, 'Exit(node is cached)')
      return existing
    }

    // Prevent recursive inference errors
    cache.set(node, new ErrorTypeDescription('Recursive definition', node))

    if (ast.isTypes(node)) {
      type = TypeSystem.inferTypeTypes(node, cache)
    } else if (ast.isSimpleType(node)) {
      // Types와 SimpleType은 분리되어져 있다.
      // SimpleType은 ArrayType | ObjectType | ElementType와 같이 UnionType이며 타입들의 단순한 집합이지만
      // Types는 types+=SimpleType ('|' types+=SimpleType)*와 같이 SimpleType의 배열로 단순히 타입이 아니다.
      // 일례로 TypeChain은 ElementType이고 SimpleType이긴 하지만 Types는 아니다.
      type = TypeSystem.inferTypeSimpleType(node, cache)
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
    } else if (ast.isSpreadExpression(node)) {
      type = TypeSystem.inferTypeSpreadExpression(node, cache)
    } else if (ast.isNewExpression(node)) {
      type = TypeSystem.inferTypeNewExpression(node, cache)
    } else if (ast.isArrayValue(node)) {
      type = TypeSystem.inferTypeArrayValue(node, cache)
    } else if (ast.isObjectValue(node)) {
      type = TypeSystem.inferTypeObjectDef(node, cache)
    } else if (ast.isFunctionValue(node)) {
      type = TypeSystem.inferTypeFunctionDef(node, cache)
    } else if (ast.isLiteral(node)) {
      type = TypeSystem.inferTypeLiteral(node, cache)
    } else if (ast.isBlock(node)) {
      type = TypeSystem.inferTypeBlock(node, cache)
    }

    if (!type) {
      type = new ErrorTypeDescription('Could not infer type for ' + node.$type, node)
    }

    if (TypeSystem.isErrorType(type)) {
      console.error(chalk.red('Error type:'), type.message, node.$cstNode?.text)
    }

    cache.set(node, type)
    exitLog(log, type)
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
    const log = enterLog('inferAllTypes', `'${node.$cstNode?.text}'`)
    const ts = node.types.map(t => TypeSystem.inferTypeSimpleType(t, cache))
    // 실제 Union 타입이 아니면 처리를 단순화하기 위해 개별 타입으로 리턴한다.
    const type = TypeSystem.createUnionType(ts)
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
    let type: TypeDescription = new ErrorTypeDescription('internal error', node)
    const log = enterLog('inferSimpleType', `'${node.$cstNode?.text}'`)
    if (ast.isArrayType(node)) {
      type = new ArrayTypeDescription(TypeSystem.inferTypeSimpleType(node.elementType, cache))
    } else if (ast.isObjectType(node)) {
      type = new ObjectTypeDescription(node)
    } else if (ast.isElementType(node)) {
      if (ast.isFunctionType(node)) {
        type = TypeSystem.createFunctionType(node.params, node.returnType)
      } else if (ast.isPrimitiveType(node)) {
        type = TypeSystem.createPrimitiveType(node.type)
      } else if (node.reference) {
        traceLog('Type is reference')
        if (node.reference.ref) {
          const ref = node.reference.ref
          if (ast.isObjectDef(ref)) {
            type = new ObjectTypeDescription(ref)
          } else {
            console.error(chalk.red('node.reference.ref is not class'))
          }
        } else {
          console.error(chalk.red('node.reference.ref is not valid'))
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
    let type: TypeDescription = new ErrorTypeDescription('No type hint for this element', node)
    const log = enterLog('inferVariableDef', node.name)
    if (node.type) {
      type = TypeSystem.inferType(node.type, cache)
    } else if (node.value) {
      type = TypeSystem.inferType(node.value, cache)
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
  static inferTypeFunctionDef(node: ast.FunctionDef | ast.FunctionValue, cache: CacheType): TypeDescription {
    let log = ''
    if (ast.isFunctionDef(node)) log = enterLog('inferFunctionDef', node.name)
    else log = enterLog('inferFunctionValue', `'${node.$cstNode?.text}', '${node.$type}'`)
    const type = TypeSystem.createFunctionType(node.params, node.returnType, node.body)
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
  static inferTypeObjectDef(node: ast.ObjectDef | ast.ObjectValue, cache: CacheType): TypeDescription {
    let log = ''
    if (ast.isObjectDef(node)) log = enterLog('inferObjectDef', node.name)
    else log = enterLog('inferObjectValue', `'${node.$cstNode?.text}'`)
    const type = new ObjectTypeDescription(node)
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
    let type: TypeDescription = new ErrorTypeDescription('internal error', node)
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

        // 일반적인 함수 호출이면 함수의 리턴 타입을 리턴하고
        // 함수형 메서드 호출인 경우에는 return type을 조정해 준다.
        type = TypeSystem.getFunctionalMethodType(type, node, cache)
      }
    }

    // this, super인 경우
    else if (node.$cstNode?.text == 'this' || node.$cstNode?.text == 'super') {
      const classItem = AstUtils.getContainerOfType(node, ast.isObjectDef)
      if (classItem) {
        traceLog(`'this' refers ${classItem.name}`)
        type = new ObjectTypeDescription(classItem)
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
        else type = new ErrorTypeDescription('Could not infer type for element ' + node.element?.$refText, node)
        exitLog(log, type)
        return type
      }

      type = new ErrorTypeDescription('Could not infer type for element ' + node.element?.$refText, node)
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
    let type: TypeDescription = new AnyTypeDescription()
    const log = enterLog('inferParameter', node.name)
    if (node.type) {
      type = TypeSystem.inferType(node.type, cache)
    } else if (node.value) {
      type = TypeSystem.inferType(node.value, cache)
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
    // Assign Binding에는 value가 없을수는 없지만 없으면 nil type으로 취급한다.
    let type: TypeDescription = new NilTypeDescription()
    const log = enterLog('inferAssignBinding', node.name)
    //todo 원래 타입은?
    if (node.value) {
      type = TypeSystem.inferType(node.value, cache)
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
    let type: TypeDescription = new ErrorTypeDescription('No type hint for this element', node)
    const log = enterLog('inferAssignment', node.operator)
    if (node.assign) {
      type = TypeSystem.inferType(node.assign, cache)
    } else if (node.value) {
      type = TypeSystem.inferType(node.value, cache)
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
    let type: TypeDescription = new ErrorTypeDescription('internal error', node)
    const log = enterLog('inferLogicalNot', node.operator)
    if (node.operator === '!' || node.operator === 'not') {
      type = new BooleanTypeDescription()
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
    let type: TypeDescription = new ErrorTypeDescription('internal error', node)
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
      if (!type.isEqual(elseType)) {
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
    const types: TypeDescription[] = []
    node.cases.forEach(c => {
      if (c.body) {
        types.push(TypeSystem.inferTypeBlock(c.body, cache))
      }
    })
    // type이 없으면 void type으로 처리한다.
    let type: TypeDescription = TypeSystem.createUnionType(types)
    if (TypeSystem.isErrorType(type)) type = new VoidTypeDescription()
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
    let type: TypeDescription = new ErrorTypeDescription('internal error', node)
    const log = enterLog('inferUnaryExpression', node.operator ? node.operator : '+')
    if (node.operator && node.operator === 'typeof') {
      type = new StringTypeDescription()
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
    let type: TypeDescription = new ErrorTypeDescription('internal error', node)
    const log = enterLog('inferBinaryExpression', node.operator)
    type = new ErrorTypeDescription('Could not infer type from binary expression', node)
    if (['and', 'or', '&&', '||', '<', '<=', '>', '>=', '==', '!='].includes(node.operator)) {
      type = new BooleanTypeDescription()
    } else if (['-', '+', '**', '*', '/', '%'].includes(node.operator)) {
      type = new NumberTypeDescription()
    } else if (['..'].includes(node.operator)) {
      const left = TypeSystem.inferType(node.left, cache)
      const right = TypeSystem.inferType(node.right, cache)
      if (TypeSystem.isStringType(left) || TypeSystem.isStringType(right)) {
        type = new StringTypeDescription()
      }
    } else if (node.operator === 'instanceof') {
      //todo instanceof 의 결과는 일단 any type으로 처리한다.
      type = new AnyTypeDescription()
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
    let type: TypeDescription = new VoidTypeDescription()
    const log = enterLog('inferReturnExpr')
    if (node.value) {
      type = TypeSystem.inferType(node.value, cache)
    }
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of a spread expression node.
   * Spread expression은 ...을 사용해서 배열을 풀어서 사용하는 경우이다.
   * 예를들어 a = [1, 2, 3]이라고 할 때 b = [...a, 4, 5]와 같이 사용하는 경우이다.
   *
   * @param node - The return expression node to infer the type from.
   * @param cache - A cache to store and retrieve type information.
   * @returns The inferred type description of the return expression.
   */
  static inferTypeSpreadExpression(node: ast.SpreadExpression, cache: CacheType): TypeDescription {
    let type: TypeDescription = new AnyTypeDescription()
    const log = enterLog('inferSpreadExpr')
    if (node.spread && node.spread.ref) {
      type = TypeSystem.inferType(node.spread.ref, cache)
      // console.log(chalk.red('spread type:'), node.spread.ref.name, node.spread.ref.$type, type.$type)
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
    let type: TypeDescription = new ErrorTypeDescription('internal error', node)
    const log = enterLog('inferNewExpression', node.class.$refText)
    if (node.class.ref) {
      type = new ObjectTypeDescription(node.class.ref)
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
  static inferTypeArrayValue(node: ast.ArrayValue, cache: CacheType): TypeDescription {
    let type: TypeDescription = new ErrorTypeDescription('internal error', node)
    const log = enterLog('inferArrayValue', `item count= ${node.items.length}`)
    // item이 없는 경우 즉 [] 으로 표현되는 빈 배열의 경우 any type으로 취급한다.
    if (node.items.length > 0) {
      const types: TypeDescription[] = []
      node.items.forEach(item => {
        types.push(TypeSystem.inferType(item, cache))
      })
      type = new ArrayTypeDescription(TypeSystem.createUnionType(types))
    } else type = new AnyTypeDescription()
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
    let type: TypeDescription = new ErrorTypeDescription('internal error', node)
    const log = enterLog('inferLiteral', `'${node.$cstNode?.text}'`)
    if (typeof node.value == 'string') {
      switch (node.value) {
        case 'any':
          type = new AnyTypeDescription()
          break
        case 'nil':
          type = new NilTypeDescription()
          break
        case 'void':
          type = new VoidTypeDescription()
          break
        case 'true':
        case 'false':
          type = new BooleanTypeDescription()
          break
        default:
          type = new StringTypeDescription(node)
      }
    } else {
      type = new NumberTypeDescription(node)
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
    const extractReturnExpression = (node: AstNode) => {
      // return AstUtils.streamAllContents(node).filter(ast.isReturnExpression).toArray()
      const result: ast.ReturnExpression[] = []
      AstUtils.streamContents(node).forEach(n => {
        if (ast.isFunctionDef(n) || ast.isFunctionType(n) || ast.isFunctionValue(n)) return
        else if (ast.isReturnExpression(n)) result.push(n)
        else {
          const r = extractReturnExpression(n)
          if (r) result.push(...r)
        }
      })
      return result
    }

    let type: TypeDescription = new ErrorTypeDescription('internal error', node)
    const log = enterLog('inferBlock', node.$type, node.$cstNode?.text)
    // Block이 여러 식으로 구성된 경우
    if (node.isBracket) {
      // 함수의 바디에 명시된 return 문이 없어도 void type으로 간주한다.
      // extractReturnExpression은 람다함수에서 리턴하는 경우를 배제한다.
      // 여러 개의 return문이 있으면 각각의 타입이 union으로 처리한다.
      const types: TypeDescription[] = []
      const returnStatements = extractReturnExpression(node)
      for (const returnStatement of returnStatements) {
        types.push(TypeSystem.inferType(returnStatement, cache))
      }
      type = TypeSystem.createUnionType(types)
      if (TypeSystem.isErrorType(type)) type = new VoidTypeDescription()
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

  /**
   * Returns an array of unique `TypeDescription` objects by removing duplicates.
   *
   * @param types - An array of `TypeDescription` objects to be normalized.
   * @returns An array of unique `TypeDescription` objects.
   */
  static getNormalizedType(types: TypeDescription[]): TypeDescription[] {
    // 새로운 타입과 기존의 타입들이 호환되는지 확인한다.
    // 새로운 타입이 기존의 타입들에 포함되면 true를 리턴하는데 이는 새로운 타입을 추가할 필요가 없다는 의미이다.
    // any type은 모든 타입으로 변환될 수 있으므로 제거한다.
    const compatibleType = (nt: TypeDescription, set: TypeDescription[]) => {
      if (set.some(e => nt.$type === e.$type)) return true

      //todo nil도 일단은 any와 같이 취급한다.
      if (TypeSystem.isAnyType(nt)) return true
      else if (TypeSystem.isNilType(nt)) return true
      else if (TypeSystem.isArrayType(nt)) {
        let found = false
        set.forEach(e => {
          if (TypeSystem.isArrayType(e)) {
            if (TypeSystem.isAnyType(nt.elementType) || TypeSystem.isAnyType(e.elementType)) found = true
          }
        })
        return found
      }
      return false
    }

    // types에 타입이 하나 이하이면 그냥 리턴
    if (types.length <= 1) return types

    // types에 union type이 포함되어 있으면 union type을 풀어서 각각의 타입으로 변환한다.
    const spread: TypeDescription[] = []
    types.forEach(t => {
      if (TypeSystem.isUnionType(t)) spread.push(...t.elementTypes)
      else spread.push(t)
    })

    const set: TypeDescription[] = []
    spread.forEach(e => {
      if (!compatibleType(e, set)) set.push(e)
    })
    return set
  }

  /**
   * Determines the functional method type for a given node in the call chain.
   *
   * This method checks if the provided type is of any type and if the method
   * being called is one of the specified functional methods (`at`, `find`,
   * `findLast`, `pop`, `reduce`, `reduceRight`, `shift`). If so, it attempts
   * to infer the type from the previous node in the call chain if it exists
   * and is an array type.
   *
   * @param type - The initial type description.
   * @param node - The AST node representing the call chain.
   * @param cache - The cache used for type inference.
   * @returns The inferred type description.
   */
  static getFunctionalMethodType(type: TypeDescription, node: ast.CallChain, cache: CacheType): TypeDescription {
    const method = node.element?.$refText
    let methodNames = ['at', 'find', 'findLast', 'pop', 'reduce', 'reduceRight', 'shift']
    if (TypeSystem.isAnyType(type) && method && methodNames.includes(method)) {
      if (node.previous) {
        const prevType = TypeSystem.inferType(node.previous, cache)
        if (TypeSystem.isArrayType(prevType)) {
          return prevType.elementType
        }
      }
    }
    methodNames = ['get', 'set']
    if (TypeSystem.isAnyType(type) && method && methodNames.includes(method)) {
      if (node.previous) {
        let prevType: TypeDescription = new ErrorTypeDescription('internal error', node)
        if (ast.isCallChain(node.previous)) {
          const prevName = node.previous.element?.$refText
          if (prevName) {
            const prevNode = findVariableDefWithName(node, prevName)
            if (prevNode && ast.isVariableDef(prevNode)) {
              if (ast.isUnaryExpression(prevNode.value) && ast.isNewExpression(prevNode.value.value)) {
                if (prevNode.value.value.class.$refText == 'Map') {
                  prevNode.value.value.generic?.types.forEach(g => {
                    prevType = TypeSystem.inferType(g, cache)
                  })
                }
              }
            }
          }
        }
        if (TypeSystem.isObjectType(prevType)) {
          return prevType
        }
      }
    }
    return type
  }
}
