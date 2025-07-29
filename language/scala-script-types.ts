import { AstNode, AstUtils } from 'langium'
import * as ast from './generated/ast.js'
import { ScalaScriptCache, LogGatherer, enterLog, exitLog, traceLog, reduceLog } from '../language/scala-script-util.js'
import assert from 'assert'
import chalk from 'chalk'

/**
 * TypeDescriptor는 타입에 대한 정보를 저장, 표시하고 비교하는 역할을 담당한다.
 * 타입을 추론하는 것은 추론기(Inferer)인 TypeSystem에서 담당한다.
 *
 * TypeDescriptor 클래스 계층 구조
 *
 * TypeDescriptor
 * - AnyTypeDescriptor
 * - NilTypeDescriptor
 * - VoidTypeDescriptor
 * - StringTypeDescriptor
 * - NumberTypeDescriptor
 * - BooleanTypeDescriptor
 * - GenericTypeDescriptor
 * - UnionTypeDescriptor
 * - ArrayTypeDescriptor
 * - FunctionTypeDescriptor
 * - ObjectTypeDescriptor
 * - ClassTypeDescriptor
 * - ErrorTypeDescriptor
 *
 * TypeDescriptor 클래스 계층 구조는 다음과 같은 특징을 가진다.
 * - 모든 타입은 TypeDescriptor에서 상속되며 생성자에서 고유의 $type 속성값을 가져야 한다.
 * - 모든 타입은 자신의 필요에 따라 toString(), showDetailInfo(), isEqual(), checkAssignableTo(), compareTo() 메소드를 재정의한다.
 *
 * TypeSystem 클래스와 완전히 독립된 구조로 하고 싶었지만 TypeSystem의 inferType() 메소드등을 일부 사용하고 있다.
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

  // this를 other에 assignment할 수 있는지를 판단한다.
  // assignment 여부에만 관심이 있으면 이 함수를 사용한다.
  // 그러면 이 함수에서 직접 checkAssignableTo를 호출하고 그 결과를 boolean으로 리턴해 준다.
  // 하지만 assign이 안될 때 그 이유도 처리해야 하는 경우라면 checkAssignableTo를 직접 호출해야 한다.
  isAssignableTo(other: TypeDescriptor): boolean {
    if (this.checkAssignableTo(other).length == 0) return true
    return false
  }

  // checkAssignableTo()는 다른 타입과의 기본적인 assignment 처리를 구현하고 있지만
  // 파생 클래스에서 특정 타입에 대해서 추가적인 처리가 필요한 경우에는 이 함수를 오버라이드한다.
  // 여기서 파생 클래스에 해당하는 any, union에 대한 처리가 있는 것은 좋지 못하지만
  // 많은 파생 클래스의 공통적인 처리에 해당하므로 여기서 구현하는 것으로 한다.
  checkAssignableTo(other: TypeDescriptor): string[] {
    if (this.$type == 'any' || other.$type == 'any') return []
    if (other.$type == 'union') {
      const otherUnion = other as UnionTypeDescriptor
      // this가 otherUnion의 elementTypes 중에서 하나라도 assign 가능하면 assignable로 판단한다.
      if (otherUnion.elementTypes.some(e => this.isAssignableTo(e))) return []
      else return [`Assigned union '${otherUnion.toString()}' don't have this type '${this.toString()}'`]
    }
    if (this.$type == other.$type) {
      return this.compareTo(other)
    }
    return [`Type '${this.toString()}' is not assignable to type '${other.toString()}'`]
  }

  // 파생 클래스에서 자신과 동일한 타입에 대한 assignment 여부를 판단하기 위한 추상함수 성격의 함수이다.
  // 기본적인 파생 클래스들을 위해서 isEqual()을 사용하는 기본 코드가 구현되어 있다.
  compareTo(other: TypeDescriptor): string[] {
    if (this.isEqual(other)) return []
    return [`Type '${this.toString()}' is not equal '${other.toString()}'`]
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
 * Represents a type descriptor for string types.
 *
 * @property $type - A constant string value indicating the type, which is always 'string'.
 * @param node - An optional AST expression associated with the string type.
 */
export class StringTypeDescriptor extends TypeDescriptor {
  constructor(public node?: ast.Expression) {
    super('string')
  }
}

/**
 * Represents a type descriptor for numbers in the ScalaScript language.
 *
 * @property $type - A constant string value indicating the type, which is always 'number'.
 * @param node - An optional AST expression associated with the number type.
 */
export class NumberTypeDescriptor extends TypeDescriptor {
  constructor(public node?: ast.Expression) {
    super('number')
  }
}

/**
 * Represents a type descriptor for boolean values.
 *
 * @property $type - A constant string value indicating the type, which is always 'boolean'.
 * @param node - An optional AST expression associated with the boolean type.
 */
