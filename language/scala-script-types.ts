import { AstNode, AstUtils } from 'langium'
import * as ast from './generated/ast.js'
import { ScalaScriptCache, LogGatherer, enterLog, exitLog, traceLog, reduceLog } from '../language/scala-script-util.js'
import assert from 'assert'
import chalk from 'chalk'

/**
 *
 */
export class TypeDescriptor {
  constructor(readonly $type = '') {}

  toString(): string {
    return this.$type
  }

  showDetailInfo() {
    console.log(this.toString())
  }

  isEqual(other: TypeDescriptor): boolean {
    return this.$type === other.$type
  }

  isAssignableTo(other: TypeDescriptor): boolean {
    if (this.$type == 'any' || other.$type == 'any') return true
    if (other.$type == 'union') {
      const union = other as UnionTypeDescriptor
      if (union.elementTypes.some(e => this.isAssignableTo(e))) return true
    }
    return this.isEqual(other)
  }
}

/**
 * Represents a description of a type that can be any value.
 *
 * @property $type - A string literal that identifies this type description as 'any'.
 */
export class AnyTypeDescriptor extends TypeDescriptor {
  constructor() {
    super('any')
  }

  override isEqual(other: TypeDescriptor): boolean {
    return true
  }

  override isAssignableTo(other: TypeDescriptor): boolean {
    return true
  }
}

/**
 * Represents a description of a Nil type.
 *
 * @property $type - A string literal type that is always 'nil'.
 */
export class NilTypeDescriptor extends TypeDescriptor {
  constructor() {
    super('nil')
  }
}

/**
 * Represents a description of a void type.
 *
 * @property $type - A string literal type that is always 'void'.
 */
export class VoidTypeDescriptor extends TypeDescriptor {
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
export class StringTypeDescriptor extends TypeDescriptor {
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
export class NumberTypeDescriptor extends TypeDescriptor {
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
export class BooleanTypeDescriptor extends TypeDescriptor {
  constructor(public literal?: ast.Literal) {
    super('boolean')
  }
}

/**
 * Represents a generic type description that extends the base `TypeDescription` class.
 * This class is used to describe generic types in the ScalaScript language.
 *
 * @property $type - A string literal that identifies the type as 'generic'.
 * @property name - The name of the generic type.
 * @property type - The type description of the generic type.
 */
export class GenericTypeDescriptor extends TypeDescriptor {
  constructor(public name: string, public type: TypeDescriptor = new AnyTypeDescriptor()) {
    super('generic')
  }

  override toString(): string {
    return `${this.$type}<${this.name}:${this.type.toString()}>`
  }

  override isEqual(other: TypeDescriptor): boolean {
    if (other.$type !== 'generic') return false
    const otherGeneric = other as GenericTypeDescriptor
    return this.type.isEqual(otherGeneric.type)
  }
}

/**
 * Represents a union type description.
 *
 * @interface UnionTypeDescription
 * @property {string} $type - The type identifier, which is always 'union'.
 * @property {TypeDescription[]} elementTypes - An array of type descriptions that are part of the union.
 */
export class UnionTypeDescriptor extends TypeDescriptor {
  constructor(public elementTypes: TypeDescriptor[]) {
    super('union')
  }

  override toString(): string {
    return `${this.$type}(${this.elementTypes.map(t => t.toString()).join(' | ')})`
  }

  override isEqual(other: TypeDescriptor): boolean {
    if (other.$type !== 'union') return false
    const otherUnion = other as UnionTypeDescriptor
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
  override isAssignableTo(other: TypeDescriptor): boolean {
    if (other.$type == 'any') return true
    if (other.$type == 'union') {
      const union = other as UnionTypeDescriptor
      if (this.elementTypes.some(e => union.isContain(e))) return true
    } else {
      if (this.elementTypes.some(e => e.isEqual(other))) return true
    }
    return false
  }

  isContain(type: TypeDescriptor): boolean {
    return this.elementTypes.some(e => e.isEqual(type))
  }
}

/**
 * Represents a type description for an array type.
 *
 * This class extends the `TypeDescription` class and provides additional
 * functionality specific to array types, such as storing the element type
 * and providing methods for string representation and equality checks.
 *
 * @extends TypeDescriptor
 * @property {string} $type - The type identifier, which is always 'array'.
 * @property {TypeDescription} elementType - The description of the type of elements contained in the array.
 */
export class ArrayTypeDescriptor extends TypeDescriptor {
  constructor(public elementType: TypeDescriptor) {
    super('array')
  }

  /**
   * Returns a string representation of the function signature.
   *
   * The string representation includes the function parameters and their types,
   * followed by the return type of the function.
   *
   * @returns {string} A string in the format `(<param1>: <type1>, <param2>: <type2>, ...) -> <returnType>`.
   */
  override toString(): string {
    return `${this.$type}<${this.elementType.toString()}>`
  }

  /**
   * Checks if this type description is equal to another type description.
   *
   * @param other - The other type description to compare with.
   * @returns `true` if the other type description is an array and its element type is equal to this element type, otherwise `false`.
   */
  override isEqual(other: TypeDescriptor): boolean {
    if (other.$type !== 'array') return false
    const otherArray = other as ArrayTypeDescriptor
    return this.elementType.isEqual(otherArray.elementType)
  }
}

/**
 * Represents a parameter of a function.
 */
export interface FunctionParameter {
  name: string
  type: TypeDescriptor
  spread: boolean
  nullable: boolean
  defaultValue?: ast.Expression
}

/**
 * Represents a description of a function type, including its return type, parameters, and generic types.
 *
 * @extends TypeDescriptor
 * @property {string} $type - The type identifier, which is always 'function'.
 * @property {TypeDescription} returnType - The description of the function's return type.
 * @property {FunctionParameter[]} parameters - The list of parameters that the function accepts.
 * @property {GenericTypeDescription[]} generic - The list of generic infomation that the function accepts.
 */
export class FunctionTypeDescriptor extends TypeDescriptor {
  returnType: TypeDescriptor
  parameters: FunctionParameter[] = []
  generic: GenericTypeDescriptor[] = []

  /**
   * Constructs a new instance of the class.
   *
   * @param node - An optional AST node which can be of type `FunctionDef`, `FunctionType`, or `FunctionValue`.
   *
   * Initializes the return type to `VoidTypeDescription` by default. If a return type is specified in the node,
   * it infers the type from the return type. If no return type is specified but the node has a body, it infers
   * the type from the body. If neither is present, it defaults to `VoidTypeDescription`.
   *
   * Initializes the parameters by mapping over the node's parameters and inferring their types.
   *
   * Initializes the generic types if the node is of type `FunctionDef`.
   */
  constructor(node?: ast.FunctionDef | ast.FunctionType | ast.FunctionValue) {
    super('function')
    // 명시된 리턴 타입이 있으면 이를 근거로 한다.
    // 명시된 리턴 타입도 없으면 함수의 바디를 근거로 한다.
    // 명시된 리턴 타입도 없고 함수의 바디도 없으면 void type으로 간주한다
    this.returnType = new VoidTypeDescriptor()
    if (!node) return

    traceLog(`* return type: '${reduceLog(node.returnType?.$cstNode?.text)}'`)
    if (node.returnType) this.returnType = TypeSystem.inferType(node.returnType)
    else if ((ast.isFunctionDef(node) || ast.isFunctionValue(node)) && node.body)
      this.returnType = TypeSystem.inferType(node.body)

    traceLog('* parameter type: count is', node.params.length)
    this.parameters = node.params.map(e => ({
      name: e.name,
      type: TypeSystem.inferType(e),
      spread: e.spread,
      nullable: e.nullable,
      defaultValue: e.value,
    }))

    // ObjectDef, FunctionDef에서 정의되어진 것들은 디폴트로 AnyTypeDescritption을 가지고 있다가
    // NewExpression에서 실제 타입으로 대체된다.
    this.generic = []
    if (ast.isFunctionDef(node)) {
      this.generic = node.generic?.types.map(name => new GenericTypeDescriptor(name)) ?? []
    }
  }

