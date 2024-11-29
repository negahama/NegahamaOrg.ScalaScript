import { AstNode, AstUtils, type ValidationAcceptor } from 'langium'
import * as ast from './generated/ast.js'
import { TypeDescription, TypeSystem } from './scala-script-types.js'
import { enterLog, exitLog, traceLog } from './scala-script-util.js'
import chalk from 'chalk'

/**
 * Implementation of custom validations.
 */
export class ScalaScriptValidator {
  /**
   * Validates a variable definition in the ScalaScript language.
   *
   * @param expr - The variable definition AST node to be checked.
   * @param accept - The validation acceptor to report validation issues.
   *
   * This function performs the following checks:
   * - Logs the entry and traces the type and value of the variable definition.
   * - If both type and value are present, it infers their types and checks if the value is assignable to the type.
   *   - If the value is not assignable to the type, it reports an error.
   * - If neither type nor value is present, it reports an error indicating that variables require a type hint or an assignment at creation.
   */
  checkVariableDef(expr: ast.VariableDef, accept: ValidationAcceptor): void {
    // const text = AstUtils.getDocument(expr).parseResult.value.$cstNode?.text
    // const text = (AstUtils.getDocument(expr).parseResult.value.$cstNode as RootCstNode).fullText
    // console.log(text)
    // const thenKeyword = GrammarUtils.findNodeForKeyword(expr.$cstNode, "=")
    // if (thenKeyword) {
    //   const index = thenKeyword.offset
    //   const previousChar = text.charAt(index - 1)
    //   if (previousChar !== ' ') {
    //     acceptor('error', ...)
    //   }
    // }

    const log = enterLog('checkVariableDef', expr.name)
    traceLog('expr.type:', `'${expr.type?.$cstNode?.text}'`)
    traceLog('expr.value:', `${expr.value?.$type}, '${expr.value?.$cstNode?.text}'`)

    if (expr.type && expr.value) {
      const cache = getTypeCache()
      const left = TypeSystem.inferType(expr.type, cache)
      const right = TypeSystem.inferType(expr.value, cache)

      traceLog(`${left.$type} = ${right.$type}`)

      if (!isAssignable(right, left)) {
        const tr = TypeSystem.typeToString(right)
        const tl = TypeSystem.typeToString(left)
        accept('error', `checkVariableDef: Type '${tr}' is not assignable to type '${tl}'.`, {
          node: expr,
          property: 'value',
        })
      }
    } else if (!expr.type && !expr.value) {
      accept('error', 'Variables require a type hint or an assignment at creation', {
        node: expr,
        property: 'name',
      })
    }
    exitLog(log)
  }

  /**
   * Validates a function definition by checking its return type and return statements.
   *
   * @param method - The function definition to be checked.
   * @param accept - The validation acceptor to report validation issues.
   *
   * This function performs the following checks:
   * 1. If the function has a body and a return type, it infers the expected return type.
   * 2. It extracts all return expressions from the function body.
   * 3. If there are no return statements and the expected return type is not 'void', it reports an error.
   * 4. For each return statement, it infers the return value type and checks if it is assignable to the expected return type.
   *    If not, it reports an error.
   */
  checkFunctionDef(method: ast.FunctionDef | ast.FunctionValue, accept: ValidationAcceptor): void {
    const log = enterLog('checkFunctionDef', method.$cstNode?.text)

    if (method.body && method.returnType) {
      const cache = getTypeCache()
      const expectedType = TypeSystem.inferType(method.returnType, cache)

      const returnStatements: ast.ReturnExpression[] = []
      this.extractReturnExpression(method.body, returnStatements)

      if (returnStatements.length === 0 && !TypeSystem.isVoidType(expectedType)) {
        accept('error', "A function whose declared type is not 'void' must return a value.", {
          node: method.returnType,
        })
        return
      }

      for (const returnStatement of returnStatements) {
        const returnValueType = TypeSystem.inferType(returnStatement, cache)
        if (!isAssignable(returnValueType, expectedType)) {
          const tr = TypeSystem.typeToString(returnValueType)
          const tl = TypeSystem.typeToString(expectedType)
          accept('error', `checkFunctionDef: Type '${tr}' is not assignable to type ` + `'${tl}'.`, {
            node: returnStatement,
          })
        }
      }
    }
    exitLog(log)
  }

