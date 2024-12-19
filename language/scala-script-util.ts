import { AstNode, AstUtils } from 'langium'
import * as ast from './generated/ast.js'
import { TypeDescriptor, TypeSystem } from './scala-script-types.js'
import chalk from 'chalk'

/**
 *
 */
export namespace ScalaScriptCache {
  const cache = new Map<AstNode, TypeDescriptor>()

  export function get(node: AstNode) {
    return cache.get(node)
  }

  export function set(node: AstNode, type: TypeDescriptor) {
    cache.set(node, type)
  }
}

/**
 * The `LogGatherer` class is responsible for collecting and displaying log information.
 * It maintains an array of debug information objects, each containing a label and info.
 * The class provides methods to add log entries, display them, and clear the log.
 */
export class LogGatherer {
  constructor(private title?: string) {}

  /**
   * An array of objects containing debug information.
   * Each object has a `label` and `info` property.
   *
   * @type {Array<{ label: string; info: string }>}
   */
  debugInfo: { label: string; info: string }[] = []

  /**
   * Gathers log information and stores it in the debugInfo array.
   * If a log with the same label already exists, it will not be added again.
   *
   * @param label - The label for the log entry.
   * @param info - The main information for the log entry. Can be undefined.
   * @param extra - Additional information to be appended to the log entry.
   */
  add(label: string, info: string | undefined, ...extra: string[]) {
    // if (!this.debugInfo.find(d => d.label == label))
    this.debugInfo.push({ label, info: info + (extra.length > 0 ? ', ' + extra.join(', ') : '') })
  }

  /**
   * Logs the function information stored in the `debugInfo` array to the console.
   * Each entry in the `debugInfo` array is logged with its label and info.
   * If the label contains the word 'error', it is displayed in red using `chalk`.
   */
  show() {
    if (this.title) console.log(this.title + ':')
    this.debugInfo.forEach(d => {
      const label = d.label.includes('error') ? chalk.red(d.label) : d.label
      console.log(' ', label + ':', d.info)
    })
  }

  /**
   * Clears the debug logs by resetting the length of the debugInfo array to 0.
   */
  clear() {
    this.debugInfo.length = 0
  }
}

/**
 * A flag to enable or disable logging.
 *
 * When set to `true`, logging is enabled and log messages will be output.
 * When set to `false`, logging is disabled and no log messages will be output.
 *
 * @default false
 */
var _enable_log_ = false

/**
 * A global variable to keep track of a signal number.
 *
 * @remarks
 * This variable is used to maintain a count or identifier for signals within the application.
 *
 * @privateRemarks
 * Ensure that this variable is incremented or modified in a thread-safe manner if accessed concurrently.
 *
 * @example
 * ```typescript
 * _sig_number_++;
 * console.log(_sig_number_);
 * ```
 */
var _sig_number_ = 0

/**
 * Enables or disables logging.
 *
 * @param enable - A boolean value to enable (true) or disable (false) logging.
 */
export function enableLog(enable: boolean) {
  _enable_log_ = enable
}

/**
 * Logs the entry of a process with a unique signature and optional parameters.
 *
 * @param procKind - A string representing the kind of process being logged.
 * @param optionalParams - Additional optional parameters to log.
 * @returns A string representing the unique signature of the log entry.
 */