  /**
   * Returns a string representation of the function signature.
   *
   * The string representation includes the function parameters and their types,
   * followed by the return type of the function.
   *
   * @returns {string} A string in the format `(<param1>: <type1>, <param2>: <type2>, ...) -> <returnType>`.
   */
  override toString(): string {
    const params = this.parameters.map(e => `${e.name}: ${e.type.toString()}`).join(', ')
    return `(${params}) -> ${this.returnType.toString()}`
  }

  /**
   * Displays detailed information about the current object.
   *
   * This method logs the string representation of the object, its return type,
   * and its parameters to the console.
   *
   * @override
   */
  override showDetailInfo() {
    console.log('Function:', this.toString())
    console.log('  returnType:', chalk.green(this.returnType.toString()))
    console.log('  parameters:')
    this.parameters.forEach(p => {
      console.log(`    ${p.name}: ${chalk.green(p.type.toString())}`)
    })
  }

  /**
   * Compares this function type description with another to determine if they are equal.
   *
   * @param other - The other type description to compare with.
   * @returns `true` if the other type description is a function and has the same return type and parameters; otherwise, `false`.
   */
  override isEqual(other: TypeDescriptor): boolean {
    if (other.$type !== 'function') return false
    const otherFunction = other as FunctionTypeDescriptor
    if (!this.returnType.isEqual(otherFunction.returnType)) return false
    if (this.parameters.length !== otherFunction.parameters.length) return false
    return this.parameters.every((p, i) => p.type.isEqual(otherFunction.parameters[i].type))
  }

  /**
   * Checks if the current type is assignable to another type.
   *
   * @param other - The type to check against.
   * @returns `true` if the current type is assignable to the other type, otherwise `false`.
   *
   * The method performs the following checks:
   * - If the other type is 'any', it returns `true`.
   * - If the other type is a union, it returns `true` if any element type in the union is equal to the current type.
   * - If the other type is a function, it checks the return type and parameters for compatibility.
   *   - If the return types are not assignable, it logs an error and returns `false`.
   *   - If either function has spread parameters, it returns `true` without further checks.
   *   - For each parameter in the current function:
   *     - If the parameter is not nullable and has no default value, it must exist in the other function and be assignable.
   *     - If the parameter is nullable or has a default value, it must be assignable if it exists in the other function.
   *   - Logs errors for any mismatched parameters.
   * - Returns `false` if none of the above conditions are met.
   */
  override isAssignableTo(other: TypeDescriptor): boolean {
    if (other.$type == 'any') return true
    if (other.$type == 'union') {
      const union = other as UnionTypeDescriptor
      if (union.elementTypes.some(e => e.isEqual(this))) return true
    }
    if (other.$type == 'function') {
      const otherFunction = other as FunctionTypeDescriptor
      if (!this.returnType.isAssignableTo(otherFunction.returnType)) {
        console.log(
          chalk.red('returnType is not assignable:'),
          this.returnType.toString(),
          otherFunction.returnType.toString()
        )
        return false
      }
      if (this.parameters.find(p => p.spread) || otherFunction.parameters.find(p => p.spread)) {
        // spread가 있으면 타입 체크를 하지 않는다.
        return true
      }

      const getOtherParam = (index: number) => {
        if (index >= otherFunction.parameters.length) return undefined
        return otherFunction.parameters[index].type
      }

      let matchAll = true
      this.parameters.forEach((p, i) => {
        // nullable이나 defaultValue가 없는 파라미터는 다른 함수에서도 존재해야 한다.
        if (!(p.nullable || p.defaultValue)) {
          const otherParam = getOtherParam(i)
          if (!otherParam) {
            console.log(chalk.red('otherParam is not exist:'), i)
            matchAll = false
          } else {
            if (!p.type.isAssignableTo(otherParam)) {
              console.log(chalk.red('parameter type is not assignable:'), p.type.toString(), otherParam.toString())
              matchAll = false
            }
          }
        } else {
          // 다른 함수에서 이 파라미터가 없어도 되지만 있다면 타입이 같아야 한다.
          const otherParam = getOtherParam(i)
          if (otherParam) {
            if (!p.type.isAssignableTo(otherParam)) {
              console.log(
                chalk.red('nullable or defaultValue parameter type is not assignable:'),
                p.type.toString(),
                otherParam.toString()
              )
              matchAll = false
            }
          }
        }
      })
      return matchAll
    }
    return false
  }

  /**
   * Changes the return type of the current instance.
   *
   * @param type - The new return type to be set.
   */
  changeReturnType(type: TypeDescriptor) {
    this.returnType = type
  }

  /**
   * Adds a parameter type to the parameters list.
   *
   * @param type - The type of the parameter to add. It can be either a `TypeDescription` or a `FunctionParameter`.
   *               If it is a `TypeDescription`, a new parameter object with default values will be created and added.
   *               If it is a `FunctionParameter`, it will be added directly to the parameters list.
   */
  addParameterType(type: TypeDescriptor | FunctionParameter) {
    if (type instanceof TypeDescriptor) this.parameters.push({ name: '', type: type, spread: false, nullable: false })
    else this.parameters.push(type)
  }
}

/**
 * Represents a description of an object type in the ScalaScript language.
 *
 * This class extends the `TypeDescription` class and provides additional functionality
 * for handling object types, including generic types and element lists.
 *
 * @extends TypeDescriptor
 * @property {string} $type - The type identifier, which is always 'object'.
 * @property {ast.ObjectDef | ast.ObjectType | ast.ObjectValue} node - The literal representation of the object type.
 * @property {GenericTypeDescription[]} generic - The list of generic infomation that the function accepts.
 */
export class ObjectTypeDescriptor extends TypeDescriptor {
  generic: GenericTypeDescriptor[]

  /**
   * Constructs an instance of the class with the given AST node.
   *
   * @param node - The AST node which can be of type `ObjectDef`, `ObjectType`, or `ObjectValue`.
   *
   * If the node is of type `ObjectDef`, the `generic` property is populated with an array of
   * `GenericTypeDescription` instances created from the generic types defined in the node.
   */
  constructor(public node: ast.ObjectDef | ast.ObjectType | ast.ObjectValue) {
    super('object')

    this.generic = []
    if (ast.isObjectDef(node)) {
      this.generic = node.generic?.types.map(name => new GenericTypeDescriptor(name)) ?? []
    }
  }

  /**
   * Returns a string representation of the object.
   *
   * @override
   * @returns {string} If the node is an object definition, returns the name of the node.
   *                   Otherwise, returns a string representation of the element list in the format '{ name1, name2, ... }'.
   */
  override toString(): string {
    if (ast.isObjectDef(this.node)) return this.node.name
    else {
      const names = this.getElementList().map(e => e.name)
      return '{ ' + names.join(', ') + ' }'
    }
  }

  /**
   * Checks if the current `TypeDescription` is equal to another `TypeDescription`.
   *
   * @param other - The other `TypeDescription` to compare with.
   * @returns `true` if the types are considered equal, `false` otherwise.
   *
   * The comparison is based on the following criteria:
   * - If the `other` type is not an object, returns `false`.
   * - If both types are object definitions, their names must be the same.
   * - Otherwise, it compares the elements of both types:
   *   - Each element in the current type must have a corresponding element with the same name in the `other` type.
   *   - The types of corresponding elements must also be equal.
   *
   * Logs differences in names and types to the console for debugging purposes.
   */
  override isEqual(other: TypeDescriptor): boolean {
    if (other.$type !== 'object') return false
    const otherObject = other as ObjectTypeDescriptor
    if (ast.isObjectDef(this.node) && ast.isObjectDef(otherObject.node)) {
      //todo 이름만 같으면 같다고 할 수 있을까?
      if (this.node.name !== otherObject.node.name) return false
    } else {
      const otherElements = otherObject.getElementList()
      for (let e of this.getElementList()) {
        const found = otherElements.find(o => o.name == e.name)
        if (!found) {
          console.log(chalk.red('이름이 없음:'), e.name, reduceLog(e.node.$cstNode?.text))
          return false
        }
        // 동일한 이름이 있으면 타입도 같아야 한다.
        const t1 = TypeSystem.inferType(e.node)
        const t2 = TypeSystem.inferType(found.node)
        if (!t1.isEqual(t2)) {
          console.log(chalk.red('타입이 다름:'), e.name)
          console.log('  t1:', chalk.green(t1.toString()), reduceLog(e.node.$cstNode?.text))
          console.log('  t2:', chalk.green(t2.toString()), reduceLog(found.node.$cstNode?.text))
          return false
        }
      }
    }
    return true
  }

