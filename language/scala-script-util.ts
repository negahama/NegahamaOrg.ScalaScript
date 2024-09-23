import { TypeDescription } from './scala-script-types.js'

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
export function enterLog(procKind: string, procId?: string): string {
  if (!_enable_log_) return ''
  _sig_number_ += 1
  const signature = `|${_sig_number_}| ${procKind}: `
  console.log(`>${signature}${procId}`)
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
export function exitLog(log: string, type?: TypeDescription) {
  if (!_enable_log_) return
  console.groupEnd()
  console.log(log + (type ? `type: ${type?.$type}` : ''))
}