  /**
   * Extracts all return expressions from the given AST node and adds them to the result array.
   * Block에서 모든 return문을 추출한다.
   * 이때 함수 선언 및 람다 함수 호출과 같이 return이 사용되었지만 return의 scope가 해당 블럭과 관련이 없는 것은 제외한다.
   *
   * @param node - The AST node to extract return expressions from.
   * @param result - An array to store the extracted return expressions.
   */
  extractReturnExpression(node: AstNode, result: ast.ReturnExpression[]) {
    // return AstUtils.streamAllContents(node).filter(ast.isReturnExpression).toArray()
    AstUtils.streamContents(node).forEach(n => {
      if (ast.isFunctionDef(n) || ast.isFunctionType(n) || ast.isFunctionValue(n)) return
      else if (ast.isReturnExpression(n)) result.push(n)
      else this.extractReturnExpression(n, result)
    })
  }

  /**
   * Checks the validity of a class declaration.
   *
   * @param decl - The class declaration object to be checked.
   * @param accept - The validation acceptor to report validation issues.
   */
  checkClassDeclaration(decl: ast.ObjectDef, accept: ValidationAcceptor): void {
    const log = enterLog('checkClassDeclaration', decl.name)
    // TODO: implement classes
    // accept("error", "Classes are currently unsupported.", {
    //   node: decl,
    //   property: "name",
    // })
    exitLog(log)
  }

  /**
   * Validates an assignment expression to ensure the right-hand side value is assignable to the left-hand side variable.
   *
   * @param expr - The assignment expression to validate.
   * @param accept - The validation acceptor to report validation issues.
   */
  checkAssignment(expr: ast.Assignment, accept: ValidationAcceptor): void {
    const log = enterLog('checkAssignment', expr.assign.$type)
    traceLog(`left: ${expr.assign.$container.$type}, ${expr.assign.$type}, ${expr.assign.$cstNode?.text}`)
    traceLog(`right: ${expr.value.$container.$type}, ${expr.value.$type}, ${expr.value.$cstNode?.text}`)

    const cache = getTypeCache()
    const left = TypeSystem.inferType(expr.assign, cache)
    const right = TypeSystem.inferType(expr.value, cache)

    traceLog(`${left.$type} = ${right.$type}`)

    if (!isAssignable(right, left)) {
      const tr = TypeSystem.typeToString(right)
      const tl = TypeSystem.typeToString(left)
      accept('error', `checkAssignment: Type '${tr}' is not assignable to type '${tl}'.`, {
        node: expr,
        property: 'value',
      })
    }
    exitLog(log)
  }

  /**
   * Checks if a unary operation is allowed on a given expression.
   *
   * @param unary - The unary expression to be checked.
   * @param accept - The validation acceptor to report errors.
   */
  checkUnaryOperationAllowed(unary: ast.UnaryExpression, accept: ValidationAcceptor): void {
    if (unary.operator) {
      const log = enterLog('checkUnaryOperationAllowed', unary.value.$type)
      const cache = getTypeCache()
      const item = TypeSystem.inferType(unary.value, cache)
      if (!isLegalOperation(unary.operator, item)) {
        accept(
          'error',
          `Cannot perform operation '${unary.operator}' on value of type '${TypeSystem.typeToString(item)}'.`,
          {
            node: unary,
          }
        )
      }
      exitLog(log)
    }
  }

  /**
   * Checks if a binary operation is allowed between two expressions.
   *
   * @param binary - The binary expression to be validated.
   * @param accept - The validation acceptor to report errors or warnings.
   *
   * This function performs the following steps:
   * 1. Logs the entry and details of the binary operation.
   * 2. Infers the types of the left and right expressions.
   * 3. Logs the inferred types.
   * 4. Checks if the binary operation is legal for the inferred types.
   * 5. If the operation is illegal, reports an error.
   * 6. If the operation is a comparison ('==' or '!='), checks if the comparison is always true or false and reports a warning if so.
   * 7. Logs the exit of the function.
   */
  checkBinaryOperationAllowed(binary: ast.BinaryExpression, accept: ValidationAcceptor): void {
    const log = enterLog('checkBinaryOperationAllowed', binary.operator)
    traceLog(`expression: '${binary.left.$cstNode?.text}' '${binary.operator}' '${binary.right.$cstNode?.text}'`)

    const cache = getTypeCache()
    const left = TypeSystem.inferType(binary.left, cache)
    const right = TypeSystem.inferType(binary.right, cache)

    traceLog(`${right.$type} = ${left.$type}`)

    if (!isLegalOperation(binary.operator, left, right)) {
      accept(
        'error',
        `Cannot perform operation '${binary.operator}' on values of type ` +
          `'${TypeSystem.typeToString(left)}' and '${TypeSystem.typeToString(right)}'.`,
        { node: binary }
      )
    } else if (['==', '!='].includes(binary.operator)) {
      if (!isLegalOperation(binary.operator, left, right)) {
        accept(
          'warning',
          `This comparison will always return '${binary.operator === '==' ? 'false' : 'true'}' as types ` +
            `'${TypeSystem.typeToString(left)}' and '${TypeSystem.typeToString(right)}' are not compatible.`,
          {
            node: binary,
            property: 'operator',
          }
        )
      }
    }
    exitLog(log)
  }
}

