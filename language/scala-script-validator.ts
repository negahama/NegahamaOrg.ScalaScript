import { type ValidationAcceptor } from 'langium'
import * as ast from './generated/ast.js'
import { FunctionParameter, TypeDescriptor, TypeSystem } from './scala-script-types.js'
import { enterLog, exitLog, traceLog, reduceLog } from './scala-script-util.js'
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
    // for debugging...
    // if (stmt.name == 'a') {
    // console.log(`Type of variable '${stmt.name}' is ${chalk.green(TypeSystem.inferType(stmt).actual.toString())}`)
    // }

    const log = enterLog('checkVariableDef', stmt)
    traceLog('- stmt.type :', `${stmt.type?.$type}, '${reduceLog(stmt.type?.$cstNode?.text)}'`)
    traceLog('- stmt.value:', `${stmt.value?.$type}, '${reduceLog(stmt.value?.$cstNode?.text)}'`)

    // val 로 선언된 변수는 초기화가 필요하다.
    if (stmt.kind == 'val' && !stmt.value) {
      const msg = "checkVariableDef: 'val' declarations must be initialized."
      accept('error', msg, {
        node: stmt,
        property: 'name',
      })
    }

    // type과 value가 모두 있을 때 value는 type에 assignable이어야 한다.
    if (stmt.type && stmt.value) {
      traceLog('* checkVariableDef infer type')
      const left = TypeSystem.inferType(stmt.type).actual
      traceLog('* checkVariableDef infer value')
      const right = TypeSystem.inferType(stmt.value).actual
      traceLog(`* checkVariableDef result: ${left.toString()} = ${right.toString()}`)

      // object type의 변수는 object의 모든 프로퍼티가 초기화되어야 하는데 그러기 위해서는 isEqual로 체크되어야 한다.
      if (stmt.kind == 'val' && TypeSystem.isObjectType(left)) {
        if (!right.isEqual(left)) {
          const msg = `checkVariableDef: Type '${right.toString()}' is not equal type '${left.toString()}'.`
          accept('error', msg, {
            node: stmt,
            property: 'value',
          })
        }
      } else {
        const errors = right.checkAssignableTo(left)
        if (errors.length) {
          const msg = `checkVariableDef: ${errors.join(', ')}`
          accept('error', msg, {
            node: stmt,
            property: 'value',
          })
        }
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
    // for debugging...
    // if (ast.isFunctionDef(stmt)) { // && stmt.name == 'main') {
    //   const t = chalk.green(TypeSystem.inferType(stmt).actual.toString())
    //   console.log(`Type of function '${stmt.name}' is ${t}`)
    // } else {
    //   const t = chalk.green(TypeSystem.inferType(stmt).actual.toString())
    //   console.log(`Type of function '${reduceLog(stmt.$cstNode?.text)}' is ${t}`)
    // }

    const log = enterLog('checkFunctionDef', stmt)
    traceLog(`- return: ${stmt.returnType?.$type}, '${reduceLog(stmt.returnType?.$cstNode?.text)}'`)
    traceLog(`- body  : ${stmt.body?.$type}, '${reduceLog(stmt.body?.$cstNode?.text)}'`)

    if (stmt.body && stmt.returnType) {
      traceLog('* checkFunctionDef infer return')
      const retType = TypeSystem.inferType(stmt.returnType).actual
      traceLog('* checkFunctionDef infer body')
      const bodyType = TypeSystem.inferType(stmt.body).actual

      const tr = retType.toString()
      const tb = bodyType.toString()
      traceLog(`* checkFunctionDef result: ${tr} => ${tb}`)

      if (!bodyType.isAssignableTo(retType)) {
        const msg = `checkFunctionDef: Type '${tb}' is not assignable to type '${tr}'.`
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
  checkClassDef(stmt: ast.ClassDef | ast.ObjectValue, accept: ValidationAcceptor): void {
    let log: string
    if (ast.isClassDef(stmt)) {
      log = enterLog('checkClassDef', stmt)
    } else {
      log = enterLog('checkObjectValue', stmt)
    }
    // todo: implement classes
    // accept("error", "Classes are currently unsupported.", {
    //   node: decl,
    //   property: "name",
    // })
    exitLog(log)
  }

  /**
   * Validates the types of items in an array expression.
   *
   * This method checks that all items in the given array expression have the same type.
   * If an item has a different type than the first item, an error is reported.
   *
   * @param expr - The array expression to validate.
   * @param accept - The validation acceptor used to report validation issues.
   */
  checkArrayValue(expr: ast.ArrayValue, accept: ValidationAcceptor): void {
    const log = enterLog('checkArrayValue', expr)

    // let type: TypeDescriptor
    // expr.items.forEach((item, index) => {
    //   const itemType = TypeSystem.inferType(item).actual
    //   if (!type) {
    //     type = itemType
    //   } else if (!type.isEqual(itemType)) {
    //     const msg = `checkArrayValue: Array item at index ${index} has type '${itemType.toString()}' but expected '${type.toString()}'.`
    //     accept('error', msg, {
    //       node: item,
    //     })
    //   }
    // })

    exitLog(log)
  }

  /**
   * Validates a ForStatement node in the AST.
   *
   * @param stmt - The ForStatement node to be validated.
   * @param accept - The ValidationAcceptor used to report validation issues.
   */
  checkForStatement(stmt: ast.ForStatement, accept: ValidationAcceptor): void {
    const log = enterLog('checkForStatement', stmt)

    stmt.iterators.forEach(iterator => {
      if (ast.isForOf(iterator)) {
      } else if (ast.isForTo(iterator)) {
        if (!(iterator.to == 'to' || iterator.to == 'until')) {
          const msg = `checkForStatement: '${iterator.to}' is not valid. For-statement can only use 'to' or 'until'.`
          accept('error', msg, {
            node: iterator,
            property: 'to',
          })
        } else {
          const checkNumberType = (e: ast.Expression, property: 'e1' | 'e2') => {
            let type = TypeSystem.inferType(e).actual
            if (!TypeSystem.isNumberType(type)) {
              const msg =
                'checkForStatement: For-statement allow the number type for expression. ' +
                `Type '${type.toString()}' is not assignable to number.`
              accept('error', msg, {
                node: iterator,
                property,
              })
            }
          }

          checkNumberType(iterator.e1, 'e1')
          checkNumberType(iterator.e2, 'e2')
        }

        // stepValue가 있으면 `step`이 존재해야 하고 그렇지 않으면 아무것도 없어야 한다.
        let stepValueError = false
        if (!iterator.stepValue && iterator.step) stepValueError = true
        else if (iterator.stepValue && iterator.step != 'step') stepValueError = true
        if (stepValueError) {
          const msg = `checkForStatement: For-statement allow for step clause to be only 'step integer'.`
          accept('error', msg, {
            node: iterator,
          })
        }
      } else {
        console.error(chalk.red('internal error in checkForStatement'))
      }
    })

    exitLog(log)
  }

  /**
   * Validates an import statement.
   *
   * @param stmt - The import statement to validate.
   * @param accept - The validation acceptor to report validation issues.
   */
  checkImportStatement(stmt: ast.ImportStatement, accept: ValidationAcceptor): void {
    const log = enterLog('checkImportStatement', stmt)
    if (stmt.from != 'from') {
      const msg = `checkImportStatement: 'from' is expected but found '${stmt.from}'.`
      accept('error', msg, {
        node: stmt,
        property: 'from',
      })
    }
    exitLog(log)
  }

  /**
   * Validates a call chain expression.
   *
   * 스칼라스크립트는 타입스크립트와 마찬가지로 rest parameter의 타입을 배열 형태로 쓴다.
   * 타입스크립트에 정의된 많은 rest parameter를 가지는 함수의 정의는 아래의 `push()`의 정의와 비슷하다.
   * `push(...items: T[]): number`
   *
   * 그리고 `push()`를 `[1].push([2,3])`와 같이 사용하면 number[]를 number에 할당할 수 없다고 나온다.
   * 또한 rest parameter를 사용할 경우에도 예를들어 아래와 같이 rest parameter를 배열로 표시하지 않으면 에러가 된다.
   * `f(msg: string, ...optionalParams: number) { ... } // error`
   * 즉 items의 각 항목은 `T` 이고 `...items` 가 `T[]` 이라고 보는 것 같다.
   *
   * 하지만 `any[]` 대신 `any`는 사용가능한데 이는 `any`자체가 배열을 포함하기 때문으로 보인다.
   * 여튼 타입스크립트는 rest parameter를 `T[]` 로 표현하고 스칼라스크립트도 마찬가지이지만
   * items의 각 항목은 `T`의 배열이 아니라 `T`이기 때문에 이를 고려해야 한다.
   *
   * 스칼라스크립트에서 rest parameter를 처리하는데 있어 한가지 예외가 있는데 그것은 `concat()`의 처리이다.
   * `concat`은 `T`와 `T[]` 모두를 취할 수 있는데 스칼라스크립트는 아직 배열의 배열형이나 union의 배열형을
   * 지원하지 않기 때문에 이를 표현할 방법이 없다. generic의 union도 아직 지원하지 않는다.
   * 그래서 `concat`은 `any[]`형으로 되어져 있다.
   *
   * @param expr - The call chain expression to validate.
   * @param accept - The validation acceptor to collect validation results.
   * @returns void
   */
  checkCallChain(expr: ast.CallChain, accept: ValidationAcceptor): void {
    const log = enterLog('checkCallChain', expr)

    // default parameter, optional parameter, rest parameter등으로 인해 파라미터의 처리가 간단하지 않다.
    if (expr.isFunction) {
      const funcName = expr.element?.$refText

      const type = TypeSystem.inferType(expr).formal
      // for debugging...
      // if (funcName == 'main') {
      // console.log(`🚀 ~ checkCallChain: Type of function '${funcName}' is ${chalk.green(type?.toString())}`)
      // }

      if (!type) {
        console.error(chalk.red('checkCallChain:'), funcName, reduceLog(expr.$cstNode?.text))
      } else if (TypeSystem.isFunctionType(type)) {
        // 파라미터에서 반드시 필요로 하는 인수의 개수를 계산하고 현재 함수에서 제공하는 인수의 개수와 비교한다.
        // rest parameter는 반드시 마지막에 있어야 하고 한개만 존재할 수 있으므로 이것도 확인한다.
        // rest parameter는 위의 설명처럼 배열형이이야 하며 실제 사용시에는 element type을 쓴다.
        let needParamNum = 0
        let hasRestParam = false
        let hasRestError = false
        type.parameters.forEach((param, index) => {
          // nullable인 경우나 default value가 있는 경우는 꼭 필요한 인수에서 제외한다.
          if (!(param.nullable || param.defaultValue)) needParamNum++
          if (param.spread) {
            hasRestParam = true
            // 이 조건으로 마지막에 있어야 하는 것과 한개만 존재해야 하는 것이 모두 검사된다.
            if (index !== type.parameters.length - 1) {
              const errorMsg = 'rest parameter must be the last parameter'
              accept('error', errorMsg, {
                node: expr,
                property: 'args',
              })
              hasRestError = true
            }
            if (!TypeSystem.isArrayType(param.type)) {
              const errorMsg = 'rest parameter must be array type'
              accept('error', errorMsg, {
                node: expr,
                property: 'args',
              })
              hasRestError = true
            }
          }
        })
        if (hasRestError) {
          exitLog(log)
          return
        }

        const paramCount = type.parameters.length

        // rest parameter가 없으면 파라미터의 개수를 체크해 준다.
        if (!hasRestParam) {
          let errorMsg = ''
          // 최소한의 인수는 있어야 한다.
          if (expr.args.length < needParamNum) {
            errorMsg = `checkCallChain: Function '${funcName}' requires at least ${needParamNum} arguments.`
          }
          // 인수가 파라미터보다 많을 때
          if (expr.args.length > paramCount) {
            errorMsg =
              `checkCallChain: Function '${funcName}' has too many arguments. ` +
              `type: ${type.toString()}, expr.args: ${expr.args.length}, paramCount: ${paramCount}`
          }

          if (errorMsg) {
            accept('error', errorMsg, {
              node: expr,
              property: 'args',
            })
            exitLog(log)
            return
          }
        }

        // argument의 타입을 검사하고 문제가 있으면 에러 메시지를 리턴한다.
        const checkArg = (index: number, arg: ast.Expression, param: FunctionParameter) => {
          const argType = TypeSystem.inferType(arg).actual
          let paramType = param.type
          if (param.spread) {
            if (TypeSystem.isArrayType(param.type)) {
              paramType = param.type.elementType
            }
          }
          const errors = argType.checkAssignableTo(paramType)

          traceLog(`🚀 index: ${index}, match:`, errors)
          traceLog(`🚀   arg: '${reduceLog(arg.$cstNode?.text)}', ${chalk.green(argType.toString())}`)
          traceLog(`🚀   prm: '${param.name}', ${chalk.green(paramType.toString())}`)

          if (errors.length) {
            return (
              `checkCallChain: Function '${funcName}'s` +
              ` parameter '${arg.$cstNode?.text}' must to be '${paramType.toString()}'.` + 
              `\n  ${errors.join(', ')}`
            )
          }
          return ''
        }

        // rest parameter가 있을 경우에는 인수의 갯수는 체크하지 않지만 타입 체크는 한다.
        expr.args.forEach((arg, index) => {
          if (index < paramCount) {
            const errorMsg = checkArg(index, arg, type.parameters[index])
            if (errorMsg) {
              accept('error', errorMsg, {
                node: arg,
              })
            }
          } else {
            // rest parameter가 있을 경우에는 나머지 인수들을 모두 rest parameter의 타입과 비교한다.
            if (hasRestParam) {
              const errorMsg = checkArg(index, arg, type.parameters[paramCount - 1])
              if (errorMsg) {
                accept('error', errorMsg, {
                  node: arg,
                })
              }
            } else {
              const errorMsg = `checkCallChain: Function '${funcName}' has internal error.`
              accept('error', errorMsg, {
                node: arg,
              })
            }
          }
        })
      } else if (TypeSystem.isAnyType(type)) {
        // do nothing
      } else {
        // console.error(chalk.red('internal error in checkCallChain'), funcName, type.toString())
      }
    } else {
      // 이름과 타입이 제대로 되어져 있는지 확인용으로 남겨둔다.
      // const type = TypeSystem.inferType(expr).actual
      // console.log('🚀 ~ checkCallChain: type:', expr.element?.$refText, chalk.green(type.toString()))
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
    const log = enterLog('checkAssignment', expr)
    traceLog(`- left : ${expr.assign.$type}, '${reduceLog(expr.assign.$cstNode?.text)}'`)
    traceLog(`- right: ${expr.value.$type}, '${reduceLog(expr.value.$cstNode?.text)}'`)

    // val로 선언된 변수는 할당할 수 없어야 한다.
    // 하지만 배열이나 맵과 같이 내부 값을 변경하는 것은 가능해야 한다.
    if (ast.isCallChain(expr.assign) && !expr.assign.isArray) {
      const ref = expr.assign.element?.ref
      if (ast.isVariableDef(ref) && ref.kind == 'val') {
        const msg = `checkAssignment: Cannot assign to ${expr.assign} because it is 'val'.`
        accept('error', msg, {
          node: expr.assign,
        })
      }
    }

    traceLog('* checkAssignment infer left')
    const left = TypeSystem.inferType(expr.assign).actual
    traceLog('* checkAssignment infer right')
    const right = TypeSystem.inferType(expr.value).actual

    const tl = left.toString()
    const tr = right.toString()
    traceLog(`* checkAssignment result: ${tl} = ${tr}`)

    // 할당문의 오른쪽이 왼쪽에 할당될 수 있는지 확인한다.
    if (!right.isAssignableTo(left)) {
      const msg = `checkAssignment: Type '${tr}' is not assignable to type '${tl}'.` + 
        `\n  ${right.checkAssignableTo(left).join(', ')}`
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
  checkIfExpression(expr: ast.IfExpression, accept: ValidationAcceptor): void {
    const log = enterLog('checkIfExpression', expr)
    exitLog(log)
  }

  /**
   * Checks if a unary operation is allowed on a given expression.
   *
   * @param unary - The unary expression to be checked.
   * @param accept - The validation acceptor to report errors.
   */
  checkUnaryExpression(unary: ast.UnaryExpression, accept: ValidationAcceptor): void {
    const log = enterLog('checkUnaryExpression', unary)

    if (unary.operator) {
      traceLog('* checkUnaryExpression infer value')
      const item = TypeSystem.inferType(unary.value).actual
      if (!this.isLegalOperation(unary.operator, item)) {
        const msg =
          'checkUnaryExpression: Cannot perform operation ' +
          `'${unary.operator}' on value of type '${item.toString()}'.`
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
  checkBinaryExpression(binary: ast.BinaryExpression, accept: ValidationAcceptor): void {
    const log = enterLog('checkBinaryExpression', binary)
    traceLog(`- left : ${binary.left.$type}, '${reduceLog(binary.left.$cstNode?.text)}'`)
    traceLog(`- right: ${binary.right.$type}, '${reduceLog(binary.right.$cstNode?.text)}'`)

    traceLog('* checkBinaryExpression infer left')
    const left = TypeSystem.inferType(binary.left).actual
    traceLog('* checkBinaryExpression infer right')
    const right = TypeSystem.inferType(binary.right).actual

    const tl = left.toString()
    const tr = right.toString()
    traceLog(`* checkBinaryExpression result: ${tl} ${binary.operator} ${tr}`)

    if (['==', '!='].includes(binary.operator)) {
      if (!this.isLegalOperation(binary.operator, left, right)) {
        const msg =
          'checkBinaryExpression: This comparison will always return ' +
          `'${binary.operator === '==' ? 'false' : 'true'}' as types ` +
          `'${tl}' and '${tr}' are not compatible.`
        accept('warning', msg, {
          node: binary,
          property: 'operator',
        })
      }
    } else {
      if (!this.isLegalOperation(binary.operator, left, right)) {
        const msg = `checkBinaryExpression: Cannot perform operation '${binary.operator}' on values of type '${tl}' and '${tr}'.`
        accept('error', msg, {
          node: binary,
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
  isLegalOperation(operator: string, left: TypeDescriptor, right?: TypeDescriptor): boolean {
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
    const isLegal = (operator: string, l: TypeDescriptor, r?: TypeDescriptor): boolean => {
      if (TypeSystem.isAnyType(l) || (r != undefined && TypeSystem.isAnyType(r))) {
        return true
      }

      // 문자열 접합 연산자
      // 문자열이 아닌 다른 자료형은 암묵적 형변환을 한다고 가정한다.
      // 그렇다고 해도 숫자형과 boolean형만 가능하다.
      if (operator === '..') {
        if (!r) {
          console.error(chalk.red('internal error in string concatenation'))
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
          console.error(chalk.red('internal error in equality check'))
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
      // string 간의 비교도 가능한 것으로 한다.
      else if (['**', '*', '/', '%', '<', '<=', '>', '>='].includes(operator)) {
        if (!r) {
          console.error(chalk.red('internal error in arithmetic or comparison operator'))
          return false
        }

        if (['<', '<=', '>', '>='].includes(operator)) {
          return (
            (TypeSystem.isNumberType(l) && TypeSystem.isNumberType(r)) ||
            (TypeSystem.isStringType(l) && TypeSystem.isStringType(r))
          )
        }

        return TypeSystem.isNumberType(l) && TypeSystem.isNumberType(r)
      }

      // 논리 연산자
      // 모두 이항 연산자이며 boolean 타입과 관련된 연산자이다
      else if (['and', 'or', '&&', '||'].includes(operator)) {
        if (!r) {
          console.error(chalk.red('internal error in logical operator'))
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
