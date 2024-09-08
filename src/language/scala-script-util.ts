import { TypeDescription } from "./scala-script-types.js";

/**
 *
 * @param procKind
 * @param procId
 * @param indent
 * @returns
 */
var _enableLog_ = false;
var _sig_number_ = 0;
export function enableLog(enable: boolean) {
  _enableLog_ = enable;
}
export function enterLog(procKind: string, procId: string | undefined, indent: number): string {
  _sig_number_ += 1;
  const space = "    ".repeat(indent);
  if (_enableLog_) console.log(space + `Enter(${_sig_number_}) ${procKind}: ${procId}`);
  return space + `Exit0(${_sig_number_}) ${procKind}: ${procId}`;
}

/**
 *
 * @param indent
 * @param msg
 * @param optionalParams
 */
export function traceLog(indent: number, msg: string, ...optionalParams: any[]) {
  if (_enableLog_) console.log("    ".repeat(indent) + msg, ...optionalParams);
}

/**
 *
 * @param log
 */
export function exitLog(log: string, type?: TypeDescription) {
  if (_enableLog_) console.log(log + (type ? `, type: ${type?.$type}` : ""));
}