/*
  파라미터 ...optionalParams의 타입을 any[]에서 any로 변경하였다.
  개념적으로는 any가 맞는 것 같은데 타입스크립트의 대부분의 정의는 아래와 같이 배열형이다.
  push(...items: T[]): number;

  그래서 처음에는 ...items가 T의 배열형이라고 생각했지만 (정확하지는 않지만) T 배열형의 rest parameter 형태로 보는 것이 맞을 것 같다.
  즉 여러 개의 T 배열형을 가질 수 있는 것인데 T 형을 그대로 쓸 수 있는 것은 자동으로 형변환이 되기 때문이 아닐까 싶다.
  그럼 문제가 아래와 같이 concat을 정의한 것이 이상하다는 것이다.
  concat(...items: ConcatArray<T>[]): T[];
  concat(...items: (T | ConcatArray<T>)[]): T[];
*/
export function enterLog(procKind: string, ...optionalParams: any): string {
  const applyColor = (text: string): string => {
    if (text.toLowerCase().includes('infer')) return chalk.cyan(text)
    if (text.toLowerCase().includes('check')) return chalk.blue(text)
    if (text.toLowerCase().includes('scope')) return chalk.magentaBright(text)
    return text
  }

  if (!_enable_log_) return ''
  _sig_number_ += 1
  const signature = `|${_sig_number_}| ${applyColor(procKind)}:`
  // 여기서 ...optionalParams 이 아닌 optionalParams을 사용하면 값이 [] 안에 표시된다.
  // 즉 배열의 형태로 표시되는데 배열로 처리되면 값들을 구분하는 comma와 대괄호로 인해 보기 좋은 경우도 많다.
  console.log(`>${signature}`, ...optionalParams)
  // console.time(`<${signature}`)
  console.group()
  return `<${signature}`
}

/**
 * Logs a message to the console if logging is enabled.
 *
 * @param msg - The message to log.
 * @param optionalParams - Additional parameters to log.
 */
export function traceLog(msg: string, ...optionalParams: any) {
  if (!_enable_log_) return
  console.log(msg, ...optionalParams)
}

/**
 * Trims the input text to a specified number of lines.
 * If the text contains more lines than the specified line count,
 * it truncates the text and appends an ellipsis (`\n...`).
 *
 * @param msg - The input text to be trimmed.
 * @param lineCount - The maximum number of lines to retain. Defaults to 3.
 * @returns The trimmed text with a maximum of `lineCount` lines, followed by an ellipsis if truncated.
 */
export function reduceLog(msg: string | undefined, lineCount: number = 3): string {
  if (!msg) return ''
  const lines = msg.split('\n')
  return lines.length > lineCount ? lines.slice(0, lineCount).join('\n') + '\n...' : msg
}

/**
 * Logs a message to the console and ends the current console group if logging is enabled.
 *
 * @param log - The message to log.
 * @param type - Optional. An object describing the type of the log message.
 * @param optionalParams - Optional. Additional parameters to log.
 */
export function exitLog(log: string, type?: TypeDescriptor, ...optionalParams: any) {
  if (!_enable_log_) return
  console.groupEnd()
  if (!type) {
    console.log(log, ...optionalParams)
    return
  }

  let typeInfo = ''
  if (TypeSystem.isErrorType(type)) typeInfo = type.message
  else typeInfo = `type: ${chalk.green(type.toString())}`

  // console.timeLog(log, typeInfo, ...optionalParams)
  console.log(log, typeInfo, ...optionalParams)
}

/**
 * Dumps detailed information about the given AST node to the console.
 *
 * @param node - The AST node to dump information for. If the node is undefined, the function returns immediately.
 *
 * The function logs various properties of the document associated with the node, including:
 * - URI of the document
 * - State of the document
 * - Text of the document
 * - Lexer errors in the document's parse result
 * - Parser errors in the document's parse result
 * - Number of references in the document
 * - Each reference's text
 * - Size of precomputed scopes in the document
 * - Each precomputed scope's key and value
 *
 * The function uses the `chalk` library to colorize the console output for better readability.
 */
