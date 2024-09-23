import {
  AstNode,
  DefaultWorkspaceManager,
  LangiumDocument,
  LangiumDocumentFactory,
  LangiumSharedCoreServices,
} from 'langium'
import { WorkspaceFolder } from 'vscode-languageserver'
import { URI } from 'vscode-uri'

/**
 *
 */
export const ScalaScriptBuiltinLibrary = `
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
  // 순회 가능 또는 유사 배열 객체에서 새 Array인스턴스를 생성합니다.
  def from()-> any[]
  // 비동기 순회 가능, 순회 가능, 또는 유사 배열 객체에서 새 Array 인스턴스를 생성합니다.
  def fromAsync()-> any[]
  // 인자가 배열이면 true를 반환하고, 그렇지 않으면 false를 반환합니다.
  def isArray()-> any[]
  // 인자의 개수나 유형에 관계없이 가변적인 수의 인자를 가진 새 Array 인스턴스를 생성합니다.
  def of()-> any[]
  // 배열 요소의 개수를 반영합니다.
  var length: number
  // 주어진 인덱스에 있는 배열의 항목을 반환합니다. 마지막 항목부터 셀 수 있는 음의 정수를 허용합니다.
  def at(index)-> any
  // 다른 배열 및/또는 값과 결합된 호출 배열인 새 배열을 반환합니다.
  def concat()-> any[]
  // 배열 내의 배열 요소 시퀀스를 복사하고 변경된 배열을 반환합니다.
  def copyWithin()-> any[]
  // 호출 배열의 모든 요소가 테스트 함수를 만족하면 true를 반환합니다.
  def every(callbackFn)-> boolean
  // 시작 인덱스부터 끝 인덱스까지 배열의 모든 요소를 고정된 값으로 채우고 변경된 배열을 반환합니다.
  def fill(value, start, end)-> any[]
  // 제공된 필터링 함수가 true를 반환하는 호출 배열의 모든 요소를 포함하는 새 배열을 반환합니다.
  def filter(callbackFn)-> any[]
  // 제공된 테스트 함수를 만족하는 배열의 첫 번째 요소의 값을 반환하고, 적절한 요소를 찾을 수 없으면 undefined를 반환합니다.
  def find(callbackFn)-> any
  // 제공된 테스트 함수를 만족하는 배열의 첫 번째 요소의 인덱스를 반환하고, 적절한 요소를 찾을 수 없으면 -1을 반환합니다.
  def findIndex(callbackFn)-> number
  // 제공된 테스트 함수를 만족하는 배열의 마지막 요소의 값을 반환하고, 적절한 요소를 찾을 수 없으면 undefined를 반환합니다.
  def findLast(callbackFn)-> any
  // 제공된 테스트 함수를 만족하는 배열의 마지막 요소의 인덱스를 반환하고, 적절한 요소를 찾을 수 없는 경우 -1을 반환합니다.
  def findLastIndex(callbackFn)-> number
  // 지정된 깊이까지 재귀적으로 연결된 모든 하위 배열 요소가 포함된 새 배열을 반환합니다.
  def flat(depth)-> any[]
  // 호출 배열의 각 요소에 지정된 콜백 함수를 적용한 다음 결과를 한 단계씩 평탄화하여 만들어진 새 배열을 반환합니다.
  def flatMap(callbackFn)-> any[]
  // 호출 배열의 각 요소로 함수를 호출합니다.
  def forEach(callbackFn)-> void
  // 호출하는 배열에 값이 포함되어 있는지 여부를 판단하여 적절하게 true나false를 반환합니다.
  def includes(searchElement, fromIndex)-> boolean
  // 호출 배열에서 지정된 요소를 찾을 수 있는 첫 번째(최소) 인덱스를 반환합니다.
  def indexOf(searchElement, fromIndex)-> number
  // 배열의 모든 요소를 문자열로 결합합니다.
  def join(separate)-> string
  // 호출 배열에서 지정된 요소를 찾을 수 있는 마지막(가장 큰) 인덱스를 반환하고, 찾을 수 없는 경우 -1을 반환합니다.
  def lastIndexOf(searchElement, fromIndex)-> number
  // 호출 배열의 모든 요소에 함수를 호출한 결과를 포함하는 새 배열을 반환합니다.
  def map(callbackFn)-> any[]
  // 배열에서 마지막 요소를 제거하고 해당 요소를 반환합니다.
  def pop()-> any
  // 배열 끝에 하나 이상의 요소를 추가하고, 배열의 새 length를 반환합니다.
  def push(element)-> number
  // 배열의 각 요소(왼쪽에서 오른쪽으로)에 대해 사용자가 제공한 "리듀서" 콜백 함수를 실행하여 하나의 값으로 줄입니다.
  def reduce(callbackFn)-> any
  // 배열의 각 요소(오른쪽에서 왼쪽으로)에 대해 사용자가 제공한 "리듀서" 콜백 함수를 실행하여 하나의 값으로 줄입니다.
  def reduceRight(callbackFn)-> any
  // 배열 요소의 순서를 반대로 바꿉니다. (첫 번째가 마지막이 되고, 마지막이 첫 번째가 됩니다.)
  def reverse()-> any[]
  // 배열에서 첫 번째 요소를 제거하고 해당 요소를 반환합니다.
  def shift()-> any
  // 호출 배열의 구획을 추출하고 새 배열을 반환합니다.
  def slice()-> any[]
  // 호출 배열의 요소 중 하나 이상이 제공된 테스트 함수를 만족하면 true를 반환합니다.
  def some(callbackFn)-> boolean
  // 배열의 요소를 제자리 정렬하고 배열을 반환합니다.
  def sort(callbackFn)-> any[]
  // 배열에서 요소를 추가 및/또는 제거합니다.
  def splice()-> any[]
  // 호출 배열과 그 요소를 나타내는 문자열을 반환합니다.
  def toString()-> string
  // 배열 앞쪽에 하나 이상의 요소를 추가하고, 배열의 새 length를 반환합니다.
  def unshift()-> number
  // 호출 배열의 각 인덱스에 대한 키를 포함하는 새 배열 반복자를 반환합니다.
  def keys()-> any
  // 배열의 각 인덱스에 대한 키/값 쌍을 포함하는 새 배열 반복자 객체를 반환합니다.
  def entries()-> any
  // 
  def values()-> any
}

@NotTrans def $number$ => {
  // 주어진 값이 NaN인지 확인합니다.
  def isNaN()-> boolean
  // 주어진 값이 유한수 인지 확인합니다.
  def isFinite()-> boolean
  // 주어진 값이 정수인지 확인합니다.
  def isInteger()-> boolean
  // 주어진 값이 안전한 정수(-(2^53 - 1)과 2^53 - 1 사이의 정수)인지 확인합니다.
  def isSafeInteger()-> boolean
  // 전역 객체 parseFloat()와 동일한 값입니다.
  def parseFloat(x: string)-> number
  // 전역 객체 parseInt()와 동일한 값입니다.
  def parseInt(x: string)-> number
  // 지수 표기법으로 표기된 숫자를 표현하는 문자열을 반환한다
  def toExponential(fractionDigits: number)-> string
  // 고정 소수점 표기법으로 숫자를 표현하는 문자열을 반환합니다.
  def toFixed(digits: number)-> string
  // 이 숫자를 해당 언어 방식으로 표현된 문자열을 반환합니다.
  def toLocaleString(locales: string)-> string
  // 고정 소수점 또는 지수 표기법으로 지정된 정밀도로 숫자를 표현하는 문자열을 반환합니다.
  def toPrecision(precision: number)-> string
  // 지정한 기수("base")에서 지정한 개체를 표현하는 문자열을 반환합니다.
  def toString()-> string
  // 명시된 객체의 원시 값을 반환합니다.
  def valueOf()-> number
}

@NotTrans def Number => {
  // 두 개의 표현 가능한 숫자 사이의 최소 간격.
  val EPSILON: number
  // JavaScript에서 안전한 최대 정수. (2^53 - 1)
  val MAX_SAFE_INTEGER: number
  // JavaScript에서 안전한 최소 정수. (-(2^53 - 1)).
  val MIN_SAFE_INTEGER: number
  // 표현 가능한 가장 큰 양수.
  val MAX_VALUE: number
  // 표현 가능한 가장 작은 양수. 즉, 0보다 크지만 0에 가장 가까운 양수
  val MIN_VALUE: number
  // "Not a Number"(숫자가 아님)을 나타내는 특별한 값.
  val NaN: number
  // 음의 무한대를 나타내는 특수한 값. 오버플로우 시 반환됩니다.
  val NEGATIVE_INFINITY: number
  // 양의 무한대를 나타내는 특수한 값. 오버플로우 시 반환됩니다.
  val POSITIVE_INFINITY: number
  // 주어진 값이 NaN인지 확인합니다.
  def isNaN()-> boolean
  // 주어진 값이 유한수 인지 확인합니다.
  def isFinite()-> boolean
  // 주어진 값이 정수인지 확인합니다.
  def isInteger()-> boolean
  // 주어진 값이 안전한 정수(-(2^53 - 1)과 2^53 - 1 사이의 정수)인지 확인합니다.
  def isSafeInteger()-> boolean
  // 전역 객체 parseFloat()와 동일한 값입니다.
  def parseFloat(x: string)-> number
  // 전역 객체 parseInt()와 동일한 값입니다.
  def parseInt(x: string)-> number
  // 지수 표기법으로 표기된 숫자를 표현하는 문자열을 반환한다
  def toExponential(fractionDigits: number)-> string
  // 고정 소수점 표기법으로 숫자를 표현하는 문자열을 반환합니다.
  def toFixed(digits: number)-> string
  // 이 숫자를 해당 언어 방식으로 표현된 문자열을 반환합니다.
  def toLocaleString(locales: string)-> string
  // 고정 소수점 또는 지수 표기법으로 지정된 정밀도로 숫자를 표현하는 문자열을 반환합니다.
  def toPrecision(precision: number)-> string
  // 지정한 기수("base")에서 지정한 개체를 표현하는 문자열을 반환합니다.
  def toString()-> string
  // 명시된 객체의 원시 값을 반환합니다.
  def valueOf()-> number
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

@NotTrans def Array => {}

@NotTrans def Map => {
  // 요소의 개수를 반환합니다.
  var size: number
  // key를 이용해 value를 저장합니다.
  def set(key, value)
  // key에 해당하는 값을 반환합니다. key가 존재하지 않으면 undefined를 반환합니다.
  def get(key)
  // key가 존재하면 true, 존재하지 않으면 false를 반환합니다.
  def has(key)-> boolean
  // key에 해당하는 값을 삭제합니다.
  def delete(key)
  // 맵 안의 모든 요소를 제거합니다.
  def clear()
  // 각 요소의 키를 모은 반복 가능한(iterable, 이터러블) 객체를 반환합니다.
  def keys()
  // 각 요소의 값을 모은 이터러블 객체를 반환합니다.
  def values()
  // 요소의 [키, 값]을 한 쌍으로 하는 이터러블 객체를 반환합니다. 이 이터러블 객체는 for..of반복문의 기초로 쓰입니다.
  def entries()
  //
  def forEach()
}

@NotTrans def Set => {
  // 셋에 몇 개의 값이 있는지 세줍니다.
  var size: number
  // 값을 추가하고 셋 자신을 반환합니다.
  def add(value)
  // 셋 내에 값이 존재하면 true, 아니면 false를 반환합니다.
  def has(value)-> boolean
  // 값을 제거합니다. 호출 시점에 셋 내에 값이 있어서 제거에 성공하면 true, 아니면 false를 반환합니다.
  def delete(value)
  // 셋을 비웁니다.
  def clear()
  // 각 요소의 키를 모은 반복 가능한(iterable, 이터러블) 객체를 반환합니다.
  def keys()
  // 각 요소의 값을 모은 이터러블 객체를 반환합니다.
  def values()
  // 요소의 [키, 값]을 한 쌍으로 하는 이터러블 객체를 반환합니다. 이 이터러블 객체는 for..of반복문의 기초로 쓰입니다.
  def entries()
  //
  def forEach()
}

@NotTrans def JSON => {
  def stringify()-> string
  def parse()
}

@NotTrans def fs => { 
  def existsSync()-> boolean
  def mkdirSync()
  def readdirSync()-> string[]
  def readFileSync()
  def writeFileSync()
  def appendFileSync()
}

@NotTrans def parseFloat()->number
@NotTrans def parseInt()->number
@NotTrans def escape()-> string
`.trim()

/**
 *
 */
export class ScalaScriptWorkspaceManager extends DefaultWorkspaceManager {
  private documentFactory: LangiumDocumentFactory

  constructor(services: LangiumSharedCoreServices) {
    super(services)
    this.documentFactory = services.workspace.LangiumDocumentFactory
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
    // console.log("before loadAdditionalDocuments", folders)
    await super.loadAdditionalDocuments(folders, collector)
    // console.log("after loadAdditionalDocuments")
    // Load our library using the `builtin` URI schema
    collector(this.documentFactory.fromString(ScalaScriptBuiltinLibrary, URI.parse('builtin:///library.ss')))
  }
}
