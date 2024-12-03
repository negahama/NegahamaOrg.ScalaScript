import { AstNode, AstUtils } from 'langium'
import * as ast from './generated/ast.js'
import { TypeDescription, TypeSystem } from './scala-script-types.js'

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
export function enterLog(procKind: string, ...optionalParams: any[]): string {
  if (!_enable_log_) return ''
  _sig_number_ += 1
  const signature = `|${_sig_number_}| ${procKind}:`
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
export function traceLog(msg: string, ...optionalParams: any[]) {
  if (!_enable_log_) return
  console.log(msg, ...optionalParams)
}

/**
 * Logs a message to the console and ends the current console group if logging is enabled.
 *
 * @param log - The message to log.
 * @param type - Optional. An object describing the type of the log message.
 * @param optionalParams - Optional. Additional parameters to log.
 */
export function exitLog(log: string, type?: TypeDescription, ...optionalParams: any[]) {
  if (!_enable_log_) return
  console.groupEnd()
  if (!type) {
    console.log(log, ...optionalParams)
    return
  }

  let typeInfo = ''
  if (TypeSystem.isErrorType(type)) typeInfo = type.message
  else typeInfo = `-type: ${type?.$type}`

  // console.timeLog(log, typeInfo, ...optionalParams)
  console.log(log, typeInfo, ...optionalParams)
}

/**
 * Finds a variable definition or parameter with the specified name within the given AST node and its ancestors.
 *
 * ObjectDef의 name으로 property를 호출하면 static property만을 대상으로 해야 한다.
 * 그런데 이때 이 name이 object name인지 variable name인지를 구분해야 한다. 즉 다음과 같은 경우를 구분해야 한다.
 * def T = {
 *   val name: String = "name"
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