  /**
   * Determines if the current type is assignable to another type.
   *
   * @param other - The type to check against.
   * @returns `true` if the current type is assignable to the other type, otherwise `false`.
   *
   * The method checks the following conditions:
   * - If the other type is 'any', it returns `true`.
   * - If the other type is a union type, it returns `true` if any element type in the union is equal to the current type.
   * - If the other type is an object type, it checks if both types are object definitions and if the current type is in the class chain of the other type.
   * - If none of the above conditions are met, it returns `false`.
   */
  override isAssignableTo(other: TypeDescriptor): boolean {
    if (other.$type == 'any') return true
    if (other.$type == 'union') {
      const union = other as UnionTypeDescriptor
      if (union.elementTypes.some(e => e.isEqual(this))) return true
    }
    if (other.$type == 'object') {
      const otherObject = other as ObjectTypeDescriptor
      if (ast.isObjectDef(this.node) && ast.isObjectDef(otherObject.node)) {
        // 동일하거나 상속관계인 경우(자식이 부모 클래스에)만 assignable이다.
        return TypeSystem.getClassChain(this.node).includes(otherObject.node)
      }
      return this.isEqual(other)
    }
    return false
  }

  /**
   * Retrieves a list of elements from the current node.
   * The elements can be of type VariableDef, FunctionDef, ObjectDef, or Binding.
   *
   * ObjectDef, ObjectType, ObjectValue의 element들을 리턴한다.
   * ObjectDef, ObjectType는 서로 동일하기 때문에 Bypass를 제거하고 리턴하면 되는데
   * ObjectValue는 Binding 개체이고 둘과는 다르다.
   *
   * Depending on the type of the current node, it processes the elements differently:
   * - If the node is an ObjectDef, it iterates over the body elements and adds them to the list if they are not bypassed.
   * - If the node is an ObjectType, it iterates over the elements and adds them to the list if they are not bypassed.
   * - If the node is an ObjectValue, it iterates over the elements and adds them to the list if both element and value are present.
   *
   * @returns An array of objects, each containing the name and node of the element.
   */
  getElementList() {
    const list: { name: string; node: ast.VariableDef | ast.FunctionDef | ast.ObjectDef | ast.Binding }[] = []
    if (ast.isObjectDef(this.node)) {
      this.node.body.elements.forEach(e => {
        if (!ast.isBypass(e)) list.push({ name: e.name, node: e })
      })
    } else if (ast.isObjectType(this.node)) {
      this.node.elements.forEach(e => {
        if (!ast.isBypass(e)) list.push({ name: e.name, node: e })
      })
    } else if (ast.isObjectValue(this.node)) {
      this.node.elements.forEach(e => {
        if (e.element && e.value) {
          list.push({ name: e.element, node: e })
        } else {
          //todo spread 처리
          console.error(
            chalk.red('internal error in createObjectType:', e.spread?.spread.$refText, reduceLog(e.$cstNode?.text))
          )
        }
      })
    }
    return list
  }

  /**
   * Retrieves the type descriptor of a specified element within an object definition.
   *
   * @param elementName - The name of the element whose type is to be determined.
   * @returns The type descriptor of the specified element, or `undefined`
   *          if the element is not found or the node is not an object definition.
   */
  getElementType(elementName: string): TypeDescriptor | undefined {
    let type: TypeDescriptor | undefined = undefined
    if (ast.isObjectDef(this.node)) {
      this.node.body.elements.forEach(e => {
        if (!ast.isBypass(e)) {
          if (e.name == elementName) {
            type = TypeSystem.inferType(e)
          }
        }
      })
    }
    return type
  }
}

/**
 * Represents an error type description in the ScalaScript language.
 * Extends the `TypeDescription` class with additional properties for error handling.
 *
 * @extends TypeDescriptor
 * @property $type - A constant string with the value 'error'.
 * @property source - An optional property representing the source of the error, which is an AstNode.
 * @property message - A string containing the error message.
 */
export class ErrorTypeDescriptor extends TypeDescriptor {
  constructor(public message: string, public source?: AstNode) {
    super('error')
  }

