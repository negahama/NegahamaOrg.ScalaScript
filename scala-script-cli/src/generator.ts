import * as fs from 'node:fs'
import * as path from 'node:path'
import { AstUtils } from 'langium'
import { expandToNode, joinToNode, toString } from 'langium/generate'
import { extractDestinationAndName } from './cli-util.js'
import * as ast from '../../language/generated/ast.js'
import chalk from 'chalk'

/**
 * Generates a TypeScript file from the given AST program and writes it to the specified destination.
 *
 * @param program - The AST program to be transpiled into TypeScript.
 * @param filePath - The file path of the source file being transpiled.
 * @param destination - The directory where the generated TypeScript file should be saved. If undefined, the file will be saved in the same directory as the source file.
 * @returns The file path of the generated TypeScript file.
 */
export function generateTypeScript(program: ast.Program, filePath: string, destination: string | undefined): string {
  const data = extractDestinationAndName(filePath, destination)
  const generatedFilePath = `${path.join(data.destination, data.name)}.ts`

  const fileNode = expandToNode`
    // This is transpiled by ScalaScript
    "use strict";

    ${joinToNode(program.codes, code => generateCode(code), {
      appendNewLineIfNotEmpty: true,
    })}
  `.appendNewLineIfNotEmpty()

  if (!fs.existsSync(data.destination)) {
    fs.mkdirSync(data.destination, { recursive: true })
  }
  fs.writeFileSync(generatedFilePath, toString(fileNode))
  return generatedFilePath
}

/**
 * Generates code from the given AST (Abstract Syntax Tree) node.
 *
 * @param code - The AST node representing the code to be generated.
 * @returns The generated code as a string.
 *
 * @remarks
 * This function determines whether the given AST node is a statement or an expression
 * and generates the corresponding code. If the node is neither a statement nor an expression,
 * an error message is logged.
 */
function generateCode(code: ast.Code): string {
  let result = ''
  if (ast.isStatement(code)) result += generateStatement(code, 0)
  else if (ast.isExpression(code)) result += generateExpression(code, 0)
  else console.log(chalk.red('ERROR in Code:', code))
  return result
}

/**
 * Generates a string representation of a given AST statement with the specified indentation.
 *
 * @param stmt - The AST statement to generate. It can be undefined.
 * @param indent - The number of spaces to use for indentation.
 * @returns The generated string representation of the statement.
 */
function generateStatement(stmt: ast.Statement | undefined, indent: number): string {
  let result = ''
  if (stmt == undefined) return result
  if (ast.isVariableDef(stmt)) {
    result += transpileVariableDef(stmt, indent)
  } else if (ast.isFunctionDef(stmt)) {
    result += transpileFunctionDef(stmt, indent)
  } else if (ast.isObjectDef(stmt)) {
    result += transpileObjectDef(stmt, indent)
  } else if (ast.isDoStatement(stmt)) {
    result += transpileDoStatement(stmt, indent)
  } else if (ast.isForStatement(stmt)) {
    result += transpileForStatement(stmt, indent)
  } else if (ast.isWhileStatement(stmt)) {
    result += transpileWhileStatement(stmt, indent)
  } else if (ast.isThrowStatement(stmt)) {
    result += transpileThrowStatement(stmt, indent)
  } else if (ast.isTryCatchStatement(stmt)) {
    result += transpileTryCatchStatement(stmt, indent)
  } else if (ast.isContinue(stmt)) {
    result += 'continue'
  } else if (ast.isBreak(stmt)) {
    result += 'break'
  } else if (ast.isBypass(stmt)) {
    result += transpileBypass(stmt, indent)
  } else {
    console.log(chalk.red('ERROR in Statement'))
  }

  /*
    코드 생성시 NewLine 처리는 indent등의 이유로 AstNode별로 간단하게 적용할 순 없다.
    하지만 전혀 없으면 매우 가독성이 떨어지고 코드 품질이 나빠보이므로 최소한의 규칙만 적용한다.
    아래의 AstNode 구문은 해당 구문 전에 newline을 추가해 주는데 모두 indent가 없을 경우이다.
    indent가 있을 경우에는 indent + newline + 내용(내용 앞에 newline이 붙으므로)의 형태가 되어 문제가 되므로
    세밀하게 조정해야 하지만 효과가 크지 않기 때문에 효과적인 ObjectDef, ByPass만 indent가 있는 경우에도 적용되게 하였다.
  */
  const newLineNode = [
    ast.ObjectDef,
    ast.DoStatement,
    ast.ForStatement,
    ast.WhileStatement,
    ast.ThrowStatement,
    ast.TryCatchStatement,
    ast.Bypass,
  ]

  if (newLineNode.some(node => node === stmt.$type) && indent == 0) result = '\n' + result
  return result
}

/**
 * Generates a string representation of the given AST expression.
 *
 * @param expr - The AST expression to generate the string for. It can be of various types defined in the `ast` module.
 * @param indent - The current indentation level for formatting the generated string.
 * @returns The string representation of the given AST expression.
 *
 * The function handles different types of expressions including:
 * - Assignment expressions
 * - Logical NOT expressions
 * - Call chain expressions
 * - If expressions
 * - Match expressions
 * - Group expressions
 * - Unary expressions
 * - Binary expressions
 * - Infix expressions
 * - Return expressions
 * - Spread expressions
 * - New expressions
 * - Array values
 * - Object values
 * - Function values
 * - Literals (with special handling for `nil` to `undefined`)
 *
 * If the expression type is not recognized, an error message is logged.
 */
function generateExpression(expr: ast.Expression | undefined, indent: number): string {
  let result = ''
  if (expr == undefined) return result
  if (ast.isAssignment(expr)) {
    result += transpileAssignment(expr, indent)
  } else if (ast.isLogicalNot(expr)) {
    result += transpileLogicalNot(expr, indent)
  } else if (ast.isCallChain(expr)) {
    result += transpileCallChain(expr, indent)
  } else if (ast.isIfExpression(expr)) {
    result += transpileIfExpression(expr, indent)
  } else if (ast.isMatchExpression(expr)) {
    result += transpileMatchExpression(expr, indent)
  } else if (ast.isGroupExpression(expr)) {
    result += transpileGroupExpression(expr, indent)
  } else if (ast.isUnaryExpression(expr)) {
    result += transpileUnaryExpression(expr, indent)
  } else if (ast.isBinaryExpression(expr)) {
    result += transpileBinaryExpression(expr, indent)
  } else if (ast.isInfixExpression(expr)) {
    result += transpileInfixExpression(expr, indent)
  } else if (ast.isReturnExpression(expr)) {
    result += transpileReturnExpression(expr, indent)
  } else if (ast.isSpreadExpression(expr)) {
    result += transplieSpreadExpression(expr, indent)
  } else if (ast.isNewExpression(expr)) {
    result += transpileNewExpression(expr, indent)
  } else if (ast.isArrayValue(expr)) {
    result += transpileArrayValue(expr, indent)
  } else if (ast.isObjectValue(expr)) {
    result += transpileObjectValue(expr, indent)
  } else if (ast.isFunctionValue(expr)) {
    result += transpileFunctionValue(expr, indent)
  } else if (ast.isLiteral(expr)) {
    // nil 만 undefined로 변경한다.
    result += expr.value == 'nil' ? 'undefined' : expr.value
  } else {
    console.log(chalk.red('ERROR in Expression:', expr))
  }
  
  return result
}