export function Dump(node: AstNode | undefined) {
  if (!node) return
  const doc = AstUtils.getDocument(node)
  console.log(chalk.bgBlue('doc.uri:'), doc.uri)
  console.log(chalk.bgBlue('doc.state:'), doc.state)
  console.log(chalk.bgBlue('doc.textDocument:'), doc.textDocument)
  console.log(chalk.bgBlue('doc.textDocument.getText():'), doc.textDocument.getText())
  console.log(chalk.bgBlue('doc.parseResult.lexerErrors:'), doc.parseResult.lexerErrors)
  console.log(chalk.bgBlue('doc.parseResult.parserErrors:'), doc.parseResult.parserErrors)
  // const text = AstUtils.getDocument(node).parseResult.value.$cstNode?.text
  // const text = (AstUtils.getDocument(stmt).parseResult.value.$cstNode as RootCstNode).fullText
  // console.log(text)

  console.log(chalk.bgBlue('doc.references.length:'), doc.references.length)
  doc.references.forEach(ref => {
    console.log('  doc.references:', ref.$refText)
  })

  let index = 0
  console.log(chalk.bgBlue('doc.precomputedScopes?.size:'), doc.precomputedScopes?.size)
  doc.precomputedScopes?.forEach((value, key) => {
    console.log('  doc.precomputedScopes:', index++)
    console.log(chalk.yellow('    K: ') + `'${reduceLog(key.$cstNode?.text)}'(${chalk.green(key.$type)})`)
    console.log(chalk.yellow('    V: ') + `${value.name}(${chalk.green(value.type)})`)
  })

  // const thenKeyword = GrammarUtils.findNodeForKeyword(node.$cstNode, '=')
  // if (thenKeyword) {
  //   const index = thenKeyword.offset
  //   const previousChar = text.charAt(index - 1)
  //   if (previousChar !== ' ') {
  //     acceptor('error', ...)
  //   }
  // }
}

/**
 * Finds a variable definition or parameter with the specified name within the given AST node and its ancestors.
 *
 * ObjectDef의 name으로 property를 호출하면 static property만을 대상으로 해야 한다.
 * 그런데 이때 이 name이 object name인지 variable name인지를 구분해야 한다.
 * 즉 다음과 같은 경우를 구분해야 한다.
 *
 * def T = {
 *   val name: string = "name"
 * }
 * val f = (T: T) => {
 *   return T.name
 * }
 *
 * 이를 구분하기 위해서는 해당 이름이 있는지 먼저 확인해야 한다.
 *
 * @param node - The starting AST node to search within. If undefined, the function returns undefined.
 * @param name - The name of the variable or parameter to find. If undefined, the function returns undefined.
 * @returns The found variable definition or parameter node, or undefined if not found.
 */
export function findVariableDefWithName(node: AstNode | undefined, name: string | undefined) {
  if (!node || !name) return undefined
  let item: AstNode | undefined = node
  while (item) {
    const found = AstUtils.streamContents(item).find(
      i => (ast.isVariableDef(i) || ast.isParameter(i)) && i.name === name
    )
    if (found) return found
    item = item.$container
  }
  return undefined
}

/**
 * Finds a function definition with the specified name within the given AST node.
 *
 * @param node - The starting AST node to search within. If undefined, the function returns undefined.
 * @param name - The name of the function to search for. If undefined, the function returns undefined.
 * @returns The found function definition node if a match is found, otherwise undefined.
 */
export function findFunctionDefWithName(node: AstNode | undefined, name: string | undefined) {
  if (!node || !name) return undefined
  let item: AstNode | undefined = node
  while (item) {
    const found = AstUtils.streamContents(item).find(i => {
      if (ast.isFunctionDef(i) && i.name === name) return true
      if (ast.isVariableDef(i) && i.name === name && TypeSystem.isFunctionType(TypeSystem.inferType(i.value)))
        return true
      return false
    })
    if (found) {
      if (ast.isFunctionDef(found)) {
        return found
      } else if (ast.isVariableDef(found)) {
        return found.value
      }
    }
    item = item.$container
  }
  return undefined
}

/**
 * Finds an object definition with the specified name within the given AST node.
 *
 * @param node - The starting AST node to search within. If undefined, the function returns undefined.
 * @param name - The name of the object definition to find. If undefined, the function returns undefined.
 * @returns The found object definition node if it exists, otherwise undefined.
 */
export function findObjectDefWithName(node: AstNode | undefined, name: string | undefined) {
  if (!node || !name) return undefined
  let item: AstNode | undefined = node
  while (item) {
    const found = AstUtils.streamContents(item).find(i => ast.isObjectDef(i) && i.name === name)
    if (found) return found
    item = item.$container
  }
  return undefined
}
