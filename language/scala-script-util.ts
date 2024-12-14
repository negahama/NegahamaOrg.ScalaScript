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
  else typeInfo = `type: ${type.toString()}`

  // console.timeLog(log, typeInfo, ...optionalParams)
  console.log(log, typeInfo, ...optionalParams)
}

/**
 * Trims the input text to a specified number of lines.
 * If the text contains more lines than the specified line count,
 * it truncates the text and appends an ellipsis (`\n...`).
 *
 * @param text - The input text to be trimmed.
 * @param lineCount - The maximum number of lines to retain. Defaults to 3.
 * @returns The trimmed text with a maximum of `lineCount` lines, followed by an ellipsis if truncated.
 */
export function trimText(text: string | undefined, lineCount: number = 3): string {
  if (!text) return ''
  const lines = text.split('\n')
  return lines.length > lineCount ? lines.slice(0, lineCount).join('\n') + '\n...' : text
}