/**
 * Transpiles a variable definition statement into a string representation.
 *
 * @param stmt - The variable definition statement to transpile.
 * @param indent - The current indentation level.
 * @param isClassMember - Indicates if the variable is a class member.
 * @returns The transpiled string representation of the variable definition.
 */
/*
  타입스크립트로 변환할 때 다음과 같은 점을 고려해야 한다.

  1) val, var, fun
  타입스크립트에서는 부모 클래스의 프로퍼티를 자식 클래스에서 재정의하는 것이 가능하다.
  (대신 override가 필요하고 함수가 아니기 때문에 super 호출은 되지 않는다)
  하지만 스칼라스크립트에서는 부모 클래스에서 val로 정의된 함수형 변수는 자식 클래스에서 재정의할 수 없다.
  var로 정의된 함수형 변수는 타입스크립트의 함수형 변수(프로퍼티)로 변환되는데 일부는 함수로 변환해야 한다.
  fun으로 시작하는 것은 함수 정의이므로 여기서 처리되지 않는다.
  
  2) Override
  override는 타입스크립트의 컴파일 옵션인 noImplicitOverride 옵션의 영향을 받는데
  여기서는 이 옵션이 true인 경우 즉 명시적으로 override를 선언해야 하는 경우를 살펴본다.
  먼저 noImplicitOverride가 true이면 부모 클래스와 동일한 이름은 무조건 override가 있어야 한다.
  
  3) Super
  타입스크립트에서 함수형 변수는 자식 클래스에서 재정의할 수 있지만 super를 사용할 수는 없다.
  이 경우 자식 클래스에서 함수로 변환할 수도 있지만 부모 클래스에서 함수형 변수로 선언되어진 경우에는
  자식 클래스에서 동일한 이름의 함수를 선언하는 것도 에러이기 때문에 의미가 없다. (아래의 코드에서 f3은 에러임)
  하지만 개념적으로도 super를 사용하려면 super의 대상이 함수이어야 하므로 부모 클래스에서는 함수인 것으로 가정한다.
  그리고 자식 클래스에서는 super가 있으면 해당 메서드가 부모 클래스에서 함수로 이미 정의되어져 있다고 가정하고
  자식 클래스에서는 함수로 변환하고 override를 추가한다. 이렇게 하면 스칼라스크립트에서는
  자식 클래스에서 메서드가 함수이든 함수형 변수이던 super를 사용할 수 있다.

  4) 함수로의 변환
  함수형 변수는 함수로 변환되어야 하는 경우가 있다. 위의 super를 포함하는 경우도 이에 해당한다.
  이 외에도 constructor, argument가 디폴트 값을 가지는 경우도 타입스크립트에서 함수형 변수로는 처리할 수 없으므로
  함수로 변환되어야 한다. 스칼라스크립트에서는 이것들은 함수이던지, 함수형 변수이든지, 함수형 상수이든지 상관없다.
  
  5) 타입스크립트에서의 함수형 변수와 함수의 차이
  class Parent {
    f1(): number { return 1 }
    f2(): number { return 1 }
    f3 = (): number => { return 1 }
    f4 = (): number => { return 1 }
  }

  class Children extends Parent {
    override f1(): number { return 1 }
    override f2 = (): number => { return 1 }
    override f3(): number { return 1 }
    override f4 = (): number => { return 1 }
  }

  같은 형태로의 변환은 당연히 되고 다른 형태로 변환하는 경우는 f3만 에러가 된다.
  즉 함수는 함수형 변수로 재정의가 될 수 있지만 함수형 변수는 파생 클래스에서 함수로 재정의 할 수 없다.
*/
function transpileVariableDef(stmt: ast.VariableDef, indent: number, isClassMember: boolean = false): string {
  let result = ''
  if (stmt.annotate == 'NotTrans') return result

  // 이 함수는 일반적인 변수 정의로 변환하는데 함수형 변수인 경우에만 함수로 변환하거나 override를 추가한다.
  // 코드의 가독성을 높이기 위해서 코드가 좀 중복되더라도 함수형 변수인 경우만 따로 처리한다.
  // 먼저 함수형이 아닌 경우를 먼저 처리하고 리턴한다.
  if (!(stmt.value && ast.isFunctionValue(stmt.value))) {
    if (stmt.export) result += 'export '
    if (stmt.private) result += 'private '
    if (stmt.static) result += 'static '

    if (!isClassMember) {
      if (stmt.kind == 'var') result += 'let '
      if (stmt.kind == 'val') result += 'const '
    }
    result += stmt.name + (stmt.nullable ? '?' : '')
    result += stmt.type ? `: ${generateTypes(stmt.type, indent)}` : ''
    result += stmt.value ? ' = ' + generateExpression(stmt.value, indent) : ''
    return result
  }

  // 여기서부터는 함수형 변수인 경우이다.
  // 함수형 변수 처리가 복잡하지만 이 모든 처리는 결국은 이 함수형 변수가 에러인지, 함수로 변환되어야 하는지,
  // override를 붙여야 하는지를 판단하기 위해서이다.
  let isError: string[] = []
  let isFunction = false
  let isOverride = false

  // 1) 먼저 함수형 변수가 있는 클래스가 부모 클래스를 가지고 있으면 부모 클래스를 찾는다.
  //   부모 클래스가 없으면 일반적인 처리를 하면 되는데 있지만 못찾는 경우는 에러 처리를 해야 한다.
  // 2) 부모 클래스에서 동일한 이름이 쓰이고 있는지를 확인한다.
  //   동일한 이름이 없으면 일반적인 처리를 한다. 이름이 쓰이면 무조건 override가 추가되어야 한다.
  // 3-1) 부모 클래스에서 해당 이름이 val 변수이면 이것을 재정의하고 있는 현재 상태는 에러인 것이다.
  //   따라서 적절한 에러 처리를 해야 한다.
  // 3-2) 해당 이름이 var 변수이면 재정의되어질 수 있으므로 대부분 일반적인 변환 과정을 거치면 된다.
  //   하지만 일부 함수형 변수는 변환시 함수로 변환되어야 하는 것들이 있는데 아래와 같은 경우들이다.
  //   3-2-1) argument가 디폴트 값을 가지는 경우
  //   3-2-2) super 호출이 있는 경우
  // 4) 함수형 변수의 이름이 constructor인 경우는 어떤 경우라도 함수로 변환되어야 한다.
  // 위의 주석 [[al=42c6f56d6b52aeb10a6d766534a7d38a]]도 참조.

  if (stmt.name == 'constructor') {
    isFunction = true
  }

  const currClass = AstUtils.getContainerOfType(stmt, ast.isObjectDef)
  if (currClass && currClass.superClass) {
    // 부모 클래스가 있는 경우 부모 클래스를 찾는다.
    const superClass = currClass.superClass.ref
    if (superClass && ast.isObjectDef(superClass) && superClass.name == currClass.superClass.$refText) {
      // 부모 클래스에서 동일한 이름이 쓰이고 있는지를 확인한다.
      let foundName: ast.FunctionDef | ast.VariableDef | ast.ObjectDef | undefined
      // bypass는 name이 없으므로 제외하고 나머지 중에서 동일한 이름을 찾는다.
      // 하지만 아래에서 결국 ast.VariableDef인 경우만 처리하고 나머지는 에러로 처리한다.
      superClass.body.elements.forEach(e => {
        if (!ast.isBypass(e) && e.name == stmt.name) {
          foundName = e
        }
      })

      // 이름을 찾았으면
      if (foundName) {
        if (ast.isVariableDef(foundName)) {
          if (foundName.kind == 'val') {
            isError.push(`'${stmt.name}' is a function constant in ${superClass.name}`)
          } else if (foundName.kind == 'var') {
            isOverride = true
            // 함수형 변수로 변환하는데 몇가지 경우에는 함수로 변환한다.
            stmt.value.params.forEach(param => {
              if (param.value) {
                isFunction = true
              }
            })

            // 함수의 바디에 super 호출이 있는 경우
            // fun 으로 정의되는 경우에는 super 호출이 관련이 없지만 변수인 상황에서는 이것은 에러에 해당한다.
            const callchain = AstUtils.streamAllContents(stmt.value.body).filter(ast.isThisOrSuper)
            callchain.forEach(cc => {
              if (cc.this == 'super') {
                isError.push(`'${stmt.name}' is not allowed to call super`)
              }
            })
          }
        } else {
          // 동일한 이름이 동일한 종류(함수형 변수)로 쓰이지 않는 경우
          isError.push(`internal error: '${stmt.name}' is not a variable`)
        }
      } else {
        // 동일한 이름이 쓰이고 있지 않은 경우
      }
    } else {
      // 부모 클래스가 있지만 찾을 수 없는 경우
      isError.push(`internal error: '${currClass.superClass.$refText}' is not found`)
    }
  } else {
    // 해당 클래스는 부모 클래스가 없는 경우
  }

  if (isError.length != 0) {
    isError.forEach(e => console.error(chalk.red(e)))
    return result
  }

  if (stmt.export) result += 'export '
  if (stmt.private) result += 'private '
  if (stmt.static) result += 'static '

  if (isFunction) {
    result += generateFunction({
      includeFunction: !isClassMember,
      override: isOverride,
      name: stmt.name,
      params: stmt.value.params,
      paramsForceBracket: true,
      returnType: stmt.value.returnType,
      body: stmt.value.body,
      bodyForceBracket: true,
      indent,
    })
    return result
  }

  if (!isClassMember) {
    if (stmt.kind == 'var') result += 'let '
    if (stmt.kind == 'val') result += 'const '
  }

  if (isOverride) result += 'override '

  result += stmt.name + (stmt.nullable ? '?' : '')
  result += stmt.type ? `: ${generateTypes(stmt.type, indent)}` : ''
  result += stmt.value ? ' = ' + generateExpression(stmt.value, indent) : ''
  return result
}

