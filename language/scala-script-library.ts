/**
 *
 */
export const ScalaScriptBuiltinLibrary = `
@NotTrans export def $string$ = {
  // Reflects the length of the string. Read-only.
  var length: number
  // Returns the character (exactly one UTF-16 code unit) at the specified index.
  val charAt: (index: number) -> string
  // Returns a number that is the UTF-16 code unit value at the given index.
  val charCodeAt: (index: number) -> number
  // Returns a nonnegative integer Number that is the code point value of the UTF-16 encoded code point starting at the specified pos.
  val codePointAt: (pos: number) -> number
  // Combines the text of two (or more) strings and returns a new string.
  val concat: (str: string) -> string
  // Determines whether the calling string contains searchString.
  val includes: (searchString: string, position: number) -> boolean
  // Determines whether a string ends with the characters of the string searchString.
  val endsWith: (searchString: string, endPosition: number) -> boolean
  // Returns the index within the calling String object of the first occurrence of searchValue, or -1 if not found.
  val indexOf: (searchValue: string, fromIndex: number) -> number
  // Returns the index within the calling String object of the last occurrence of searchValue, or -1 if not found.
  val lastIndexOf: (searchValue: string, fromIndex: number) -> number
  // Returns a number indicating whether the reference string compareString comes before, after, or is equivalent to the given string in sort order.
  val localeCompare: (compareString: string) -> number
  // Used to match regular expression regexp against a string.
  //val match: (regexp: string) -> string
  // Returns an iterator of all regexp's matches.
  val matchAll: (regexp: string) -> string[]
  // Returns the Unicode Normalization Form of the calling string value.
  val normalize: (form: string) -> string
  // Pads the current string from the end with a given string and returns a new string of the length targetLength.
  val padEnd: (targetLength: number, padString: string) -> string
  // Pads the current string from the start with a given string and returns a new string of the length targetLength.
  val padStart: (targetLength: number, padString: string) -> string
  // Returns a string consisting of the elements of the object repeated count times.
  val repeat: (count: number) -> string
  // Used to replace occurrences of searchFor using replaceWith. searchFor may be a string or Regular Expression, and replaceWith may be a string or function.
  val replace: (searchFor: string, replaceWith: string) -> string
  // Used to replace all occurrences of searchFor using replaceWith. searchFor may be a string or Regular Expression, and replaceWith may be a string or function.
  val replaceAll: (searchFor: string, replaceWith: string) -> string
  // Search for a match between a regular expression regexp and the calling string.
  val search: (regexp: string) -> string
  // Extracts a section of a string and returns a new string.
  val slice: (beginIndex: number, endIndex: number) -> string
  // Returns an array of strings populated by splitting the calling string at occurrences of the substring sep.
  val split: (sep: string, limit: number) -> string[]
  // Determines whether the calling string begins with the characters of string searchString.
  val startsWith: (searchString: string, position: number) -> boolean
  // Returns a new string containing characters of the calling string from (or between) the specified index (or indices).
  val substring: (indexStart: number, indexEnd: number) -> string
  // The characters within a string are converted to lowercase while respecting the current locale.For most languages, this will return the same as toLowerCase().
  val toLocaleLowerCase: (locale: string) -> string
  // The characters within a string are converted to uppercase while respecting the current locale.For most languages, this will return the same as toUpperCase().
  val toLocaleUpperCase: (locale: string) -> string
  // Returns the calling string value converted to lowercase.
  val toLowerCase: () -> string
  // Returns the calling string value converted to uppercase.
  val toUpperCase: () -> string
  // Returns a string representing the specified object. Overrides the Object.prototype.toString() method.
  val toString: () -> string
  // Trims whitespace from the beginning and end of the string. Part of the ECMAScript 5 standard.
  val trim: () -> string
  // Trims whitespace from the beginning of the string.
  val trimStart: () -> string
  // Trims whitespace from the end of the string.
  val trimEnd: () -> string
  // Returns the primitive value of the specified object. Overrides the Object.prototype.valueOf() method.
  val valueOf: () -> string
}

@NotTrans export def $array$ = {
  // 순회 가능 또는 유사 배열 객체에서 새 Array인스턴스를 생성합니다.
  val from: () -> any[]
  // 비동기 순회 가능, 순회 가능, 또는 유사 배열 객체에서 새 Array 인스턴스를 생성합니다.
  val fromAsync: () -> any[]
  // 인자가 배열이면 true를 반환하고, 그렇지 않으면 false를 반환합니다.
  val isArray: () -> any[]
  // 인자의 개수나 유형에 관계없이 가변적인 수의 인자를 가진 새 Array 인스턴스를 생성합니다.
  val of: () -> any[]
  // 배열 요소의 개수를 반영합니다.
  var length: number
  // 주어진 인덱스에 있는 배열의 항목을 반환합니다. 마지막 항목부터 셀 수 있는 음의 정수를 허용합니다.
  val at: (index: number) -> any
  // 다른 배열 및/또는 값과 결합된 호출 배열인 새 배열을 반환합니다.
  val concat: () -> any[]
  // 배열 내의 배열 요소 시퀀스를 복사하고 변경된 배열을 반환합니다.
  val copyWithin: () -> any[]
  // 호출 배열의 모든 요소가 테스트 함수를 만족하면 true를 반환합니다.
  val every: (callbackFn) -> boolean
  // 시작 인덱스부터 끝 인덱스까지 배열의 모든 요소를 고정된 값으로 채우고 변경된 배열을 반환합니다.
  val fill: (value, start, end) -> any[]
  // 제공된 필터링 함수가 true를 반환하는 호출 배열의 모든 요소를 포함하는 새 배열을 반환합니다.
  val filter: (callbackFn) -> any[]
  // 제공된 테스트 함수를 만족하는 배열의 첫 번째 요소의 값을 반환하고, 적절한 요소를 찾을 수 없으면 unvalined를 반환합니다.
  val find: (callbackFn) -> any
  // 제공된 테스트 함수를 만족하는 배열의 첫 번째 요소의 인덱스를 반환하고, 적절한 요소를 찾을 수 없으면 -1을 반환합니다.
  val findIndex: (callbackFn) -> number
  // 제공된 테스트 함수를 만족하는 배열의 마지막 요소의 값을 반환하고, 적절한 요소를 찾을 수 없으면 unvalined를 반환합니다.
  val findLast: (callbackFn) -> any
  // 제공된 테스트 함수를 만족하는 배열의 마지막 요소의 인덱스를 반환하고, 적절한 요소를 찾을 수 없는 경우 -1을 반환합니다.
  val findLastIndex: (callbackFn) -> number
  // 지정된 깊이까지 재귀적으로 연결된 모든 하위 배열 요소가 포함된 새 배열을 반환합니다.
  val flat: (depth) -> any[]
  // 호출 배열의 각 요소에 지정된 콜백 함수를 적용한 다음 결과를 한 단계씩 평탄화하여 만들어진 새 배열을 반환합니다.
  val flatMap: (callbackFn) -> any[]
  // 호출 배열의 각 요소로 함수를 호출합니다.
  val forEach: (callbackFn) -> void
  // 호출하는 배열에 값이 포함되어 있는지 여부를 판단하여 적절하게 true나false를 반환합니다.
  val includes: (searchElement, fromIndex) -> boolean
  // 호출 배열에서 지정된 요소를 찾을 수 있는 첫 번째(최소) 인덱스를 반환합니다.
  val indexOf: (searchElement, fromIndex) -> number
  // 배열의 모든 요소를 문자열로 결합합니다.
  val join: (separate) -> string
  // 호출 배열에서 지정된 요소를 찾을 수 있는 마지막(가장 큰) 인덱스를 반환하고, 찾을 수 없는 경우 -1을 반환합니다.
  val lastIndexOf: (searchElement, fromIndex) -> number
  // 호출 배열의 모든 요소에 함수를 호출한 결과를 포함하는 새 배열을 반환합니다.
  val map: (callbackFn) -> any[]
  // 배열에서 마지막 요소를 제거하고 해당 요소를 반환합니다.
  val pop: () -> any
  // 배열 끝에 하나 이상의 요소를 추가하고, 배열의 새 length를 반환합니다.
  val push: (element) -> number
  // 배열의 각 요소(왼쪽에서 오른쪽으로)에 대해 사용자가 제공한 "리듀서" 콜백 함수를 실행하여 하나의 값으로 줄입니다.
  val reduce: (callbackFn) -> any
  // 배열의 각 요소(오른쪽에서 왼쪽으로)에 대해 사용자가 제공한 "리듀서" 콜백 함수를 실행하여 하나의 값으로 줄입니다.
  val reduceRight: (callbackFn) -> any
  // 배열 요소의 순서를 반대로 바꿉니다. (첫 번째가 마지막이 되고, 마지막이 첫 번째가 됩니다.)
  val reverse: () -> any[]
  // 배열에서 첫 번째 요소를 제거하고 해당 요소를 반환합니다.
  val shift: () -> any
  // 호출 배열의 구획을 추출하고 새 배열을 반환합니다.
  val slice: () -> any[]
  // 호출 배열의 요소 중 하나 이상이 제공된 테스트 함수를 만족하면 true를 반환합니다.
  val some: (callbackFn) -> boolean
  // 배열의 요소를 제자리 정렬하고 배열을 반환합니다.
  val sort: (callbackFn) -> any[]
  // 배열에서 요소를 추가 및/또는 제거합니다.
  val splice: () -> any[]
  // 호출 배열과 그 요소를 나타내는 문자열을 반환합니다.
  val toString: () -> string
  // 배열 앞쪽에 하나 이상의 요소를 추가하고, 배열의 새 length를 반환합니다.
  val unshift: () -> number
  // 호출 배열의 각 인덱스에 대한 키를 포함하는 새 배열 반복자를 반환합니다.
  val keys: () -> any
  // 배열의 각 인덱스에 대한 키/값 쌍을 포함하는 새 배열 반복자 객체를 반환합니다.
  val entries: () -> any
  // 
  val values: () -> any
}

@NotTrans export def $number$ = {
  // 주어진 값이 NaN인지 확인합니다.
  val isNaN: () -> boolean
  // 주어진 값이 유한수 인지 확인합니다.
  val isFinite: () -> boolean
  // 주어진 값이 정수인지 확인합니다.
  val isInteger: () -> boolean
  // 주어진 값이 안전한 정수(-(2^53 - 1)과 2^53 - 1 사이의 정수)인지 확인합니다.
  val isSafeInteger: () -> boolean
  // 전역 객체 parseFloat()와 동일한 값입니다.
  val parseFloat: (x: string) -> number
  // 전역 객체 parseInt()와 동일한 값입니다.
  val parseInt: (x: string) -> number
  // 지수 표기법으로 표기된 숫자를 표현하는 문자열을 반환한다
  val toExponential: (fractionDigits: number) -> string
  // 고정 소수점 표기법으로 숫자를 표현하는 문자열을 반환합니다.
  val toFixed: (digits: number) -> string
  // 이 숫자를 해당 언어 방식으로 표현된 문자열을 반환합니다.
  val toLocaleString: (locales: string) -> string
  // 고정 소수점 또는 지수 표기법으로 지정된 정밀도로 숫자를 표현하는 문자열을 반환합니다.
  val toPrecision: (precision: number) -> string
  // 지정한 기수("base")에서 지정한 개체를 표현하는 문자열을 반환합니다.
  val toString: () -> string
  // 명시된 객체의 원시 값을 반환합니다.
  val valueOf: () -> number
}

@NotTrans export def Number = {
  // 두 개의 표현 가능한 숫자 사이의 최소 간격.
  static val EPSILON: number
  // JavaScript에서 안전한 최대 정수. (2^53 - 1)
  static val MAX_SAFE_INTEGER: number
  // JavaScript에서 안전한 최소 정수. (-(2^53 - 1)).
  static val MIN_SAFE_INTEGER: number
  // 표현 가능한 가장 큰 양수.
  static val MAX_VALUE: number
  // 표현 가능한 가장 작은 양수. 즉, 0보다 크지만 0에 가장 가까운 양수
  static val MIN_VALUE: number
  // "Not a Number"(숫자가 아님)을 나타내는 특별한 값.
  static val NaN: number
  // 음의 무한대를 나타내는 특수한 값. 오버플로우 시 반환됩니다.
  static val NEGATIVE_INFINITY: number
  // 양의 무한대를 나타내는 특수한 값. 오버플로우 시 반환됩니다.
  static val POSITIVE_INFINITY: number
  // 주어진 값이 NaN인지 확인합니다.
  static val isNaN: () -> boolean
  // 주어진 값이 유한수 인지 확인합니다.
  static val isFinite: () -> boolean
  // 주어진 값이 정수인지 확인합니다.
  static val isInteger: () -> boolean
  // 주어진 값이 안전한 정수(-(2^53 - 1)과 2^53 - 1 사이의 정수)인지 확인합니다.
  static val isSafeInteger: () -> boolean
  // 전역 객체 parseFloat()와 동일한 값입니다.
  static val parseFloat: (x: string) -> number
  // 전역 객체 parseInt()와 동일한 값입니다.
  static val parseInt: (x: string) -> number
  // 지수 표기법으로 표기된 숫자를 표현하는 문자열을 반환한다
  static val toExponential: (fractionDigits: number) -> string
  // 고정 소수점 표기법으로 숫자를 표현하는 문자열을 반환합니다.
  static val toFixed: (digits: number) -> string
  // 이 숫자를 해당 언어 방식으로 표현된 문자열을 반환합니다.
  static val toLocaleString: (locales: string) -> string
  // 고정 소수점 또는 지수 표기법으로 지정된 정밀도로 숫자를 표현하는 문자열을 반환합니다.
  static val toPrecision: (precision: number) -> string
  // 지정한 기수("base")에서 지정한 개체를 표현하는 문자열을 반환합니다.
  static val toString: () -> string
  // 명시된 객체의 원시 값을 반환합니다.
  static val valueOf: () -> number
}

@NotTrans export def Math = {
  // 오일러의 상수이며 자연로그의 밑. 약 2.718.
  static val E: number
  // 원의 둘레와 지름의 비율. 약 3.14159.
  static val PI: number
  // 2의 자연로그. 약 0.693.
  static val LN2: number
  // 10의 자연로그. 약 2.303.
  static val LN10: number
  // 밑이 2인 로그 E. 약 1.443.
  static val LOG2E: number
  // 밑이 10인 로그 E. 약 0.434.
  static val LOG10E: number
  // ½의 제곱근. 약 0.707.
  static val SQRT1_2: number
  // 2의 제곱근. 약 1.414.
  static val SQRT2: number
  // 숫자의 절댓값을 반환합니다.
  static val abs: (x: number) -> number
  // 숫자의 아크코사인 값을 반환합니다.
  static val acos: (x: number) -> number
  // 숫자의 쌍곡아크코사인 값을 반환합니다.
  static val acosh: (x: number) -> number
  // 숫자의 아크사인 값을 반환합니다.
  static val asin: (x: number) -> number
  // 숫자의 쌍곡아크사인 값을 반환합니다.
  static val asinh: (x: number) -> number
  // 숫자의 아크탄젠트 값을 반환합니다.
  static val atan: (x: number) -> number
  // 숫자의 쌍곡아크탄젠트 값을 반환합니다.
  static val atanh: (x: number) -> number
  // 인수 몫의 아크탄젠트 값을 반환합니다.
  static val atan2: (y: number, x: number) -> number
  // 숫자의 세제곱근을 반환합니다.
  static val cbrt: (x: number) -> number
  // 인수보다 크거나 같은 수 중에서 가장 작은 정수를 반환합니다.
  static val ceil: (x: number) -> number
  // 주어진 32비트 정수의 선행 0 개수를 반환합니다.
  static val clz32: (x: number) -> number
  // 숫자의 코사인 값을 반환합니다.
  static val cos: (x: number) -> number
  // 숫자의 쌍곡코사인 값을 반환합니다.
  static val cosh: (x: number) -> number
  // E^x 를 반환합니다. x는 인수이며 E 는 오일러 상수(2.718...) 또는 자연로그의 밑입니다.
  static val exp: (x: number) -> number
  // exp(x)에서 1을 뺀 값을 반환합니다.
  static val expm1: (x: number) -> number
  // 인수보다 작거나 같은 수 중에서 가장 큰 정수를 반환합니다.
  static val floor: (x: number) -> number
  // 인수의 가장 가까운 단일 정밀도 표현을 반환합니다.
  static val fround: (x: number) -> number
  // 두 32비트 정수의 곱을 반환합니다.
  static val imul: (x: number, y) -> number
  // 숫자의 자연로그(e를 밑으로 하는 로그, 즉 ln) 값을 반환합니다.
  static val log: (x: number) -> number
  // 숫자 x에 대해 1 + x의 자연로그(e를 밑으로 하는 로그, ln) 값을 반환합니다.
  static val log1p: (x: number) -> number
  // 숫자의 밑이 10인 로그를 반환합니다.
  static val log10: (x: number) -> number
  // 숫자의 밑이 2인 로그를 반환합니다.
  static val log2: (x: number) -> number
  // 0개 이상의 인수에서 제일 큰 수를 반환합니다.
  static val max: (x: number, y: number) -> number
  // 0개 이상의 인수에서 제일 작은 수를 반환합니다.
  static val min: (x: number, y: number) -> number
  // x의 y 제곱을 반환합니다.
  static val pow: (x: number, y) -> number
  // 0과 1 사이의 난수를 반환합니다.
  static val random: () -> number
  // 숫자에서 가장 가까운 정수를 반환합니다.
  static val round: (x: number) -> number
  // x의 양의 수인지 음의 수인지 나타내는 부호를 반환합니다.
  static val sign: (x: number) -> number
  // 숫자의 사인 값을 반환합니다.
  static val sin: (x: number) -> number
  // 숫자의 쌍곡사인 값을 반환합니다.
  static val sinh: (x: number) -> number
  // 숫자의 제곱근을 반환합니다.
  static val sqrt: (x: number) -> number
  // 숫자의 탄젠트 값을 반환합니다.
  static val tan: (x: number) -> number
  // 숫자의 쌍곡탄젠트 값을 반환합니다.
  static val tanh: (x: number) -> number
  // 숫자의 정수 부분을 반환합니다.
  static val trunc: (x: number) -> number
}

@NotTrans export def console = {
  // 첫 번째 매개변수가 false인 경우 메시지와 스택 추적을 출력합니다.
  static val assert: () -> void
  // 콘솔의 내용을 지웁니다.
  static val clear: () -> void
  // 주어진 레이블로 메서드를 호출한 횟수를 출력합니다.
  static val count: () -> void
  // 주어진 라벨의 횟수를 초기화합니다.
  static val countReset: () -> void
  // debug 중요도로 메시지를 출력합니다.
  static val debug: () -> void
  // 오류 메시지를 출력합니다. 추가 매개변수와 함께 문자열 치환을 사용할 수 있습니다.
  static val error: () -> void
  // 새로운 인라인 그룹을 생성해, 이후 모든 출력을 한 단계 들여씁니다. 그룹을 나오려면 groupEnd()를 호출하세요.
  static val group: () -> void
  // 새로운 인라인 그룹을 생성해, 이후 모든 출력을 한 단계 들여씁니다. 그러나 group()과 달리, groupCollapsed()로 생성한 그룹은 처음에 접혀 있습니다. 그룹을 나오려면 groupEnd()를 호출하세요.
  static val groupCollapsed: () -> void
  // 현재 인라인 그룹을 나옵니다.
  static val groupEnd: () -> void
  // 정보 메시지를 출력합니다. 추가 매개변수와 함께 문자열 치환을 사용할 수 있습니다.
  static val info: () -> void
  // 일반 메시지를 출력합니다. 추가 매개변수와 함께 문자열 치환을 사용할 수 있습니다.
  static val log: () -> void
  // 브라우저의 내장 프로파일러(Firefox 성능 측정 도구 등)를 실행합니다. 선택 사항으로 프로파일에 이름을 붙일 수 있습니다.
  static val profile: () -> void
  // 프로파일러를 멈춥니다. 프로파일 결과는 브라우저의 성능 측정 도구(Firefox 성능 측정 도구 등)에서 확인할 수 있습니다.
  static val profileEnd: () -> void
  // 표 형태의 데이터를 표에 그립니다.
  static val table: () -> void
  // 주어진 이름의 타이머를 실행합니다. 하나의 페이지에서는 최대 10,000개의 타이머를 동시에 실행할 수 있습니다.
  static val time: () -> void
  // 지정한 타이머를 멈추고, 소요시간을 출력합니다.
  static val timeEnd: () -> void
  // 스택 추적을 출력합니다.
  static val trace: () -> void
  // 경고 메시지를 출력합니다. 추가 매개변수와 함께 문자열 치환을 사용할 수 있습니다.
  static val warn: () -> void
}
  
@NotTrans export def assert = {
  static val equal: () -> void
  static val notEqual: () -> void
}

@NotTrans export def Array = {}

@NotTrans export def Map = {
  // 요소의 개수를 반환합니다.
  var size: number
  // key를 이용해 value를 저장합니다.
  val set: (key, value) -> any
  // key에 해당하는 값을 반환합니다. key가 존재하지 않으면 undefined를 반환합니다.
  val get: (key) -> any
  // key가 존재하면 true, 존재하지 않으면 false를 반환합니다.
  val has: (key) -> boolean
  // key에 해당하는 값을 삭제합니다.
  val delete: (key) -> void
  // 맵 안의 모든 요소를 제거합니다.
  val clear: () -> void
  // 각 요소의 키를 모은 반복 가능한(iterable, 이터러블) 객체를 반환합니다.
  val keys: () -> any
  // 각 요소의 값을 모은 이터러블 객체를 반환합니다.
  val values: () -> any
  // 요소의 [키, 값]을 한 쌍으로 하는 이터러블 객체를 반환합니다. 이 이터러블 객체는 for..of반복문의 기초로 쓰입니다.
  val entries: () -> any
  //
  val forEach: () -> void
}

@NotTrans export def Set = {
  // 셋에 몇 개의 값이 있는지 세줍니다.
  var size: number
  // 값을 추가하고 셋 자신을 반환합니다.
  val add: (value) -> any
  // 셋 내에 값이 존재하면 true, 아니면 false를 반환합니다.
  val has: (value) -> boolean
  // 값을 제거합니다. 호출 시점에 셋 내에 값이 있어서 제거에 성공하면 true, 아니면 false를 반환합니다.
  val delete: (value) -> boolean 
  // 셋을 비웁니다.
  val clear: () -> void
  // 각 요소의 키를 모은 반복 가능한(iterable, 이터러블) 객체를 반환합니다.
  val keys: () -> any
  // 각 요소의 값을 모은 이터러블 객체를 반환합니다.
  val values: () -> any
  // 요소의 [키, 값]을 한 쌍으로 하는 이터러블 객체를 반환합니다. 이 이터러블 객체는 for..of반복문의 기초로 쓰입니다.
  val entries: () -> any
  //
  val forEach: () -> void
}

@NotTrans export def JSON = {
  // 주어진 값에 해당하는 JSON 문자열을 반환합니다. 선택 사항으로 특정 속성만 포함하거나 사용자 정의 방식으로 속성을 대체합니다.
  static val stringify: () -> string
  // 문자열을 JSON으로서 구문 분석하고, 선택적으로 분석 결과의 값과 속성을 변환해 반환합니다.
  static val parse: () -> any
}

@NotTrans export def fs = { 
  static val existsSync: () -> boolean
  static val mkdirSync: () -> void
  static val readdirSync: () -> string[]
  static val readFileSync: () -> void
  static val writeFileSync: () -> void
  static val appendFileSync: () -> void
}

@NotTrans export val parseFloat: () ->number
@NotTrans export val parseInt: () ->number
@NotTrans export val escape: () -> string
`.trim()
