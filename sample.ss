@NotTrans def Console => { log() }
@NotTrans var console: Console

@NotTrans def $string$ => {
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
@NotTrans def $array$ => {
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
  includes(searchElement, fromIndex)-> string
  indexOf(searchElement, fromIndex)-> string
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
@NotTrans def $number$ => {
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
  toFixed(digits: number)-> number
  toLocaleString(locales: string)-> string
  toPrecision(precision: number)-> number
  toString()-> string
  valueOf()-> number
}
@NotTrans def Math => {
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

@NotTrans def setTimeout()


%%
/*
  자료형 및 선언과 정의, 다중 대입
*/
%%
%%//// 다중 선언
var a, b, c : number = 0xff

%%//// 다중 대입
a = b = c = 0b11 + 0o11 + 0x11 + 11.1 + 1.1e+1

%%//// 각종 산술 연산자
c = (1 + 2) * 3 % 2 ** 3

%%//// 삼항 연산자
var gender = if a == 1 then 'male' else 'female'

%%
/*
  문자열 관련
*/
%%
var s1: string = "this is sample"
var list2 = s1.concat("2" .. 'def').trim().split(",")

%%//// 문자열 접합 연산자
var ts:string = "abc" .. 'def' .. 's'

%%//// 문자열 length
if (ts.length > 0) ts = "1"

%%//// 문자열 인덱스는 1 부터
val included = ts.includes("is", 1)

%%
/*
  배열 관련
*/
%%
%%//// array type
val array1: string[] = ['a', 'b', 'c']

%%//// array length
if (array1.length > 0) s1 = "2"

%%//// 배열의 인덱스는 1 부터
s1 = array1[a + b] .. array1[1]

%%/*
  조건문
*/%%
if not ts console log 'a is not true'

def matchTest(x: number)-> string => x match {
  case 1 => return "one"
  case 2 => return "two"
  case _ => return "other"
}

%%/*
  반복문 관련
*/%%
val array2: string[] = ['a', 'b', 'c']

%%//// for parameter type check
var sum = 0
for (d <- 1 to 10) {
  sum += d
}
var result = ""
for (e <- array2) result = result .. e

%%//// 중첩 for 문
for (a <- array2; b <- array2) { console.log(a, b) }

%%//// do/while 문
var arrLen = 1
while arrLen < array2.length and arrLen >= 2 arrLen += 1
do console.log(arrLen) while arrLen < array2.length and arrLen >= 2

do {
  console.log(a)
  a += 1
} while (a <= 10)

%%//// 조건문, 반복문 혼합 응용
for (a <- 1 to 10; b <- 1 to 10; c <-  1 to 10) {
  console.log(a)
  if a == b
  then console.log('a == b')
  else if (a < b) console.log("a < b")
  elif (a > b) console.log("a > b")
  else {
    console.log("error")
    val x: number = 2
    x match {
      case 0 => { "zero" break }
      case 1 => { "one" continue }
      case 2 => "two"
      case _ => "other"
    }
  }
}

%%//// function types and anonymous function call
%%//// 스칼라는 인수의 이름을 명시할 필요없이 인수의 타입만 열거해서 표현한다.
%%//// 인수가 하나이면 괄호를 생략할 수 있고 인수가 없으면 빈 괄호로 표현한다.
%%//// 반면 타입스크립트는 형식적인 인수명이 있어야 한다.
%%//// 그리고 인수가 하나만 있는 경우라도 괄호가 반드시 필요하다.
%%//// 스칼라스크립트는 타입스크립트와 동일하다.
var t1: ()-> number
var t2: (arg: number)-> number

%%//// 스칼라는 익명 함수를 표현할때 그냥 인수(또는 `_`) 하나만 달랑 쓰거나 아니면
%%//// 인수의 타입을 명시해야 하거나 인수가 여러 개이면 괄호로 묶어야 하고
%%//// 익명 함수의 리턴 타입은 명시할 수 없는 것 같다.
%%//// 타입스크립트는 스칼라와 동일한데 익명 함수의 리턴 타입을 지정할 수 있다.
%%//// 스칼라스크립트는 여기에 더해 인수가 하나이고 타입을 명시할 경우에도 괄호가 필요하지 않다.
val lambda1 = () => return 1
val lambda2 = arg => return arg
val lambda3 = arg: number => return arg
val lambda4 = (arg: number) => return arg
val lambda5 = (arg: number)-> number => return arg

%%
/*
  함수 정의 및 호출
*/
%%
def add(a: number, b: number)-> number => return a + b

def factorial(N: number)-> number => {
  var sum: number = 0
  for (d <- 1 to N) {
    sum += d
  }
  return sum
}

val timeFlies1 = (msg: string)-> void => {
  console.log("time flies like an arrow... ", msg)
}
def timeFlies2(msg: string)-> void => {
  console.log("time flies like an arrow... ", msg)
}

val oncePerSecond = (callback: (p:string)-> void)-> void => {
%%////def oncePerSecond(callback: (p: string)-> void)-> void => {
  setTimeout(() => { callback('1초 지남!') }, 1000)
}

def main() => {
  hanoi(3, "a", "b", "c")
  var ary: string[] = ['a', 'b', 'c']
  concatenate(ary)
}

def hanoi(n: number, from: string, to1: string, mid: string)-> void => {
  def move(from: string, to1: string) => {
    console.log(`${from} ${to1}`)
  }

  if (n == 1)
  then move(from, to1)
  else {
    hanoi(n - 1, from, mid, to1)
    move(from, to1)
    hanoi(n - 1, mid, to1, from)
  }
}

def concatenate(ary: string[])-> string => {
  var result = ""
  for (e <- ary)
    result = result .. e
  return result
}

def generateBypassElement(bypass: string[])-> string => {
  var result: string = ""
  var t = result.trim()
  bypass.forEach(s:string => {
    // 의 다음 줄부터 본문이 입력하기 때문에 s의 처음과 끝에 new line 문자가 존재하는데 이를 제거한다.
    var ns: string = s
    if (s.startsWith("\r\n")) ns = ns.slice(2)
    ns = ns.trim()
    result += ns
  })
  return result
}