/**
 * Transpiles an AST function definition into a TypeScript function declaration.
 *
 * @param stmt - The AST node representing the function definition.
 * @param indent - The current indentation level.
 * @param isClassMethod - A boolean indicating if the function is a class method. Defaults to `false`.
 * @returns The transpiled TypeScript function declaration as a string.
 */
function transpileFunctionDef(stmt: ast.FunctionDef, indent: number, isClassMethod: boolean = false): string {
  let result = ''
  if (stmt.annotate == 'NotTrans') return result

  // 함수의 정의도 함수형 변수에서의 처리와 거의 유사하지만 조금 다르다.
  let isError: string[] = []
  let isOverride = false

  // 내가 파생 클래스이면 부모 클래스를 찾아서 동일한 이름이 쓰이고 있는지를 확인한다.
  const currClass = AstUtils.getContainerOfType(stmt, ast.isObjectDef)
  if (currClass && currClass.superClass) {
    // 부모 클래스가 있는 경우 부모 클래스를 찾는다.
    const superClass = currClass.superClass.ref
    if (superClass && ast.isObjectDef(superClass) && superClass.name == currClass.superClass.$refText) {
      // 부모 클래스에서 동일한 이름이 쓰이고 있는지를 확인한다.
      let foundName: ast.FunctionDef | ast.VariableDef | ast.ObjectDef | undefined
      // bypass는 name이 없으므로 제외하고 나머지 중에서 동일한 이름을 찾는다.
      // 하지만 아래에서 결국 ast.FunctionDef인 경우만 처리하고 나머지는 에러로 처리한다.
      superClass.body.elements.forEach(e => {
        if (!ast.isBypass(e) && e.name == stmt.name) {
          foundName = e
        }
      })

      // 이름을 찾았으면
      if (foundName) {
        if (ast.isFunctionDef(foundName)) {
          isOverride = true
        } else {
          // 동일한 이름이 동일한 종류(함수형 변수)로 쓰이지 않는 경우
          isError.push(`internal error: '${stmt.name}' is not a variable`)
        }
      } else {
        // 동일한 이름이 쓰이고 있지 않은 경우
      }
    } else {
      // 부모 클래스가 있지만 찾을 수 없는 경우
      isError.push(`internal error: '${currClass.superClass.$refText}' is not found`)
    }
  } else {
    // 해당 클래스는 부모 클래스가 없는 경우
  }

  if (isError.length != 0) {
    isError.forEach(e => console.error(chalk.red(e)))
    return result
  }

  if (stmt.export) result += 'export '
  if (stmt.private) result += 'private '
  if (stmt.static) result += 'static '

  result += generateFunction({
    includeFunction: !isClassMethod,
    override: isOverride,
    name: stmt.name,
    generic: stmt.generic,
    params: stmt.params,
    returnType: stmt.returnType,
    body: stmt.body,
    bodyForceBracket: true,
    indent,
  })
  return result
}