/**
 * Retrieves a new type cache.
 *
 * @returns {Map<AstNode, TypeDescription>} A new map instance to be used as a type cache.
 */
function getTypeCache(): Map<AstNode, TypeDescription> {
  return new Map()
}

/**
 * Determines if an operation between two types is legal.
 *
 * This function checks if the given operator can be legally applied to the provided types.
 * If either of the types is a union type, it will check all combinations of the union's element types.
 *
 * 연산자가 적법한 타입을 취하는지 확인한다.
 * any type은 모든 타입과 연산이 가능하다.
 * nil type은 일반적으로는 모든 타입과 연산이 안되지만 연산자마다 조금씩 다르다
 *
 * @param operator - The operator to be applied.
 * @param left - The left-hand side type description.
 * @param right - The right-hand side type description (optional).
 * @returns `true` if the operation is legal, otherwise `false`.
 */
function isLegalOperation(operator: string, left: TypeDescription, right?: TypeDescription): boolean {
  /**
   * Determines if the given operator is legal for the provided type descriptions.
   *
   * @param operator - The operator to check.
   * @param left - The left-hand side type description.
   * @param right - The right-hand side type description (optional).
   * @returns `true` if the operator is legal for the provided types, otherwise `false`.
   *
   * The function checks the legality of various operators including:
   * - String concatenation (`..`)
   * - Equality and inequality (`==`, `!=`)
   * - Arithmetic operators (`+`, `-`, `*`, `/`, `%`, `**`)
   * - Comparison operators (`<`, `<=`, `>`, `>=`)
   * - Logical operators (`and`, `or`, `&&`, `||`)
   * - Unary logical NOT (`not`, `!`)
   * - Type-related operators (`typeof`, `instanceof`)
   *
   * Special cases:
   * - If either type is `any`, the operation is considered legal.
   * - If either type is `nil`, the operation is considered legal for equality checks.
   * - String concatenation allows implicit type conversion for numbers and booleans.
   * - Unary plus and minus operators are only legal for numbers.
   * - Logical operators are only legal for booleans.
   * - Unary NOT operators are legal for booleans, strings, and numbers.
   */
  const isLegal = (operator: string, left: TypeDescription, right?: TypeDescription): boolean => {
    if (TypeSystem.isAnyType(left) || (right != undefined && TypeSystem.isAnyType(right))) {
      return true
    }

    // 문자열 접합 연산자
    // 문자열이 아닌 다른 자료형은 암묵적 형변환을 한다고 가정한다.
    // 그렇다고 해도 숫자형과 boolean형만 가능하다.
    if (operator === '..') {
      if (!right) {
        console.error(chalk.red('internal error'))
        return false
      }

      return (
        (TypeSystem.isStringType(left) || TypeSystem.isNumberType(left) || TypeSystem.isBooleanType(left)) &&
        (TypeSystem.isStringType(right) || TypeSystem.isNumberType(right) || TypeSystem.isBooleanType(right))
      )
    }

    // 동등 연산자
    // 값이 동등한지 아닌지를 판단하는 것이 아니라 동등 여부를 비교할 수 있는지 타입을 확인하는 것이다.
    // - 두 대상의 타입이 동일한 경우
    // - 한 대상의 타입이 any 타입인 경우
    // - 한 대상의 타입이 nil 타입인 경우 - 모든 타입은 nil 인지를 검사할 수 있다.
    else if (['==', '!='].includes(operator)) {
      if (!right) {
        console.error(chalk.red('internal error'))
        return false
      }

      if (
        TypeSystem.isAnyType(left) ||
        TypeSystem.isAnyType(right) ||
        TypeSystem.isNilType(left) ||
        TypeSystem.isNilType(right)
      ) {
        return true
      }

      return left.$type === right.$type
    }

    // plus, minus 연산자. Unary, Binary operator를 모두 포함한다.
    // 모두 number 타입과 관련된 연산자이다
    else if (['-', '+'].includes(operator)) {
      if (!right) return TypeSystem.isNumberType(left)
      return TypeSystem.isNumberType(left) && TypeSystem.isNumberType(right)
    }

    // 각종 산술 연산자, 비교 연산자
    // 모두 이항 연산자이며 number 타입과 관련된 연산자이다
    else if (['**', '*', '/', '%', '<', '<=', '>', '>='].includes(operator)) {
      if (!right) {
        console.error(chalk.red('internal error'))
        return false
      }

      return TypeSystem.isNumberType(left) && TypeSystem.isNumberType(right)
    }

    // 논리 연산자
    // 모두 이항 연산자이며 boolean 타입과 관련된 연산자이다
    else if (['and', 'or', '&&', '||'].includes(operator)) {
      if (!right) {
        console.error(chalk.red('internal error'))
        return false
      }

      return TypeSystem.isBooleanType(left) && TypeSystem.isBooleanType(right)
    }

    // 부정(논리적 NOT) 단항 연산자
    // 부정 단항 연산자는 문자열과 숫자에도 적용되는데 빈 문자열과 0 을 거짓으로 취급한다.
    else if (['not', '!'].includes(operator)) {
      return TypeSystem.isBooleanType(left) || TypeSystem.isStringType(left) || TypeSystem.isNumberType(left)
    }

    // typeof, instanceof 연산자
    //todo 일단은 모든 타입에 대해 적용 가능하다.
    else if (['typeof', 'instanceof'].includes(operator)) {
      return true
    }

    return true
  }

  // Union type이면 모든 내부 타입들을 하나씩 적용해서 적법한 연산이 있는지 확인한다.
  if (TypeSystem.isUnionType(left)) {
    for (const l of left.elementTypes) {
      if (right && TypeSystem.isUnionType(right)) {
        for (const r of right.elementTypes) {
          if (isLegal(operator, l, r)) return true
        }
      } else return isLegal(operator, l, right)
    }
  } else {
    if (right && TypeSystem.isUnionType(right)) {
      for (const r of right.elementTypes) {
        if (isLegal(operator, left, r)) return true
      }
    } else return isLegal(operator, left, right)
  }
  return false
}

