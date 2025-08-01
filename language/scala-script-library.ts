/**
 *
 */
export const ScalaScriptBuiltinLibrary = `
@NotTrans export def $string$ = {
  /**
   * Reflects the length of the string. Read-only.
   */
  var length: number

  /**
   * Returns the character (exactly one UTF-16 code unit) at the specified index.
   * @param index
   * @returns
   */
  var charAt: (index: number) -> string

  /**
   * Returns a number that is the UTF-16 code unit value at the given index.
   * @param index
   * @returns
   */
  var charCodeAt: (index: number) -> number

  /**
   * Returns a nonnegative integer Number that is the code point value of the UTF-16 encoded code point starting at the specified pos.
   * @param pos
   * @returns
   */
  var codePointAt: (pos: number) -> number

  /**
   * Combines the text of two (or more) strings and returns a new string.
   * @param str
   * @returns
   */
  var concat: (str: string) -> string

  /**
   * Determines whether the calling string contains searchString.
   * @param searchString The string to search for.
   * @param position The position in the string at which to begin searching for searchString.
   * @returns
   */
  var includes: (searchString: string, position?: number) -> boolean

  /**
   * Determines whether a string ends with the characters of the string searchString.
   * @param searchString The characters to be searched for at the end of the calling string.
   * @param endPosition If provided, it is used as the length of the calling string.
   * @returns
   */
  var endsWith: (searchString: string, endPosition?: number) -> boolean

  /**
   * Returns the index within the calling String object of the first occurrence of searchValue, or -1 if not found.
   * @param searchValue The string to search for.
   * @param fromIndex The index at which to begin the search. If omitted, the search starts at the beginning of the string.
   * @returns
   */
  var indexOf: (searchValue: string, fromIndex?: number) -> number

  /**
   * Returns the index within the calling String object of the last occurrence of searchValue, or -1 if not found.
   * @param searchValue The string to search for.
   * @param fromIndex The index at which to begin the search. If omitted, the search starts at the end of the string.
   * @returns
   */
  var lastIndexOf: (searchValue: string, fromIndex?: number) -> number

  /**
   * Returns a number indicating whether the reference string compareString comes before, after, or is equivalent to the given string in sort order.
   * @param compareString The string to compare against the calling string.
   * @returns
   */
  var localeCompare: (compareString: string) -> number

  /**
   * Used to match regular expression regexp against a string.
   * @param regexp The regular expression to search for.
   * @returns
   */
  //var match: (regexp: string) -> string

  /**
   * Returns an iterator of all regexp's matches.
   * @param regexp The regular expression to search for.
   * @returns
   */
  var matchAll: (regexp: string) -> string[]

  /**
   * Returns the Unicode Normalization Form of the calling string value.
   * @param form The Unicode Normalization Form to use. Possible values are NFC, NFD, NFKC, and NFKD.
   * @returns
   */
  var normalize: (form: string) -> string

  /**
   * Pads the current string from the end with a given string and returns a new string of the length targetLength.
   * @param targetLength The length of the resulting string once the current string has been padded. If the value is less than the current string's length, the current string will be returned as it is.
   * @returns
   */
  var padEnd: (targetLength: number, padString?: string) -> string

  /**
   * Pads the current string from the start with a given string and returns a new string of the length targetLength.
   * @param targetLength The length of the resulting string once the current string has been padded. If the value is less than the current string's length, the current string will be returned as it is.
   * @param padString The string to pad the current string with. If padString is too long, it will be truncated from the end.
   * @returns
   */
  var padStart: (targetLength: number, padString?: string) -> string

  /**
   * Returns a string consisting of the elements of the object repeated count times.
   * @param count The number of times to repeat the string. If count is negative, the empty string is returned.
   * @returns
   */
  var repeat: (count: number) -> string

  /**
   * Used to replace occurrences of searchFor using replaceWith. searchFor may be a string or Regular Expression, and replaceWith may be a string or function.
   * @param searchFor The substring or regular expression to search for.
   * @param replaceWith The string or function to replace the matched substring with.
   * @returns
   */
  var replace: (searchFor: string, replaceWith: string) -> string

  /**
   * Used to replace all occurrences of searchFor using replaceWith. searchFor may be a string or Regular Expression, and replaceWith may be a string or function.
   * @param searchFor The substring or regular expression to search for.
   * @param replaceWith The string or function to replace the matched substring with.
   * @returns
   */
  var replaceAll: (searchFor: string, replaceWith: string) -> string

  /**
   * Search for a match between a regular expression regexp and the calling string.
   * @param regexp The regular expression to search for.
   * @returns
   */
  var search: (regexp: string) -> string

  /**
   * Extracts a section of a string and returns a new string.
   * @param beginIndex The zero-based index at which to begin extraction.
   * @param endIndex The zero-based index at which to end extraction. If omitted, the substring will extend to the end of the string.
   * @returns
   */
  var slice: (beginIndex: number, endIndex?: number) -> string

  /**
   * Returns an array of strings populated by splitting the calling string at occurrences of the substring sep.
   * @param sep The string or regular expression to use for splitting the string.
   * @param limit A value used to limit the number of elements in the returned array.
   * @returns
   */
  var split: (sep?: string, limit?: number) -> string[]

  /**
   * Determines whether the calling string begins with the characters of string searchString.
   * @param searchString The characters to be searched for at the beginning of the calling string.
   * @param position The position in the string at which to begin searching for searchString. Defaults to 0.
   * @returns
   */
  var startsWith: (searchString: string, position?: number) -> boolean

  /**
   * Returns a new string containing characters of the calling string from (or between) the specified index (or indices).
   * @param indexStart The zero-based index at which to begin extraction.
   * @param indexEnd The zero-based index at which to end extraction. If omitted, the substring will extend to the end of the string.
   * @returns
   */
  var substring: (indexStart: number, indexEnd?: number) -> string

  /**
   * The characters within a string are converted to lowercase while respecting the current locale.For most languages, this will return the same as toLowerCase().
   * @param locale The locale to use for the conversion. If omitted, the default locale will be used.
   * @returns
   */
  var toLocaleLowerCase: (locale?: string) -> string

  /**
   * The characters within a string are converted to uppercase while respecting the current locale.For most languages, this will return the same as toUpperCase().
   * @param locale The locale to use for the conversion. If omitted, the default locale will be used.
   * @returns
   */
  var toLocaleUpperCase: (locale?: string) -> string

  /**
   * Returns the calling string value converted to lowercase.
   * @returns
   */
  var toLowerCase: () -> string

  /**
   * Returns the calling string value converted to uppercase.
   * @returns
   */
  var toUpperCase: () -> string

  /**
   * Returns a string representing the specified object. Overrides the Object.prototype.toString() method.
   * @returns
   */
  var toString: () -> string

  /**
   * Trims whitespace from the beginning and end of the string. Part of the ECMAScript 5 standard.
   * @returns
   */
  var trim: () -> string

  /**
   * Trims whitespace from the beginning of the string.
   * @returns
   */
  var trimStart: () -> string

  /**
   * Trims whitespace from the end of the string.
   * @returns
   */
  var trimEnd: () -> string

  /**
   * Returns the primitive value of the specified object. Overrides the Object.prototype.valueOf() method.
   * @returns
   */
  var valueOf: () -> string
}

@NotTrans export def $array$<T> = {
  /**
   * 순회 가능 또는 유사 배열 객체에서 새 Array인스턴스를 생성합니다.
   * @returns
   */
  var from: () -> T[]

  /**
   * 비동기 순회 가능, 순회 가능, 또는 유사 배열 객체에서 새 Array 인스턴스를 생성합니다.
   * @returns
   */
  var fromAsync: () -> T[]

  /**
   * 인자가 배열이면 true를 반환하고, 그렇지 않으면 false를 반환합니다.
   * @returns
   */
  var isArray: () -> T[]

  /**
   * 인자의 개수나 유형에 관계없이 가변적인 수의 인자를 가진 새 Array 인스턴스를 생성합니다.
   * @returns
   */
  var of: () -> T[]

  /**
   * 배열 요소의 개수를 반영합니다.
   */
  var length: number

  /**
   * 주어진 인덱스에 있는 배열의 항목을 반환합니다. 마지막 항목부터 셀 수 있는 음의 정수를 허용합니다.
   * @param index
   * @returns
   */
  var at: (index: number) -> T

  /**
   * 다른 배열 및/또는 값과 결합된 호출 배열인 새 배열을 반환합니다.
   * @param value
   * @returns
   */
  var concat: (...value: any[]) -> T[]

  /**
   * 배열 내의 배열 요소 시퀀스를 복사하고 변경된 배열을 반환합니다.
   * @param target
   * @param start
   * @param end
   * @returns
   */
  var copyWithin: (target: number, start: number, end?: number) -> T[]

  /**
   * 호출 배열의 모든 요소가 테스트 함수를 만족하면 true를 반환합니다.
   * @param callbackFn
   * @returns
   */
  var every: (callbackFn: (arg: T, index?: number) -> boolean) -> boolean

  /**
   * 시작 인덱스부터 끝 인덱스까지 배열의 모든 요소를 고정된 값으로 채우고 변경된 배열을 반환합니다.
   * @param value
   * @param start
   * @param end
   * @returns
   */
  var fill: (value: T, start?: number, end?: number) -> T[]

  /**
   * 제공된 필터링 함수가 true를 반환하는 호출 배열의 모든 요소를 포함하는 새 배열을 반환합니다.
   * @param callbackFn
   * @returns
   */
  var filter: (callbackFn: (arg: T, index?: number) -> boolean) -> T[]

  /**
   * 제공된 테스트 함수를 만족하는 배열의 첫 번째 요소의 값을 반환하고, 적절한 요소를 찾을 수 없으면 nil를 반환합니다.
   * @param callbackFn
   * @returns
   */
  var find: (callbackFn: (arg: T, index?: number) -> boolean) -> T

  /**
   * 제공된 테스트 함수를 만족하는 배열의 첫 번째 요소의 인덱스를 반환하고, 적절한 요소를 찾을 수 없으면 -1을 반환합니다.
   * @param callbackFn
   * @returns
   */
  var findIndex: (callbackFn: (arg: T, index?: number) -> boolean) -> number

  /**
   * 제공된 테스트 함수를 만족하는 배열의 마지막 요소의 값을 반환하고, 적절한 요소를 찾을 수 없으면 nil를 반환합니다.
   * @param callbackFn
   * @returns
   */
  var findLast: (callbackFn: (arg: T, index?: number) -> boolean) -> T

  /**
   * 제공된 테스트 함수를 만족하는 배열의 마지막 요소의 인덱스를 반환하고, 적절한 요소를 찾을 수 없는 경우 -1을 반환합니다.
   * @param callbackFn
   * @returns
   */
  var findLastIndex: (callbackFn: (arg: T, index?: number) -> boolean) -> number

  /**
   * 지정된 깊이까지 재귀적으로 연결된 모든 하위 배열 요소가 포함된 새 배열을 반환합니다.
   * @param depth
   * @returns
   */
  var flat: (depth?: number) -> T[]

  /**
   * 호출 배열의 각 요소에 지정된 콜백 함수를 적용한 다음 결과를 한 단계씩 평탄화하여 만들어진 새 배열을 반환합니다.
   * @param callbackFn
   * @returns
   */
  var flatMap: (callbackFn: (arg: T, index?: number) -> T) -> T[]

  /**
   * 호출 배열의 각 요소로 함수를 호출합니다.
   * @param callbackFn
   * @returns
   */
  var forEach: (callbackFn: (arg: T, index?: number) -> any, thisArg?: any) -> void

  /**
   * 호출하는 배열에 값이 포함되어 있는지 여부를 판단하여 적절하게 true나false를 반환합니다.
   * @param searchElement
   * @param fromIndex 
   * @returns
   */
  var includes: (searchElement: T, fromIndex?: number) -> boolean

  /**
   * 호출 배열에서 지정된 요소를 찾을 수 있는 첫 번째(최소) 인덱스를 반환합니다.
   * @param searchElement
   * @param fromIndex
   * @returns
   */
  var indexOf: (searchElement: T, fromIndex?: number) -> number

  /**
   * 배열의 모든 요소를 문자열로 결합합니다.
   * @param separate
   * @returns
   */
  var join: (separate?: string) -> string

  /**
   * 호출 배열에서 지정된 요소를 찾을 수 있는 마지막(가장 큰) 인덱스를 반환하고, 찾을 수 없는 경우 -1을 반환합니다.
   * @param searchElement
   * @param fromIndex
   * @returns
   */
  var lastIndexOf: (searchElement: T, fromIndex?: number) -> number

  /**
   * 호출 배열의 모든 요소에 함수를 호출한 결과를 포함하는 새 배열을 반환합니다.
   * @param callbackFn
   * @returns
   */
  var map: (callbackFn: (arg: T, index?: number) -> T) -> T[]

  /**
   * 배열에서 마지막 요소를 제거하고 해당 요소를 반환합니다.
   * @returns
   */
  var pop: () -> T

  /**
   * 배열 끝에 하나 이상의 요소를 추가하고, 배열의 새 length를 반환합니다.
   * @param element
   * @returns
   */
  var push: (...element: T[]) -> number

  /**
   * 배열의 각 요소(왼쪽에서 오른쪽으로)에 대해 사용자가 제공한 "리듀서" 콜백 함수를 실행하여 하나의 값으로 줄입니다.
   * @param callbackFn
   * @param initialValue
   * @returns
   */
  var reduce: (callbackFn: (accumulator: any, currentValue: T, currentIndex?: number) -> any, initialValue?: any) -> any

  /**
   * 배열의 각 요소(오른쪽에서 왼쪽으로)에 대해 사용자가 제공한 "리듀서" 콜백 함수를 실행하여 하나의 값으로 줄입니다.
   * @param callbackFn
   * @param initialValue
   * @returns
   */
  var reduceRight: (callbackFn: (accumulator: any, currentValue: T, currentIndex?: number) -> any, initialValue?: any) -> any

  /**
   * 배열 요소의 순서를 반대로 바꿉니다. (첫 번째가 마지막이 되고, 마지막이 첫 번째가 됩니다.)
   * @returns
   */
  var reverse: () -> T[]

  /**
   * 배열에서 첫 번째 요소를 제거하고 해당 요소를 반환합니다.
   * @returns
   */
  var shift: () -> T

  /**
   * 호출 배열의 구획을 추출하고 새 배열을 반환합니다.
   * @param begin
   * @param end
   * @returns
   */
  var slice: (begin?: number, end?: number) -> T[]

  /**
   * 호출 배열의 요소 중 하나 이상이 제공된 테스트 함수를 만족하면 true를 반환합니다.
   * @param callbackFn
   * @returns
   */
  var some: (callbackFn: (arg: T, index?: number) -> boolean) -> boolean

  /**
   * 배열의 요소를 제자리 정렬하고 배열을 반환합니다.
   * @param callbackFn
   * @returns
   */
  var sort: (callbackFn: (arg1: T, arg2: T) -> number) -> T[]

  /**
   * 배열의 기존 요소를 삭제 또는 교체하거나 새 요소를 추가하여 배열의 내용을 변경합니다.
   * @param start
   * @param deleteCount
   * @param item
   * @returns
   */
  var splice: (start: number, deleteCount?: number, ...item: T[]) -> T[]

  /**
   * 호출 배열과 그 요소를 나타내는 문자열을 반환합니다.
   * @returns
   */
  var toString: () -> string

  /**
   * 배열 앞쪽에 하나 이상의 요소를 추가하고, 배열의 새 length를 반환합니다.
   * @returns
   */
  var unshift: () -> number

  /**
   * 호출 배열의 각 인덱스에 대한 키를 포함하는 새 배열 반복자를 반환합니다.
   * @returns
   */
  var keys: () -> any

  /**
   * 배열의 각 인덱스에 대한 키/값 쌍을 포함하는 새 배열 반복자 객체를 반환합니다.
   * @returns
   */
  var entries: () -> any

  /**
   * 
   * @param
   * @returns
   */
  var values: () -> T[]
}

@NotTrans export def $number$ = {
  /**
   * 주어진 값이 NaN인지 확인합니다.
   * @returns
   */
  var isNaN: () -> boolean

  /**
   * 주어진 값이 유한수 인지 확인합니다.
   * @returns
   */
  var isFinite: () -> boolean

  /**
   * 주어진 값이 정수인지 확인합니다.
   * @returns
   */
  var isInteger: () -> boolean

  /**
   * 주어진 값이 안전한 정수(-(2^53 - 1)과 2^53 - 1 사이의 정수)인지 확인합니다.
   * @returns
   */
  var isSafeInteger: () -> boolean

  /**
   * 전역 객체 parseFloat()와 동일한 값입니다.
   * @param str
   * @returns
   */
  var parseFloat: (str: string) -> number

  /**
   * 전역 객체 parseInt()와 동일한 값입니다.
   * @param str
   * @returns
   */
  var parseInt: (str: string) -> number

  /**
   * 지수 표기법으로 표기된 숫자를 표현하는 문자열을 반환한다
   * @param fractionDigits
   * @returns
   */
  var toExponential: (fractionDigits: number) -> string

  /**
   * 고정 소수점 표기법으로 숫자를 표현하는 문자열을 반환합니다.
   * @param digits 소수점 뒤에 나타날 자릿수. 0 이상 20 이하의 값을 사용할 수 있습니다. 값을 지정하지 않으면 0을 사용합니다.
   * @returns
   */
  var toFixed: (digits?: number) -> string

  /**
   * 이 숫자를 해당 언어 방식으로 표현된 문자열을 반환합니다.
   * @param locales
   * @returns
   */
  var toLocaleString: (locales: string) -> string

  /**
   * 고정 소수점 또는 지수 표기법으로 지정된 정밀도로 숫자를 표현하는 문자열을 반환합니다.
   * @param precision
   * @returns
   */
  var toPrecision: (precision: number) -> string

  /**
   * 지정한 기수("base")에서 지정한 개체를 표현하는 문자열을 반환합니다.
   * @returns
   */
  var toString: () -> string

  /**
   * 명시된 객체의 원시 값을 반환합니다.
   * @returns
   */
  var valueOf: () -> number
}

@NotTrans export var parseFloat: (arg: any) ->number
@NotTrans export var parseInt: (arg: any) ->number

@NotTrans export def Number = {
  /**
   * 두 개의 표현 가능한 숫자 사이의 최소 간격.
   */
  static var EPSILON: number

  /**
   * JavaScript에서 안전한 최대 정수. (2^53 - 1)
   */
  static var MAX_SAFE_INTEGER: number

  /**
   * JavaScript에서 안전한 최소 정수. (-(2^53 - 1)).
   */
  static var MIN_SAFE_INTEGER: number

  /**
   * 표현 가능한 가장 큰 양수.
   */
  static var MAX_VALUE: number

  /**
   * 표현 가능한 가장 작은 양수. 즉, 0보다 크지만 0에 가장 가까운 양수
   */
  static var MIN_VALUE: number

  /**
   * "Not a Number"(숫자가 아님)을 나타내는 특별한 값.
   */
  static var NaN: number

  /**
   * 음의 무한대를 나타내는 특수한 값. 오버플로우 시 반환됩니다.
   */
  static var NEGATIVE_INFINITY: number

  /**
   * 양의 무한대를 나타내는 특수한 값. 오버플로우 시 반환됩니다.
   */
  static var POSITIVE_INFINITY: number

  /**
   * 주어진 값이 NaN인지 확인합니다.
   * @param value
   * @returns
   */
  static var isNaN: (value: number) -> boolean

  /**
   * 주어진 값이 유한수 인지 확인합니다.
   * @param value
   * @returns
   */
  static var isFinite: (value: number) -> boolean

  /**
   * 주어진 값이 정수인지 확인합니다.
   * @param value
   * @returns
   */
  static var isInteger: (value: number) -> boolean

  /**
   * 주어진 값이 안전한 정수(-(2^53 - 1)과 2^53 - 1 사이의 정수)인지 확인합니다.
   * @param value
   * @returns
   */
  static var isSafeInteger: (value: number) -> boolean

  /**
   * 전역 객체 parseFloat()와 동일한 값입니다.
   * @param str
   * @returns
   */
  static var parseFloat: (str: string) -> number

  /**
   * 전역 객체 parseInt()와 동일한 값입니다.
   * @param str
   * @returns
   */
  static var parseInt: (str: string) -> number

  /**
   * 지수 표기법으로 표기된 숫자를 표현하는 문자열을 반환한다
   * @param fractionDigits
   * @returns
   */
  static var toExponential: (fractionDigits: number) -> string

  /**
   * 고정 소수점 표기법으로 숫자를 표현하는 문자열을 반환합니다.
   * @param digits 소수점 뒤에 나타날 자릿수. 0 이상 20 이하의 값을 사용할 수 있습니다. 값을 지정하지 않으면 0을 사용합니다.
   * @returns
   */
  static var toFixed: (digits?: number) -> string

  /**
   * 이 숫자를 해당 언어 방식으로 표현된 문자열을 반환합니다.
   * @param locales
   * @returns
   */
  static var toLocaleString: (locales: string) -> string

  /**
   * 고정 소수점 또는 지수 표기법으로 지정된 정밀도로 숫자를 표현하는 문자열을 반환합니다.
   * @param precision
   * @returns
   */
  static var toPrecision: (precision: number) -> string

  /**
   * 지정한 기수("base")에서 지정한 개체를 표현하는 문자열을 반환합니다.
   * @returns
   */
  static var toString: () -> string

  /**
   * 명시된 객체의 원시 값을 반환합니다.
   * @returns
   */
  static var valueOf: () -> number
}

@NotTrans export def Math = {
  /**
   * 오일러의 상수이며 자연로그의 밑. 약 2.718.
   */
  static var E: number

  /**
   * 원의 둘레와 지름의 비율. 약 3.14159.
   */
  static var PI: number

  /**
   * 2의 자연로그. 약 0.693.
   */
  static var LN2: number

  /**
   * 10의 자연로그. 약 2.303.
   */
  static var LN10: number

  /**
   * 밑이 2인 로그 E. 약 1.443.
   */
  static var LOG2E: number

  /**
   * 밑이 10인 로그 E. 약 0.434.
   */
  static var LOG10E: number

  /**
   * ½의 제곱근. 약 0.707.
   */
  static var SQRT1_2: number

  /**
   * 2의 제곱근. 약 1.414.
   */
  static var SQRT2: number

  /**
   * 숫자의 절댓값을 반환합니다.
   * @param x
   * @returns
   */
  static var abs: (x: number) -> number

  /**
   * 숫자의 아크코사인 값을 반환합니다.
   * @param x
   * @returns
   */
  static var acos: (x: number) -> number

  /**
   * 숫자의 쌍곡아크코사인 값을 반환합니다.
   * @param x
   * @returns
   */
  static var acosh: (x: number) -> number

  /**
   * 숫자의 아크사인 값을 반환합니다.
   * @param x
   * @returns
   */
  static var asin: (x: number) -> number

  /**
   * 숫자의 쌍곡아크사인 값을 반환합니다.
   * @param x
   * @returns
   */
  static var asinh: (x: number) -> number

  /**
   * 숫자의 아크탄젠트 값을 반환합니다.
   * @param x
   * @returns
   */
  static var atan: (x: number) -> number

  /**
   * 숫자의 쌍곡아크탄젠트 값을 반환합니다.
   * @param x
   * @returns
   */
  static var atanh: (x: number) -> number

  /**
   * 인수 몫의 아크탄젠트 값을 반환합니다.
   * @param y
   * @param x
   * @returns
   */
  static var atan2: (y: number, x: number) -> number

  /**
   * 숫자의 세제곱근을 반환합니다.
   * @param x
   * @returns
   */
  static var cbrt: (x: number) -> number

  /**
   * 인수보다 크거나 같은 수 중에서 가장 작은 정수를 반환합니다.
   * @param x
   * @returns
   */
  static var ceil: (x: number) -> number

  /**
   * 주어진 32비트 정수의 선행 0 개수를 반환합니다.
   * @param x
   * @returns
   */
  static var clz32: (x: number) -> number

  /**
   * 숫자의 코사인 값을 반환합니다.
   * @param x
   * @returns
   */
  static var cos: (x: number) -> number

  /**
   * 숫자의 쌍곡코사인 값을 반환합니다.
   * @param x
   * @returns
   */
  static var cosh: (x: number) -> number

  /**
   * E^x 를 반환합니다. x는 인수이며 E 는 오일러 상수(2.718...) 또는 자연로그의 밑입니다.
   * @param x
   * @returns
   */
  static var exp: (x: number) -> number

  /**
   * exp(x)에서 1을 뺀 값을 반환합니다.
   * @param x
   * @returns
   */
  static var expm1: (x: number) -> number

  /**
   * 인수보다 작거나 같은 수 중에서 가장 큰 정수를 반환합니다.
   * @param x
   * @returns
   */
  static var floor: (x: number) -> number

  /**
   * 인수의 가장 가까운 단일 정밀도 표현을 반환합니다.
   * @param x
   * @returns
   */
  static var fround: (x: number) -> number

  /**
   * 두 32비트 정수의 곱을 반환합니다.
   * @param x
   * @param y
   * @returns
   */
  static var imul: (x: number, y: number) -> number

  /**
   * 숫자의 자연로그(e를 밑으로 하는 로그, 즉 ln) 값을 반환합니다.
   * @param x
   * @returns
   */
  static var log: (x: number) -> number

  /**
   * 숫자 x에 대해 1 + x의 자연로그(e를 밑으로 하는 로그, ln) 값을 반환합니다.
   * @param x
   * @returns
   */
  static var log1p: (x: number) -> number

  /**
   * 숫자의 밑이 10인 로그를 반환합니다.
   * @param x
   * @returns
   */
  static var log10: (x: number) -> number

  /**
   * 숫자의 밑이 2인 로그를 반환합니다.
   * @param x
   * @returns
   */
  static var log2: (x: number) -> number

  /**
   * 0개 이상의 인수에서 제일 큰 수를 반환합니다.
   * @param x
   * @param y
   * @returns
   */
  static var max: (x: number, y: number) -> number

  /**
   * 0개 이상의 인수에서 제일 작은 수를 반환합니다.
   * @param x
   * @param y
   * @returns
   */
  static var min: (x: number, y: number) -> number

  /**
   * x의 y 제곱을 반환합니다.
   * @param x
   * @param y
   * @returns
   */
  static var pow: (x: number, y: number) -> number

  /**
   * 0과 1 사이의 난수를 반환합니다.
   * @returns
   */
  static var random: () -> number

  /**
   * 숫자에서 가장 가까운 정수를 반환합니다.
   * @param x
   * @returns
   */
  static var round: (x: number) -> number

  /**
   * x의 양의 수인지 음의 수인지 나타내는 부호를 반환합니다.
   * @param x
   * @returns
   */
  static var sign: (x: number) -> number

  /**
   * 숫자의 사인 값을 반환합니다.
   * @param x
   * @returns
   */
  static var sin: (x: number) -> number

  /**
   * 숫자의 쌍곡사인 값을 반환합니다.
   * @param x
   * @returns
   */
  static var sinh: (x: number) -> number

  /**
   * 숫자의 제곱근을 반환합니다.
   * @param x
   * @returns
   */
  static var sqrt: (x: number) -> number

  /**
   * 숫자의 탄젠트 값을 반환합니다.
   * @param x
   * @returns
   */
  static var tan: (x: number) -> number

  /**
   * 숫자의 쌍곡탄젠트 값을 반환합니다.
   * @param x
   * @returns
   */
  static var tanh: (x: number) -> number

  /**
   * 숫자의 정수 부분을 반환합니다.
   * @param x
   * @returns
   */
  static var trunc: (x: number) -> number
}

@NotTrans export def console = {
  /**
   * 첫 번째 매개변수가 false인 경우 메시지와 스택 추적을 출력합니다.
   * @param args
   * @returns
   */
  static var assert: (...args: any[]) -> void

  /**
   * 콘솔의 내용을 지웁니다.
   * @returns
   */
  static var clear: () -> void

  /**
   * 주어진 레이블로 메서드를 호출한 횟수를 출력합니다.
   * @param label
   * @returns
   */
  static var count: (label?: string) -> void

  /**
   * 주어진 라벨의 횟수를 초기화합니다.
   * @param label
   * @returns
   */
  static var countReset: (label?: string) -> void

  /**
   * debug 중요도로 메시지를 출력합니다.
   * @param args
   * @returns
   */
  static var debug: (...args: any[]) -> void

  /**
   * 오류 메시지를 출력합니다. 추가 매개변수와 함께 문자열 치환을 사용할 수 있습니다.
   * @param args
   * @returns
   */
  static var error: (...args: any[]) -> void

  /**
   * 새로운 인라인 그룹을 생성해, 이후 모든 출력을 한 단계 들여씁니다. 그룹을 나오려면 groupEnd()를 호출하세요.
   * @param label
   * @returns
   */
  static var group: (label?: string) -> void

  /**
   * 새로운 인라인 그룹을 생성해, 이후 모든 출력을 한 단계 들여씁니다. 그러나 group()과 달리, groupCollapsed()로 생성한 그룹은 처음에 접혀 있습니다. 그룹을 나오려면 groupEnd()를 호출하세요.
   * @param label
   * @returns
   */
  static var groupCollapsed: (label?: string) -> void

  /**
   * 현재 인라인 그룹을 나옵니다.
   * @param label
   * @returns
   */
  static var groupEnd: (label?: string) -> void

  /**
   * 정보 메시지를 출력합니다. 추가 매개변수와 함께 문자열 치환을 사용할 수 있습니다.
   * @param args
   * @returns
   */
  static var info: (...args: any[]) -> void

  /**
   * 일반 메시지를 출력합니다. 추가 매개변수와 함께 문자열 치환을 사용할 수 있습니다.
   * @param args
   * @returns
   */
  static var log: (...args: any[]) -> void

  /**
   * 브라우저의 내장 프로파일러(Firefox 성능 측정 도구 등)를 실행합니다. 선택 사항으로 프로파일에 이름을 붙일 수 있습니다.
   * @param profileName
   * @returns
   */
  static var profile: (profileName: string) -> void

  /**
   * 프로파일러를 멈춥니다. 프로파일 결과는 브라우저의 성능 측정 도구(Firefox 성능 측정 도구 등)에서 확인할 수 있습니다.
   * @param profileName
   * @returns
   */
  static var profileEnd: (profileName: string) -> void

  /**
   * 표 형태의 데이터를 표에 그립니다.
   * @param data
   * @param columns
   * @returns
   */
  static var table: (data: any, columns: any) -> void

  /**
   * 주어진 이름의 타이머를 실행합니다. 하나의 페이지에서는 최대 10,000개의 타이머를 동시에 실행할 수 있습니다.
   * @param label
   * @returns
   */
  static var time: (label?: string) -> void

  /**
   * 지정한 타이머를 멈추고, 소요시간을 출력합니다.
   * @param label
   * @returns
   */
  static var timeEnd: (label?: string) -> void

  /**
   * 스택 추적을 출력합니다.
   * @param args
   * @returns
   */
  static var trace: (...args: any[]) -> void

  /**
   * 경고 메시지를 출력합니다. 추가 매개변수와 함께 문자열 치환을 사용할 수 있습니다.
   * @param args
   * @returns
   */
  static var warn: (...args: any[]) -> void
}
  
@NotTrans export var assert: (value: any, message?: any) -> void
@NotTrans export def assert = {
  /**
   * @param value
   * @param message
   * @returns
   */
  static var ok: (value: any, message?: any) -> void

  /**
   * @param message
   * @returns
   */
  static var fail: (message?: any) -> void

  /**
   * @param value1
   * @param value2
   * @param message
   * @returns
   */
  static var equal: (value1: any, value2: any, message?: string) -> void

  /**
   * @param value1
   * @param value2
   * @param message
   * @returns
   */
  static var notEqual: (value1: any, value2: any, message?: string) -> void
}

@NotTrans export def Array = {
  /**
   * 순회 가능 또는 유사 배열 객체에서 새 Array인스턴스를 생성합니다.
   * @returns
   */
  static var from: (arrayLike: any, mapFn?: (value: any, index?: number) -> any, thisArg?: any) -> any[]

  /**
   * 비동기 순회 가능, 순회 가능, 또는 유사 배열 객체에서 새 Array 인스턴스를 생성합니다.
   * @returns
   */
  static var fromAsync: (arrayLike: any, mapFn?: (value: any, index?: number) -> any, thisArg?: any) -> any[]

  /**
   * 인자가 배열이면 true를 반환하고, 그렇지 않으면 false를 반환합니다.
   * @returns
   */
  static var isArray: (arg: any) -> boolean

  /**
   * 인자의 개수나 유형에 관계없이 가변적인 수의 인자를 가진 새 Array 인스턴스를 생성합니다.
   * @returns
   */
  static var of: (...items: any[]) -> any[]

  /**
   * 배열 요소의 개수를 반영합니다.
   */
  static var length: number
}

@NotTrans export def Map<K, V> = {
  /**
   * 요소의 개수를 반환합니다.
   */
  var size: number

  /**
   * key를 이용해 value를 저장합니다.
   * 이 메서드는 key가 이미 존재하면 해당 값을 업데이트하고, 존재하지 않으면 새로 추가합니다.
   * Javascript에서 이 메서드는 맵 자신을 반환하지만 ScalaScript에서는 이를 지원하지 않습니다.
   * @param key
   * @param value
   * @returns
   */
  var set: (key: K, value: V) -> any

  /**
   * key에 해당하는 값을 반환합니다. key가 존재하지 않으면 undefined를 반환합니다.
   * @param key
   * @returns
   */
  var get: (key: K) -> V | nil

  /**
   * key가 존재하면 true, 존재하지 않으면 false를 반환합니다.
   * @param key
   * @returns
   */
  var has: (key: K) -> boolean

  /**
   * key에 해당하는 값을 삭제합니다.
   * @param key
   * @returns
   */
  var delete: (key: K) -> boolean

  /**
   * 맵 안의 모든 요소를 제거합니다.
   */
  var clear: () -> void

  /**
   * Javascript에서 이 메서드는 각 요소의 키를 모은 반복 가능한(iterable, 이터러블) 객체를 반환합니다.
   * ScalaScript에서는 이터러블 객체를 지원하지 않기 때문에 반환값을 직접 사용하는 것을 지원하지는 않지만
   * for..of 반복문을 사용하여 키를 순회할 수 있습니다.
   * for (key <- map.keys()) {
   *   console.log('key:', key)
   * }
   * @returns
   */
  var keys: () -> K[]

  /**
   * Javascript에서 이 메서드는 각 요소의 값을 모은 이터러블 객체를 반환합니다.
   * ScalaScript에서는 이터러블 객체를 지원하지 않기 때문에 반환값을 직접 사용하는 것을 지원하지는 않지만
   * for..of 반복문을 사용하여 값을 순회할 수 있습니다.
   * for (value <- map.values()) {
   *   console.log('value:', value)
   * }
   * @returns
   */
  var values: () -> V[]

  /**
   * 요소의 [키, 값]을 한 쌍으로 하는 이터러블 객체를 반환합니다. 이 이터러블 객체는 for..of 반복문의 기초로 쓰입니다.
   * @returns
   */
  var entries: () -> any

  /**
   * @param callbackFn
   * @param thisArg
   * @returns
   */
  var forEach: (callbackFn: (value: V, key?: K) -> any, thisArg?: any) -> void
}

@NotTrans export def Set<T> = {
  /**
   * 셋에 몇 개의 값이 있는지 세줍니다.
   */
  var size: number

  /**
   * 값을 추가하고 셋 자신을 반환합니다.
   * @param value
   * @returns
   */
  var add: (value: T) -> any

  /**
   * 셋 내에 값이 존재하면 true, 아니면 false를 반환합니다.
   * @param value
   * @returns
   */
  var has: (value: T) -> boolean

  /**
   * 값을 제거합니다. 호출 시점에 셋 내에 값이 있어서 제거에 성공하면 true, 아니면 false를 반환합니다.
   * @param value
   * @returns
   */
  var delete: (value: T) -> boolean 

  /**
   * 셋을 비웁니다.
   */
  var clear: () -> void

  /**
   * Javascript에서 이 메서드는 각 요소의 키를 모은 반복 가능한(iterable, 이터러블) 객체를 반환합니다.
   * ScalaScript에서는 이터러블 객체를 지원하지 않기 때문에 반환값을 직접 사용하는 것을 지원하지는 않지만
   * for..of 반복문을 사용하여 값을 순회할 수 있습니다.
   * @returns
   */
  var keys: () -> T[]

  /**
   * Javascript에서 이 메서드는 각 요소의 값을 모은 이터러블 객체를 반환합니다.
   * ScalaScript에서는 이터러블 객체를 지원하지 않기 때문에 반환값을 직접 사용하는 것을 지원하지는 않지만
   * for..of 반복문을 사용하여 값을 순회할 수 있습니다.
   * @returns
   */
  var values: () -> T[]

  /**
   * Javascript에서 이 메서드는 요소의 [키, 값]을 한 쌍으로 하는 이터러블 객체를 반환합니다.
   * ScalaScript에서는 이터러블 객체를 지원하지 않기 때문에 반환값을 직접 사용하는 것을 지원하지는 않지만
   * for..of 반복문을 사용하여 값을 순회할 수 있습니다.
   * @returns
   */
  var entries: () -> T[]

  /**
   * @param callbackFn
   * @param thisArg
   * @returns
   */
  var forEach: (callbackFn: (arg: T, index?: number) -> any, thisArg?: any) -> void
}

@NotTrans export def JSON = {
  /**
   * 주어진 값에 해당하는 JSON 문자열을 반환합니다. 선택 사항으로 특정 속성만 포함하거나 사용자 정의 방식으로 속성을 대체합니다.
   * @param data
   * @returns
   */
  static var stringify: (data: any) -> string

  /**
   * 문자열을 JSON으로서 구문 분석하고, 선택적으로 분석 결과의 값과 속성을 변환해 반환합니다.
   * @param data
   * @returns
   */
  static var parse: (data: any) -> any
}

@NotTrans export def fs = { 
  /**
   * @param
   * @returns
   */
  static var existsSync: (filename: string, options?: string) -> boolean

  /**
   * @param
   * @returns
   */
  static var mkdirSync: (filename: string, options?: string) -> void

  /**
   * @param
   * @returns
   */
  static var readdirSync: (filename: string, options?: string) -> string[]

  /**
   * @param
   * @returns
   */
  static var readFileSync: (filename: string, options?: string) -> any

  /**
   * @param
   * @returns
   */
  static var writeFileSync: (filename: string, data: any, options?: string) -> void

  /**
   * @param
   * @returns
   */
  static var appendFileSync: (filename: string, data: any, options?: string) -> void
}

@NotTrans export var escape: (arg: string) -> string
`.trim()