/**
 * Transpiles an object definition statement into a TypeScript class or interface definition.
 *
 * @param stmt - The object definition statement to transpile.
 * @param indent - The current indentation level.
 * @returns The transpiled TypeScript code as a string.
 *
 * The function checks if the object definition should be annotated as 'NotTrans' and returns an empty string if so.
 * If the object definition is marked for export, it adds the 'export' keyword to the result.
 * It determines whether the object should be transpiled as an interface or a class based on the elements in the body.
 * If the body contains function definitions or assignment statements, it is transpiled as a class.
 * Otherwise, it is transpiled as an interface.
 * The function iterates over the elements in the body and transpiles each element accordingly.
 * It handles variable definitions, function definitions, nested object definitions, and bypass statements.
 * If an unknown element type is encountered, it logs an internal error.
 */
function transpileObjectDef(stmt: ast.ObjectDef, indent: number): string {
  let result = ''
  if (stmt.annotate == 'NotTrans') return result
  if (stmt.export) result += 'export '

  // interface가 되는 조건
  // body 에 함수나 할당문이 있을 경우 또는 변수 선언문에서 값으로 초기화하는 경우가 아닌 경우
  let isInterface = true
  stmt.body.elements.forEach(m => {
    if (ast.isFunctionDef(m) || ast.isAssignment(m)) isInterface = false
    if (ast.isVariableDef(m) && m.value) isInterface = false
  })

  if (isInterface) {
    result += `interface ${stmt.name}`
    result += generateGeneric(stmt.generic, indent)
    result += ' {\n'
  } else {
    result += `class ${stmt.name}`
    result += generateGeneric(stmt.generic, indent) + ' '
    result += stmt.superClass ? `extends ${stmt.superClass.$refText} {\n` : '{\n'
  }

  stmt.body.elements.forEach(m => {
    if (ast.isVariableDef(m)) {
      result += applyIndent(indent + 1, transpileVariableDef(m, indent + 1, true))
    } else if (ast.isFunctionDef(m)) {
      result += applyIndent(indent + 1, transpileFunctionDef(m, indent + 1, true))
    } else if (ast.isObjectDef(m)) {
      result += '\n'
      result += applyIndent(indent + 1, transpileObjectDef(m, indent + 1))
    } else if (ast.isBypass(m)) {
      result += '\n'
      result += applyIndent(indent + 1, generateStatement(m, indent + 1))
    } else {
      console.error(chalk.red('internal error'))
    }
    result += '\n'
  })
  result += '}'
  return result
}

/**
 * Transpiles a DoStatement AST node into a string representation.
 *
 * @param stmt - The DoStatement AST node to transpile.
 * @param indent - The current indentation level.
 * @returns The transpiled string representation of the DoStatement.
 */
function transpileDoStatement(stmt: ast.DoStatement, indent: number): string {
  return `do ${generateBlock(stmt.loop, indent)} while ${generateCondition(stmt.condition, indent)}`
}

/**
 * Transpiles a ForStatement AST node into a JavaScript for loop string.
 *
 * @param stmt - The ForStatement AST node to transpile.
 * @param indent - The current indentation level.
 * @returns The transpiled JavaScript for loop as a string.
 */
function transpileForStatement(stmt: ast.ForStatement, indent: number): string {
  let result = ''
  let forIndent = indent
  stmt.iterators.forEach((iter, idx) => {
    const name = iter.name
    if (ast.isForOf(iter)) {
      const text = `for (const ${name} of ${generateExpression(iter.of, indent)}) `
      if (idx == 0) result += text
      else result += applyIndent(forIndent, text)
    } else {
      const e1 = generateExpression(iter.e1, indent)
      const e2 = generateExpression(iter.e2, indent)
      let mark = iter.to == 'to' ? '<=' : '<'
      let step = `${name}++`
      if (iter.stepValue) {
        if (iter.stepValue >= 0) step = `${name} += ${iter.stepValue}`
        if (iter.stepValue < 0) {
          mark = iter.to == 'to' ? '>=' : '>'
          step = `${name} -= ${-iter.stepValue}`
        }
      }
      const text = `for (let ${name} = ${e1}; ${name} ${mark} ${e2}; ${step}) `
      if (idx == 0) result += text
      else result += applyIndent(forIndent, text)
    }
    if (idx < stmt.iterators.length - 1) {
      result += '{\n'
      forIndent++
    }
  })
  result += generateBlock(stmt.loop, forIndent)
  for (let i = forIndent; i > indent; i--) {
    result += '\n' + applyIndent(i - 1, '}')
  }
  return result
}

/**
 * Transpiles a WhileStatement AST node into a string representation of the corresponding code.
 *
 * @param stmt - The WhileStatement AST node to transpile.
 * @param indent - The current indentation level for formatting the output code.
 * @returns The transpiled string representation of the WhileStatement.
 */
function transpileWhileStatement(stmt: ast.WhileStatement, indent: number): string {
  return `while ${generateCondition(stmt.condition, indent)} ${generateBlock(stmt.loop, indent)}`
}

/**
 * Transpiles a ThrowStatement AST node into a string representation.
 *
 * @param stmt - The ThrowStatement AST node to transpile.
 * @param indent - The current indentation level.
 * @returns The string representation of the ThrowStatement.
 */
function transpileThrowStatement(stmt: ast.ThrowStatement, indent: number): string {
  return `throw ${generateExpression(stmt.throw, indent)}`
}

/**
 * Transpiles a TryCatchStatement AST node into a string representation.
 *
 * @param stmt - The TryCatchStatement AST node to transpile.
 * @param indent - The current indentation level for formatting the output string.
 * @returns The string representation of the transpiled TryCatchStatement.
 */
