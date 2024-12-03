import { AstNode, type ValidationAcceptor } from 'langium'
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
   * @param stmt - The variable definition AST node to be checked.
   * @param accept - The validation acceptor to report validation issues.
   *
   * This function performs the following checks:
   * - Logs the entry and traces the type and value of the variable definition.
   * - If both type and value are present, it infers their types and checks if the value is assignable to the type.
   *   - If the value is not assignable to the type, it reports an error.
   * - If neither type nor value is present, it reports an error indicating that variables require a type hint or an assignment at creation.
   */
  checkVariableDef(stmt: ast.VariableDef, accept: ValidationAcceptor): void {
    // const text = AstUtils.getDocument(stmt).parseResult.value.$cstNode?.text
    // const text = (AstUtils.getDocument(stmt).parseResult.value.$cstNode as RootCstNode).fullText
    // console.log(text)
    // const thenKeyword = GrammarUtils.findNodeForKeyword(stmt.$cstNode, "=")
    // if (thenKeyword) {
    //   const index = thenKeyword.offset
    //   const previousChar = text.charAt(index - 1)
    //   if (previousChar !== ' ') {
    //     acceptor('error', ...)
    //   }
    // }

    const log = enterLog('checkVariableDef', stmt.name)
    traceLog('stmt.type:', `'${stmt.type?.$cstNode?.text}'`)
    traceLog('stmt.value:', `${stmt.value?.$type}, '${stmt.value?.$cstNode?.text}'`)

    if (stmt.type && stmt.value) {
      const cache = this.getTypeCache()
      const left = TypeSystem.inferType(stmt.type, cache)
      const right = TypeSystem.inferType(stmt.value, cache)

      traceLog(`${left.$type} = ${right.$type}`)

      if (!this.isAssignable(right, left)) {
        const tr = right.toString()
        const tl = left.toString()
        accept('error', `checkVariableDef: Type '${tr}' is not assignable to type '${tl}'.`, {
          node: stmt,
          property: 'value',
        })
      }
    } else if (!stmt.type && !stmt.value) {
      accept('error', 'Variables require a type hint or an assignment at creation', {
        node: stmt,
        property: 'name',
      })
    }
    exitLog(log)
  }

  /**
   * Validates a function definition by checking its return type and return statements.
   *
   * @param stmt - The function definition to be checked.
   * @param accept - The validation acceptor to report validation issues.
   *
   * This function performs the following checks:
   * 1. If the function has a body and a return type, it infers the expected return type.
   * 2. It extracts all return expressions from the function body.
   * 3. If there are no return statements and the expected return type is not 'void', it reports an error.
   * 4. For each return statement, it infers the return value type and checks if it is assignable to the expected return type.
   *    If not, it reports an error.
   */
  checkFunctionDef(stmt: ast.FunctionDef | ast.FunctionValue, accept: ValidationAcceptor): void {
    const log = enterLog('checkFunctionDef', stmt.$cstNode?.text)

    if (stmt.body && stmt.returnType) {
      const cache = this.getTypeCache()
      const returnType = TypeSystem.inferType(stmt.returnType, cache)
      const bodyType = TypeSystem.inferType(stmt.body, cache)

      if (!this.isAssignable(bodyType, returnType)) {
        const tr = bodyType.toString()
        const tl = returnType.toString()
        accept('error', `checkFunctionDef: Type '${tr}' is not assignable to type ` + `'${tl}'.`, {
          node: stmt.body,
        })
      }
    }
    exitLog(log)
  }

  /**
   * Checks the validity of a class declaration.
   *
   * @param stmt - The class declaration object to be checked.
   * @param accept - The validation acceptor to report validation issues.
   */
  checkObjectDef(stmt: ast.ObjectDef | ast.ObjectValue, accept: ValidationAcceptor): void {
    let log: string
    if (ast.isObjectDef(stmt)) {
      log = enterLog('checkObjectDef', stmt.name)
    } else {
      log = enterLog('checkObjectValue', stmt.$cstNode?.text)
    }
    // TODO: implement classes
    // accept("error", "Classes are currently unsupported.", {
    //   node: decl,
    //   property: "name",
    // })
    exitLog(log)
  }

  /**
   * Validates a call chain expression.
   *
   * @param expr - The call chain expression to validate.
   * @param accept - The validation acceptor to collect validation results.
   * @returns void
   */
  checkCallChain(expr: ast.CallChain, accept: ValidationAcceptor): void {
    const log = enterLog('checkCallChain', expr.$cstNode?.text)
    // if (expr.isFunction) {
    //   //todo
    //   console.log('checkCallChain', expr.$cstNode?.text)
    // }
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

    const cache = this.getTypeCache()
    const left = TypeSystem.inferType(expr.assign, cache)
    const right = TypeSystem.inferType(expr.value, cache)

    traceLog(`${left.$type} = ${right.$type}`)

    if (!this.isAssignable(right, left)) {
      const tr = right.toString()
      const tl = left.toString()
      accept('error', `checkAssignment: Type '${tr}' is not assignable to type '${tl}'.`, {
        node: expr,
        property: 'value',
      })
    }
    exitLog(log)
  }

  /**
   * Validates an IfExpression node in the AST.
   *
   * @param expr - The IfExpression node to validate.
   * @param accept - The validation acceptor to collect validation issues.
   */
  checkIfExpression(expr: ast.IfExpression, accept: ValidationAcceptor): void {}

  /**
   * Checks if a unary operation is allowed on a given expression.
   *
   * @param unary - The unary expression to be checked.
   * @param accept - The validation acceptor to report errors.
   */
  checkUnaryOperationAllowed(unary: ast.UnaryExpression, accept: ValidationAcceptor): void {
    if (unary.operator) {
      const log = enterLog('checkUnaryOperationAllowed', unary.value.$type)
      const cache = this.getTypeCache()
      const item = TypeSystem.inferType(unary.value, cache)
      if (!this.isLegalOperation(unary.operator, item)) {
        accept('error', `Cannot perform operation '${unary.operator}' on value of type '${item.toString()}'.`, {
          node: unary,
        })
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

    const cache = this.getTypeCache()
    const left = TypeSystem.inferType(binary.left, cache)
    const right = TypeSystem.inferType(binary.right, cache)

    traceLog(`${right.$type} = ${left.$type}`)

    const tr = right.toString()
    const tl = left.toString()
    if (!this.isLegalOperation(binary.operator, left, right)) {
      accept('error', `Cannot perform operation '${binary.operator}' on values of type ` + `'${tl}' and '${tr}'.`, {
        node: binary,
      })
    } else if (['==', '!='].includes(binary.operator)) {
      if (!this.isLegalOperation(binary.operator, left, right)) {
        accept(
          'warning',
          `This comparison will always return '${binary.operator === '==' ? 'false' : 'true'}' as types ` +
            `'${tl}' and '${tr}' are not compatible.`,
          {
            node: binary,
            property: 'operator',
          }
        )
      }
    }
    exitLog(log)
  }

  /**
   * Retrieves a new type cache.
   *
   * @returns {Map<AstNode, TypeDescription>} A new map instance to be used as a type cache.
   */
  getTypeCache(): Map<AstNode, TypeDescription> {
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
  isLegalOperation(operator: string, left: TypeDescription, right?: TypeDescription): boolean {
    /**
     * Determines if the given operator is legal for the provided type descriptions.
     *
     * @param operator - The operator to check.
     * @param l - The left-hand side type description.
     * @param r - The right-hand side type description (optional).
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
    const isLegal = (operator: string, l: TypeDescription, r?: TypeDescription): boolean => {
      if (TypeSystem.isAnyType(l) || (r != undefined && TypeSystem.isAnyType(r))) {
        return true
      }

      // 문자열 접합 연산자
      // 문자열이 아닌 다른 자료형은 암묵적 형변환을 한다고 가정한다.
      // 그렇다고 해도 숫자형과 boolean형만 가능하다.
      if (operator === '..') {
        if (!r) {
          console.error(chalk.red('internal error'))
          return false
        }

        return (
          (TypeSystem.isStringType(l) || TypeSystem.isNumberType(l) || TypeSystem.isBooleanType(l)) &&
          (TypeSystem.isStringType(r) || TypeSystem.isNumberType(r) || TypeSystem.isBooleanType(r))
        )
      }

      // 동등 연산자
      // 값이 동등한지 아닌지를 판단하는 것이 아니라 동등 여부를 비교할 수 있는지 타입을 확인하는 것이다.
      // - 두 대상의 타입이 동일한 경우
      // - 한 대상의 타입이 any 타입인 경우
      // - 한 대상의 타입이 nil 타입인 경우 - 모든 타입은 nil 인지를 검사할 수 있다.
      else if (['==', '!='].includes(operator)) {
        if (!r) {
          console.error(chalk.red('internal error'))
          return false
        }

        if (TypeSystem.isAnyType(l) || TypeSystem.isAnyType(r) || TypeSystem.isNilType(l) || TypeSystem.isNilType(r)) {
          return true
        }

        return l.isEqual(r)
      }

      // plus, minus 연산자. Unary, Binary operator를 모두 포함한다.
      // 모두 number 타입과 관련된 연산자이다
      else if (['-', '+'].includes(operator)) {
        if (!r) return TypeSystem.isNumberType(l)
        return TypeSystem.isNumberType(l) && TypeSystem.isNumberType(r)
      }

      // 각종 산술 연산자, 비교 연산자
      // 모두 이항 연산자이며 number 타입과 관련된 연산자이다
      else if (['**', '*', '/', '%', '<', '<=', '>', '>='].includes(operator)) {
        if (!r) {
          console.error(chalk.red('internal error'))
          return false
        }

        return TypeSystem.isNumberType(l) && TypeSystem.isNumberType(r)
      }

      // 논리 연산자
      // 모두 이항 연산자이며 boolean 타입과 관련된 연산자이다
      else if (['and', 'or', '&&', '||'].includes(operator)) {
        if (!r) {
          console.error(chalk.red('internal error'))
          return false
        }

        return TypeSystem.isBooleanType(l) && TypeSystem.isBooleanType(r)
      }

      // 부정(논리적 NOT) 단항 연산자
      // 부정 단항 연산자는 문자열과 숫자에도 적용되는데 빈 문자열과 0 을 거짓으로 취급한다.
      else if (['not', '!'].includes(operator)) {
        return TypeSystem.isBooleanType(l) || TypeSystem.isStringType(l) || TypeSystem.isNumberType(l)
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
  isAssignable(from: TypeDescription, to: TypeDescription): boolean {
    return from.isAssignableTo(to)

    // // 성능 향상을 위해 어느 하나의 타입이 any이면 바로 return true
    // if (TypeSystem.isAnyType(from) || TypeSystem.isAnyType(to)) {
    //   return true
    // }

    // // 성능 향상을 위해 둘의 타입이 동일하면 바로 return true
    // // function type이면 return type과 parameter type을 비교한다.
    // if (from.isEqual(to)) {
    //   return true
    // }

    // // to가 union type이면 각 세부 타입들의 조합을 검사한다.
    // if (TypeSystem.isUnionType(to)) {
    //   return to.elementTypes.some(t => this.isAssignable(from, t))
    // }

    // // from이 union type이면 to도 동일한 union type이어야 한다.
    // if (TypeSystem.isUnionType(from)) {
    //   return from.isEqual(to)
    // }

    // // nil type은 다른 타입과 연산이 되지 않지만 같은 nil인 경우에는 assignable될 수 있다.
    // // 이 경우가 허락되지 않으면 nil을 return하는 함수의 경우가 문제가 된다.
    // if (TypeSystem.isNilType(from) || TypeSystem.isNilType(to)) {
    //   return from.isEqual(to)
    // }

    // if (TypeSystem.isObjectType(from)) {
    //   if (!TypeSystem.isObjectType(to)) {
    //     return false
    //   }
    //   const fromLit = from.literal
    //   if (ast.isObjectDef(fromLit)) {
    //     const fromChain = TypeSystem.getClassChain(fromLit)
    //     const toClass = to.literal
    //     for (const fromClass of fromChain) {
    //       if (fromClass === toClass) {
    //         return true
    //       }
    //     }
    //   } else if (ast.isObjectType(fromLit)) {
    //     console.error(chalk.red('from is object type', fromLit.$cstNode?.text))
    //   } else if (ast.isObjectValue(fromLit)) {
    //     console.error(chalk.red('from is object value', fromLit.$cstNode?.text))
    //   }
    // }

    // return from.isEqual(to)
  }
}
