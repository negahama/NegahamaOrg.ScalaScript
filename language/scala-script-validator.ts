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
   *
   * @param expr
   * @param accept
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
      const map = getTypeCache()
      const left = TypeSystem.inferType(expr.type, map)
      const right = TypeSystem.inferType(expr.value, map)

      traceLog(`${right.$type} = ${left.$type}`)

      if (!isAssignable(right, left)) {
        accept(
          'error',
          `Type '${TypeSystem.typeToString(right)}' is not assignable to type '${TypeSystem.typeToString(left)}'.`,
          {
            node: expr,
            property: 'value',
          }
        )
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
   *
   * @param method
   * @param accept
   * @returns
   */
  checkFunctionDef(method: ast.FunctionDef, accept: ValidationAcceptor): void {
    const log = enterLog('checkFunctionDef', method.name)

    if (method.body && method.returnType) {
      const map = getTypeCache()
      const expectedType = TypeSystem.inferType(method.returnType, map)

      const returnStatements: ast.ReturnExpression[] = []
      this.extractReturnExpression(method.body, returnStatements)

      if (returnStatements.length === 0 && !TypeSystem.isVoidType(expectedType)) {
        accept('error', "A function whose declared type is not 'void' must return a value.", {
          node: method.returnType,
        })
        return
      }

      for (const returnStatement of returnStatements) {
        const returnValueType = TypeSystem.inferType(returnStatement, map)
        if (!isAssignable(returnValueType, expectedType)) {
          accept(
            'error',
            `Type '${TypeSystem.typeToString(returnValueType)}' is not assignable to type ` +
              `'${TypeSystem.typeToString(expectedType)}'.`,
            {
              node: returnStatement,
            }
          )
        }
      }
    }
    exitLog(log)
  }

  /**
   * Block에서 모든 return문을 추출한다.
   * 이때 함수 선언 및 람다 함수 호출과 같이 return이 사용되었지만 return의 scope가 해당 블럭과 관련이 없는 것은 제외한다.
   *
   * @param node
   * @param result
   */
  extractReturnExpression(node: AstNode, result: ast.ReturnExpression[]) {
    // return AstUtils.streamAllContents(node).filter(ast.isReturnExpression).toArray()
    AstUtils.streamContents(node).forEach(n => {
      if (ast.isFunctionDef(n) || ast.isFunctionValue(n)) return
      else if (ast.isReturnExpression(n)) result.push(n)
      else this.extractReturnExpression(n, result)
    })
  }

  /**
   *
   * @param declaration
   * @param accept
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
   *
   * @param expr
   * @param accept
   */
  checkAssignment(expr: ast.Assignment, accept: ValidationAcceptor): void {
    const log = enterLog('checkAssignment', expr.assign.$type)
    traceLog(`left: ${expr.assign.$container.$type}, ${expr.assign.$type}, ${expr.assign.$cstNode?.text}`)
    traceLog(`right: ${expr.value.$container.$type}, ${expr.value.$type}, ${expr.value.$cstNode?.text}`)

    const map = getTypeCache()
    const left = TypeSystem.inferType(expr.assign, map)
    const right = TypeSystem.inferType(expr.value, map)

    traceLog(`${right.$type} = ${left.$type}`)

    if (!isAssignable(right, left)) {
      accept(
        'error',
        `Type '${TypeSystem.typeToString(right)}' is not assignable to type '${TypeSystem.typeToString(left)}'.`,
        {
          node: expr,
          property: 'value',
        }
      )
    }
    exitLog(log)
  }

  /**
   *
   * @param unary
   * @param accept
   */
  checkUnaryOperationAllowed(unary: ast.UnaryExpression, accept: ValidationAcceptor): void {
    if (unary.operator) {
      const log = enterLog('checkUnaryOperationAllowed', unary.value.$type)
      const item = TypeSystem.inferType(unary.value, getTypeCache())
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
   *
   * @param binary
   * @param accept
   */
  checkBinaryOperationAllowed(binary: ast.BinaryExpression, accept: ValidationAcceptor): void {
    const log = enterLog('checkBinaryOperationAllowed', binary.operator)
    traceLog(`expression: '${binary.left.$cstNode?.text}' '${binary.operator}' '${binary.right.$cstNode?.text}'`)

    const map = getTypeCache()
    const left = TypeSystem.inferType(binary.left, map)
    const right = TypeSystem.inferType(binary.right, map)

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
 *
 * @returns
 */
export function getTypeCache(): Map<AstNode, TypeDescription> {
  return new Map()
}

/**
 * 연산자가 적법한 타입을 취하는지 확인한다.
 * any type은 모든 타입과 연산이 가능하다.
 * nil type은 일반적으로는 모든 타입과 연산이 안되지만 연산자마다 조금씩 다르다
 *
 * @param operator
 * @param left
 * @param right
 * @returns
 */
export function isLegalOperation(operator: string, left: TypeDescription, right?: TypeDescription): boolean {
  // Union type이면 모든 내부 타입들을 하나씩 적용해서 적법한 연산이 있는지 확인한다.
  if (TypeSystem.isUnionType(left)) {
    for (const l of left.elementTypes) {
      if (right && TypeSystem.isUnionType(right)) {
        for (const r of right.elementTypes) {
          if (isLegalOperation_(operator, l, r)) return true
        }
      } else return isLegalOperation_(operator, l, right)
    }
  } else {
    if (right && TypeSystem.isUnionType(right)) {
      for (const r of right.elementTypes) {
        if (isLegalOperation_(operator, left, r)) return true
      }
    } else return isLegalOperation_(operator, left, right)
  }
  return false
}

/**
 *
 * @param operator
 * @param left
 * @param right
 * @returns
 */
function isLegalOperation_(operator: string, left: TypeDescription, right?: TypeDescription): boolean {
  if (TypeSystem.isAnyType(left) || (right != undefined && TypeSystem.isAnyType(right))) {
    return true
  }

  // 문자열 접합 연산자
  if (operator === '..') {
    if (!right) {
      console.error(chalk.red('internal error'))
      return false
    }
    // 문자열 접합 연산자이지만 문자열이 아닌 다른 자료형은 암묵적 형변환을 한다고 가정한다.
    // 그렇다고 해도 숫자형과 boolean형만 가능하다.
    return (
      (TypeSystem.isStringType(left) || TypeSystem.isNumberType(left) || TypeSystem.isBooleanType(left)) &&
      (TypeSystem.isStringType(right) || TypeSystem.isNumberType(right) || TypeSystem.isBooleanType(right))
    )
  }

  // 동등 연산자
  else if (['==', '!='].includes(operator)) {
    if (!right) {
      console.error(chalk.red('internal error'))
      return false
    }
    /**
     * 비교 가능한지를 리턴한다. 비교 가능한 경우는 다음과 같다.
     *
     * 두 대상의 타입이 동일한 경우
     * 한 대상의 타입이 any 타입인 경우
     * 한 대상의 타입이 nil 타입인 경우 - 모든 타입은 nil 인지를 검사할 수 있다.
     */
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
  else if (['-', '+'].includes(operator)) {
    if (!right) return TypeSystem.isNumberType(left)
    return TypeSystem.isNumberType(left) && TypeSystem.isNumberType(right)
  }

  // 각종 산술 연산자, 비교 연산자
  else if (['**', '*', '/', '%', '<', '<=', '>', '>='].includes(operator)) {
    if (!right) {
      console.error(chalk.red('internal error'))
      return false
    }
    // 모두 숫자 타입과 관련된 연산자이다
    return TypeSystem.isNumberType(left) && TypeSystem.isNumberType(right)
  }

  // 논리 연산자
  else if (['and', 'or', '&&', '||'].includes(operator)) {
    if (!right) {
      console.error(chalk.red('internal error'))
      return false
    }
    return TypeSystem.isBooleanType(left) && TypeSystem.isBooleanType(right)
  }

  // 부정(논리적 NOT) 단항 연산자는 문자열과 숫자에도 적용되는데 빈 문자열과 0 을 거짓으로 취급한다.
  else if (['not', '!'].includes(operator)) {
    return TypeSystem.isBooleanType(left) || TypeSystem.isStringType(left) || TypeSystem.isNumberType(left)
  }

  // typeof, instanceof 연산자
  else if (['typeof', 'instanceof'].includes(operator)) {
    return true
  }
  return true
}

/**
 * any type은 모든 타입과 연산이 가능하며 nil type은 모든 타입과 가능한 연산이 없다.
 *
 * @param from
 * @param to
 * @returns
 */
export function isAssignable(from: TypeDescription, to: TypeDescription, indent: number = 0): boolean {
  // const space = "  ".repeat(indent)
  // console.log(space + `isAssignable: ${to.$type} = ${from.$type}`)

  // 성능 향상을 위해 둘의 타입이 동일하거나 어느 하나의 타입이 any이면 바로 return true
  if (from.$type == to.$type || TypeSystem.isAnyType(from) || TypeSystem.isAnyType(to)) {
    return true
  }

  // union type이면 각 세부 타입들의 조합을 검사한다.
  if (TypeSystem.isUnionType(to)) {
    return to.elementTypes.some(t => isAssignable(from, t, indent))
    // console.log(
    //   space + "to's union type:",
    //   to.elementTypes.map((t) => t.$type)
    // )
    // let result: boolean = false
    // to.elementTypes.forEach((t) => {
    //   console.log(space + "type compare:", t.$type, "=", from.$type)
    //   if (isAssignable(from, t, indent + 1)) result = true
    // })
    // return result
  }

  if (TypeSystem.isUnionType(from)) {
    return from.elementTypes.some(t => isAssignable(t, to, indent))
    // console.log(
    //   space + "from's union type:",
    //   from.elementTypes.map((t) => t.$type)
    // )
    // let result: boolean = false
    // from.elementTypes.forEach((t) => {
    //   console.log(space + "type compare:", to.$type, "=", t.$type)
    //   if (isAssignable(t, to, indent + 1)) result = true
    // })
    // return result
  }

  // nil type은 다른 타입과 연산이 되지 않지만 같은 nil인 경우에는 assignable될 수 있다.
  // 이 경우가 허락되지 않으면 nil을 return하는 함수의 경우가 문제가 된다.
  if (TypeSystem.isNilType(from) || TypeSystem.isNilType(to)) {
    if (TypeSystem.isNilType(from) && TypeSystem.isNilType(to)) return true
    else return false
  }

  if (TypeSystem.isClassType(from)) {
    if (!TypeSystem.isClassType(to)) {
      return false
    }
    const fromLit = from.literal
    if (ast.isObjectDef(fromLit)) {
      // console.log(space + `from is object: '${fromLit.name}'`)
      const fromChain = TypeSystem.getClassChain(fromLit)
      const toClass = to.literal
      for (const fromClass of fromChain) {
        if (fromClass === toClass) {
          return true
        }
      }
    } else if (ast.isObjectType(fromLit)) {
      // console.log(space + "from is object type", fromLit.$cstNode?.text)
    } else if (ast.isObjectValue(fromLit)) {
      // console.log(space + "from is object value", fromLit.$cstNode?.text)
    }
    // 둘 다 클래스 타입이면 일단 통과시킨다.
    // return false
  }

  if (TypeSystem.isFunctionType(from)) {
    if (!TypeSystem.isFunctionType(to)) {
      return false
    }
    if (!isAssignable(from.returnType, to.returnType)) {
      return false
    }
    if (from.parameters.length !== to.parameters.length) {
      return false
    }
    for (let i = 0; i < from.parameters.length; i++) {
      const fromParam = from.parameters[i]
      const toParam = to.parameters[i]
      if (!isAssignable(fromParam.type, toParam.type)) {
        return false
      }
    }
    return true
  }

  return from.$type === to.$type
}