function transpileTryCatchStatement(stmt: ast.TryCatchStatement, indent: number): string {
  let result = ''
  result += `try ${generateBlock(stmt.body, indent)}`
  result += applyIndent(indent, 'catch {\n')
  stmt.cases.forEach(mc => {
    if (ast.isLiteral(mc.pattern)) {
      const pattern = generateExpression(mc.pattern, indent)
      result += applyIndent(indent + 1, `case ${pattern}: `)
    } else {
      result += applyIndent(indent + 1, `default: `)
    }
    if (mc.body) {
      result += generateBlock(mc.body, indent + 1, (lastCode, indent) => {
        if (ast.isStatement(lastCode)) return generateStatement(lastCode, indent)
        else if (ast.isExpression(lastCode)) return generateExpression(lastCode, indent)
        else return ''
      })
    }
    result += '\n'
  })
  result += applyIndent(indent, '}')
  result += applyIndent(indent, `finally ${generateExpression(stmt.finally, indent)}`)
  return result
}

/**
 * Transpiles a bypass statement by removing specific patterns from the bypass string.
 *
 * @param stmt - The bypass statement to be transpiled.
 * @param indent - The current indentation level (not used in this function).
 * @returns The transpiled bypass string with specific patterns removed.
 */
function transpileBypass(stmt: ast.Bypass, indent: number): string {
  let result = ''
  if (stmt.bypass) {
    result += stmt.bypass.replaceAll('%%\r\n', '').replaceAll('\r\n%%', '').replaceAll('%%', '')
  }
  return result
}

/**
 * Transpiles an assignment expression into a string representation.
 *
 * @param expr - The assignment expression to transpile.
 * @param indent - The current indentation level.
 * @returns The transpiled assignment expression as a string.
 *
 * @remarks
 * This function generates a string representation of an assignment expression.
 * It concatenates the left-hand side (assign) and the right-hand side (value) of the assignment
 * with the assignment operator in between. Note that it does not append a semicolon at the end
 * of the expression to support cases where the assignment is used as an argument (e.g., `n++`
 * being replaced with `n += 1`).
 */
function transpileAssignment(expr: ast.Assignment, indent: number): string {
  let result = ''
  const name = generateExpression(expr.assign, indent)
  result += `${name} ${expr.operator} ${generateExpression(expr.value, indent)}`

  // n++ 을 대신해서 n += 1 이 argument로 사용되거나 할 때는 semi colon을 표시하면 안되므로 지원하지 않는다
  // result += ast.isAssignment(expr.value) ? "" : ";"
  return result
}

/**
 * Transpiles a logical NOT expression from the abstract syntax tree (AST) to a string representation.
 *
 * @param expr - The logical NOT expression node from the AST.
 * @param indent - The current indentation level for formatting the output string.
 * @returns The string representation of the logical NOT expression.
 */
function transpileLogicalNot(expr: ast.LogicalNot, indent: number): string {
  let op = ''
  switch (expr.operator) {
    case 'not': {
      op = '!'
      break
    }
    default: {
      op = expr.operator
    }
  }
  return `${op} ${generateExpression(expr.value, indent)}`
}

/**
 * Transpiles a call chain expression into a string representation.
 *
 * @param expr - The call chain expression to transpile.
 * @param indent - The current indentation level.
 * @returns The transpiled string representation of the call chain.
 *
 * The function handles different parts of the call chain:
 * - If there is a previous expression, it generates the expression for it and appends the current element.
 * - If there is no previous expression, it handles the current element directly.
 * - If the expression is a function call, it handles specific methods that use array indices and adjusts the arguments accordingly.
 * - If the expression is an array access, it generates the array index.
 * - If there is an assertion, it appends it to the result.
 */
function transpileCallChain(expr: ast.CallChain, indent: number): string {
  let result = ''
  if (expr.previous) {
    result += generateExpression(expr.previous, indent)
    result += expr.element ? '.' + expr.element.$refText : ''
  } else {
    result += expr.this ? expr.this : ''
    result += expr.element ? expr.element.$refText : ''
  }
  if (expr.isFunction) {
    // endsWith()의 endPosition은 1부터 카운트되므로 제외
    const methodsUsingArrayIndex = [
      { methodName: 'charAt', argIndices: [0] },
      { methodName: 'charCodeAt', argIndices: [0] },
      { methodName: 'codePointAt', argIndices: [0] },
      { methodName: 'includes', argIndices: [1] },
      { methodName: 'indexOf', argIndices: [1] },
      { methodName: 'lastIndexOf', argIndices: [1] },
      { methodName: 'slice', argIndices: [0, 1] },
      { methodName: 'startsWith', argIndices: [1] },
      { methodName: 'substring', argIndices: [0, 1] },
      { methodName: 'at', argIndices: [0] },
    ]
    const found = methodsUsingArrayIndex.find(e => e.methodName == expr.element?.$refText)
    if (found) {
      result += '('
      expr.args.map((arg, index) => {
        if (index != 0) result += ', '
        result += found.argIndices.includes(index) ? generateArrayIndex(arg, indent) : generateExpression(arg, indent)
      })
      result += ')'
    } else {
      result += '(' + expr.args.map(arg => generateExpression(arg, indent)).join(', ') + ')'
    }

    const methodsReturningArrayIndex = [
      { methodName: 'findIndex' },
      { methodName: 'findLastIndex' },
      { methodName: 'indexOf' },
      { methodName: 'lastIndexOf' },
    ]
    const found2 = methodsReturningArrayIndex.find(e => e.methodName == expr.element?.$refText)
    if (found2) {
      result = '(' + result + ' + 1)'
    }
  }
  if (expr.isArray) {
    result += '[' + generateArrayIndex(expr.index, indent) + ']'
  }
  if (expr.assertion) result += expr.assertion
  return result
}

/**
 * Transpiles an AST IfExpression into a string representation of the corresponding JavaScript code.
 *
 * This function handles two cases:
 * 1. If the if-expression can be converted into a ternary operator, it does so.
 * 2. Otherwise, it generates the standard if-else statement.
 *
 * The ternary operator conversion is applied if:
 * - The `then` block exists, is not wrapped in braces, contains exactly one expression, and is not a return expression.
 * - The `else` block exists, is not wrapped in braces, contains exactly one expression, and is not a return expression.
 * - There are no `elif` blocks.
 *
 * @param expr - The AST IfExpression to transpile.
 * @param indent - The current indentation level.
 * @returns The transpiled string representation of the if-expression.
 */