/**
 * Determines if a type can be assigned to another type.
 * any type은 모든 타입과 연산이 가능하며 nil type은 모든 타입과 가능한 연산이 없다.
 *
 * @param from - The source type description.
 * @param to - The target type description.
 * @param indent - The indentation level for logging (default is 0).
 * @returns `true` if the `from` type can be assigned to the `to` type, otherwise `false`.
 *
 * The function checks for the following conditions:
 * - If the types are identical or if either type is `any`, it returns `true`.
 * - If the target type is a union type, it checks if the source type can be assigned to any of the union's element types.
 * - If the source type is a union type, it checks if any of the union's element types can be assigned to the target type.
 * - If either type is `nil`, it returns `true` only if both types are `nil`.
 * - If the source type is a class type, it checks if the target type is also a class type and if the source class is in the inheritance chain of the target class.
 * - If the source type is a function type, it checks if the target type is also a function type, if their return types are assignable, and if their parameters are assignable.
 */
function isAssignable(from: TypeDescription, to: TypeDescription): boolean {
  // 성능 향상을 위해 어느 하나의 타입이 any이면 바로 return true
  if (TypeSystem.isAnyType(from) || TypeSystem.isAnyType(to)) {
    return true
  }

  // 성능 향상을 위해 둘의 타입이 동일하면 바로 return true
  // 하지만 이 경우에도 function type이면 return type과 parameter type을 비교해야 한다.
  if (from.$type == to.$type) {
    if (TypeSystem.isFunctionType(from) && TypeSystem.isFunctionType(to)) {
      return TypeSystem.compareType(from, to)
    } else return true
  }

  // union type이면 각 세부 타입들의 조합을 검사한다.
  if (TypeSystem.isUnionType(to)) {
    return to.elementTypes.some(t => isAssignable(from, t))
  }

  if (TypeSystem.isUnionType(from)) {
    return from.elementTypes.some(t => isAssignable(t, to))
  }

  // nil type은 다른 타입과 연산이 되지 않지만 같은 nil인 경우에는 assignable될 수 있다.
  // 이 경우가 허락되지 않으면 nil을 return하는 함수의 경우가 문제가 된다.
  if (TypeSystem.isNilType(from) || TypeSystem.isNilType(to)) {
    if (TypeSystem.isNilType(from) && TypeSystem.isNilType(to)) return true
    else return false
  }

  if (TypeSystem.isObjectType(from)) {
    if (!TypeSystem.isObjectType(to)) {
      return false
    }
    const fromLit = from.literal
    if (ast.isObjectDef(fromLit)) {
      const fromChain = TypeSystem.getClassChain(fromLit)
      const toClass = to.literal
      for (const fromClass of fromChain) {
        if (fromClass === toClass) {
          return true
        }
      }
    } else if (ast.isObjectType(fromLit)) {
      console.log('from is object type', fromLit.$cstNode?.text)
    } else if (ast.isObjectValue(fromLit)) {
      console.log('from is object value', fromLit.$cstNode?.text)
    }
  }

  return from.$type === to.$type
}