  override toString(): string {
    return `{${chalk.red(this.$type)}: ${this.message}, '${reduceLog(this.source?.$cstNode?.text)}'}`
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
   * Creates a union type description from the provided element types.
   *
   * @param types - An array of `TypeDescription` objects that represent the types to be included in the union.
   * @returns A `UnionTypeDescription` object representing the union of the provided types.
   */
  static createUnionType(types: TypeDescriptor[]): TypeDescriptor {
    // Union 타입은 중복된 타입을 제거해야 하는데 Set을 사용해서 이를 처리할 수 없다.
    // 중복된 타입을 제거한 후에도 union 타입인 경우에만 union을 리턴하고 아니면 단일 타입을 리턴한다.
    const normalized = TypeSystem.getNormalizedType(types)
    if (normalized.length == 0) return new ErrorTypeDescriptor('no types in union')
    else if (normalized.length == 1) return normalized[0]
    else return new UnionTypeDescriptor(normalized)
  }

  /**
   * Checks if the given item is of type `AnyTypeDescription`.
   *
   * @param item - The type description to check.
   * @returns `true` if the item is of type `AnyTypeDescription`, otherwise `false`.
   */
  static isAnyType(item: TypeDescriptor): boolean {
    return item.$type === 'any'
  }

  /**
   * Checks if the given item is of type `NilTypeDescription`.
   *
   * @param item - The type description to check.
   * @returns True if the item is of type `NilTypeDescription`, otherwise false.
   */
  static isNilType(item: TypeDescriptor): boolean {
    return item.$type === 'nil'
  }

  /**
   * Determines if the given type description is a void type.
   *
   * @param item - The type description to check.
   * @returns True if the type description is a void type, otherwise false.
   */
  static isVoidType(item: TypeDescriptor): boolean {
    return item.$type === 'void'
  }

  /**
   * Checks if the given TypeDescription is of type StringTypeDescription.
   *
   * @param item - The TypeDescription to check.
   * @returns True if the item is of type StringTypeDescription, otherwise false.
   */
  static isStringType(item: TypeDescriptor): item is StringTypeDescriptor {
    return item.$type === 'string'
  }

  /**
   * Determines if the given type description is a number type.
   *
   * @param item - The type description to check.
   * @returns True if the type description is a number type, otherwise false.
   */
  static isNumberType(item: TypeDescriptor): item is NumberTypeDescriptor {
    return item.$type === 'number'
  }

  /**
   * Determines if the given type description is a boolean type.
   *
   * @param item - The type description to check.
   * @returns True if the type description is a boolean type, otherwise false.
   */
  static isBooleanType(item: TypeDescriptor): item is BooleanTypeDescriptor {
    return item.$type === 'boolean'
  }

  /**
   * Determines if the given type description is a generic type.
   *
   * @param item - The type description to check.
   * @returns True if the type description is a generic type, otherwise false.
   */
  static isGenericType(item: TypeDescriptor): item is GenericTypeDescriptor {
    return item.$type === 'generic'
  }

  /**
   * Determines if the given type description is a union type.
   *
   * @param item - The type description to check.
   * @returns True if the type description is a union type, otherwise false.
   */
  static isUnionType(item: TypeDescriptor): item is UnionTypeDescriptor {
    return item.$type === 'union'
  }

  /**
   * Checks if the given type description is an array type.
   *
   * @param item - The type description to check.
   * @returns True if the type description is an array type, otherwise false.
   */
  static isArrayType(item: TypeDescriptor): item is ArrayTypeDescriptor {
    return item.$type === 'array'
  }

  /**
   * Determines if the given type description is a function type.
   *
   * @param item - The type description to check.
   * @returns True if the type description is a function type, otherwise false.
   */
  static isFunctionType(item: TypeDescriptor): item is FunctionTypeDescriptor {
    return item.$type === 'function'
  }

  /**
   * Determines if the given `TypeDescription` item is of type `ClassTypeDescription`.
   *
   * @param item - The `TypeDescription` item to check.
   * @returns A boolean indicating whether the item is a `ClassTypeDescription`.
   */
  static isObjectType(item: TypeDescriptor): item is ObjectTypeDescriptor {
    return item.$type === 'object'
  }

  /**
   * Determines if the given type description is an error type.
   *
   * @param item - The type description to check.
   * @returns True if the type description is an error type, otherwise false.
   */
  static isErrorType(item: TypeDescriptor): item is ErrorTypeDescriptor {
    return item.$type === 'error'
  }

  /**
   * Infers the type of a given AST node.
   *
   * @param node - The AST node for which the type is to be inferred. Can be undefined.
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
  static inferType(node: AstNode | undefined): TypeDescriptor {
    const log = enterLog('inferType', `${chalk.green(node?.$type)}, '${node?.$cstNode?.text}'`)

    if (!node) {
      const type = new ErrorTypeDescriptor('Could not infer type for undefined', node)
      exitLog(log, type, 'Exit(node is undefined)')
      return type
    }

    const existing = ScalaScriptCache.get(node)
    if (existing) {
      // for debugging...
      // if (TypeSystem.isErrorType(existing)) console.trace(existing.toString())
      exitLog(log, existing, 'Exit(node is cached)')
      return existing
    }

    // Prevent recursive inference errors
    ScalaScriptCache.set(node, new ErrorTypeDescriptor('Recursive definition', node))

    let type: TypeDescriptor | undefined

    if (ast.isTypes(node)) {
      type = TypeSystem.inferTypeTypes(node)
    } else if (ast.isSimpleType(node)) {
      // Types와 SimpleType은 분리되어져 있다.
      // SimpleType은 ArrayType | ObjectType | ElementType와 같이 UnionType이며 타입들의 단순한 집합이지만
      // Types는 types+=SimpleType ('|' types+=SimpleType)*와 같이 SimpleType의 배열로 단순히 타입이 아니다.
      // 일례로 TypeChain은 ElementType이고 SimpleType이긴 하지만 Types는 아니다.
      type = TypeSystem.inferTypeSimpleType(node)
    } else if (ast.isVariableDef(node)) {
      type = TypeSystem.inferTypeVariableDef(node)
    } else if (ast.isFunctionDef(node)) {
      type = TypeSystem.inferTypeFunctionDef(node)
    } else if (ast.isObjectDef(node)) {
      type = TypeSystem.inferTypeObjectDef(node)
    } else if (ast.isCallChain(node)) {
      type = TypeSystem.inferTypeCallChain(node)
    } else if (ast.isParameter(node)) {
      type = TypeSystem.inferTypeParameter(node)
    } else if (ast.isBinding(node)) {
      type = TypeSystem.inferTypeBinding(node)
    } else if (ast.isForOf(node)) {
      type = TypeSystem.inferTypeForOf(node)
    } else if (ast.isForTo(node)) {
      type = TypeSystem.inferTypeForTo(node)
    } else if (ast.isAssignment(node)) {
      type = TypeSystem.inferTypeAssignment(node)
    } else if (ast.isLogicalNot(node)) {
      type = TypeSystem.inferTypeLogicalNot(node)
    } else if (ast.isIfExpression(node)) {
      type = TypeSystem.inferTypeIfExpression(node)
    } else if (ast.isMatchExpression(node)) {
      type = TypeSystem.inferTypeMatchExpression(node)
    } else if (ast.isGroupExpression(node)) {
      type = TypeSystem.inferTypeGroupExpression(node)
    } else if (ast.isUnaryExpression(node)) {
      type = TypeSystem.inferTypeUnaryExpression(node)
    } else if (ast.isBinaryExpression(node)) {
      type = TypeSystem.inferTypeBinaryExpression(node)
    } else if (ast.isReturnExpression(node)) {
      type = TypeSystem.inferTypeReturnExpression(node)
    } else if (ast.isSpreadExpression(node)) {
      type = TypeSystem.inferTypeSpreadExpression(node)
    } else if (ast.isNewExpression(node)) {
      type = TypeSystem.inferTypeNewExpression(node)
    } else if (ast.isArrayValue(node)) {
      type = TypeSystem.inferTypeArrayValue(node)
    } else if (ast.isObjectValue(node)) {
      type = TypeSystem.inferTypeObjectValue(node)
    } else if (ast.isFunctionValue(node)) {
      type = TypeSystem.inferTypeFunctionValue(node)
    } else if (ast.isLiteral(node)) {
      type = TypeSystem.inferTypeLiteral(node)
    } else if (ast.isBlock(node)) {
      type = TypeSystem.inferTypeBlock(node)
    }

    if (!type) {
      type = new ErrorTypeDescriptor('Could not infer type for ' + node.$type, node)
    }

    // for debugging...
    // if (TypeSystem.isErrorType(type)) {
    //   console.error(chalk.red('inferType Error:'), `${type.toString()}, '${node.$cstNode?.text}'`)
    // }

    ScalaScriptCache.set(node, type)
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of the given AST node and returns a TypeDescription.
   *
   * @param node - The AST node representing the types to infer.
   * @returns A TypeDescription representing the inferred type.
   *
   * The function processes the types within the node and simplifies the result:
   * - If there are no types, it returns an error type.
   * - If there is only one type, it returns that type.
   * - If there are multiple types, it returns a union type.
   */
  static inferTypeTypes(node: ast.Types): TypeDescriptor {
    const log = enterLog('inferTypeTypes', `'${node.$cstNode?.text}'`)
    const ts = node.types.map(t => TypeSystem.inferType(t))
    // 실제 Union 타입이 아니면 처리를 단순화하기 위해 개별 타입으로 리턴한다.
    const type = TypeSystem.createUnionType(ts)
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of a given SimpleType node.
   *
   * @param node - The SimpleType node to infer the type for.
   * @returns The inferred TypeDescription for the given SimpleType node.
   *
   * This function determines the type of the provided SimpleType node by checking its specific kind.
   * It handles array types, object types, function types, primitive types, and reference types.
   * If the type cannot be determined, it returns an error type.
   */
  static inferTypeSimpleType(node: ast.SimpleType): TypeDescriptor {
    const log = enterLog('inferTypeSimpleType', `'${node.$cstNode?.text}'`)
    let type: TypeDescriptor = new ErrorTypeDescriptor('internal error', node)
    if (ast.isArrayType(node)) {
      type = new ArrayTypeDescriptor(TypeSystem.inferType(node.elementType))
    } else if (ast.isObjectType(node)) {
      type = new ObjectTypeDescriptor(node)
    } else if (ast.isElementType(node)) {
      if (ast.isFunctionType(node)) {
        type = new FunctionTypeDescriptor(node)
      } else if (ast.isPrimitiveType(node)) {
        switch (node.type) {
          case 'any':
            type = new AnyTypeDescriptor()
            break
          case 'nil':
            type = new NilTypeDescriptor()
            break
          case 'void':
            type = new VoidTypeDescriptor()
            break
          case 'string':
            type = new StringTypeDescriptor()
            break
          case 'number':
            type = new NumberTypeDescriptor()
            break
          case 'boolean':
            type = new BooleanTypeDescriptor()
            break
          default:
            type = new ErrorTypeDescriptor(`Unknown primitive type: ${node.type}`)
            break
        }
      } else if (ast.isTypeChain(node)) {
        traceLog('Type is reference')
        if (node.reference.ref) {
          const ref = node.reference.ref
          if (ast.isObjectDef(ref)) {
            type = new ObjectTypeDescriptor(ref)
          }
        }
        if (TypeSystem.isErrorType(type)) {
          // type 중에 ref가 없는 것은 Generic일 가능성이 있다.
          const container = AstUtils.getContainerOfType(node, ast.isObjectDef)
          if (container && container.generic?.types.includes(node.reference.$refText)) {
            type = new GenericTypeDescriptor(node.reference.$refText)
          } else console.error(chalk.red('node.reference.ref is not valid:', node.reference.$refText))
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
   * @returns The inferred type description of the variable definition.
   */
  static inferTypeVariableDef(node: ast.VariableDef): TypeDescriptor {
    const log = enterLog('inferTypeVariableDef', node.name)
    let type: TypeDescriptor = new ErrorTypeDescriptor('No type hint for this element', node)
    if (node.type) type = TypeSystem.inferType(node.type)
    else if (node.value) type = TypeSystem.inferType(node.value)
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of a function definition node.
   *
   * @param node - The function definition AST node to infer the type for.
   * @returns A `TypeDescription` object representing the inferred type of the function.
   */
  static inferTypeFunctionDef(node: ast.FunctionDef): TypeDescriptor {
    const log = enterLog('inferTypeFunctionDef', node.name)
    const type = new FunctionTypeDescriptor(node)
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type description for an object definition node.
   *
   * @param node - The AST node representing the object definition.
   * @returns The inferred type description for the object.
   */
  static inferTypeObjectDef(node: ast.ObjectDef): TypeDescriptor {
    const log = enterLog('inferTypeObjectDef', node.name)
    const type = new ObjectTypeDescriptor(node)
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
   * @returns The inferred type description of the call chain node.
   */
  static inferTypeCallChain(node: ast.CallChain): TypeDescriptor {
    const id = `element='${node.element?.$refText}', cst='${node?.$cstNode?.text}'`
    const log = enterLog('inferTypeCallChain', id)
    traceLog(chalk.redBright('ref 참조전:'), id)
    const element = node.element?.ref
    traceLog(chalk.green('ref 참조후:'), id)

    let type: TypeDescriptor = new ErrorTypeDescriptor('internal error', node)
    if (element) {
      type = TypeSystem.inferType(element)

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
        traceLog('배열 호출이면 배열 요소가 리턴되어야 한다', type.elementType.toString())
        type = type.elementType
      }

      // 함수 호출이면 함수 리턴 타입이 리턴되어야 한다
      if (TypeSystem.isFunctionType(type) && node.isFunction) {
        traceLog('함수 호출이면 함수 리턴 타입이 리턴되어야 한다', type.returnType.toString())
        // 일반적인 함수 호출이면 함수의 리턴 타입을 리턴하고
        // 함수형 메서드 호출인 경우에는 return type을 조정해 준다.
        // 이때 if (fmt) type.returnType = fmt 같이 하면 정의된 함수의 리턴 타입이 변경되므로 주의해야 한다.
        const fmt = TypeSystem.getFunctionInfo(node)
        if (fmt && TypeSystem.isFunctionType(fmt)) {
          // console.log('After getFunctionInfo():', node.$cstNode?.text, fmt.returnType.toString())
          type = fmt.returnType
        } else type = type.returnType
      }
    }

    // this, super인 경우
    else if (node.$cstNode?.text == 'this' || node.$cstNode?.text == 'super') {
      const classItem = AstUtils.getContainerOfType(node, ast.isObjectDef)
      if (classItem) {
        traceLog(`'this' refers ${classItem.name}`)
        type = new ObjectTypeDescriptor(classItem)
      } else {
        console.error(chalk.red('this or super is empty in types.ts'))
        // for debugging...
        let item: AstNode | undefined = node
        while (item) {
          console.log(chalk.green(reduceLog(`  ${item.$type}: ${item.$cstNode?.text}`)))
          if (ast.isObjectDef(item)) break
          item = item.$container
        }
      }
    }

    // node.element.ref가 없는 경우
    else {
      // 그냥 에러로 처리할 수도 있지만 최대한 추론해 본다.
      // previous가 함수이면 이것의 리턴 타입을 자신의 타입으로 리턴하게 하고
      // previous가 배열이면 배열의 element 타입을 자신의 타입으로 취한다.
      if (node.previous) {
        const previousType = TypeSystem.inferType(node.previous)
        console.log(chalk.red('여기는 정확히 어떨 때 호출되는가?', id))
        console.log(chalk.green(`  previous: ${node.previous?.$cstNode?.text}'s type: ${previousType.$type}`))
        if (TypeSystem.isFunctionType(previousType)) type = previousType.returnType
        else if (TypeSystem.isArrayType(previousType)) type = previousType.elementType
        else type = new ErrorTypeDescriptor('Could not infer type for element ' + node.element?.$refText, node)
        exitLog(log, type)
        return type
      }

      type = new ErrorTypeDescriptor('Could not infer type for element ' + node.element?.$refText, node)
    }

    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of a given parameter node. If the type of the parameter
   * cannot be determined from its type or value, it defaults to `any` type.
   *
   * @param node - The parameter node to infer the type for.
   * @returns The inferred type description of the parameter.
   */
  static inferTypeParameter(node: ast.Parameter): TypeDescriptor {
    const log = enterLog('inferTypeParameter', node.name)
    let type: TypeDescriptor = new AnyTypeDescriptor()
    if (node.type) type = TypeSystem.inferType(node.type)
    else if (node.value) type = TypeSystem.inferType(node.value)
    else {
      // getFunctionInfo()는 함수 자체에 대한 정보를 리턴하기 때문에 파라미터와 함수의 인수들을 매치하는 작업이 필요하다.
      // node.$container.$container가 쓰인 이유는 [이 문서](/.prism/docs/d064613466b71eae97f19e05193accdf.md)을 참고한다.
      const funcNode = node.$container.$container
      const funcType = TypeSystem.getFunctionInfo(funcNode)
      if (!funcType) {
        // for debugging...
        console.error(
          chalk.red('getFunctionInfo() is null in inferTypeParameter:'),
          node.name,
          chalk.green(funcNode?.$type),
          reduceLog(funcNode?.$cstNode?.text)
        )
      } else if (TypeSystem.isArrayType(funcType)) {
        type = funcType
      } else if (TypeSystem.isFunctionType(funcType)) {
        // for debugging...
        // console.log('parameter.name:', node.name, `'${reduceLog(funcNode?.$cstNode?.text)}'`)
        // funcType.showDetailInfo()

        if (!ast.isBinding(funcNode)) {
          // 현재 노드에서 CallChain까지 올라간 다음 CallChain의 args를 검사해서 파라미터의 위치를 찾는다.
          // 처음에는 노드로 찾고 람다 함수가 있으면 람다 함수의 파라미터 인덱스는 이름으로 찾는다.
          const callchain = AstUtils.getContainerOfType(node, ast.isCallChain)
          const funcParamIndex = callchain?.args.findIndex(arg => arg == node.$container)
          if (funcParamIndex != undefined && funcParamIndex != -1) {
            const funcArg = callchain?.args[funcParamIndex]
            const argType = funcType.parameters[funcParamIndex].type
            if (ast.isFunctionValue(funcArg) && argType && TypeSystem.isFunctionType(argType)) {
              let lambdaParamIndex = node.$container.params.findIndex(param => param.name == node.name)
              if (lambdaParamIndex != -1) {
                type = argType.parameters[lambdaParamIndex].type
                // console.log('new type:', type.toString())
              }
            }
          }
        } else {
          funcType.parameters.forEach((p, i) => {
            if (p.name == node.name) type = p.type
          })
          // for debugging...
          // console.log('BINDING:', node.$cstNode?.text, node.name, type.toString())
        }
      }
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
   * @returns The inferred type description of the assignment binding node.
   */
  static inferTypeBinding(node: ast.Binding): TypeDescriptor {
    const log = enterLog('inferTypeBinding', node.element)
    // Binding에는 value가 없을수는 없지만 없으면 nil type으로 취급한다.
    //todo 타입스크립트에서는 name과 value가 동일하면 하나만 사용할 수 있는데 스칼라스크립트에서는 아직 그렇지 않다.
    let type: TypeDescriptor = new NilTypeDescriptor()
    if (node.value) type = TypeSystem.inferType(node.value)
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of the elements in a `for...of` loop.
   * 이 함수는 for(a <- ary)와 같이 정의되어진 후 a를 참조하게 되면 a의 타입을 추론할때 사용된다.
   *
   * @param node - The AST node representing the `for...of` loop.
   * @returns The inferred type of the elements being iterated over.
   */
  static inferTypeForOf(node: ast.ForOf): TypeDescriptor {
    const log = enterLog('inferTypeForOf', node.name)
    let type = TypeSystem.inferType(node.of)
    if (TypeSystem.isArrayType(type)) type = type.elementType
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type for a `ForTo` node.
   * 이 함수는 for(a <- 1 (to | until) 10)와 같이 정의되어진 후 a를 참조하게 되면 a의 타입을 추론할때 사용된다.
   *
   * @param node - The `ForTo` AST node to infer the type for.
   * @returns The inferred type description.
   */
  static inferTypeForTo(node: ast.ForTo): TypeDescriptor {
    const log = enterLog('inferTypeForTo', node.name)
    let e1 = TypeSystem.inferType(node.e1)
    let e2 = TypeSystem.inferType(node.e1)
    if (TypeSystem.isNumberType(e1) && TypeSystem.isNumberType(e2)) {
      exitLog(log, e1)
      return e1
    }
    const type = new ErrorTypeDescriptor('ForTo loop must have number types', node)
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
   * @returns The inferred type description of the assignment node.
   */
  static inferTypeAssignment(node: ast.Assignment): TypeDescriptor {
    const log = enterLog('inferTypeAssignment', node.operator)
    let type: TypeDescriptor = new ErrorTypeDescriptor('No type hint for this element', node)
    if (node.assign) type = TypeSystem.inferType(node.assign)
    else if (node.value) type = TypeSystem.inferType(node.value)
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of a logical NOT operation in the AST.
   *
   * @param node - The AST node representing the logical NOT operation.
   * @returns The inferred type description of the logical NOT operation.
   */
  static inferTypeLogicalNot(node: ast.LogicalNot): TypeDescriptor {
    const log = enterLog('inferTypeLogicalNot', node.operator)
    let type: TypeDescriptor = new ErrorTypeDescriptor('internal error', node)
    if (node.operator === '!' || node.operator === 'not') type = new BooleanTypeDescriptor()
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of an IfExpression node.
   *
   * @param node - The IfExpression AST node to infer the type for.
   * @returns The inferred type description of the IfExpression node.
   */
  static inferTypeIfExpression(node: ast.IfExpression): TypeDescriptor {
    const log = enterLog('inferTypeIfExpression', node.$type)
    let type: TypeDescriptor = new ErrorTypeDescriptor('internal error', node)
    if (!node.then) {
      console.error(chalk.red('IfExpression has no then node'))
      exitLog(log, type)
      return type
    }
    type = TypeSystem.inferType(node.then)

    // IfExpression에 else가 있으면 then과 else의 타입을 비교해서 union type으로 만든다.
    // 그렇지 않은 모든 경우는 then의 타입을 그대로 사용한다.
    if (node.else) {
      const elseType = TypeSystem.inferType(node.else)
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
   * @returns The inferred type description of the MatchExpression node.
   */
  static inferTypeMatchExpression(node: ast.MatchExpression): TypeDescriptor {
    const log = enterLog('inferTypeMatchExpression', node.$type)
    const types: TypeDescriptor[] = []
    node.cases.forEach(c => {
      if (c.body) types.push(TypeSystem.inferType(c.body))
    })
    // type이 없으면 void type으로 처리한다.
    let type: TypeDescriptor = TypeSystem.createUnionType(types)
    if (TypeSystem.isErrorType(type)) type = new VoidTypeDescriptor()
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of a function value node.
   *
   * @param node - The function value AST node to infer the type for.
   * @returns The inferred type description of the function value.
   */
  static inferTypeGroupExpression(node: ast.GroupExpression): TypeDescriptor {
    const log = enterLog('inferTypeGroupExpression', `'${node.$cstNode?.text}'`)
    const type = TypeSystem.inferType(node.value)
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of a unary expression node.
   *
   * @param node - The unary expression AST node to infer the type for.
   * @returns The inferred type description of the unary expression.
   */
  static inferTypeUnaryExpression(node: ast.UnaryExpression): TypeDescriptor {
    const log = enterLog('inferTypeUnaryExpression', node.operator ? node.operator : '+')
    let type: TypeDescriptor = new ErrorTypeDescriptor('internal error', node)
    if (node.operator && node.operator === 'typeof') type = new StringTypeDescriptor()
    else type = TypeSystem.inferType(node.value)
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of a binary expression node.
   *
   * @param node - The binary expression AST node to infer the type for.
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
  static inferTypeBinaryExpression(node: ast.BinaryExpression): TypeDescriptor {
    const log = enterLog('inferTypeBinaryExpression', node.operator)
    let type: TypeDescriptor = new ErrorTypeDescriptor('Could not infer type from binary expression', node)
    if (['and', 'or', '&&', '||', '<', '<=', '>', '>=', '==', '!='].includes(node.operator)) {
      type = new BooleanTypeDescriptor()
    } else if (['-', '+', '**', '*', '/', '%'].includes(node.operator)) {
      type = new NumberTypeDescriptor()
    } else if (['..'].includes(node.operator)) {
      const left = TypeSystem.inferType(node.left)
      const right = TypeSystem.inferType(node.right)
      if (TypeSystem.isStringType(left) || TypeSystem.isStringType(right)) {
        type = new StringTypeDescriptor()
      }
    } else if (node.operator === 'instanceof') {
      //todo instanceof 의 결과는 일단 any type으로 처리한다.
      type = new AnyTypeDescriptor()
    }
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of a return expression node.
   *
   * @param node - The return expression node to infer the type from.
   * @returns The inferred type description of the return expression.
   */
  static inferTypeReturnExpression(node: ast.ReturnExpression): TypeDescriptor {
    const log = enterLog('inferTypeReturnExpression')
    let type: TypeDescriptor = new VoidTypeDescriptor()
    if (node.value) type = TypeSystem.inferType(node.value)
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of a spread expression node.
   * Spread expression은 ...을 사용해서 배열을 풀어서 사용하는 경우이다.
   * 예를들어 a = [1, 2, 3]이라고 할 때 b = [...a, 4, 5]와 같이 사용하는 경우이다.
   *
   * @param node - The return expression node to infer the type from.
   * @returns The inferred type description of the return expression.
   */
  static inferTypeSpreadExpression(node: ast.SpreadExpression): TypeDescriptor {
    const log = enterLog('inferTypeSpreadExpression', node.$cstNode?.text)
    let type: TypeDescriptor = new AnyTypeDescriptor()
    if (node.spread && node.spread.ref) {
      type = TypeSystem.inferType(node.spread.ref)
    }
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of a new expression node.
   *
   * @param node - The AST node representing the new expression.
   * @returns The inferred type description of the new expression.
   */
  static inferTypeNewExpression(node: ast.NewExpression): TypeDescriptor {
    const log = enterLog('inferTypeNewExpression', node.class.$refText)
    let type: TypeDescriptor = new ErrorTypeDescriptor('internal error', node)
    if (node.class.ref) type = new ObjectTypeDescriptor(node.class.ref)

    // new Array<number>()와 같은 경우에는 ArrayTypeDescription으로 변경해 준다.
    // generic이 있으면 generic의 타입을 element type으로 사용하고 없으면 any type으로 처리한다.
    if (TypeSystem.isObjectType(type) && node.class.$refText === 'Array') {
      if (node.generic) {
        assert(node.generic.types.length === 1, 'Array type must have one generic type')
        const t = TypeSystem.inferType(node.generic.types[0])
        type = new ArrayTypeDescriptor(t)
      } else type = new ArrayTypeDescriptor(new AnyTypeDescriptor())
      exitLog(log, type)
      return type
    }

    // 생성시 generic정보가 있으면 오브젝트의 타입에 이를 추가한다.
    // new Set<string>(), new Set<number>()와 같은 경우에도 ObjectTypeDescription은 동일하지 않기 때문에 상관없다.
    if (node.generic && TypeSystem.isObjectType(type)) {
      type.generic = node.generic.types.map((g, index) => {
        const t = TypeSystem.inferType(g)
        return new GenericTypeDescriptor(index.toString(), t)
      })
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
   * @returns The inferred type description of the array value.
   */
  static inferTypeArrayValue(node: ast.ArrayValue): TypeDescriptor {
    const log = enterLog('inferTypeArrayValue', `'${reduceLog(node.$cstNode?.text)}', item count= ${node.items.length}`)
    let type: TypeDescriptor = new ErrorTypeDescriptor('internal error', node)
    // item이 없는 경우 즉 [] 으로 표현되는 빈 배열의 경우 any type으로 취급한다.
    if (node.items.length > 0) {
      const types: TypeDescriptor[] = []
      node.items.forEach(item => {
        // 배열 안에서 spread가 사용되면 spread를 풀어서 처리해야 한다.
        if (ast.isSpreadExpression(item)) {
          const spreadType = TypeSystem.inferType(item)
          if (TypeSystem.isObjectType(spreadType)) types.push(new AnyTypeDescriptor())
          else if (TypeSystem.isArrayType(spreadType)) types.push(spreadType.elementType)
          else types.push(spreadType)
        } else types.push(TypeSystem.inferType(item))
      })
      type = new ArrayTypeDescriptor(TypeSystem.createUnionType(types))
    } else type = new AnyTypeDescriptor()
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of an object value from the given AST node.
   *
   * @param node - The AST node representing the object value.
   * @returns A TypeDescription object representing the inferred type.
   */
  static inferTypeObjectValue(node: ast.ObjectValue): TypeDescriptor {
    const log = enterLog('inferTypeObjectValue', `'${reduceLog(node.$cstNode?.text)}'`)
    const type = new ObjectTypeDescriptor(node)
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of a given function value node.
   *
   * @param node - The function value node to infer the type for.
   * @returns A `TypeDescription` representing the inferred type of the function value.
   */
  static inferTypeFunctionValue(node: ast.FunctionValue): TypeDescriptor {
    const log = enterLog('inferTypeFunctionValue', `'${reduceLog(node.$cstNode?.text)}'`)
    const type = new FunctionTypeDescriptor(node)
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of a given literal node.
   *
   * @param node - The AST literal node to infer the type from.
   * @returns The inferred type description of the literal node.
   */
  static inferTypeLiteral(node: ast.Literal): TypeDescriptor {
    const log = enterLog('inferTypeLiteral', `'${node.$cstNode?.text}'`)
    let type: TypeDescriptor = new ErrorTypeDescriptor('internal error', node)
    if (typeof node.value == 'string') {
      switch (node.value) {
        case 'any':
          type = new AnyTypeDescriptor()
          break
        case 'nil':
          type = new NilTypeDescriptor()
          break
        case 'void':
          type = new VoidTypeDescriptor()
          break
        case 'true':
        case 'false':
          type = new BooleanTypeDescriptor()
          break
        default:
          type = new StringTypeDescriptor(node)
      }
    } else {
      type = new NumberTypeDescriptor(node)
    }
    exitLog(log, type)
    return type
  }

  /**
   * Infers the type of a given block node.
   *
   * @param node - The AST block node to infer the type from.
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
  static inferTypeBlock(node: ast.Block): TypeDescriptor {
    const extractReturns = (node: AstNode) => {
      // return AstUtils.streamAllContents(node).filter(ast.isReturnExpression).toArray()
      const result: ast.ReturnExpression[] = []
      AstUtils.streamContents(node).forEach(n => {
        if (ast.isFunctionDef(n) || ast.isFunctionType(n) || ast.isFunctionValue(n)) return
        else if (ast.isReturnExpression(n)) result.push(n)
        else {
          const r = extractReturns(n)
          if (r) result.push(...r)
        }
      })
      return result
    }

    const log = enterLog('inferTypeBlock', reduceLog(node.$cstNode?.text))
    let type: TypeDescriptor = new ErrorTypeDescriptor('internal error', node)
    // Block이 여러 식으로 구성된 경우
    if (node.isBracket) {
      // 함수의 바디에 명시된 return 문이 없어도 void type으로 간주한다.
      // extractReturnExpression은 람다함수에서 리턴하는 경우를 배제한다.
      // 여러 개의 return문이 있으면 각각의 타입이 union으로 처리한다.
      const types: TypeDescriptor[] = extractReturns(node).map(r => TypeSystem.inferType(r))
      type = TypeSystem.createUnionType(types)
      if (TypeSystem.isErrorType(type)) {
        // console.error(chalk.red(type.toString()), types.length)
        // types.forEach(t => console.error('  ', t.toString()))
        type = new VoidTypeDescriptor()
      }
    } else {
      // Block이 단일 식인 경우 이 식의 타입을 리턴한다.
      if (node.codes.length == 1) type = TypeSystem.inferType(node.codes[0])
      else console.error(chalk.red('Block is not bracket but has multiple codes'))
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
  static getNormalizedType(types: TypeDescriptor[]): TypeDescriptor[] {
    // 새로운 타입과 기존의 타입들이 호환되는지 확인한다.
    // 새로운 타입이 기존의 타입들에 포함되면 true를 리턴하는데 이는 새로운 타입을 추가할 필요가 없다는 의미이다.
    // any type은 모든 타입으로 변환될 수 있으므로 제거한다.
    const compatibleType = (nt: TypeDescriptor, set: TypeDescriptor[]) => {
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
    const spread: TypeDescriptor[] = []
    types.forEach(t => {
      if (TypeSystem.isUnionType(t)) spread.push(...t.elementTypes)
      else spread.push(t)
    })

    const set: TypeDescriptor[] = []
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
   * @returns The inferred type description.
   */
  /*
    이 함수는 함수의 파라미터와 리턴의 실제 타입을 추론하는 함수이다.
    이 함수는 크게 다음과 같은 3가지 경우를 처리한다.
    1) 일반 함수
    2) 배열, Map, Set등의 generic을 가지는 함수형 메서드
    3) Binding 되어진 람다 함수
    
    1) 일반 함수
    일반 함수는 2)와 3)의 경우가 아닌 것을 의미하며 generic과 binding의 영향을 받지 않으므로 간단하다.
    
    2) 배열, Map, Set등의 generic을 가지는 함수형 메서드
    예를 들어 this.corpList.find(corp => corp.name == 'name')와 같은 코드에서 corp의 타입과 find의 리턴 타입을 추론하는 것이다.
    전달되는 node는 find이며 이것의 이전 노드인 this.corpList의 타입을 이용해서 corp, find의 타입을 추론한다.
    Map, Set의 경우도 거의 동일하지만 generic이 K, V 등으로 다수일 수 있고 K, V에 대응하는 실제 타입을
    new Map<string, Corp>와 같은 new Expression에서 얻는다는 것이 다르다.

    Map, Set의 경우는 아래와 같이 사용되는데
    var corpMap = new Map<string, Corp>()
    this.corpMap.get('name')
    this.corpMap의 타입을 추론하면 object형 타입이 된다.
    그리고 inferTypeNewExpression()에서 generic의 정보를 저장하기 때문에 corpMap의 타입에 string, Corp가 저장되어져 있다.
    하지만 배열은 corpList에 gereric 정보가 저장되어져 있지 않다.
    
    배열 자체는 generic의 정보를 가지고 있고 배열도 new Array<Corp>와 같이 사용할 수 있지만 현재는 지원하지 않는다.

    3) Binding 되어진 람다 함수
  */
  static getFunctionInfo(node: AstNode | undefined): FunctionTypeDescriptor | AnyTypeDescriptor | undefined {
    if (!node) {
      console.error(chalk.red('getFunctionInfo: node is null'))
      return undefined
    }
    const log = enterLog('getFunctionInfo', `'${node.$cstNode?.text}'`)

    const gather = new LogGatherer('getFunctionInfo')
    gather.add('node.$type', chalk.green(node.$type))
    gather.add('node.$cstNode', reduceLog(node.$cstNode?.text))

    // 배열, Map, Set등의 generic을 가지는 함수형 메서드 처리 부분
    if (ast.isCallChain(node) && node.isFunction) {
      const nodeRef = node.element?.ref
      const nodeName = node.element?.$refText
      if (!nodeRef) {
        console.error(chalk.red('getFunctionInfo: node ref is null'), node.$cstNode?.text)
        exitLog(log)
        return undefined
      }

      gather.add('node.ref', nodeRef.$type)
      gather.add('node.name', nodeName)

      let isProcessed = false
      let funcType: TypeDescriptor | undefined

      // 처리 과정 중에 name에는 T, K, V와 같은 것들이, type에는 실제 타입이 들어온다.
      // name은 함수형 메서드들이 선언되어진 곳에서 가져오고 실제 타입은 이전 노드나 new expression에서 가져온다.
      let generic: {
        name: string
        type: TypeDescriptor
      }[] = []

      if (node.previous) {
        const prevType = TypeSystem.inferType(node.previous)

        gather.add('node.prev', node.previous.$cstNode?.text)
        gather.add('prevType', prevType.toString())

        if (TypeSystem.isArrayType(prevType)) {
          // find는 변수나 함수로 정의되어져 있다.
          funcType = TypeSystem.inferType(nodeRef)
          assert.ok(ast.isVariableDef(nodeRef) || ast.isFunctionDef(nodeRef), 'it is not valid definition')
          assert.ok(TypeSystem.isFunctionType(funcType), `'${nodeName}' is not function`)

          // VariableDef의 container는 ObjectType이고 그 위에가 ObjectDef이다.
          const grandContainer = nodeRef?.$container?.$container
          if (grandContainer && ast.isObjectDef(grandContainer)) {
            // array이기 때문에 generic이 하나일 것으로 가정하고 있다.
            // Array.map()인 경우에는 타입이 변경될 수 있으므로 any type으로 처리한다.
            let t = prevType.elementType
            if (nodeName == 'map') t = new AnyTypeDescriptor()
            assert(grandContainer.generic?.types.length == 1, 'generic type must be one')
            generic.push({ name: grandContainer.generic?.types[0], type: t })
            isProcessed = true
          } else gather.add('error1', `'${nodeName}'s grandContainer is not object`)
        } else if (TypeSystem.isObjectType(prevType)) {
          if (prevType.toString() == 'Map' || prevType.toString() == 'Set') {
            funcType = TypeSystem.inferType(nodeRef)
            assert.ok(ast.isVariableDef(nodeRef) || ast.isFunctionDef(nodeRef), 'it is not valid definition')
            assert.ok(TypeSystem.isFunctionType(funcType), `'${nodeName}' is not function`)

            // Map, Set은 prevType에 NewExpression에서 설정된 generic 정보가 있다.
            let genericIds: string[] = []
            const grandContainer = nodeRef.$container?.$container
            if (grandContainer && ast.isObjectDef(grandContainer)) {
              genericIds = grandContainer.generic?.types.map(name => name) ?? []
            }
            if (genericIds && prevType.generic && genericIds.length == prevType.generic.length) {
              prevType.generic.forEach((g, index) => {
                generic.push({ name: genericIds[index], type: g.type })
              })
              isProcessed = true
            } else gather.add('error2', 'genericIds and prevType.generic is not matched')
          } else gather.add('error3', `'${nodeName}' is object but Map and Set`)
        } else gather.add('error4', 'prevType is not array or object')
      }

      // Array, Map, Set의 함수형 메서드가 아닌 일반 함수의 경우
      if (!isProcessed) {
        const type = TypeSystem.inferType(nodeRef)

        gather.add('isProcessed', 'now procesing')
        gather.add('type', type.toString())

        if (TypeSystem.isFunctionType(type) || TypeSystem.isAnyType(type)) {
          funcType = type
        } else if (TypeSystem.isObjectType(type) && nodeName == 'assert') {
          // assert는 단독 함수로도 존재하고 ok, equal등을 가지는 오브젝트로도 존재하기 때문에 별도 처리가 필요하다.
          const type = new FunctionTypeDescriptor()
          type.changeReturnType(new VoidTypeDescriptor())
          type.addParameterType({
            name: 'value',
            type: new AnyTypeDescriptor(),
            spread: false,
            nullable: false,
          })
          // message parameter는 optional이다.
          type.addParameterType({
            name: 'message',
            type: new AnyTypeDescriptor(),
            spread: false,
            nullable: true,
          })
          funcType = type
        } else gather.add('error5', `'${nodeName}'s type: ${chalk.green(type.toString())}`)
      }

      // 인수 t에 Generic이 있으면 t가 실제 어떤 타입이어야 하는지를 g를 통해 판단한다.
      const replace = (
        t: TypeDescriptor,
        g: {
          name: string
          type: TypeDescriptor
        }[]
      ) => {
        if (TypeSystem.isGenericType(t)) {
          const m = g.find(e => e.name == t.name)
          return m?.type || new AnyTypeDescriptor()
        } else if (TypeSystem.isArrayType(t)) {
          if (TypeSystem.isGenericType(t.elementType)) return new ArrayTypeDescriptor(g[0].type)
          else return new ArrayTypeDescriptor(t.elementType)
        } else if (TypeSystem.isFunctionType(t)) {
          const desc = new FunctionTypeDescriptor()
          desc.changeReturnType(replace(t.returnType, g))
          t.parameters.forEach(p => {
            const type = replace(p.type, g)
            desc.addParameterType({
              name: p.name,
              type,
              spread: p.spread,
              nullable: p.nullable,
              defaultValue: p.defaultValue,
            })
          })
          return desc
        } else return t
      }

      // 어떤 경우이든지 funcType에 추론된 함수의 타입이 저장되는데 generic이 있으면 실제 타입으로 변환해 준다.
      if (funcType) {
        if (TypeSystem.isAnyType(funcType)) {
          gather.add('funcType', funcType.toString())
          exitLog(log, funcType)
          return funcType
        } else if (TypeSystem.isFunctionType(funcType)) {
          const newType = replace(funcType, generic)
          if (TypeSystem.isFunctionType(newType)) {
            gather.add('newType', newType.toString())
            exitLog(log, newType)
            return newType
          } else gather.add('error6', 'newType is not function type')
        }
      }
      gather.add('error7', 'funcType must be any or function type')
    }
    // Binding 되어진 람다 함수 처리 부분
    else if (ast.isBinding(node)) {
      // Binding 내부에 Binding이 포함될 수 있다.
      // 따라서 findBindingRootDef()는 중첩된 Binding을 따라가면서 Binding이 정의된 definition을 찾는다.
      // 간단히 아래와 같이 한번만 Binding되어진 경우는 비교적 간단하다.
      // var prompt: ChainPrompt = {
      //   prompt: (options) => { return options }
      // }
      // 이 경우는 인수로 전달되는 node는 prompt: (options) => { return options } 으로
      // options의 타입을 추론하기 위해서는 inferTypeParameter()에서 options의 $container.$container인
      // (여기서는 FunctionValue의 container인 Binding임)을 이 함수에 전달하고 다시 그것의 container가
      // 변수 선언인 경우이다.
      // 하지만 다음과 같이 상위 노드가 또 다른 Binding인 경우에는
      // nextChain: {
      //   prompt: (options) => { return options }
      // }
      // node에서 시작해서 VariableDef가 나올때까지 node의 타입이 무엇인지를 검사해야 한다.
      // 상위 노드로 가면 node는 달라질 수 있다. 즉 위에서 처음 시작은 prompt이지만
      // prompt를 포함하는 상위 binding의 이름이 nextChain이면
      // 다음번 찾기는 nextChain으로 찾는다는 의미이다.
      const findBindingRootDef = (node: AstNode): TypeDescriptor | undefined => {
        const property = ast.isBinding(node) ? node.element : ''
        if (!property) {
          console.error(chalk.red('findBindingRootDef: property is null'))
          return undefined
        }

        const object = AstUtils.getContainerOfType(node, ast.isObjectValue)
        if (object && object.$container) {
          if (ast.isVariableDef(object.$container)) {
            const container = object.$container
            const containerType = TypeSystem.inferType(container)
            gather.add('fd.container.$type', container.$type)
            gather.add('fd.container.type', containerType.toString())
            // 해당 Binding이 소속된 ObjectDef를 찾아서 해당 항목의 타입을 찾아야 한다.
            if (TypeSystem.isObjectType(containerType)) {
              return containerType.getElementType(property)
            }
          } else if (ast.isBinding(object.$container)) {
            const result = findBindingRootDef(object.$container)
            if (result && TypeSystem.isObjectType(result)) {
              return result.getElementType(property)
            } else gather.add('error10', 'find-bind is not valid')
          } else gather.add('error11', 'container is not valid')
        } else gather.add('error12', 'object is not found')
        return undefined
      }

      const propType = findBindingRootDef(node)
      gather.add('propType', propType?.toString())
      if (propType && TypeSystem.isFunctionType(propType)) {
        // propType.showDetailInfo()
        return propType
      } else gather.add('error8', 'propType is not function type')
    } else gather.add('error9', 'node is invalid')

    gather.show()
    exitLog(log)
    return undefined
  }
}