function transpileIfExpression(expr: ast.IfExpression, indent: number): string {
  let result = ''
  // 삼항 연산자 처리 조건
  // else if 문 없이 then, else 문만 있어야 한다.
  // then, else 모두 중괄호 없어야 하며 식이 하나만 있어야 한다.
  // 하나의 식은 return 이 아니어야 한다.
  if (
    expr.then &&
    !expr.then.isBracket &&
    expr.then.codes.length == 1 &&
    ast.isExpression(expr.then.codes[0]) &&
    !ast.isReturnExpression(expr.then.codes[0]) &&
    expr.else &&
    !expr.else.isBracket &&
    expr.else.codes.length == 1 &&
    ast.isExpression(expr.else.codes[0]) &&
    !ast.isReturnExpression(expr.else.codes[0]) &&
    (expr.elif == undefined || expr.elif.length == 0)
  ) {
    result += `${generateCondition(expr.condition, indent)} ? `

    // then 절에 해당하는 부분은 세미콜론을 포함하지 않아야 한다.
    let then = generateExpression(expr.then.codes[0], indent)
    if (then.endsWith(';')) {
      then = then.slice(0, then.lastIndexOf(';'))
    }

    result += then + ' : '
    result += generateExpression(expr.else.codes[0], indent)
    return result
  }

  result += 'if ' + generateCondition(expr.condition, indent) + ' '
  if (expr.then) {
    result += generateBlock(expr.then, indent)
  }
  expr.elif.forEach(elif => {
    result += '\n' + applyIndent(indent, 'else if ' + generateCondition(elif.condition, indent) + ' ')
    if (elif.elif) {
      result += generateBlock(elif.elif, indent)
    }
  })
  if (expr.else) {
    result += '\n' + applyIndent(indent, 'else ' + generateBlock(expr.else, indent))
  }
  return result
}

/**
 * Transpiles a match expression (similar to a switch-case statement) from an abstract syntax tree (AST) representation
 * into a TypeScript switch statement string.
 *
 * @param expr - The match expression AST node to transpile.
 * @param indent - The current indentation level for formatting the output string.
 * @returns The transpiled switch statement as a formatted string.
 */
function transpileMatchExpression(expr: ast.MatchExpression, indent: number): string {
  let result = ''
  result += `switch (${generateExpression(expr.expr, indent)}) {\n`
  expr.cases.forEach(mc => {
    if (ast.isLiteral(mc.pattern)) {
      const pattern = generateExpression(mc.pattern, indent)
      result += applyIndent(indent + 1, `case ${pattern}: `)
    } else {
      result += applyIndent(indent + 1, `default: `)
    }
    if (mc.body) {
      result += generateBlock(mc.body, indent + 1, (lastCode, indent) => {
        if (ast.isStatement(lastCode)) return generateStatement(lastCode, indent)
        else if (ast.isExpression(lastCode)) return generateExpression(lastCode, indent)
        else return ''
      })
    }
    result += '\n'
  })
  result += applyIndent(indent, '}')
  return result
}

/**
 * Transpiles a GroupExpression AST node into a string representation.
 *
 * @param expr - The GroupExpression AST node to transpile.
 * @param indent - The current indentation level.
 * @returns The transpiled string representation of the GroupExpression.
 */
function transpileGroupExpression(expr: ast.GroupExpression, indent: number): string {
  return `(${generateExpression(expr.value, indent)})`
}

/**
 * Transpiles a unary expression into a string representation.
 *
 * @param expr - The unary expression to transpile.
 * @param indent - The current indentation level.
 * @returns The string representation of the unary expression.
 */
function transpileUnaryExpression(expr: ast.UnaryExpression, indent: number): string {
  if (expr.operator) {
    // typeof만 공백을 포함하고 나머지(+, -)는 공백없이 표현한다
    let operator = expr.operator
    if (expr.operator == 'typeof') operator += ' '
    return `${operator}${generateExpression(expr.value, indent)}`
  } else return generateExpression(expr.value, indent)
}

/**
 * Transpiles a binary expression from the abstract syntax tree (AST) into a string representation.
 *
 * @param expr - The binary expression node from the AST.
 * @param indent - The current indentation level for formatting the output string.
 * @returns The transpiled string representation of the binary expression.
 */
function transpileBinaryExpression(expr: ast.BinaryExpression, indent: number): string {
  let op = ''
  switch (expr.operator) {
    case 'and': {
      op = '&&'
      break
    }
    case 'or': {
      op = '||'
      break
    }
    case '..': {
      op = '+'
      break
    }
    default: {
      op = expr.operator
    }
  }
  return `${generateExpression(expr.left, indent)} ${op} ${generateExpression(expr.right, indent)}`
}

/**
 * Transpiles an infix expression into a string representation.
 *
 * @param expr - The infix expression to transpile.
 * @param indent - The current indentation level.
 * @returns The transpiled infix expression as a string.
 */
function transpileInfixExpression(expr: ast.InfixExpression, indent: number): string {
  return `${expr.e1}.${expr.name}(${generateExpression(expr.e2, indent)})`
}

/**
 * Transpiles a return expression into a string representation.
 *
 * @param expr - The return expression to transpile.
 * @param indent - The current indentation level.
 * @returns The transpiled return expression as a string.
 */
function transpileReturnExpression(expr: ast.ReturnExpression, indent: number): string {
  let result = 'return'
  if (expr.value) result += ` ${generateExpression(expr.value, indent)}`
  return result
}

/**
 * Transpiles a SpreadExpression AST node into a string representation.
 *
 * @param expr - The SpreadExpression AST node to transpile.
 * @param indent - The current indentation level (not used in this function).
 * @returns The string representation of the SpreadExpression.
 */
function transplieSpreadExpression(expr: ast.SpreadExpression, indent: number): string {
  return '...' + expr.spread.$refText
}

/**
 * Transpiles a NewExpression AST node into a string representation.
 *
 * @param expr - The NewExpression AST node to transpile.
 * @param indent - The current indentation level.
 * @returns The string representation of the NewExpression.
 */
function transpileNewExpression(expr: ast.NewExpression, indent: number): string {
  let result = `new ${expr.class.$refText}`
  result += generateGeneric(expr.generic, indent)
  result += '('
  expr.args.map((arg, index) => {
    if (index != 0) result += ', '
    result += generateExpression(arg, indent)
  })
  result += ')'
  return result
}

/**
 * Transpiles an array value expression into a string representation.
 *
 * @param expr - The array value expression to transpile.
 * @param indent - The current indentation level.
 * @returns The string representation of the array value.
 */
function transpileArrayValue(expr: ast.ArrayValue, indent: number): string {
  return '[' + expr.items.map(item => generateExpression(item, indent)).join(', ') + ']'
}

/**
 * Transpiles an AST object value into a formatted string representation.
 *
 * @param expr - The AST object value to transpile.
 * @param indent - The current indentation level.
 * @returns The transpiled string representation of the object value.
 */
