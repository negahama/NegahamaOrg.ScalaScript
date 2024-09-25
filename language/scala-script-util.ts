import { TypeDescription, TypeSystem } from './scala-script-types.js'

/**
 *
 */
var _enable_log_ = false
var _sig_number_ = 0

/**
 *
 * @param enable
 */
export function enableLog(enable: boolean) {
  _enable_log_ = enable
}

/**
 *
 * @param procKind
 * @param procId
 * @returns
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
 *
 * @param msg
 * @param optionalParams
 */
export function traceLog(msg: string, ...optionalParams: any[]) {
  if (!_enable_log_) return
  console.log(msg, ...optionalParams)
}

/**
 *
 * @param log
 * @param type
 */
export function exitLog(log: string, type?: TypeDescription, ...optionalParams: any[]) {
  if (!_enable_log_) return
  console.groupEnd()
  let typeInfo = ''
  if (type) {
    if (TypeSystem.isErrorType(type)) typeInfo = type.message
    else typeInfo = `-type: ${type?.$type}`
  }
  // console.timeLog(log, typeInfo, ...optionalParams)
  console.log(log, typeInfo, ...optionalParams)
}
