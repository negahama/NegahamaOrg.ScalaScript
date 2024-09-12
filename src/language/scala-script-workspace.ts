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
  var length: number
  def charAt(index: number)-> string
  def charCodeAt(index: number)-> number
  def codePointAt(pos: number)-> number
  def concat(str: string)-> string
  def includes(searchString: string, position: number)-> boolean
  def endsWith(searchString: string, endPosition: number)-> boolean
  def indexOf(searchValue: string, fromIndex: number)-> number
  def lastIndexOf(searchValue: string, fromIndex: number)-> number
  def localeCompare(compareString: string)-> number
  //def match(regexp: string)-> string
  def matchAll(regexp: string)-> string[]
  def normalize(form: string)-> string
  def padEnd(targetLength: number, padString: string)-> string
  def padStart(targetLength: number, padString: string)-> string
  def repeat(count: number)-> string
  def replace(searchFor: string, replaceWith: string)-> string
  def replaceAll(searchFor: string, replaceWith: string)-> string
  def search(regexp: string)-> string
  def slice(beginIndex: number, endIndex: number)-> string
  def split(sep: string, limit: number)-> string[]
  def startsWith(searchString: string, position: number)-> boolean
  def substring(indexStart: number, indexEnd: number)-> string
  def toLocaleLowerCase(locale: string)-> string
  def toLocaleUpperCase(locale: string)-> string
  def toLowerCase()-> string
  def toUpperCase()-> string
  def toString()-> string
  def trim()-> string
  def trimStart()-> string
  def trimEnd()-> string
  def valueOf()-> string
}
@NotTrans def $array$ => {
  var length: number
  def at(index)-> string
  def concat()-> string[]
  def copyWithin()-> string
  def every(callbackFn)-> string
  def fill(value, start, end)-> string
  def filter(callbackFn)-> string[]
  def find(callbackFn)-> any
  def findIndex(callbackFn)-> number
  def findLast(callbackFn)-> string
  def findLastIndex(callbackFn)-> number
  def flat(depth)-> string
  def flatMap(callbackFn)-> string
  def forEach(callbackFn)-> string
  def includes(searchElement, fromIndex)-> boolean
  def indexOf(searchElement, fromIndex)-> number
  def join(separate)-> string
  def keys()-> string
  def lastIndexOf(searchElement, fromIndex)-> string
  def map(callbackFn)-> string
  def pop()-> string
  def push(element)-> string
  def reduce(callbackFn)-> string
  def reduceRight(callbackFn)-> string
  def reverse()-> string
  def shift()-> string
  def slice()-> string
  def some(callbackFn)-> string
  def sort(callbackFn)-> any[]
  def splice()-> string
  def toString()-> string
  def unshift()-> string
  def values()-> string
}
@NotTrans def $number$ => {
  def isNaN()-> boolean
  def isFinite()-> boolean
  def isInteger()-> boolean
  def isSafeInteger()-> boolean
  def parseFloat(x: string)-> number
  def parseInt(x: string)-> number
  def toExponential(fractionDigits: number)-> number
  def toFixed(digits: number)-> string
  def toLocaleString(locales: string)-> string
  def toPrecision(precision: number)-> number
  def toString()-> string
  def valueOf()-> number
}
@NotTrans def Number => {
  val EPSILON: number
  val MAX_SAFE_INTEGER: number
  val MIN_SAFE_INTEGER: number
  val MAX_VALUE: number
  val MIN_VALUE: number
  val NaN: number
  val NEGATIVE_INFINITY: number
  val POSITIVE_INFINITY: number
  def isNaN()-> boolean
}
@NotTrans def Math => {
  val E: number
  val PI: number
  val LN2: number
  val LN10: number
  val LOG2E: number
  val LOG10E: number
  val SQRT1_2: number
  val SQRT2: number
  def abs(x: number)-> number
  def acos(x: number)-> number
  def acosh(x: number)-> number
  def asin(x: number)-> number
  def asinh(x: number)-> number
  def atan(x: number)-> number
  def atanh(x: number)-> number
  def atan2(y: number, x: number)-> number
  def cbrt(x: number)-> number
  def ceil(x: number)-> number
  def clz32(x: number)-> number
  def cos(x: number)-> number
  def cosh(x: number)-> number
  def exp(x: number)-> number
  def expm1(x: number)-> number
  def floor(x: number)-> number
  def fround(x: number)-> number
  def imul(x: number, y)-> number
  def log(x: number)-> number
  def log1p(x: number)-> number
  def log10(x: number)-> number
  def log2(x: number)-> number
  def max(x: number, y: number)-> number
  def min(x: number, y: number)-> number
  def pow(x: number, y)-> number
  def random()-> number
  def round(x: number)-> number
  def sign(x: number)-> number
  def sin(x: number)-> number
  def sinh(x: number)-> number
  def sqrt(x: number)-> number
  def tan(x: number)-> number
  def tanh(x: number)-> number
  def trunc(x: number)-> number
}

@NotTrans def console => { def log() }
@NotTrans def assert => { def equal() def notEqual() }
@NotTrans def parseInt()->number
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
    collector(this.documentFactory.fromString(ScalaScriptBuiltinLibrary, URI.parse("builtin:///library.ss")));
  }
}