function transpileObjectValue(expr: ast.ObjectValue, indent: number): string {
  let result = '{\n'
  expr.elements.forEach(item => {
    let value = ''
    if (item.spread) {
      value = `${item.$cstNode?.text},\n`
    } else {
      value = item.element + ': ' + (item.value ? generateExpression(item.value, indent + 1) : '') + ',\n'
    }
    result += applyIndent(indent + 1, value)
  })
  result += applyIndent(indent, '}')
  return result
}

/**
 * Transpiles a function value from the abstract syntax tree (AST) into a string representation.
 * function value는 TypeScript로 변환될 때 (arg: number): number => { ... } 형태로 변환된다.
 *
 * @param expr - The function value expression from the AST.
 * @param indent - The current indentation level for formatting the output string.
 * @returns The transpiled function value as a string.
 */
function transpileFunctionValue(expr: ast.FunctionValue, indent: number): string {
  return generateFunction({
    params: expr.params,
    returnType: expr.returnType,
    body: expr.body,
    bodyDelimiter: '=>',
    indent,
  })
}

//-----------------------------------------------------------------------------
// helper functions
//-----------------------------------------------------------------------------

/**
 * Transpiles a given AST (Abstract Syntax Tree) expression of type `ast.Types` into a string representation.
 * If the expression is undefined, it returns an empty string.
 *
 * @param expr - The AST expression of type `ast.Types` to be transpiled. Can be undefined.
 * @param indent - The current indentation level for formatting purposes.
 * @returns The transpiled string representation of the given AST expression.
 */
function generateTypes(expr: ast.Types | undefined, indent: number): string {
  let result = ''
  if (expr == undefined) return result
  expr.types.forEach((t, index) => {
    if (index != 0) result += ' | '
    result += generateSimpleType(t, indent)
  })
  return result
}

/**
 * Transpiles a given SimpleType AST node into its corresponding string representation.
 *
 * @param expr - The SimpleType AST node to transpile.
 * @param indent - The current indentation level for formatting the output string.
 * @returns The transpiled string representation of the SimpleType.
 */
function generateSimpleType(expr: ast.SimpleType, indent: number): string {
  let result = ''
  if (ast.isArrayType(expr)) {
    result += generateSimpleType(expr.elementType, indent) + '[]'
  } else if (ast.isObjectType(expr)) {
    result += '{\n'
    expr.elements.forEach(e => {
      if (ast.isVariableDef(e)) {
        result += applyIndent(indent + 1, transpileVariableDef(e, indent + 1, true))
      } else if (ast.isFunctionDef(e)) {
        result += applyIndent(indent + 1, transpileFunctionDef(e, indent + 1, true))
      } else if (ast.isObjectDef(e)) {
        result += '\n'
        result += applyIndent(indent + 1, transpileObjectDef(e, indent + 1))
      } else if (ast.isBypass(e)) {
        result += '\n'
        result += applyIndent(indent + 1, generateStatement(e, indent + 1))
      } else {
        console.error(chalk.red('internal error'))
      }
      result += '\n'
    })
    result += applyIndent(indent, '}')
  } else if (ast.isElementType(expr)) {
    if (ast.isFunctionType(expr)) {
      result += generateFunction({
        params: expr.params,
        returnType: expr.returnType,
        returnDelimiter: '=>',
        indent,
      })
    } else if (ast.isPrimitiveType(expr)) {
      // nil 만 undefined로 바꿔준다.
      if (expr.type == 'nil') result += 'undefined'
      else result += expr.type
    } else if (ast.isTypeChain(expr)) {
      result += generateTypeChain(expr, indent)
    } else result += 'internal error'
  }
  return result
}

/**
 * Transpiles a TypeChain expression into a string representation.
 *
 * @param expr - The TypeChain expression to transpile.
 * @param indent - The current indentation level.
 * @returns The string representation of the TypeChain expression.
 */
function generateTypeChain(expr: ast.TypeChain, indent: number): string {
  let result = ''
  if (expr.previous) {
    result += generateTypeChain(expr.previous, indent)
    result += expr.reference ? '.' + expr.reference.$refText : ''
  } else {
    if (expr.reference) {
      result += expr.reference.$refText
      result += generateGeneric(expr.generic, indent)
    }
  }
  return result
}

/**
 * Generates a string representation of a block of code with proper indentation.
 *
 * @param body - The block of code to generate.
 * @param indent - The current level of indentation.
 * @param doItForLastCode - An optional function to handle the last code element in the block.
 *                          If not provided, a default function will be used.
 * @returns The generated string representation of the block of code.
 */
function generateBlock(
  body: ast.Block,
  indent: number,
  doItForLastCode?: (lastCode: ast.Code, indent: number) => string
): string {
  const defaultDoIt = (lastCode: ast.Code, indent: number) => {
    if (ast.isStatement(lastCode)) return generateStatement(lastCode, indent)
    else if (ast.isExpression(lastCode)) return generateExpression(lastCode, indent)
    else return ''
  }

  // 단일 expression으로 되어져 있어도 괄호로 둘러싸인 형태로 변환된다.
  // 괄호 내부의 모든 코드는 indent가 하나 증가되어진 상태로 처리되어야 한다.
  let result = '{\n'
  body.codes.forEach((code, index) => {
    let element = ''
    if (index == body.codes.length - 1) {
      if (doItForLastCode == undefined) element += defaultDoIt(code, indent + 1)
      else element += doItForLastCode(code, indent + 1)
    } else {
      if (ast.isStatement(code)) element += generateStatement(code, indent + 1)
      else if (ast.isExpression(code)) element += generateExpression(code, indent + 1)
      else console.log(chalk.red('ERROR in Block:', code))
    }
    if (ast.isBypass(code)) result += '\n'
    result += applyIndent(indent + 1, element + '\n')
  })
  result += applyIndent(indent, '}')
  return result
}

/**
 * Parameters for generating a function.
 */
interface GenerateFunctionParams {
  /**
   * if this is true, 'function' keyword is included in the generated code.
   * @default false
   */
  includeFunction?: boolean

  /**
   * Whether to override the existing function definition.
   * @default false
   */
  override?: boolean

  /**
   * The name of the function.
   * if this is undefined, the name of the function is not included in the generated code.
   */
  name?: string

  /**
   * The generic type of the function.
   */
  generic?: ast.GenericDef | ast.GenericValue

  /**
   * The parameters of the function.
   */
  params: ast.Parameter[]

  /**
   * Whether to include parentheses around the parameters by force.
   * name이 있으면 이 설정은 무조건 true로 처리된다.
   * @default false
   */
  paramsForceBracket?: boolean

