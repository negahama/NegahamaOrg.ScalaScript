%%
//-----------------------------------------------------------------------------
// 변수의 선언과 정의
//-----------------------------------------------------------------------------
%%
%%// ScalaScript에서 let, const는 예약어가 아니지만 사용하면 변환될때 문제가 된다.
var variable: number = 0xff
val constant: number = 0xff

/**
  대입문 및 다중 대입
*/
%%// 대입문
var a: number = 0b1010  // 2진수
var b: number = 0o12    // 8진수
var c: number = 0xa     // 16진수

%%// 다중 대입
a = b = c = 0b11 + 0o11 + 0x11 + 11.1 + 1.1e+1

%%
//-----------------------------------------------------------------------------
// 자료형 및 연산자
//-----------------------------------------------------------------------------
%%
/**
  기본 자료형(primitive type)
*/
var s: string
var num: number
var bool: boolean
var $void: void
var $nil: nil

/**
  연산자
*/
%%// 각종 산술 연산자
c = (1 + 2) * 3 % 2 ** 3

/**
  문자열 관련
*/
%%// 모두 가능
s = "'hello' `world`"
s = '`hello` "world"'
s = `'hello' "world"`

%%// 문자열 접합 연산자
s = "this " .. 'is ' .. `sample`

%%// 문자열 length
a = s.length

%%// 문자열 함수들
var list1 = s.concat(",2" .. ', 3, 4 ').trim().split(",")

%%// 문자열 인덱스는 1 부터
val included = s.includes("is", 1)

/**
  배열 관련
*/
%%// array type
val array1: string[] = ['a', 'b', 'c']

%%// array length
if (array1.length > 0) s = "array is not empty"

%%// 배열 관련 함수들
array1.push('d', 'e', 'f')
array1.filter(e => e == 'e')
array1.includes('f')

%%// 배열의 인덱스는 1 부터
s = array1[a + b] .. array1[1]

%%
//-----------------------------------------------------------------------------
// 조건문
//-----------------------------------------------------------------------------
%%
/**
  if
  if은 문(statement)이 아니라 식(expression)이므로 삼항 연산자처럼 사용할 수 있고 다른 식에 포함될 수 있다.
```
  if 조건식 (then)? BLOCK (elif BLOCK)? (else BLOCK)?
```
  ()? 는 생략 가능하다는 표현이다. 즉 then, elif, else 는 생략 가능하다. 따라서 최소한의 구문은 if 조건식 BLOCK 이다.
  - 조건식은 괄호를 생략할 수 있다.
  - Block은 single expression이면 중괄호를 생략할 수 있다.
  - elif는 else if로 바꿔 쓸 수 있으나 else와 if사이에는 반드시 공백 한 글자만 가능하다.
 */
%%// 최소 구문
if a > 0 s = "true"

%%// 삼항 연산자
var gender = if a == 1 then 'male' else 'female'

%%// 중위 연산자를 포함한 if 문
if not s console log 'a is not true'

%%// if/elif/else 문
if a == b
then console.log('a == b')
else if a < b console.log("a < b")
elif a > b console.log("a > b")
else console.log("error")

/**
  match
  match도 문(statement)이 아니라 식(expression)이다.
```
  변수 match {
    case 값 => BLOCK
    ...
    case _ => BLOCK
  }
```
  match의 중괄호는 필요하며 case문은 하나이상 있어야만 한다. `_` 는 default를 의미한다.
 */
%%// match 문
val matchTest = (x: number) -> string => x match {
  case 1 => return "one"
  case 2 => return "two"
  case _ => return "other"
}

%%
//-----------------------------------------------------------------------------
// BLOCK
//-----------------------------------------------------------------------------
%%
%%// 하나의 문으로 구성된 블럭
if a == b then console.log('a == b')

%%// 여러 개의 문으로 구성된 블럭
if a != b {
  console.log('a != b')
  a = b
  console.log('now, a is the same b')
}

%%// indent를 이용한 블럭
if a == 0
  console.log('a == 0')
  a = 1
else
  console.log('a != 0')
  a = 0

%%
//-----------------------------------------------------------------------------
// 반복문
//-----------------------------------------------------------------------------
%%
/**
  for
  for문은 두가지 타입이 있다.
  - for (변수 <- 시작 to 끝) BLOCK
  - for (변수 <- 컬렉션) BLOCK
*/
%%// for (변수 <- 시작 to 끝) BLOCK
var sum = 0
for (d <- 1 to 10) {
  sum += d
}

%%// for (변수 <- 컬렉션) BLOCK
var result = ""
for (e <- array1) result = result .. e