export class BooleanTypeDescriptor extends TypeDescriptor {
  constructor(public node?: ast.Expression) {
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
  elementTypes: TypeDescriptor[] = []

  constructor(types: TypeDescriptor[]) {
    super('union')
    this.elementTypes = this.normalize(types)
  }

  override toString(): string {
    return `${this.$type}(${this.elementTypes.map(t => t.toString()).join(' | ')})`
  }

  override isEqual(other: TypeDescriptor): boolean {
    if (other.$type !== 'union') return false
    const otherUnion = other as UnionTypeDescriptor
    // Union 타입은 순서가 중요하지 않다.
    const set1 = this.normalize(this.elementTypes)
    const set2 = this.normalize(otherUnion.elementTypes)
    return set1.length == set2.length && set1.every(value => set2.find(e => value.isEqual(e)))
  }

  /**
   * union type을 구성하는 타입 중에 하나라도 other에 할당 가능한 타입이 있으면 true를 리턴한다.
   * 이것은 다음과 같은 경우를 가능하게 하기 위한 것이다.
   * var u: string | number
   * if (typeof u == 'number') n = u else s = u
   */
  override checkAssignableTo(other: TypeDescriptor): string[] {
    const errors: string[] = []
    if (other.$type == 'any') return []
    if (other.$type == 'union') {
      const otherUnion = other as UnionTypeDescriptor
      // this.elementType 중에 하나라도 other에 포함되어 있으면 assignable이다.
      if (this.elementTypes.some(e => otherUnion.isContain(e))) return []
      else errors.push(`Assigned union '${otherUnion.toString()}' don't have this type '${this.toString()}'`)
    } else {
      if (this.elementTypes.some(e => e.isEqual(other))) return []
      else errors.push(`Type '${this.toString()}' is not equal '${other.toString()}'`)
    }
    return errors
  }

  isContain(type: TypeDescriptor): boolean {
    return this.elementTypes.some(e => e.isEqual(type))
  }

  /**
   * Returns an array of unique `TypeDescription` objects by removing duplicates.
   *
   * @param types - An array of `TypeDescription` objects to be normalized.
   * @returns An array of unique `TypeDescription` objects.
   */
  normalize(types: TypeDescriptor[]): TypeDescriptor[] {
    // 새로운 타입과 기존의 타입들이 호환되는지 확인한다.
    // 새로운 타입이 기존의 타입들에 포함되면 true를 리턴하는데 이는 새로운 타입을 추가할 필요가 없다는 의미이다.
    // any type은 모든 타입으로 변환될 수 있으므로 제거한다.
    const compatibleType = (nt: TypeDescriptor, set: TypeDescriptor[]) => {
      if (set.some(e => nt.isEqual(e))) return true

      // nil type도 매우 빈번하게 발생하고 null check를 제외하면 처리에 큰 영향을 주지 않으므로 일단 제거한다.
      if (nt.$type == 'any') return true
      else if (nt.$type == 'nil') return true
      else if (nt.$type == 'array') {
        let found = false
        set.forEach(e => {
          if (e.$type == 'array') {
            if ((nt as ArrayTypeDescriptor).elementType.isEqual((e as ArrayTypeDescriptor).elementType)) found = true
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
      if (t.$type == 'union') spread.push(...(t as UnionTypeDescriptor).elementTypes)
      else spread.push(t)
    })

    // spread에 any type이 있으면 전체 타입은 any type이 된다.
    if (spread.some(e => e.$type == 'any')) return [new AnyTypeDescriptor()]

    const set: TypeDescriptor[] = []
    spread.forEach(e => {
      if (!compatibleType(e, set)) set.push(e)
    })
    return set
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
    return `${this.elementType.toString()}[]`
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

  /**
   * Compares this `TypeDescriptor` to another `TypeDescriptor` and returns an array of strings
   * representing the differences or issues found during the comparison.
   *
   * @param other - The other `TypeDescriptor` to compare against.
   * @returns An array of strings detailing the differences or issues found.
   */
  override compareTo(other: TypeDescriptor): string[] {
    const otherArray = other as ArrayTypeDescriptor
    return this.elementType.checkAssignableTo(otherArray.elementType)
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
  returnType: TypeDescriptor = new VoidTypeDescriptor()
  parameters: FunctionParameter[] = []
  generic: GenericTypeDescriptor[] = []

  /**
   * Constructs a new instance of the class.
   *
   * FunctionTypeDescriptor는 returnType, parameters, generic의 정보를 필요로 하는데
   * 이 정보들을 여기 생성자에서 추론할 수 있지만 TypeSystem과의 결합성을 줄이고 TypeDescriptor로 한정하기 위해서
   * 여기서 추론하지 않는다. 이 정보들은 FunctionDescriptor가 생성되어진 이후에 TypeSystem의 createFunctionType()에서
   * 설정하며 TypeSystem은 이 개체의 설정에 대해서 책임을 진다.
   *
   * @param node - An optional parameter that can be of type `ast.FunctionDef`, `ast.FunctionType`, or `ast.FunctionValue`.
   */
  constructor(node?: ast.FunctionDef | ast.FunctionType | ast.FunctionValue) {
    super('function')
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
   * Compares this `TypeDescriptor` with another `TypeDescriptor`.
   *
   * @param other - The other `TypeDescriptor` to compare with.
   * @returns An array of error messages if the types are not assignable, otherwise an empty array.
   *
   * The comparison checks the following:
   * - If the return types are assignable.
   * - If either function has spread parameters, type checking is skipped.
   * - For each parameter:
   *   - If the parameter is not nullable and has no default value, it must exist in the other function and be assignable.
   *   - If the parameter is nullable or has a default value, it does not need to exist in the other function, but if it does, it must be assignable.
   */
  override compareTo(other: TypeDescriptor): string[] {
    const otherFunction = other as FunctionTypeDescriptor
    const result = this.returnType.checkAssignableTo(otherFunction.returnType)
    if (result.length > 0) {
      return result
    }
    if (this.parameters.find(p => p.spread) || otherFunction.parameters.find(p => p.spread)) {
      // spread가 있으면 타입 체크를 하지 않는다.
      return []
    }

    const getOtherParam = (index: number) => {
      if (index >= otherFunction.parameters.length) return undefined
      return otherFunction.parameters[index].type
    }

    let errors: string[] = []
    // 파라미터가 없는 경우도 고려해야 한다.
    // 다른 함수에서도 파라미터가 없거나 nullable, default가 있는 것만 있어야 한다.
    if (this.parameters.length == 0) {
      if (otherFunction.parameters.length == 0) return []
      else {
        if (otherFunction.parameters.filter(p => !(p.nullable || p.defaultValue))) return ['parameter does not matched']
        return errors
      }
    }

    this.parameters.forEach((p, i) => {
      // nullable이나 defaultValue가 없는 파라미터는 다른 함수에서도 존재해야 한다.
      if (!(p.nullable || p.defaultValue)) {
        const otherParam = getOtherParam(i)
        if (!otherParam) {
          errors.push('otherParam does not exist')
        } else {
          const result = p.type.checkAssignableTo(otherParam)
          if (result.length > 0) {
            errors = errors.concat(result)
          }
        }
      } else {
        // 다른 함수에서 이 파라미터가 없어도 되지만 있다면 타입이 같아야 한다.
        const otherParam = getOtherParam(i)
        if (otherParam) {
          const result = p.type.checkAssignableTo(otherParam)
          if (result.length > 0) {
            errors = errors.concat(result)
          }
        }
      }
    })
    return errors
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
 * @property {ast.ObjectType | ast.ObjectValue} node - The literal representation of the object type.
 */
export class ObjectTypeDescriptor extends TypeDescriptor {
  /**
   * Constructs an instance of the object with the given AST node.
   *
   * @param node - The AST node which can be of type `ObjectType`, or `ObjectValue`.
   */
  constructor(public node: ast.ObjectType | ast.ObjectValue) {
    super('object')
  }

  /**
   * Returns a string representation of the object.
   *
   * @override
   * @returns {string} If the node is an object definition, returns the name of the node.
   *                   Otherwise, returns a string representation of the element list in the format '{ name1, name2, ... }'.
   */
  override toString(): string {
    const names = this.getElementList().map(e => e.name)
    return '{ ' + names.join(', ') + ' }'
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
    if (!(other.$type == 'object' || other.$type == 'class')) return false
    if (other.$type == 'object') {
      const otherObject = other as ObjectTypeDescriptor
      const otherElements = otherObject.getElementList()
      if (this.getElementList().length != otherElements.length) {
        console.log(chalk.red('개수가 다름:'), this.getElementList().length, otherElements.length)
        return false
      }
      for (let e of this.getElementList()) {
        const result = otherObject.hasElement(e.name, e.node, 'isEqual')
        if (result) return false
      }
    } else if (other.$type == 'class') {
      const otherClass = other as ClassTypeDescriptor
      for (let e of this.getElementList()) {
        const result = otherClass.hasElement(e.name, e.node, 'isEqual')
        if (result) return false
      }
    }
    return true
  }

  /**
   * Checks if the current type descriptor is assignable to another type descriptor.
   *
   * @param other - The other type descriptor to check against.
   * @returns An array of error messages if the current type is not assignable to the other type, otherwise an empty array.
   *
   * This method overrides the base implementation to provide specific logic for checking
   * assignability to a class type. If the other type is a class, it verifies that all elements
   * in the current type exist in the other class and that their types are compatible.
   *
   * - If an element in the current type does not exist in the other class, an error message is added.
   * - If an element exists but its type is not assignable to the corresponding element in the other class, an error message is added.
   *
   * If the other type is not a class, the method delegates to the base implementation.
   */
  override checkAssignableTo(other: TypeDescriptor): string[] {
    // ObjectValue는 Class에 assignable이 가능하다.
    if (other.$type == 'class') {
      const otherClass = other as ClassTypeDescriptor
      const errors: string[] = []
      for (let e of this.getElementList()) {
        const result = otherClass.hasElement(e.name, e.node, 'isAssignableTo')
        if (result) errors.push(result)
      }
      return errors
    }
    return super.checkAssignableTo(other)
  }

  /**
   * Compares the current `TypeDescriptor` with another `TypeDescriptor` and returns an array of error messages if there are discrepancies.
   *
   * @param other - The `TypeDescriptor` to compare with.
   * @returns An array of error messages indicating the differences between the two `TypeDescriptor` objects.
   *
   * The comparison checks for the following:
   * - If an element in the current `TypeDescriptor` does not exist in the other `TypeDescriptor`, an error message is added.
   * - If an element with the same name exists in both `TypeDescriptor` objects but their types are different, an error message is added.
   */
  override compareTo(other: TypeDescriptor): string[] {
    const otherObject = other as ObjectTypeDescriptor
    const errors: string[] = []
    for (let e of this.getElementList()) {
      const result = otherObject.hasElement(e.name, e.node, 'isAssignableTo')
      if (result) errors.push(result)
    }
    return errors
  }

  /**
   * Retrieves a list of elements from the current node.
   *
   * @returns An array of objects, each containing the name and node of the element.
   */
  getElementList() {
    const list: {
      name: string
      node: ast.Property | ast.Binding
    }[] = []
    if (ast.isObjectType(this.node)) {
      this.node.elements.forEach(e => {
        if (!ast.isBypass(e)) list.push({ name: e.name, node: e })
      })
    } else if (ast.isObjectValue(this.node)) {
      this.node.elements.forEach(e => {
        if (e.name && e.value) {
          list.push({ name: e.name, node: e })
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
   * Checks if an element with the given name exists in the element list and verifies its type.
   *
   * @param name - The name of the element to check.
   * @param node - The AST node associated with the element.
   * @param checkingType - The type of check to perform: 'isEqual' or 'isAssignableTo'.
   * @returns A string indicating an error message if the element does not exist or if the types are different, otherwise undefined.
   */
  hasElement(name: string, node: AstNode, checkingType: 'isEqual' | 'isAssignableTo'): string | undefined {
    const found = this.getElementList().find(e => e.name == name)
    if (!found) return `Element '${name}' does not exist`

    // 동일한 이름이 있으면 타입도 같아야 한다.
    const t1 = TypeSystem.inferType(node).actual
    const t2 = TypeSystem.inferType(found.node).actual
    const result = checkingType == 'isEqual' ? t1.isEqual(t2) : t1.isAssignableTo(t2)
    if (!result) return `Element '${name}'s types are different(${t1.toString()}, ${t2.toString()})`
    return undefined
  }
}

/**
 * Represents a description of an class type in the ScalaScript language.
 *
 * This class extends the `TypeDescription` class and provides additional functionality
 * for handling class types, including generic types and element lists.
 *
 * @extends TypeDescriptor
 * @property {string} $type - The type identifier, which is always 'class'.
 * @property {ast.ClassDef} node - The literal representation of the class type.
 */
export class ClassTypeDescriptor extends TypeDescriptor {
  generic: GenericTypeDescriptor[]

  /**
   * Constructs an instance of the class with the given AST node.
   *
   * @param node - The AST node which can be of type `ClassDef`.
   *
   * If the node is of type `ClassDef`, the `generic` property is populated with an array of
   * `GenericTypeDescription` instances created from the generic types defined in the node.
   */
  constructor(public node: ast.ClassDef) {
    super('class')
    // 여기서 설정되는 generic은 generic의 선언이다. generic의 실제 타입은 NewExpression에서만 정의할 수 있다.
    this.generic = node.generic?.types.map(name => new GenericTypeDescriptor(name)) ?? []
  }

  /**
   * Returns a string representation of the class.
   *
   * @override
   * @returns {string} returns the name of the class.
   */
  override toString(): string {
    return this.node.name
  }

  /**
   * Checks if the current `TypeDescription` is equal to another `TypeDescription`.
   *
   * @param other - The other `TypeDescription` to compare with.
   * @returns `true` if the types are considered equal, `false` otherwise.
   *
   * The comparison is based on the following criteria:
   * - If the `other` type is not an class, returns `false`.
   * - If both types are class definitions, their names must be the same.
   */
  override isEqual(other: TypeDescriptor): boolean {
    if (other.$type !== 'class') return false
    const otherClass = other as ClassTypeDescriptor
    //todo 이름만 같으면 같다고 할 수 있을까?
    if (this.node.name !== otherClass.node.name) return false
    return true
  }

  /**
   * Compares this `TypeDescriptor` with another `TypeDescriptor` to determine if they are assignable.
   *
   * @param other - The other `TypeDescriptor` to compare against.
   * @returns An empty array if the types are assignable, otherwise an array containing an error message.
   *
   * The comparison checks if both `TypeDescriptor` instances represent class definitions. If they do,
   * it verifies if the class represented by this instance is in the class chain of the other class.
   * If the class is in the chain, it returns an empty array indicating they are assignable.
   * Otherwise, it returns an array with an error message indicating the classes are not in a parent-child relationship.
   *
   * If the nodes are not class definitions, it returns an array with an internal error message.
   */
  override compareTo(other: TypeDescriptor): string[] {
    const otherClass = other as ClassTypeDescriptor
    // 동일하거나 상속관계인 경우(자식이 부모 클래스에)만 assignable이다.
    const classChain = TypeSystem.getClassChain(this.node)
    // if (classChain.includes(otherClass.node)) return []
    if (classChain.find(e => e.name == otherClass.node.name)) return []
    else {
      const classChainNames = classChain.map(c => c.name).join(', ')
      return [`Object ${otherClass.toString()} is not super class of ${this.toString()} in class chain [${classChainNames}]`]
    }
  }

  /**
   * Retrieves a list of elements from the current node.
   *
   * @returns An array of objects, each containing the name and node of the element.
   */
  getElementList() {
    const list: {
      name: string
      node: ast.VariableDef | ast.FunctionDef | ast.ClassDef
    }[] = []
    this.node.body.elements.forEach(e => {
      if (!ast.isBypass(e)) list.push({ name: e.name, node: e })
    })
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
    this.node.body.elements.forEach(e => {
      if (!ast.isBypass(e) && e.name == elementName) {
        type = TypeSystem.inferType(e).actual
      }
    })
    return type
  }

  /**
   * Checks if an element with the given name exists in the element list and verifies its type.
   *
   * @param name - The name of the element to check.
   * @param node - The AST node associated with the element.
   * @param checkingType - The type of check to perform: 'isEqual' or 'isAssignableTo'.
   * @returns A string indicating an error message if the element does not exist or if the types are different, otherwise undefined.
   */
  hasElement(name: string, node: AstNode, checkingType: 'isEqual' | 'isAssignableTo'): string | undefined {
    const found = this.getElementList().find(e => e.name == name)
    if (!found) return `Element '${name}' does not exist`

    // 동일한 이름이 있으면 타입도 같아야 한다.
    const t1 = TypeSystem.inferType(node).actual
    const t2 = TypeSystem.inferType(found.node).actual
    const result = checkingType == 'isEqual' ? t1.isEqual(t2) : t1.isAssignableTo(t2)
    if (!result) return `Element '${name}'s types are different(${t1.toString()}, ${t2.toString()})`
    return undefined
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
 * Options for inferring types in ScalaScript.
 *
 * @property {Map<AstNode, InferResult>} [cache] - A map to cache type descriptors for AST nodes.
 */
export type InferOptions = {
  cache?: Map<AstNode, InferResult>
}

/**
 * Represents the result of an inference operation.
 *
 * 타입을 추론할 때는 context가 중요하다.
 * 예를들어 `var n: number = f()`는 `f`의 타입이 `() -> number` 라는 것이 중요한 것이 아니라
 * number를 리턴한다는 것이 중요하다. 하지만 좌변에 있을 경우에는 예를 들어 `var f: () -> number`와 같은 경우에는
 * f의 타입은 `number`가 아니라 `() -> number` 이어야 한다.
 *
 * 이와 같은 차이는 값을 사용하는 것인지 아니면 형식을 사용하는 것인지에 달려있다.
 * 즉 첫번째 경우처럼 함수를 호출하는 경우는 함수의 값을 사용하므로 함수의 리턴 타입이 중요하고
 * 두번째 경우처럼 f의 형식을 참조하는 경우는 함수 자체의 타입이 중요하다.
 *
 * 이러한 차이를 지원하기 위해서 InferResult에는 동일한 node를 추론한 결과를
 * actual과 formal로 구분하고 모두 제공하는 것으로 처리하고 있다.
 *
 * 두 가지 모두 지원해야 하는 경우는 대입문, 함수등이 있다.
 * 그 외에는 actual, formal 모두 동일하다.
 *
 * @typedef {Object} InferResult
 * @property {TypeDescriptor} actual - The actual type descriptor inferred.
 * @property {TypeDescriptor} [formal] - The formal type descriptor, if available.
 */
export type InferResult = {
  // 값에 근거하는 실제적인 타입
  actual: TypeDescriptor
  // 형식에 근거하는 타입
  formal?: TypeDescriptor
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
    const union = new UnionTypeDescriptor(types)
    if (union.elementTypes.length == 0) return new ErrorTypeDescriptor('no types in union')
    else if (union.elementTypes.length == 1) return union.elementTypes[0]
    else return union
  }

  /**
   * Creates a new `FunctionTypeDescriptor` instance from the given AST node.
   *
   * @param node - The AST node representing a function definition, function type, or function value.
   * @returns A new `FunctionTypeDescriptor` instance.
   */
  static createFunctionType(node: ast.FunctionDef | ast.FunctionType | ast.FunctionValue): FunctionTypeDescriptor {
    const log = enterLog('createFunctionType', node, `${chalk.green(node?.$type)}`)

    const type = new FunctionTypeDescriptor(node)

    // 명시된 리턴 타입이 있으면 이를 근거로 한다.
    // 명시된 리턴 타입이 없으면 함수의 바디를 근거로 한다.
    // 명시된 리턴 타입도 없고 함수의 바디도 없으면 void type으로 간주한다
    type.returnType = new VoidTypeDescriptor()
    if (node.returnType) type.returnType = this.inferType(node.returnType).actual
    else if ((ast.isFunctionDef(node) || ast.isFunctionValue(node)) && node.body)
      type.returnType = this.inferType(node.body).actual
    traceLog(`* return type: ${type.returnType.toString()}`)

    type.parameters = node.params.map(e => ({
      name: e.name,
      type: this.inferType(e).actual,
      spread: e.spread,
      nullable: e.nullable,
      defaultValue: e.value,
    }))
    traceLog('* parameter type: count is', type.parameters.length)

    // ClassDef, FunctionDef에서 정의되어진 것들은 디폴트로 AnyTypeDescritption을 가지고 있다가
    // NewExpression에서 실제 타입으로 대체된다.
    if (ast.isFunctionDef(node)) {
      type.generic = node.generic?.types.map(name => new GenericTypeDescriptor(name)) ?? []
    }

    exitLog(log, type)
    return type
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
   * Determines if the given `TypeDescription` item is of type `ClassTypeDescription`.
   *
   * @param item - The `TypeDescription` item to check.
   * @returns A boolean indicating whether the item is a `ClassTypeDescription`.
   */
  static isClassType(item: TypeDescriptor): item is ClassTypeDescriptor {
    return item.$type === 'class'
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
   * @param options - Optional inference options that may influence the type inference process.
   * @returns An object containing the inferred type as both `actual` and `formal` properties.
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
  static inferType(node: AstNode | undefined, options?: InferOptions): InferResult {
    const log = enterLog('inferType', undefined, `${chalk.green(node?.$type)}, '${reduceLog(node?.$cstNode?.text)}'`)

    if (!node) {
      const type = new ErrorTypeDescriptor('Could not infer type for undefined', node)
      exitLog(log, type, 'Exit(node is undefined)')
      return { actual: type, formal: type }
    }

    let existing: InferResult | undefined
    if (options?.cache) {
      existing = options.cache.get(node)
    } else {
      existing = ScalaScriptCache.get(node)
    }
    if (existing) {
      exitLog(log, existing.actual, 'Exit(node is cached)')
      return existing
    }

    // Prevent recursive inference errors
    if (options?.cache) {
      options.cache.set(node, { actual: new ErrorTypeDescriptor('Recursive definition', node) })
    } else {
      ScalaScriptCache.set(node, { actual: new ErrorTypeDescriptor('Recursive definition', node) })
    }

    let result: InferResult | undefined

    if (ast.isTypes(node)) {
      result = this.inferTypeTypes(node, options)
    } else if (ast.isSimpleType(node)) {
      // Types와 SimpleType은 분리되어져 있다.
      // SimpleType은 ArrayType | ObjectType | ... 와 같이 타입들의 단순한 집합이지만
      // Types는 types+=SimpleType ('|' types+=SimpleType)*와 같이 SimpleType의 배열이다.
      // 일례로 RefType은 SimpleType이긴 하지만 Types는 아니다.
      result = this.inferTypeSimpleType(node, options)
    } else if (ast.isVariableDef(node)) {
      result = this.inferTypeVariableDef(node, options)
    } else if (ast.isFunctionDef(node)) {
      result = this.inferTypeFunctionDef(node, options)
    } else if (ast.isClassDef(node)) {
      result = this.inferTypeClassDef(node, options)
    } else if (ast.isCallChain(node)) {
      result = this.inferTypeCallChain(node, options)
    } else if (ast.isParameter(node)) {
      result = this.inferTypeParameter(node, options)
    } else if (ast.isProperty(node)) {
      result = this.inferTypeProperty(node, options)
    } else if (ast.isBinding(node)) {
      result = this.inferTypeBinding(node, options)
    } else if (ast.isForOf(node)) {
      result = this.inferTypeForOf(node, options)
    } else if (ast.isForTo(node)) {
      result = this.inferTypeForTo(node, options)
    } else if (ast.isAssignment(node)) {
      result = this.inferTypeAssignment(node, options)
    } else if (ast.isIfExpression(node)) {
      result = this.inferTypeIfExpression(node, options)
    } else if (ast.isMatchExpression(node)) {
      result = this.inferTypeMatchExpression(node, options)
    } else if (ast.isGroupExpression(node)) {
      result = this.inferTypeGroupExpression(node, options)
    } else if (ast.isUnaryExpression(node)) {
      result = this.inferTypeUnaryExpression(node, options)
    } else if (ast.isBinaryExpression(node)) {
      result = this.inferTypeBinaryExpression(node, options)
    } else if (ast.isReturnExpression(node)) {
      result = this.inferTypeReturnExpression(node, options)
    } else if (ast.isSpreadExpression(node)) {
      result = this.inferTypeSpreadExpression(node, options)
    } else if (ast.isNewExpression(node)) {
      result = this.inferTypeNewExpression(node, options)
    } else if (ast.isArrayValue(node)) {
      result = this.inferTypeArrayValue(node, options)
    } else if (ast.isObjectValue(node)) {
      result = this.inferTypeObjectValue(node, options)
    } else if (ast.isFunctionValue(node)) {
      result = this.inferTypeFunctionValue(node, options)
    } else if (ast.isCatchClause(node)) {
      result = this.inferTypeCatchClause(node, options)
    } else if (ast.isLiteral(node)) {
      result = this.inferTypeLiteral(node, options)
    } else if (ast.isBlock(node)) {
      result = this.inferTypeBlock(node, options)
    }

    if (!result) {
      result = { actual: new ErrorTypeDescriptor('Could not infer type for ' + node.$type, node) }
    }

    // for debugging...
    if (this.isErrorType(result.actual)) {
      console.error(chalk.red('inferType Error:'), `${result.actual.toString()}, '${node.$cstNode?.text}'`)
    }

    if (options?.cache) {
      options.cache.set(node, result)
    } else {
      ScalaScriptCache.set(node, result)
    }
    exitLog(log, result?.actual)
    // console.log(chalk.yellow(`inferType(${node.$type}): ${result?.actual.toString()}, ${result?.formal?.toString()}`))
    return result
  }

  /**
   * Infers the type of the given AST node and returns a TypeDescription.
   *
   * @param node - The AST node representing the types to infer.
   * @param options - Optional inference options that may influence the type inference process.
   * @returns An object containing the inferred type as both `actual` and `formal` properties.
   *
   * The function processes the types within the node and simplifies the result:
   * - If there are no types, it returns an error type.
   * - If there is only one type, it returns that type.
   * - If there are multiple types, it returns a union type.
   */
  static inferTypeTypes(node: ast.Types, options?: InferOptions): InferResult {
    const log = enterLog('inferTypeTypes', node)
    const al = node.types.map(t => this.inferType(t, options).actual)
    const fl = node.types.map(t => this.inferType(t, options).formal ?? this.inferType(t, options).actual)
    // 실제 Union 타입이 아니면 처리를 단순화하기 위해 개별 타입으로 리턴한다.
    const actual = this.createUnionType(al)
    const formal = this.createUnionType(fl)
    exitLog(log, actual)
    return { actual, formal }
  }

  /**
   * Infers the type of a given SimpleType node.
   *
   * @param node - The SimpleType node to infer the type for.
   * @param options - Optional inference options that may influence the type inference process.
   * @returns An object containing the inferred type as both `actual` and `formal` properties.
   *
   * This function determines the type of the provided SimpleType node by checking its specific kind.
   * It handles array types, object types, function types, primitive types, and reference types.
   * If the type cannot be determined, it returns an error type.
   */
  static inferTypeSimpleType(node: ast.SimpleType, options?: InferOptions): InferResult {
    const log = enterLog('inferTypeSimpleType', node)
    let type: TypeDescriptor = new ErrorTypeDescriptor('internal error', node)
    if (ast.isArrayType(node)) {
      type = new ArrayTypeDescriptor(this.inferType(node.elementType, options).actual)
    } else if (ast.isObjectType(node)) {
      type = new ObjectTypeDescriptor(node)
    } else if (ast.isFunctionType(node)) {
      type = this.createFunctionType(node)
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
    } else if (ast.isRefType(node)) {
      traceLog('Type is reference')
      if (node.reference.ref) {
        const ref = node.reference.ref
        if (ast.isClassDef(ref)) {
          type = new ClassTypeDescriptor(ref)
        }
      }
      if (this.isErrorType(type)) {
        // type 중에 ref가 없는 것은 Generic일 가능성이 있다.
        // 이 부분은 타입을 추론하는 과정에서 호출되는 것이다.
        // 따라서 `val goods: Goods[]`와 같이 타입이 명확한 구문에서는 호출되지 않는다.
        // 오히려 `goods.every(...)`와 같이 결국은 generic을 포함하는 함수까지 추론하게 되는 그런 구문들에서 호출된다.
        // 즉 위의 구문이 처리되면서 `every()`함수에 있는 `T`라는 제네릭을 처리할때 이 부분이 호출되는 것이다.
        const container = AstUtils.getContainerOfType(node, ast.isClassDef)
        if (container && container.generic?.types.includes(node.reference.$refText)) {
          type = new GenericTypeDescriptor(node.reference.$refText)
        } else console.error(chalk.red(`${node.reference.$refText} is not valid type`))
      }
    }
    exitLog(log, type)
    return { actual: type, formal: type }
  }

  /**
   * Infers the type of a variable definition node.
   *
   * 타입이 명시되어진 경우라도 값에서 더 유용한 타입을 추론할 수 있다.
   * 예를 들면 명시된 타입이 union인 경우 실제 값의 타입이 union 자체보다 유용하다.
   * 하지만 항상 그런 것은 아니다. 값의 타입이 any인 경우나 유효하지 않은 경우에는 명시된 타입을 더 유용하다.
   *
   * 값의 타입을 추론하는 것은 신중하게 처리되어야 한다. 왜냐하면 값으로 방대하고 복잡한 오브젝트가
   * 올 수도 있는데 때때로 이것은 recursive definition을 유발할 수도 있기 때문이다.
   * ```
   * val 보유기술: ChainPrompt = {
   *   prompt: '추가할 기술?'
   *   callback: (corp, options) => { console.log(corp.name, options) }
   *   nextChain: { prompt: '기술수준?' }
   * }
   * ```
   * 위 코드에서 `corp.name`에서 `corp`의 타입을 추론하려고 parameter인 `corp`를 추론하려고 하는데
   * 이 parameter `corp`는 `callback`을 알아야 하고 `callback`은 `ChainPrompt`를 알아야 해결될 수 있다.
   * 여기까지는 문제가 안되는데 `VariableDef`인 `val 보유기술: ChainPrompt = {...}` 에서 `value`를 추론하면
   * `callback`의 parameter `corp`에 대해 다시 알아야 하고 처음 과정이 아직 끝난 상태가 아니기 때문에
   * recursive definition이 발생한다.
   *
   * 아울러 값이 있는 경우에는 값 자체를 TypeDescriptor의 node로 사용하는 것이 더 유용하다.
   * 이것은 해당 변수에 값이 할당되어졌는지를 확인할 때도 유용하고 변수의 실제 값을 나중에 참조할 수 있다.
   *
   * @param node - The variable definition node to infer the type for.
   * @param options - Optional inference options that may influence the type inference process.
   * @returns An object containing the inferred type as both `actual` and `formal` properties.
   */
  static inferTypeVariableDef(node: ast.VariableDef, options?: InferOptions): InferResult {
    const log = enterLog('inferTypeVariableDef', undefined, node.name)
    const type: TypeDescriptor = new ErrorTypeDescriptor('No type hint for this element', node)
    let result: InferResult = { actual: type, formal: type }
    if (node.type) {
      result = this.inferType(node.type, options)
      // 명시된 타입만 있고 값이 없는 경우 명시된 타입을 사용한다.
      if (node.value) {
        // 명시된 타입도 있고 값도 있는 경우
        // 값의 타입을 사용하는 경우를 union으로 선언되어진 경우와 primitive type인 경우만으로 한정한다.
        // isAssignableTo()를 호출하지 않아도 deep한 추론을 하지 않기 때문에 위에서 말한 문제점을 줄일 수 있다.
        // 아울러 위에서 설정된 result의 actual, formal을 변경하면 node.type 자체의 정보가 변경되기 때문에 주의해야 한다.
        result = { actual: result.actual, formal: result.formal }
        if (this.isUnionType(result.actual)) {
          const valueType = this.inferType(node.value, options).actual
          traceLog(`명시된 타입: ${result.actual.toString()}, 값의 타입: ${valueType.toString()}`)
          if (this.isAnyType(valueType)) {
            // do nothing
            // } else if (!valueType.isAssignableTo(result.actual)) {
            //   const msg =
            //     `Variable '${node.name}' value '${valueType.toString()}' is not assignable to ` +
            //     `type '${result.actual.toString()}'`
            //   console.error(chalk.red(msg))
          } else result.actual = valueType
        }
      }
    }
    // 명시된 타입없이 값만 있는 경우 값을 보고 타입을 추론한다.
    else if (node.value) {
      result = this.inferType(node.value, options)
      traceLog('명시된 타입없이 value만으로 추론:', node.name)
      traceLog(`  actual: ${result.actual.toString()}`)
      traceLog(`  formal: ${result.formal?.toString()}`)

      // FunctionValue는 formal을 사용해야 하므로 그대로 두고 나머지는 formal을 actual로 대체한다.
      if (ast.isFunctionValue(node.value)) {
        // do nothing
      } else {
        result = { actual: result.actual, formal: result.actual }
      }
    }
    exitLog(log, result.actual)
    return result
  }

  /**
   * Infers the type of a function definition node.
   *
   * @param node - The function definition AST node to infer the type for.
   * @param options - Optional inference options that may influence the type inference process.
   * @returns An object containing the inferred type as both `actual` and `formal` properties.
   */
  static inferTypeFunctionDef(node: ast.FunctionDef, options?: InferOptions): InferResult {
    const log = enterLog('inferTypeFunctionDef', undefined, node.name)
    const type = this.createFunctionType(node)
    exitLog(log, type)
    return { actual: type, formal: type }
  }

  /**
   * Infers the type description for an object definition node.
   *
   * @param node - The AST node representing the object definition.
   * @param options - Optional inference options that may influence the type inference process.
   * @returns An object containing the inferred type as both `actual` and `formal` properties.
   */
  static inferTypeClassDef(node: ast.ClassDef, options?: InferOptions): InferResult {
    const log = enterLog('inferTypeClassDef', undefined, node.name)
    const type = new ClassTypeDescriptor(node)
    exitLog(log, type)
    return { actual: type, formal: type }
  }

  /**
   * Infers the type of a call chain node in the AST.
   *
   * This function analyzes the given call chain node and determines its type based on various conditions,
   * such as whether the node represents an array, a function, or special keywords like 'this' or 'super'.
   * It uses the provided cache to optimize type inference and logs the process for debugging purposes.
   *
   * @param node - The call chain node to infer the type for.
   * @param options - Optional inference options that may influence the type inference process.
   * @returns An object containing the inferred type as both `actual` and `formal` properties.
   */
  static inferTypeCallChain(node: ast.CallChain, options?: InferOptions): InferResult {
    const id = `element='${node.element?.$refText}', cst='${node?.$cstNode?.text}'`
    const log = enterLog('inferTypeCallChain', undefined, id)
    traceLog(chalk.redBright('ref 참조전:'), id)
    const element = node.element?.ref
    traceLog(chalk.green('ref 참조후:'), id)

    let type: TypeDescriptor = new ErrorTypeDescriptor('internal error', node)
    let actual = type
    let formal = type
    if (element && !ast.isImportStatement(element)) {
      // 이 함수에서 InferResult 객체를 직접 사용하지 않고 actual과 formal을 사용하는 이유는
      // InferResult 객체를 사용하면 `result.actual = type.elementType`와 같이 할당할 때
      // element의 타입이 변경되기 때문이다.
      const result = this.inferType(element, options)
      actual = result.actual
      formal = result.formal || result.actual
      type = result.actual

      // CallChain은 변수, 함수, 배열등을 모두 포함할 수 있다.
      // 이것의 타입이 무엇인가를 결정할 때는 context가 중요하다.
      // 이에 대한 자세한 설명은 InferResult의 주석 [[al=0bdb2c40b449f29baae9fee9ce472d96]]을 참조한다.

      if (this.isArrayType(type) && node.isArray) {
        // 배열 호출이면 배열 요소가 리턴되어야 한다.
        // 즉 `ary[0]`의 타입은 `array<number>`가 아니라 `number`이어야 한다.
        traceLog('배열 호출', type.elementType.toString())
        actual = type.elementType
        formal = type.elementType
      } else if (this.isFunctionType(type) && node.isFunction) {
        const detectGeneric = (type: TypeDescriptor): boolean => {
          if (this.isGenericType(type)) return true
          else if (this.isArrayType(type)) return detectGeneric(type.elementType)
          else if (this.isFunctionType(type)) {
            for (const param of type.parameters) {
              if (detectGeneric(param.type)) return true
            }
            return detectGeneric(type.returnType)
          }
          return false
        }

        // 인수 t에 Generic이 있으면 t가 실제 어떤 타입이어야 하는지를 g를 통해 판단한다.
        const replaceGeneric = (
          t: TypeDescriptor,
          g: {
            name: string
            type: TypeDescriptor
          }[]
        ) => {
          if (this.isGenericType(t)) {
            const m = g.find(e => e.name == t.name)
            return m?.type || new AnyTypeDescriptor()
          } else if (this.isArrayType(t)) {
            const arrayElementType = t.elementType
            if (this.isGenericType(arrayElementType) && g.length > 0) {
              const m = g.find(e => e.name == arrayElementType.name)
              return new ArrayTypeDescriptor(m?.type || new AnyTypeDescriptor())
            } else return new ArrayTypeDescriptor(arrayElementType)
          } else if (this.isFunctionType(t)) {
            const desc = new FunctionTypeDescriptor()
            desc.changeReturnType(replaceGeneric(t.returnType, g))
            t.parameters.forEach(p => {
              const type = replaceGeneric(p.type, g)
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

        // 추론된 타입에 generic이 있으면 이를 resolve하기 위해서 previous를 사용한다.
        if (detectGeneric(type)) {
          // 처리 과정 중에 name에는 T, K, V와 같은 것들이, type에는 실제 타입이 들어온다.
          // name은 함수형 메서드들이 선언되어진 곳에서 가져오고 실제 타입은 이전 노드나 new expression에서 가져온다.
          let generic: {
            name: string
            type: TypeDescriptor
          }[] = []

          if (!node.previous) {
            console.error(chalk.red('inferTypeCallChain: generic has been used but previous is empty'))
          } else {
            let previous = this.inferType(node.previous, options).actual
            // for debugging...
            // console.log(
            //   `node '${node.$cstNode?.text}'s previous '${node.previous?.$cstNode?.text}'s type: ${previous.toString()}`
            // )

            if (this.isArrayType(previous)) {
              // array이기 때문에 generic이 하나일 것으로 가정하고 있다.
              // Array.map()인 경우에는 타입이 변경될 수 있으므로 any type으로 처리한다.
              if (element.name == 'map') {
                type = new AnyTypeDescriptor()
              } else {
                generic.push({ name: 'T', type: previous.elementType })
                type = replaceGeneric(type, generic)
              }
            } else if (this.isClassType(previous) && (previous.toString() == 'Map' || previous.toString() == 'Set')) {
              let funcType: TypeDescriptor | undefined
              funcType = this.inferType(element, options).actual
              assert.ok(ast.isVariableDef(element) || ast.isFunctionDef(element), 'it is not valid definition')
              assert.ok(this.isFunctionType(funcType), `'${element.name}' is not function`)

              // Map, Set은 previous에 NewExpression에서 설정된 generic 정보가 있다.
              let genericIds: string[] = []
              const grandContainer = element.$container?.$container
              if (grandContainer && ast.isClassDef(grandContainer)) {
                genericIds = grandContainer.generic?.types.map(name => name) ?? []
              }
              if (genericIds && previous.generic && genericIds.length == previous.generic.length) {
                previous.generic.forEach((g, index) => {
                  generic.push({ name: genericIds[index], type: g.type })
                })
              }
              type = replaceGeneric(type, generic)
            } else {
              console.error(chalk.red('inferTypeCallChain: previous is not array, map, set'), previous.toString())
            }
          }
        }
        // Generic, 일반 함수 모두 actual은 함수의 리턴 타입을 리턴하고 formal은 함수의 자체 타입을 리턴한다.
        // console.log(`함수: ${element.name}, '${node.$cstNode?.text}'`, chalk.green(type.toString()))
        actual = formal = type
        if (this.isFunctionType(type)) actual = type.returnType
      } else {
        // 배열과 함수가 아닌 나머지 CallChain의 처리
        // console.log(`나머지: ${element.name}, '${node.$cstNode?.text}'`, chalk.green(type.toString()))
        actual = type
        // formal = type
      }
    }

    // [[al=30c7407d6425b374442b09ef337f06a2]] 참고
    // // import인 경우
    // else if (element && ast.isImportStatement(element)) {
    //   // console.log(chalk.green('import is always any type in ScalaScript'))
    //   type = new AnyTypeDescriptor()
    //   actual = formal = type
    // }

    // this, super인 경우
    else if (node.$cstNode?.text == 'this' || node.$cstNode?.text == 'super') {
      const classItem = AstUtils.getContainerOfType(node, ast.isClassDef)
      if (classItem) {
        if (node.$cstNode?.text == 'this') {
          traceLog(`'this' refers ${classItem.name}`)
          type = new ClassTypeDescriptor(classItem)
        } else if (node.$cstNode?.text == 'super') {
          // super는 현재 클래스의 부모 클래스를 찾는다.
          //todo 문제는 조부모 클래스인데... 일단은 부모만 사용한다.
          const classChain = this.getClassChain(classItem).filter(c => c != classItem)
          if (classChain.length > 0) {
            const superClass = classChain[0]
            traceLog(`'super' refers ${superClass.name}`)
            type = new ClassTypeDescriptor(superClass)
            // console.log(`'super' refers ${superClass.name}`)
            // classChain.forEach(c => console.log(`  - ${c.name}`))
          } else {
            console.error(chalk.red('super is empty in types.ts'))
          }
        }
      } else {
        console.error(chalk.red('this or super is empty in types.ts'))
        // for debugging...
        let item: AstNode | undefined = node
        while (item) {
          console.log(chalk.green(reduceLog(`  ${item.$type}: ${item.$cstNode?.text}`)))
          if (ast.isClassDef(item)) break
          item = item.$container
        }
      }

      actual = formal = type
    }

    // node.element.ref가 없는 경우
    else {
      // 그냥 에러로 처리할 수도 있지만 최대한 추론해 본다.
      // previous가 함수이면 이것의 리턴 타입을 자신의 타입으로 리턴하게 하고
      // previous가 배열이면 배열의 element 타입을 자신의 타입으로 취한다.
      if (node.previous) {
        const previousType = this.inferType(node.previous, options).actual
        console.log(chalk.red('여기는 정확히 어떨 때 호출되는가?', id))
        console.log(`> previous '${node.previous?.$cstNode?.text}'s type: ${previousType.toString()}`)
        actual = formal = previousType
        if (this.isFunctionType(previousType)) actual = previousType.returnType
        else if (this.isArrayType(previousType)) actual = previousType.elementType
        else actual = new ErrorTypeDescriptor(`Could not infer type for element '${node.element?.$refText}'`, node)
        exitLog(log, type)
        return { actual, formal }
      }

      actual = formal = new ErrorTypeDescriptor(`Could not infer type for element '${node.element?.$refText}'`, node)
    }

    exitLog(log, type)
    return { actual, formal }
  }

  /**
   * Infers the type of a given parameter node.
   *
   * This function attempts to determine the type of a parameter by examining its type annotation,
   * its value, or by analyzing the function it belongs to if neither is available.
   *
   * @param node - The parameter node whose type is to be inferred.
   * @param options - Optional inference options that may influence the type inference process.
   * @returns An object containing the inferred type as both `actual` and `formal` properties.
   */
  static inferTypeParameter(node: ast.Parameter, options?: InferOptions): InferResult {
    const log = enterLog('inferTypeParameter', undefined, node.name)
    const any: TypeDescriptor = new AnyTypeDescriptor()
    let result: InferResult = { actual: any, formal: any }
    if (node.type) result = this.inferType(node.type, options)
    else if (node.value) result = this.inferType(node.value, options)
    else {
      // 파라미터의 타입이 명시되어 있지 않고 값도 없는 경우
      // 파라미터의 타입을 추론하기 위해서는 함수 자체에 대한 정보가 필요하다.
      // inferType()를 호출할때 cache를 사용하지 않으면 recursive definition이 발생할 수 있다.
      // inferType().formal은 함수 자체에 대한 정보를 리턴하기 때문에 파라미터와 함수의 인수들을 매치하는 작업이 필요하다.
      // node.$container.$container가 쓰인 이유는 [이 문서](/.prism/docs/d064613466b71eae97f19e05193accdf.md)을 참고한다.
      let type: TypeDescriptor = new AnyTypeDescriptor()
      const funcNode = node.$container.$container
      const funcType = this.inferType(funcNode, { ...options, cache: new Map() }).formal
      if (!funcType) {
        // for debugging...
        console.error(
          chalk.red('getFunctionInfo() is null in inferTypeParameter:'),
          node.name,
          chalk.green(funcNode?.$type),
          reduceLog(funcNode?.$cstNode?.text)
        )
      } else if (this.isAnyType(funcType)) {
        type = funcType
      } else if (this.isFunctionType(funcType)) {
        // for debugging...
        // console.log('parameter.name:', node.name, `'${reduceLog(funcNode?.$cstNode?.text)}'`)
        // funcType.showDetailInfo()

        if (!ast.isBinding(funcNode)) {
          // 함수 `f`가 `(callback: (arg: Corp, index?: number) -> void, thisArg?: any) -> void`와 같이 정의되어져 있고
          // `f(corp => corp.process())`가 호출된다고 할 때 파라미터 `corp`를 `callback`의 `arg`에 매칭해야 한다.
          // 보다 효과적인 예로써 `this.getCell(columnName, (column) => { ... })`의 경우
          // `column`은 `getCell()`의 두번째 파라미터의 첫번째 파라미터이다.
          // 이렇게 node가 함수의 몇번째 파라미터인지를 확인하기 위해서는 node만으로는 안된다.
          // 현재 노드에서 CallChain까지 올라간 다음 CallChain의 args를 검사해서 파라미터의 위치를 찾는다.
          // 처음에는 노드로 찾고 람다 함수가 있으면 람다 함수의 파라미터 인덱스는 이름으로 찾는다.
          const callchain = AstUtils.getContainerOfType(node, ast.isCallChain)
          const funcParamIndex = callchain?.args.findIndex(arg => arg == node.$container)
          if (funcParamIndex != undefined && funcParamIndex != -1) {
            const funcArg = callchain?.args[funcParamIndex]
            const argType = funcType.parameters[funcParamIndex].type
            if (ast.isFunctionValue(funcArg) && argType && this.isFunctionType(argType)) {
              let nodeIndex = node.$container.params.findIndex(param => param.name == node.name)
              if (nodeIndex != -1) {
                type = argType.parameters[nodeIndex].type
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
      } else {
        console.error(chalk.red('inferTypeParameter:'), 'funcType is not valid type')
      }
      result = { actual: type, formal: type }
    }
    exitLog(log, result.actual)
    return result
  }

  /**
   * Infers the type of a given property node.
   *
   * @param node - The property node for which the type is to be inferred.
   * @param options - Optional inference options that may influence the type inference process.
   * @returns An object containing the inferred type as both `actual` and `formal` properties.
   */
  static inferTypeProperty(node: ast.Property, options?: InferOptions): InferResult {
    const log = enterLog('inferTypeProperty', undefined, node.name)
    const result = this.inferType(node.type, options)
    exitLog(log, result.actual)
    return result
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
   * @param options - Optional inference options that may influence the type inference process.
   * @returns An object containing the inferred type as both `actual` and `formal` properties.
   */
  static inferTypeBinding(node: ast.Binding, options?: InferOptions): InferResult {
    const log = enterLog('inferTypeBinding', node)
    // Binding에는 value가 없을수는 없지만 없으면 nil type으로 취급한다.
    //todo 타입스크립트에서는 name과 value가 동일하면 하나만 사용할 수 있는데 스칼라스크립트에서는 아직 그렇지 않다.
    const type: TypeDescriptor = new NilTypeDescriptor()
    let result: InferResult = { actual: type, formal: type }
    if (node.value) result = this.inferType(node.value, options)

    // Binding 되어진 람다 함수 처리 부분
    // Binding 내부에 Binding이 포함될 수 있다.
    // 따라서 `findBindingRootDef()`는 중첩된 Binding을 따라가면서 Binding이 정의된 definition을 찾는다.
    // 간단히 아래와 같이 한번만 Binding되어진 경우는 비교적 간단하다.
    // ```
    // var variable: ChainPrompt = {
    //   prompt: 'what do you want?',
    //   callback: (options) => { return options }
    // }
    // ```
    // 위 경우에서 `prompt`의 타입은 간단히 위의 `inferType(node.value, ...)`으로 구할 수 있다.
    // (`prompt`의 경우도 `findBindingRootDef()`를 거치긴 하지만 이때 구한 값은 사용되지 않는다)
    // 하지만 `callback: (options) => { return options }` 의 타입은 함수이지만 `options`의 정확한 타입을
    // 구하기 위해서는 `ChainPrompt`를 참조해야만 한다.
    // 그래서 `inferTypeBinding()`에서 `options`의 타입을 추출하기 위해서 `inferTypeParameter()`가 호출되는데
    // `inferTypeParameter()`에서 `options`의 $container.$container인, 여기서는 FunctionValue의 container인 Binding으로
    // 다시 이 함수가 호출된다. 이것은 순환 호출이 되어 에러로 처리되고 `findBindingRootDef()`가 호출된다.
    // 이 함수에서 그것의 container인 VariableDef를 찾고 거기서 callback의 타입을 이용해서 Binding의 타입을 구한다.
    // 하지만 다음과 같이 상위 노드가 또 다른 Binding인 경우에는
    // ```
    // nextChain: {
    //   callback: (options) => { return options }
    // }
    // ```
    // node에서 시작해서 VariableDef가 나올때까지 node의 타입이 무엇인지를 검사해야 한다.
    // 상위 노드로 가면 node는 달라질 수 있다. 즉 위에서 처음 시작은 callback이지만
    // callback를 포함하는 상위 binding의 이름이 nextChain이면
    // 다음번 찾기는 nextChain으로 찾는다는 의미이다.
    const findBindingRootDef = (node: AstNode): TypeDescriptor | undefined => {
      const property = ast.isBinding(node) ? node.name : ''
      if (!property) {
        console.error(chalk.red('findBindingRootDef: property is null'))
        return undefined
      }

      const object = AstUtils.getContainerOfType(node, ast.isObjectValue)
      const container = object ? object.$container : undefined
      if (object && container) {
        if (ast.isVariableDef(container)) {
          const containerType = this.inferType(container, options).actual
          // 해당 Binding이 소속된 ClassDef를 찾아서 해당 항목의 타입을 찾아야 한다.
          if (this.isClassType(containerType)) {
            return containerType.getElementType(property)
          }
        } else if (ast.isBinding(container)) {
          const result = findBindingRootDef(container)
          if (result && this.isClassType(result)) {
            return result.getElementType(property)
          }
        }
      }
      return undefined
    }

    const propType = findBindingRootDef(node)
    if (propType && this.isFunctionType(propType)) {
      // propType.showDetailInfo()
      result = { actual: propType, formal: propType }
    }

    exitLog(log, result.actual)
    return result
  }

  /**
   * Infers the type of the elements in a `for...of` loop.
   *
   * 이 함수는 `for(a <- ary)`와 같이 정의되어진 후 `a`를 참조하게 되면 `a`의 타입을 추론할때 사용된다.
   *
   * @param node - The AST node representing the `for...of` loop.
   * @param options - Optional inference options that may influence the type inference process.
   * @returns An object containing the inferred type as both `actual` and `formal` properties.
   */
  static inferTypeForOf(node: ast.ForOf, options?: InferOptions): InferResult {
    const log = enterLog('inferTypeForOf', node)
    const result = this.inferType(node.of, options)
    let actual = result.actual
    let formal = result.formal
    if (this.isArrayType(actual)) actual = actual.elementType
    exitLog(log, actual)
    return { actual, formal }
  }

  /**
   * Infers the type for a `ForTo` node.
   *
   * 이 함수는 `for(a <- 1 (to | until) 10)`와 같이 정의되어진 후 `a`를 참조하게 되면 `a`의 타입을 추론할때 사용된다.
   *
   * @param node - The `ForTo` AST node to infer the type for.
   * @param options - Optional inference options that may influence the type inference process.
   * @returns An object containing the inferred type as both `actual` and `formal` properties.
   */
  static inferTypeForTo(node: ast.ForTo, options?: InferOptions): InferResult {
    const log = enterLog('inferTypeForTo', node)
    const e1 = this.inferType(node.e1, options)
    const e2 = this.inferType(node.e2, options)
    if (this.isNumberType(e1.actual) && this.isNumberType(e2.actual)) {
      exitLog(log, e1.actual)
      return e1
    }
    const type = new ErrorTypeDescriptor('ForTo loop must have number types', node)
    exitLog(log, type)
    return { actual: type, formal: type }
  }

  /**
   * Infers the type of an assignment node.
   *
   * 대입문이라고 해서 이 함수가 매번 호출되는 것은 아니다.
   * 왜냐하면 대입문의 타입 추론은 validator의 `checkAssignment()`에서 하는데 좌변과 우변을 따로 추론하기 때문이다.
   * 따라서 이 함수가 호출되는 경우는 다중 대입문인 경우(`a = b = 0`)이거나 복합 대입문인 경우(`n += 1`)이다.
   *
   * @param node - The assignment node to infer the type for.
   * @param options - Optional inference options that may influence the type inference process.
   * @returns An object containing the inferred type as both `actual` and `formal` properties.
   */
  static inferTypeAssignment(node: ast.Assignment, options?: InferOptions): InferResult {
    const log = enterLog('inferTypeAssignment', node)
    const type: TypeDescriptor = new ErrorTypeDescriptor('No type hint for this element', node)
    let result: InferResult = { actual: type, formal: type }
    if (node.assign) result = this.inferType(node.assign, options)
    else if (node.value) result = this.inferType(node.value, options)
    exitLog(log, result.actual)
    return result
  }

  /**
   * Infers the type of an IfExpression node.
   *
   * @param node - The IfExpression AST node to infer the type for.
   * @param options - Optional inference options that may influence the type inference process.
   * @returns An object containing the inferred type as both `actual` and `formal` properties.
   */
  static inferTypeIfExpression(node: ast.IfExpression, options?: InferOptions): InferResult {
    const log = enterLog('inferTypeIfExpression', node)
    if (!node.then) {
      const type: TypeDescriptor = new ErrorTypeDescriptor('internal error', node)
      console.error(chalk.red('IfExpression has no then node'))
      exitLog(log, type)
      return { actual: type, formal: type }
    }
    const result = this.inferType(node.then, options)
    let actual = result.actual
    let formal = result.formal

    // IfExpression에 else가 있으면 then과 else의 타입을 비교해서 union type으로 만든다.
    // 그렇지 않은 모든 경우는 then의 타입을 그대로 사용한다.
    if (node.else) {
      const elseType = this.inferType(node.else, options).actual
      if (!actual.isEqual(elseType)) {
        actual = this.createUnionType([actual, elseType])
      }
    }
    exitLog(log, actual)
    return { actual, formal }
  }

  /**
   * Infers the type of a MatchExpression node.
   *
   * @param node - The MatchExpression AST node to infer the type for.
   * @param options - Optional inference options that may influence the type inference process.
   * @returns An object containing the inferred type as both `actual` and `formal` properties.
   */
  static inferTypeMatchExpression(node: ast.MatchExpression, options?: InferOptions): InferResult {
    const log = enterLog('inferTypeMatchExpression', node)
    const types: TypeDescriptor[] = []
    node.cases.forEach(c => {
      if (c.body) types.push(this.inferType(c.body, options).actual)
    })
    // type이 없으면 void type으로 처리한다.
    let type: TypeDescriptor = this.createUnionType(types)
    if (this.isErrorType(type)) type = new VoidTypeDescriptor()
    exitLog(log, type)
    return { actual: type, formal: type }
  }

  /**
   * Infers the type of a function value node.
   *
   * @param node - The function value AST node to infer the type for.
   * @param options - Optional inference options that may influence the type inference process.
   * @returns An object containing the inferred type as both `actual` and `formal` properties.
   */
  static inferTypeGroupExpression(node: ast.GroupExpression, options?: InferOptions): InferResult {
    const log = enterLog('inferTypeGroupExpression', node)
    const result = this.inferType(node.value, options)
    exitLog(log, result.actual)
    return result
  }

  /**
   * Infers the type of a unary expression node.
   *
   * @param node - The unary expression AST node to infer the type for.
   * @param options - Optional inference options that may influence the type inference process.
   * @returns An object containing the inferred type as both `actual` and `formal` properties.
   */
  static inferTypeUnaryExpression(node: ast.UnaryExpression, options?: InferOptions): InferResult {
    const log = enterLog('inferTypeUnaryExpression', node)
    let type: TypeDescriptor = new ErrorTypeDescriptor('internal error', node)
    if (node.operator) {
      if (node.operator === 'typeof') type = new StringTypeDescriptor(node)
      else if (node.operator === '-' || node.operator === '+') type = new NumberTypeDescriptor(node)
      else if (node.operator === '!' || node.operator === 'not') type = new BooleanTypeDescriptor(node)
      else type = new ErrorTypeDescriptor(`Unknown unary operator: ${node.operator}`)

      exitLog(log, type)
      return { actual: type, formal: type }
    }
    return this.inferType(node.value, options)
  }

  /**
   * Infers the type of a binary expression node.
   * 
   * `inferAssignment()`와 마찬가지로 이 함수도 validator의 `CheckBinaryExpression()`에서 좌변과 우변을 따로
   * 추론하기 때문에 `1 + 2 * 3` 같이 이항 연산자가 연속적인 경우에만 호출되며 심지어 실제 타입을 리턴하지도 않는다.
   * 실제 타입을 리턴하지 않는 이유는 실제 타입을 힘들게(경우에 따라서는 이것은 비용이 많이 들수도 있고 심지어 
   * 재귀호출 문제를 발생시킬 수도 있다) 구할 필요가 없기 때문이다.
   * 
   * 예를 들어 `1 + 2 * 3`가 있다고 하면 validator가 실제 이항 연산자 `+` 를 `1`과 `2 * 3`으로 나눠서 처리할 때
   * 이 함수는 `2 * 3`의 타입이 number type이라고 알려주는 것이다. 실제 평가해서 구한 타입이 아니라 가져야 할 타입,
   * 가짜 타입을 알려주는 것이다. 그래도 되는 이유는 결국은 `2 * 3`을 다시 평가하기 때문에 미리 구할 필요가 없기 때문이다.  

   * 연산자에 적합한 타입인지의 여부를 검사하는 것은 validator에서 하고 최종적으로 연산의 각 항목(`1 + 2`에서 `1`, `2`)은
   * unary, literal, callchain등으로 표현되기 때문에 사실 이 함수 자체가 거의 무의미하다. 하지만 이항 연산자가 연속인
   * 경우에 이 함수는 꼭 필요하며 여기서 적절한 타입을 리턴하지 않으면 validator에서 바로 에러가 되어 버린다.
   *
   * @param node - The binary expression AST node to infer the type for.
   * @param options - Optional inference options that may influence the type inference process.
   * @returns An object containing the inferred type as both `actual` and `formal` properties.
   *
   * The function handles different binary operators and infers the type based on the operator:
   * - Logical operators (`and`, `or`, `&&`, `||`, `<`, `<=`, `>`, `>=`, `==`, `!=`) result in a boolean type.
   * - Arithmetic operators (`-`, `+`, `**`, `*`, `/`, `%`) result in a number type.
   * - The range operator (`..`) results in a string type if either operand is a string.
   * - The `instanceof` operator results in an any type.
   *
   * If the type cannot be inferred, an error type is returned.
   */
  static inferTypeBinaryExpression(node: ast.BinaryExpression, options?: InferOptions): InferResult {
    const log = enterLog('inferTypeBinaryExpression', node)
    let type: TypeDescriptor = new ErrorTypeDescriptor('Could not infer type from binary expression', node)
    if (['and', 'or', '&&', '||', '<', '<=', '>', '>=', '==', '!='].includes(node.operator)) {
      type = new BooleanTypeDescriptor(node)
    } else if (['-', '+', '**', '*', '/', '%'].includes(node.operator)) {
      type = new NumberTypeDescriptor(node)
    } else if (['..'].includes(node.operator)) {
      const left = this.inferType(node.left, options).actual
      const right = this.inferType(node.right, options).actual
      if (this.isStringType(left) || this.isStringType(right)) {
        type = new StringTypeDescriptor()
      }
    } else if (node.operator === 'instanceof') {
      //todo instanceof 의 결과는 일단 any type으로 처리한다.
      type = new AnyTypeDescriptor()
    }
    exitLog(log, type)
    return { actual: type, formal: type }
  }

  /**
   * Infers the type of a return expression node.
   *
   * @param node - The return expression node to infer the type from.
   * @param options - Optional inference options that may influence the type inference process.
   * @returns An object containing the inferred type as both `actual` and `formal` properties.
   */
  static inferTypeReturnExpression(node: ast.ReturnExpression, options?: InferOptions): InferResult {
    const log = enterLog('inferTypeReturnExpression', node)
    const type: TypeDescriptor = new VoidTypeDescriptor()
    let result: InferResult = { actual: type, formal: type }
    if (node.value) result = this.inferType(node.value, options)
    exitLog(log, result.actual)
    return result
  }

  /**
   * Infers the type of a spread expression node.
   *
   * Spread expression은 `...`을 사용해서 배열을 풀어서 사용하는 경우이다.
   * 예를들어 `a = [1, 2, 3]`이라고 할 때 `b = [...a, 4, 5]`와 같이 사용하는 경우이다.
   *
   * @param node - The return expression node to infer the type from.
   * @param options - Optional inference options that may influence the type inference process.
   * @returns An object containing the inferred type as both `actual` and `formal` properties.
   */
  static inferTypeSpreadExpression(node: ast.SpreadExpression, options?: InferOptions): InferResult {
    const log = enterLog('inferTypeSpreadExpression', node)
    const type: TypeDescriptor = new AnyTypeDescriptor()
    let result: InferResult = { actual: type, formal: type }
    if (node.spread && node.spread.ref) result = this.inferType(node.spread.ref, options)
    exitLog(log, result.actual)
    return result
  }

  /**
   * Infers the type of a new expression node.
   *
   * @param node - The AST node representing the new expression.
   * @param options - Optional inference options that may influence the type inference process.
   * @returns An object containing the inferred type as both `actual` and `formal` properties.
   */
  static inferTypeNewExpression(node: ast.NewExpression, options?: InferOptions): InferResult {
    const log = enterLog('inferTypeNewExpression', node)

    // 실제 class가 존재하지 않으면 에러로 처리한다.
    if (!node.class.ref) {
      const type = new ErrorTypeDescriptor('internal error', node)
      exitLog(log, type)
      return { actual: type, formal: type }
    }

    // new Array<number>()와 같은 경우에는 ArrayTypeDescription으로 변경해 준다.
    // generic이 있으면 generic의 타입을 element type으로 사용하고 없으면 any type으로 처리한다.
    if (node.class.$refText === 'Array') {
      let type: TypeDescriptor
      if (node.generic) {
        assert(node.generic.types.length === 1, 'Array type must have one generic type')
        const t = this.inferType(node.generic.types[0], options).actual
        type = new ArrayTypeDescriptor(t)
      } else type = new ArrayTypeDescriptor(new AnyTypeDescriptor())
      exitLog(log, type)
      return { actual: type, formal: type }
    }

    // 생성시 generic정보가 있으면 Class의 타입에 이를 추가한다.
    // new Set<string>(), new Set<number>()와 같은 경우에도 ClassTypeDescription은 동일하지 않기 때문에 상관없다.
    const type = new ClassTypeDescriptor(node.class.ref)
    if (node.generic) {
      type.generic = node.generic.types.map((g, index) => {
        const t = this.inferType(g, options).actual
        return new GenericTypeDescriptor(index.toString(), t)
      })
    }

    exitLog(log, type)
    return { actual: type, formal: type }
  }

  /**
   * Infers the type of an array value node.
   *
   * This function determines the type of an array value node in the AST. If the array is empty,
   * it assigns the `any` type to it. Otherwise, it infers the type of the first item in the array
   * and creates an array type based on that.
   *
   * @param node - The AST node representing the array value.
   * @param options - Optional inference options that may influence the type inference process.
   * @returns An object containing the inferred type as both `actual` and `formal` properties.
   */
  static inferTypeArrayValue(node: ast.ArrayValue, options?: InferOptions): InferResult {
    const log = enterLog('inferTypeArrayValue', node, `item count= ${node.items.length}`)
    let type: TypeDescriptor = new ErrorTypeDescriptor('internal error', node)
    // item이 없는 경우 즉 [] 으로 표현되는 빈 배열의 경우 any type으로 취급한다.
    if (node.items.length > 0) {
      const types: TypeDescriptor[] = []
      node.items.forEach(item => {
        // 배열 안에서 spread가 사용되면 spread를 풀어서 처리해야 한다.
        if (ast.isSpreadExpression(item)) {
          const spreadType = this.inferType(item, options).actual
          if (this.isClassType(spreadType)) types.push(new AnyTypeDescriptor())
          else if (this.isArrayType(spreadType)) types.push(spreadType.elementType)
          else types.push(spreadType)
        } else types.push(this.inferType(item, options).actual)
      })
      type = new ArrayTypeDescriptor(this.createUnionType(types))
    } else type = new AnyTypeDescriptor()
    exitLog(log, type)
    return { actual: type, formal: type }
  }

  /**
   * Infers the type of an object value from the given AST node.
   *
   * @param node - The AST node representing the object value.
   * @param options - Optional inference options that may influence the type inference process.
   * @returns An object containing the inferred type as both `actual` and `formal` properties.
   */
  static inferTypeObjectValue(node: ast.ObjectValue, options?: InferOptions): InferResult {
    const log = enterLog('inferTypeObjectValue', node)
    const type = new ObjectTypeDescriptor(node)
    exitLog(log, type)
    return { actual: type, formal: type }
  }

  /**
   * Infers the type of a given function value node.
   *
   * @param node - The function value node to infer the type for.
   * @param options - Optional inference options that may influence the type inference process.
   * @returns An object containing the inferred type as both `actual` and `formal` properties.
   */
  static inferTypeFunctionValue(node: ast.FunctionValue, options?: InferOptions): InferResult {
    const log = enterLog('inferTypeFunctionValue', node)
    const type = this.createFunctionType(node)
    exitLog(log, type)
    return { actual: type, formal: type }
  }

  /**
   *
   * @param node - The `ForTo` AST node to infer the type for.
   * @param options - Optional inference options that may influence the type inference process.
   * @returns An object containing the inferred type as both `actual` and `formal` properties.
   */
  static inferTypeCatchClause(node: ast.CatchClause, options?: InferOptions): InferResult {
    const log = enterLog('inferTypeCatchClause', node)
    const type: TypeDescriptor = new AnyTypeDescriptor()
    let result: InferResult = { actual: type, formal: type }
    exitLog(log, result.actual)
    return result
  }

  /**
   * Infers the type of a given literal node.
   *
   * @param node - The AST literal node to infer the type from.
   * @param options - Optional inference options that may influence the type inference process.
   * @returns An object containing the inferred type as both `actual` and `formal` properties.
   */
  static inferTypeLiteral(node: ast.Literal, options?: InferOptions): InferResult {
    const log = enterLog('inferTypeLiteral', node)
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
          type = new BooleanTypeDescriptor(node)
          break
        default:
          type = new StringTypeDescriptor(node)
      }
    } else if (typeof node.value == 'number') {
      type = new NumberTypeDescriptor(node)
    } else if (typeof node.value == 'boolean') {
      type = new BooleanTypeDescriptor(node)
    }
    exitLog(log, type)
    return { actual: type, formal: type }
  }

  /**
   * Infers the type of a given block node.
   *
   * @param node - The AST block node to infer the type from.
   * @param options - Optional inference options that may influence the type inference process.
   * @returns An object containing the inferred type as both `actual` and `formal` properties.
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
  static inferTypeBlock(node: ast.Block, options?: InferOptions): InferResult {
    const extractReturns = (node: AstNode) => {
      // return AstUtils.streamAllContents(node).filter(ast.isReturnExpression).toArray()
      const result: ast.ReturnExpression[] = []
      AstUtils.streamContents(node).forEach(n => {
        // forEach 같은 람다함수에서 리턴하는 경우를 제외하기 위해 함수인 경우는 빼고 처리한다.
        if (ast.isFunctionDef(n) || ast.isFunctionType(n) || ast.isFunctionValue(n)) return
        else if (ast.isReturnExpression(n)) result.push(n)
        else {
          const r = extractReturns(n)
          if (r) result.push(...r)
        }
      })
      return result
    }

    const log = enterLog('inferTypeBlock', node)
    let type: TypeDescriptor = new ErrorTypeDescriptor('internal error', node)
    if (node.isBracket) {
      // Block이 여러 식으로 구성된 경우
      // 함수의 바디에 명시된 return 문이 없으면 void type으로 간주한다.
      // return문이 하나라도 있으면 void type과의 union type일 수도 있기 때문에 주의가 필요하다.
      // void type과의 union인지의 여부는 가장 마지막 문이 return인지 아닌지로 판단한다.
      const returns = extractReturns(node)
      if (returns.length == 0) type = new VoidTypeDescriptor()
      else {
        // 여러 개의 return문이 있으면 각각의 타입을 union type으로 처리한다. 하나인 경우에도 union type으로 처리한다.
        // 블럭의 마지막에 return문이 없으면 void와 union되어야 하고 있으면 이미 returns에 포함된 상태이므로 union으로 처리가능
        // 문제는 이렇게 구성했을때 type narrowing을 지원해야 한다는 것이다.
        // 스칼라스크립트는 타입스크립트의 type narrowing을 처리하기 위해서 타입스크립트와는 반대로 처리한다.
        // 실제 타입스크립트의 type narrowing을 그대로 구현하는 것은 매우 어려운 일일 뿐만 아니라 그렇게까지 할 필요가 없다.
        // 어떤 타입이 A, B 타입으로 구성되어져 있을 때 A인 경우와 B인 경우를 모두 처리하고 둘 중 하나라도 맞으면 그걸 사용하는 것이다.
        const types: TypeDescriptor[] = returns.map(r => this.inferType(r, options).actual)
        const isReturnAtLast = ast.isReturnExpression(node.codes[node.codes.length - 1]) ? true : false
        if (!isReturnAtLast) types.push(new VoidTypeDescriptor())
        type = this.createUnionType(types)
        if (this.isErrorType(type)) {
          type = new VoidTypeDescriptor()
        }
      }
    } else {
      // Block이 단일 식인 경우 이 식의 타입을 리턴한다.
      if (node.codes.length == 1) type = this.inferType(node.codes[0], options).actual
      else console.error(chalk.red('Block is not bracket but has multiple codes'))
    }
    exitLog(log, type)
    return { actual: type, formal: type }
  }

  //-----------------------------------------------------------------------------
  // helper functions
  //-----------------------------------------------------------------------------

  /**
   * Retrieves the chain of superclasses for a given class item.
   *
   * @param node - The class item for which to retrieve the superclass chain.
   * @returns An array of `ast.ClassDef` representing the chain of superclasses,
   *          starting from the given class item and following the `superClass` references.
   */
  static getClassChain(node: ast.ClassDef): ast.ClassDef[] {
    const set = new Set<ast.ClassDef>()
    let value: ast.ClassDef | undefined = node
    while (value && !set.has(value)) {
      set.add(value)
      value = value.superClass?.ref
    }
    // Sets preserve insertion order
    return Array.from(set)
  }

  /*
    이 함수는 함수의 파라미터와 리턴의 실제 타입을 추론하는 함수이다.
    이 함수는 크게 다음과 같은 3가지 경우를 처리한다.
    1) 일반 함수
    2) Array, Map, Set등의 generic을 가지는 함수형 메서드
    3) Binding 되어진 람다 함수
    
    1) 일반 함수
    일반 함수는 2)와 3)의 경우가 아닌 것을 의미하며 generic과 binding의 영향을 받지 않으므로 간단하다.
    
    2) Array, Map, Set등의 generic을 가지는 함수형 메서드
    예를 들어 `this.corpList.find(corp => corp.name == 'name')`와 같은 코드에서 `corp`의 타입과 `find`의 리턴 타입을 추론하는 것이다.
    전달되는 node는 `find`이며 이것의 이전 노드인 `this.corpList`의 타입을 이용해서 `corp`, `find`의 타입을 추론한다.
    Map, Set의 경우도 거의 동일하지만 generic이 K, V 등으로 다수일 수 있고 K, V에 대응하는 실제 타입을
    `new Map<string, Corp>`와 같은 new Expression에서 얻는다는 것이 다르다.

    Map, Set의 경우는 아래와 같이 사용되는데
    `var corpMap = new Map<string, Corp>()`
    `this.corpMap.get('name')`
    `this.corpMap`의 타입을 추론하면 class형 타입이 된다.
    그리고 `inferTypeNewExpression()`에서 generic의 정보를 저장하기 때문에 `corpMap`의 `ClassTypeDescriptor`에 `string`, `Corp`가 저장되어져 있다.
    하지만 배열은 corpList에 gereric 정보가 저장되어져 있지 않다.
    
    배열 자체($array$)는 generic의 정보를 가지고 있고 배열도 `new Array<Corp>`와 같이 사용할 수 있지만 현재는 지원하지 않는다.

    3) Binding 되어진 람다 함수
  */
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
  static getFunctionInfo(node: AstNode | undefined): FunctionTypeDescriptor | AnyTypeDescriptor | undefined {
    if (!node) {
      console.error(chalk.red('getFunctionInfo: node is null'))
      return undefined
    }
    const log = enterLog('getFunctionInfo', node)

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
        const prevType = this.inferType(node.previous).actual

        gather.add('node.prev', node.previous.$cstNode?.text)
        gather.add('prevType', prevType.toString())

        if (this.isArrayType(prevType)) {
          // find는 변수나 함수로 정의되어져 있다.
          funcType = this.inferType(nodeRef).actual
          assert.ok(ast.isVariableDef(nodeRef) || ast.isFunctionDef(nodeRef), 'it is not valid definition')
          assert.ok(this.isFunctionType(funcType), `'${nodeName}' is not function`)

          // VariableDef의 container는 ClassBody이고 그 위에가 ClassDef이다.
          const grandContainer = nodeRef?.$container?.$container
          if (grandContainer && ast.isClassDef(grandContainer)) {
            // array이기 때문에 generic이 하나일 것으로 가정하고 있다.
            // Array.map()인 경우에는 타입이 변경될 수 있으므로 any type으로 처리한다.
            let t = prevType.elementType
            if (nodeName == 'map') t = new AnyTypeDescriptor()
            assert(grandContainer.generic?.types.length == 1, 'generic type must be one')
            generic.push({ name: grandContainer.generic?.types[0], type: t })
            isProcessed = true
          } else gather.add('error1', `'${nodeName}'s grandContainer is not object`)
        } else if (this.isClassType(prevType)) {
          if (prevType.toString() == 'Map' || prevType.toString() == 'Set') {
            funcType = this.inferType(nodeRef).actual
            assert.ok(ast.isVariableDef(nodeRef) || ast.isFunctionDef(nodeRef), 'it is not valid definition')
            assert.ok(this.isFunctionType(funcType), `'${nodeName}' is not function`)

            // Map, Set은 prevType에 NewExpression에서 설정된 generic 정보가 있다.
            let genericIds: string[] = []
            const grandContainer = nodeRef.$container?.$container
            if (grandContainer && ast.isClassDef(grandContainer)) {
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
        const type = this.inferType(nodeRef).actual

        gather.add('isProcessed', 'now procesing')
        gather.add('type', type.toString())

        if (this.isFunctionType(type) || this.isAnyType(type)) {
          funcType = type
        } else if (this.isClassType(type) && nodeName == 'assert') {
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
        if (this.isGenericType(t)) {
          const m = g.find(e => e.name == t.name)
          return m?.type || new AnyTypeDescriptor()
        } else if (this.isArrayType(t)) {
          if (this.isGenericType(t.elementType) && g.length > 0) return new ArrayTypeDescriptor(g[0].type)
          else return new ArrayTypeDescriptor(t.elementType)
        } else if (this.isFunctionType(t)) {
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
        if (this.isAnyType(funcType)) {
          gather.add('funcType', funcType.toString())
          exitLog(log, funcType)
          return funcType
        } else if (this.isFunctionType(funcType)) {
          const newType = replace(funcType, generic)
          if (this.isFunctionType(newType)) {
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
        const property = ast.isBinding(node) ? node.name : ''
        if (!property) {
          console.error(chalk.red('findBindingRootDef: property is null'))
          return undefined
        }

        const object = AstUtils.getContainerOfType(node, ast.isObjectValue)
        if (object && object.$container) {
          if (ast.isVariableDef(object.$container)) {
            const container = object.$container
            const containerType = this.inferType(container).actual
            gather.add('fd.container.$type', container.$type)
            gather.add('fd.container.type', containerType.toString())
            // 해당 Binding이 소속된 ClassDef를 찾아서 해당 항목의 타입을 찾아야 한다.
            if (this.isClassType(containerType)) {
              return containerType.getElementType(property)
            }
          } else if (ast.isBinding(object.$container)) {
            const result = findBindingRootDef(object.$container)
            if (result && this.isClassType(result)) {
              return result.getElementType(property)
            } else gather.add('error10', 'find-bind is not valid')
          } else gather.add('error11', 'container is not valid')
        } else gather.add('error12', 'object is not found')
        return undefined
      }

      const propType = findBindingRootDef(node)
      gather.add('propType', propType?.toString())
      if (propType && this.isFunctionType(propType)) {
        // propType.showDetailInfo()
        return propType
      } else gather.add('error8', 'propType is not function type')
    } else gather.add('error9', 'node is invalid')

    gather.show()
    exitLog(log)
    return undefined
  }
}