  /**
   * The return type of the function.
   */
  returnType?: ast.Types | undefined

  /**
   * returnDelimiter는 파라메터 리스트와 리턴타입 사이에 들어갈 구분자이다.
   * (arg: string) : string 에서 : 가 returnDelimiter이다.
   * default는 ':' 이며 returnType이 있을때만 표시된다.
   */
  returnDelimiter?: string

  /**
   * The body of the function.
   */
  body?: ast.Block | undefined

  /**
   * bodyDelimiter는 body 앞에 들어갈 구분자이다.
   * (arg: string) : string => { ... } 에서 => 가 bodyDelimiter이다.
   * default는 ' ' 이며 body가 있을때만 표시된다.
   */
  bodyDelimiter?: string

  /**
   * Whether to include curly brackets around the body by force.
   * @default false
   */
  bodyForceBracket?: boolean

  /**
   * The indentation level for the generated code.
   */
  indent: number
}

/**
 * Generates a function declaration or expression as a string based on the provided parameters.
 */
function generateFunction(param: GenerateFunctionParams): string {
  let result = param.includeFunction ? 'function ' : ''
  result += param.override ? 'override ' : ''
  result += param.name ? param.name : ''
  result += generateGeneric(param.generic, 0)

  const paramsText = param.params
    .map(arg => {
      if (ast.isParameter(arg)) {
        let p = (arg.spread ? '...' : '') + arg.name
        p += arg.nullable ? '?' : ''
        p += arg.type ? `: ${generateTypes(arg.type, param.indent)}` : ''
        p += arg.value ? ` = ${generateExpression(arg.value, param.indent)}` : ''
        return p
      } else return 'internal error'
    })
    .join(', ')

  // name이 있으면 무조건 괄호를 표시한다.
  param.paramsForceBracket = param.name ? true : param.paramsForceBracket

  if (
    param.paramsForceBracket == false &&
    param.params.length == 1 &&
    param.params[0].type == undefined &&
    ast.isParameter(param.params[0])
  )
    result += paramsText
  else result += '(' + paramsText + ')'

  if (param.returnType) {
    result += param.returnDelimiter ? ` ${param.returnDelimiter} ` : ': '
    result += generateTypes(param.returnType, param.indent)
  }

  if (param.body) {
    result += param.bodyDelimiter ? ` ${param.bodyDelimiter} ` : ' '

    if (!param.bodyForceBracket) {
      // 함수가 정의되는 경우에는 단일 식인지의 여부와 관계없이 블럭으로 처리되어야 한다.
      // 단일 expression을 괄호로 표시하면 numbers.find(n => n == 0) 과 같은 구문에 항상 return을 사용해야 하는 불편이 있다.
      // 따라서 expression이 하나이면 괄호를 사용하지 않지만 이것도 return 문과 같이 사용되면 괄호를 사용해야 한다
      // return처럼 단일 expression으로 처리할 수 없는 것들은 assignment, if, match등이 있다.
      if (param.body.codes.length == 0) console.error(chalk.red('block is empty'))
      if (param.body.codes.length == 1) {
        const lastCode = param.body.codes[0]
        if (ast.isExpression(lastCode)) {
          if (
            !(
              ast.isAssignment(lastCode) ||
              ast.isIfExpression(lastCode) ||
              ast.isMatchExpression(lastCode) ||
              ast.isReturnExpression(lastCode)
            )
          )
            return result + generateExpression(lastCode, param.indent)
        }
      }
    }

    // generateBlock에 전달되는 indent는 function level인데 generateBlock에서는 이를 모두 +1 해서 쓰고 있다.
    result += generateBlock(param.body, param.indent, (lastCode: ast.Code, indent: number) => {
      if (ast.isStatement(lastCode)) return generateStatement(lastCode, indent)
      else if (ast.isExpression(lastCode)) return generateExpression(lastCode, indent)
      else return ''
    })
  }
  return result
}

/**
 * Generates a string representation of a given condition expression.
 *
 * @param condition - The AST expression to generate the condition for.
 * @param indent - The indentation level to use for formatting the generated string.
 * @returns The string representation of the condition expression, wrapped in parentheses if necessary.
 */
function generateCondition(condition: ast.Expression, indent: number): string {
  const e = generateExpression(condition, indent)
  return ast.isGroupExpression(condition) || ast.isUnaryExpression(condition) ? e : '(' + e + ')'
}

/**
 * Generates a string representation of an array index based on the given expression.
 * If the expression is a unary expression with a numeric literal value, it returns the value minus one.
 * Otherwise, it generates the expression and appends ' - 1' to it.
 *
 * 배열은 1 부터 카운트되기 때문에 TypeScript로 변환될 때는 -1을 해 주어야 한다.
 * 이때 숫자로 되어져 있으면 -1을 한 값을 바로 사용하고 그렇지 않으면 -1을 추가해 준다.
 * IntegerLiteral 인지의 여부를 판별하기 위해서는 여러 단계를 거쳐야만 한다.
 *
 * @param expr - The expression to generate the array index from. It can be an AST expression or undefined.
 * @param indent - The indentation level to use when generating the expression.
 * @returns A string representing the array index.
 */
function generateArrayIndex(expr: ast.Expression | undefined, indent: number): string {
  if (ast.isUnaryExpression(expr) && ast.isLiteral(expr.value) && typeof expr.value.value == 'number') {
    return (expr.value.value - 1).toString()
  }
  return generateExpression(expr, indent) + ' - 1'
}

/**
 * Generates a generic type into a string representation.
 *
 * @param generic - The generic type to transpile. It can be undefined.
 * @param indent - The indentation level to use for formatting.
 * @returns The string representation of the generic type.
 */
function generateGeneric(generic: ast.GenericDef | ast.GenericValue | undefined, indent: number): string {
  let result = ''
  if (!generic) return result
  if (ast.isGenericDef(generic)) {
    result += '<'
    generic.types.forEach((t, index) => {
      if (index != 0) result += ', '
      result += t
    })
    result += '>'
  } else if (ast.isGenericValue(generic)) {
    result += '<'
    generic.types.forEach((t, index) => {
      if (index != 0) result += ', '
      result += generateSimpleType(t, indent)
    })
    result += '>'
  }
  return result
}

/**
 * Applies indentation to a given string by repeating a specified number of spaces.
 *
 * @param lv - The level of indentation, representing the number of times to repeat the indentation string.
 * @param s - The string to which the indentation will be applied.
 * @returns The indented string.
 */
function applyIndent(lv: number, s: string) {
  return '  '.repeat(lv) + s
}