%%// 중첩 for 문
for (a <- array1; b <- array1) { console.log(a, b) }

/**
  do/while
*/
%%// do/while 문
var arrLen = 1
while arrLen < array1.length and arrLen >= 2 arrLen += 1
do console.log(arrLen) while arrLen < array1.length and arrLen >= 2

do {
  console.log(a)
  a += 1
} while (a <= 10)

%%// 조건문, 반복문 혼합 응용
for (a <- 1 to 10; b <- 1 to 10; c <-  1 to 10) {
  console.log(a)
  if a == b
  then console.log('a == b')
  else if a < b console.log("a < b")
  elif a > b console.log("a > b")
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

%%
//-----------------------------------------------------------------------------
// 함수 정의
//-----------------------------------------------------------------------------
%%

%%
// function types and anonymous function call
// 스칼라는 인수의 이름을 명시할 필요없이 인수의 타입만 열거해서 표현한다.
// 인수가 하나이면 괄호를 생략할 수 있고 인수가 없으면 빈 괄호로 표현한다.
// 반면 타입스크립트는 형식적인 인수명이 있어야 한다.
// 그리고 인수가 하나만 있는 경우라도 괄호가 반드시 필요하다.
// 스칼라스크립트는 타입스크립트와 동일하다.
%%
var t1: () -> number
var t2: (arg: number) -> number[]

%%
// 스칼라는 익명 함수를 표현할때 그냥 인수(또는 `_`) 하나만 달랑 쓰거나 아니면
// 인수의 타입을 명시해야 하거나 인수가 여러 개이면 괄호로 묶어야 하고
// 익명 함수의 리턴 타입은 명시할 수 없는 것 같다.
// 타입스크립트는 스칼라와 동일한데 익명 함수의 리턴 타입을 지정할 수 있다.
// 스칼라스크립트는 여기에 더해 인수가 하나이면 인수 타입과 리턴 타입을 명시할 경우에도 괄호가 필요하지 않다.
%%
val lambda1 = () => return 1
val lambda2 = arg => return arg
val lambda3 = arg: number => return arg
val lambda4 = arg: number -> number => return arg
val lambda5 = (arg1: number, arg2: number) => return arg1 + arg2

/**
  함수 정의 및 호출
*/
fun add = (a: number, b: number) -> number => return a + b
// val add = (a: number, b: number) -> number => return a + b
var returnValue = add(1, 2)

/**
 * 
 * @param N 
 * @returns 
 */
val factorial = (N: number) -> number => {
  var sum: number = 0
  for (d <- 1 to N) {
    sum += d
  }
  return sum
}

val timeFlies1 = (msg: string) => {
  console.log("time flies like an arrow... ", msg)
}

val timeFlies2 = (msg: string) -> void => {
  console.log("time flies like an arrow... ", msg)
}

@NotTrans val setTimeout: (callback: () -> void, time: number) -> void
val oncePerSecond = (callback: (p:string) -> void) -> void => {
%%//fun oncePerSecond = (callback: (p: string) -> void) -> void => {
  setTimeout(() => { callback('1초 지남!') }, 1000)
}

val main = () => {
  hanoi(3, "a", "b", "c")
  var ary: string[] = ['a', 'b', 'c']
  concatenate(ary)
}

/**
 * 
 * @param n 
 * @param from 
 * @param to
 * @param mid 
 */
val hanoi = (n: number, from: string, to: string, mid: string) -> void => {
  val move = (from: string, to: string) => {
    console.log(`${from} ${to}`)
  }

  if (n == 1)
  then move(from, to)
  else {
    hanoi(n - 1, from, mid, to)
    move(from, to)
    hanoi(n - 1, mid, to, from)
  }
}

/**
 * 
 * @param ary 
 * @returns 
 */
val concatenate = (ary: string[]) -> string => {
  var result = ""
  for (e <- ary)
    result = result .. e
  return result
}

val generateBypassElement = (bypass: string[]) -> string => {
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

/**
  오브젝트 정의 및 사용 관련 예
*/
def Work = {
  var name: string
  var kind: string
  var wage: number
}

def Person = {
  var name: string
  var work: Work
  val calc = (hour: number, bonus: Bonus) -> number => {
    return this.work.wage * hour + bonus.amount
  }
}

def Bonus = {
  var amount: number
}

var alba: Work = {
  name: "alba"
  kind: "..."
  wage: 10000
}

var somebody = new Person()
somebody.name = "Jessica"
somebody.work = alba
somebody.calc(3, { amount: 10 })

