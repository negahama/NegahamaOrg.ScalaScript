@NotTrans val setTimeout: ()-> void

/**
  자료형 및 선언과 정의, 다중 대입
*/
var a: number = 0xff
var b: number = 0xff
var c: number = 0xff

%%// 다중 대입
a = b = c = 0b11 + 0o11 + 0x11 + 11.1 + 1.1e+1

%%// 각종 산술 연산자
c = (1 + 2) * 3 % 2 ** 3

%%// 삼항 연산자
var gender = if a == 1 then 'male' else 'female'

/**
  문자열 관련
*/
%%// 문자열 접합 연산자
var s: string = "this " .. 'is ' .. `sample`

%%// 문자열 length
if (s.length > 0) s = "1"

%%// 문자열 함수들
var list1 = s.concat("2" .. 'def').trim().split(",")

%%// 문자열 인덱스는 1 부터
val included = s.includes("is", 1)

/**
  배열 관련
*/
%%// array type
val array1: string[] = ['a', 'b', 'c']

%%// array length
if (array1.length > 0) s = "2"

%%// 배열의 인덱스는 1 부터
s = array1[a + b] .. array1[1]

/**
  조건문
*/
if not s console log 'a is not true'

val matchTest = (x: number)-> string => x match {
  case 1 => return "one"
  case 2 => return "two"
  case _ => return "other"
}

/**
  반복문 관련
*/
%%// for parameter type check
var sum = 0
for (d <- 1 to 10) {
  sum += d
}

var result = ""
for (e <- array1) result = result .. e

%%// 중첩 for 문
for (a <- array1; b <- array1) { console.log(a, b) }

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

%%// function types and anonymous function call
%%// 스칼라는 인수의 이름을 명시할 필요없이 인수의 타입만 열거해서 표현한다.
%%// 인수가 하나이면 괄호를 생략할 수 있고 인수가 없으면 빈 괄호로 표현한다.
%%// 반면 타입스크립트는 형식적인 인수명이 있어야 한다.
%%// 그리고 인수가 하나만 있는 경우라도 괄호가 반드시 필요하다.
%%// 스칼라스크립트는 타입스크립트와 동일하다.
var t1: ()-> number
var t2: (arg: number)-> number[]

%%// 스칼라는 익명 함수를 표현할때 그냥 인수(또는 `_`) 하나만 달랑 쓰거나 아니면
%%// 인수의 타입을 명시해야 하거나 인수가 여러 개이면 괄호로 묶어야 하고
%%// 익명 함수의 리턴 타입은 명시할 수 없는 것 같다.
%%// 타입스크립트는 스칼라와 동일한데 익명 함수의 리턴 타입을 지정할 수 있다.
%%// 스칼라스크립트는 여기에 더해 인수가 하나이고 타입을 명시할 경우에도 괄호가 필요하지 않다.
val lambda1 = () => return 1
val lambda2 = arg => return arg
val lambda3 = arg: number => return arg
val lambda4 = (arg: number) => return arg
val lambda5 = (arg: number)-> number => return arg

/**
  함수 정의 및 호출
*/
// def add(a: number, b: number)-> number => return a + b
val add = (a: number, b: number)-> number => return a + b
var returnValue = add(1, 2)

/**
 * 
 * @param N 
 * @returns 
 */
val factorial = (N: number)-> number => {
  var sum: number = 0
  for (d <- 1 to N) {
    sum += d
  }
  return sum
}

val timeFlies1 = (msg: string) => {
  console.log("time flies like an arrow... ", msg)
}

val timeFlies2 = (msg: string)-> void => {
  console.log("time flies like an arrow... ", msg)
}

val oncePerSecond = (callback: (p:string)-> void)-> void => {
%%//def oncePerSecond(callback: (p: string)-> void)-> void => {
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
val hanoi = (n: number, from: string, to: string, mid: string)-> void => {
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
val concatenate = (ary: string[])-> string => {
  var result = ""
  for (e <- ary)
    result = result .. e
  return result
}

val generateBypassElement = (bypass: string[])-> string => {
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

def Work = {
  var name: string
  var kind: string
  var wage: number
}

def Person = {
  var name: string
  var work: Work
  val calc = (hour: number, bonus: Bonus)-> number => {
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
