import {
  AstNode,
  DefaultWorkspaceManager,
  LangiumDocument,
  LangiumDocumentFactory,
  LangiumSharedCoreServices,
} from "langium";
import { WorkspaceFolder } from "vscode-languageserver";
import { URI } from "vscode-uri";

/**
 *
 */
const ScalaScriptBuiltinLibrary = `
@NotTrans def $string$ {
  length: number
  charAt(index: number)-> string
  charCodeAt(index: number)-> number
  codePointAt(pos: number)-> number
  concat(str: string)-> string
  includes(searchString: string, position: number)-> boolean
  endsWith(searchString: string, endPosition: number)-> boolean
  indexOf(searchValue: string, fromIndex: number)-> number
  lastIndexOf(searchValue: string, fromIndex: number)-> number
  localeCompare(compareString: string)-> number
  //match(regexp: string)-> string
  matchAll(regexp: string)-> string[]
  normalize(form: string)-> string
  padEnd(targetLength: number, padString: string)-> string
  padStart(targetLength: number, padString: string)-> string
  repeat(count: number)-> string
  replace(searchFor: string, replaceWith: string)-> string
  replaceAll(searchFor: string, replaceWith: string)-> string
  search(regexp: string)-> string
  slice(beginIndex: number, endIndex: number)-> string
  split(sep: string, limit: number)-> string[]
  startsWith(searchString: string, position: number)-> boolean
  substring(indexStart: number, indexEnd: number)-> string
  toLocaleLowerCase(locale: string)-> string
  toLocaleUpperCase(locale: string)-> string
  toLowerCase()-> string
  toUpperCase()-> string
  toString()-> string
  trim()-> string
  trimStart()-> string
  trimEnd()-> string
  valueOf()-> string
}
@NotTrans def $array$ {
  length: number
  at(index)-> string
  concat()-> string
  copyWithin()-> string
  every(callbackFn)-> string
  fill(value, start, end)-> string
  filter(callbackFn)-> string
  find(callbackFn)-> string
  findIndex(callbackFn)-> string
  findLast(callbackFn)-> string
  findLastIndex(callbackFn)-> string
  flat(depth)-> string
  flatMap(callbackFn)-> string
  forEach(callbackFn)-> string
  includes(searchElement, fromIndex)-> boolean
  indexOf(searchElement, fromIndex)-> number
  join(separate)-> string
  keys()-> string
  lastIndexOf(searchElement, fromIndex)-> string
  map(callbackFn)-> string
  pop()-> string
  push(element)-> string
  reduce(callbackFn)-> string
  reduceRight(callbackFn)-> string
  reverse()-> string
  shift()-> string
  slice()-> string
  some(callbackFn)-> string
  sort(callbackFn)-> string
  splice()-> string
  toString()-> string
  unshift()-> string
  values()-> string
}
@NotTrans def $number$ {
  EPSILON: number
  MAX_SAFE_INTEGER: number
  MIN_SAFE_INTEGER: number
  MAX_VALUE: number
  MIN_VALUE: number
  NaN: number
  NEGATIVE_INFINITY: number
  POSITIVE_INFINITY: number
  isNaN()-> boolean
  isFinite()-> boolean
  isInteger()-> boolean
  isSafeInteger()-> boolean
  parseFloat(x: string)-> number
  parseInt(x: string)-> number
  toExponential(fractionDigits: number)-> number
  toFixed(digits: number)-> string
  toLocaleString(locales: string)-> string
  toPrecision(precision: number)-> number
  toString()-> string
  valueOf()-> number
}
@NotTrans def Math {
  E: number
  PI: number
  LN2: number
  LN10: number
  LOG2E: number
  LOG10E: number
  SQRT1_2: number
  SQRT2: number
  abs(x: number)-> number
  acos(x: number)-> number
  acosh(x: number)-> number
  asin(x: number)-> number
  asinh(x: number)-> number
  atan(x: number)-> number
  atanh(x: number)-> number
  atan2(y: number, x: number)-> number
  cbrt(x: number)-> number
  ceil(x: number)-> number
  clz32(x: number)-> number
  cos(x: number)-> number
  cosh(x: number)-> number
  exp(x: number)-> number
  expm1(x: number)-> number
  floor(x: number)-> number
  fround(x: number)-> number
  imul(x: number, y)-> number
  log(x: number)-> number
  log1p(x: number)-> number
  log10(x: number)-> number
  log2(x: number)-> number
  max(x: number, y: number)-> number
  min(x: number, y: number)-> number
  pow(x: number, y)-> number
  random()-> number
  round(x: number)-> number
  sign(x: number)-> number
  sin(x: number)-> number
  sinh(x: number)-> number
  sqrt(x: number)-> number
  tan(x: number)-> number
  tanh(x: number)-> number
  trunc(x: number)-> number
}

@NotTrans def console => { log() }
@NotTrans def assert => { equal() notEqual() }
`.trim();

/**
 *
 */
export class ScalaScriptWorkspaceManager extends DefaultWorkspaceManager {
  private documentFactory: LangiumDocumentFactory;

  constructor(services: LangiumSharedCoreServices) {
    super(services);
    this.documentFactory = services.workspace.LangiumDocumentFactory;
  }

  /**
   *
   * @param folders
   * @param collector
   */
  protected override async loadAdditionalDocuments(
    folders: WorkspaceFolder[],
    collector: (document: LangiumDocument<AstNode>) => void
  ): Promise<void> {
    // console.log("before loadAdditionalDocuments", folders);
    await super.loadAdditionalDocuments(folders, collector);
    // console.log("after loadAdditionalDocuments");
    // Load our library using the `builtin` URI schema
    collector(this.documentFactory.fromString(ScalaScriptBuiltinLibrary, URI.parse("builtin:///library.hello")));
  }
}
