import { type ValidationAcceptor } from 'langium'
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
    const log = enterLog('checkVariableDef', `variable name: ${stmt.name}`)
    traceLog('stmt.type :', `${stmt.type?.$type}, '${stmt.type?.$cstNode?.text}'`)
    traceLog('stmt.value:', `${stmt.value?.$type}, '${stmt.value?.$cstNode?.text}'`)

    if (stmt.type && stmt.value) {
      const left = TypeSystem.inferType(stmt.type)
      const right = TypeSystem.inferType(stmt.value)

      traceLog(`checkVariableDef result: ${left.$type} = ${right.$type}`)

      if (!right.isAssignableTo(left)) {
        const msg = `checkVariableDef: Type '${right.toString()}' is not assignable to type '${left.toString()}'.`
        accept('error', msg, {
          node: stmt,
          property: 'value',
        })
      }
    } else if (!stmt.type && !stmt.value) {
      const msg = 'Variables require a type hint or an assignment at creation'
      accept('error', msg, {
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
      const returnType = TypeSystem.inferType(stmt.returnType)
      const bodyType = TypeSystem.inferType(stmt.body)

      traceLog(`checkFunctionDef result: ${returnType.$type} => ${bodyType.$type}`)

      if (!bodyType.isAssignableTo(returnType)) {
        const msg = `checkFunctionDef: Type '${bodyType.toString()}' is not assignable to type '${returnType.toString()}'.`
        accept('error', msg, {
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
    // todo: implement classes
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
    // if (expr.previous) {
    //   const previousType = TypeSystem.inferType(expr.previous)
    //   if (TypeSystem.isObjectType(previousType)) {
    //     const previous = expr.previous as ast.CallChain
    //     console.log('previous:', previous.$type, previous.$cstNode?.text)
    //     const found = findObjectDefWithName(expr, previous.$cstNode?.text)
    //     if (!found) {
    //       accept('error', `Object '${previous.$cstNode?.text}' is not defined.`, {
    //         node: expr,
    //       })
    //     }
    //   }
    // }

    //todo
    // default parameter, optional parameter, rest parameter등으로 인해 파라미터의 처리가 간단하지 않다.
    // 아울러 def에서 정의된 함수들은 아직 이름으로 함수를 찾지 못하고 있으며
    // 어떤 def인가에 따라서도 다르기 때문에 이름으로만 찾는 것도 불가능하다.
    // 또한 기정의된 console.log 같은 함수도 이 대상이 되는데 이것들의 파라미터도 정의되어져 있지 않다.
    if (expr.isFunction) {
      // const tt = TypeSystem.inferType(expr)
      // console.log('function:', expr.element?.$refText, expr.$cstNode?.text)
      // console.log('🚀 ~ ScalaScriptValidator ~ checkCallChain ~ tt:', tt.toString())
      // //todo 'e.date.isEqual()'에서 isEqual의 ref가 없다. 아니면 e.date이거나...
      // const ref = expr.element?.ref
      // const type = TypeSystem.inferType(ref)
      // if (!TypeSystem.isFunctionType(type)) {
      // } else {
      //   expr.args.forEach((arg, index) => {
      //     const argType = TypeSystem.inferType(arg)
      //     if (type.parameters.length === 1 && type.parameters[0].spread) {
      //       // rest parameter
      //       //todo 일단은 파라미터 체크를 하지 않는다.
      //     } else {
      //       const paramInfo = type.parameters[index]
      //       if (index >= type.parameters.length || !paramInfo) {
      //         console.log('function:', expr.element?.$refText, expr.$cstNode?.text)
      //         console.log('  ref:', ref.name, 'type:', type.$type, type.toString())
      //         console.log('  length:', index)
      //       } else {
      //         if (!paramInfo.type.isAssignableTo(argType)) {
      //           console.log('function:', expr.element?.$refText, expr.$cstNode?.text)
      //           console.log('  ref:', ref.name, 'type:', type.$type, type.toString())
      //           console.log(
      //             '  arg and param not match:',
      //             paramInfo.name,
      //             argType.toString(),
      //             paramInfo.type.toString()
      //           )
      //           // accept('error', `Arguments for function is not matched '${expr.element?.$refText}'.`, {
      //           //   node: expr,
      //           // })
      //         }
      //       }
      //     }
      //   })
      // }
      // const t = ScalaScriptCache.get(expr.element?.ref)
      // if (t) {
      //   console.log('  found in cache:', t.$type, t.toString())
      // } else {
      //   const found = ScalaScriptCache.findFunctionDefWithName(expr, expr.element?.$refText)
      //   if (found) {
      //     console.log('  found in defs:', found.$type)
      //   }
      // }
      // let definedName: string | undefined
      // let definedParams: ast.Parameter[] = []
      // if (ast.isFunctionDef(found)) {
      //   const func = found as ast.FunctionDef
      //   definedName = func.name
      //   definedParams = func.params
      // } else if (ast.isFunctionValue(found)) {
      //   const func = found as ast.FunctionValue
      //   definedName = func.$cstNode?.text
      //   definedParams = func.params
      // } else {
      //   console.error(chalk.red('internal error', found.$type))
      // }
      // console.log('defined:', definedName, definedParams.length, expr.args.length)
      // console.log('function:', expr.element?.$refText, expr.args.length)
      // if (expr.args.length > definedParams.length) {
      //   console.log('error', expr.args.length, definedParams.length)
      //   console.log('function:', definedName)
      //   accept('error', `Too many arguments for function '${expr.element?.$refText}'.`, {
      //     node: expr,
      //   })
      //   return
      // }
      // expr.args.forEach((arg, index) => {
      //   const definedType = TypeSystem.inferType(definedParams[index].type)
      //   const argType = TypeSystem.inferType(arg)
      //   if (!argType.isAssignableTo(definedType)) {
      //     const tr = argType.toString()
      //     const tl = definedType.toString()
      //     accept('error', `Type '${tr}' is not assignable to type '${tl}'.`, {
      //       node: arg,
      //     })
      //   }
      // })
    }
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
    traceLog(`left : ${expr.assign.$type}, ${expr.assign.$cstNode?.text}`)
    traceLog(`right: ${expr.value.$type}, ${expr.value.$cstNode?.text}`)

    const left = TypeSystem.inferType(expr.assign)
    const right = TypeSystem.inferType(expr.value)

    traceLog(`checkAssignment result: ${left.$type} = ${right.$type}`)

    if (!right.isAssignableTo(left)) {
      const msg = `checkAssignment: Type '${right.toString()}' is not assignable to type '${left.toString()}'.`
      accept('error', msg, {
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
    const log = enterLog('checkUnaryOperationAllowed', unary.value.$type)
    if (unary.operator) {
      const item = TypeSystem.inferType(unary.value)
      if (!this.isLegalOperation(unary.operator, item)) {
        const msg = `Cannot perform operation '${unary.operator}' on value of type '${item.toString()}'.`
        accept('error', msg, {
          node: unary,
        })
      }
    }
    exitLog(log)
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

    const left = TypeSystem.inferType(binary.left)
    const right = TypeSystem.inferType(binary.right)

    traceLog(`checkBinary result: ${right.$type} = ${left.$type}`)

    const tr = right.toString()
    const tl = left.toString()
    if (!this.isLegalOperation(binary.operator, left, right)) {
      const msg = `Cannot perform operation '${binary.operator}' on values of type '${tl}' and '${tr}'.`
      accept('error', msg, {
        node: binary,
      })
    } else if (['==', '!='].includes(binary.operator)) {
      if (!this.isLegalOperation(binary.operator, left, right)) {
        const msg =
          `This comparison will always return '${binary.operator === '==' ? 'false' : 'true'}' as types ` +
          `'${tl}' and '${tr}' are not compatible.`
        accept('warning', msg, {
          node: binary,
          property: 'operator',
        })
      }
    }
    exitLog(log)
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
}
