/*
  자료형 및 선언과 정의, 다중 대입
*/
var a, b, c : number = 0xff
a = b = c = 1e5
b = 0b11 + 0o11 + 0x11 + 11.1 + 1.1e+1
c = (1 + 2) * 3 % 2 ** 3
val s:string = "abc" .. 'def' + 's'
val array1: string[] = ['a', 'b', 'c']
val tuple: [string, number, boolean] = ['Hello', 42, true]
val s1 = array1[a+b] + array1[1]
val obj: {
  name: string,
  age: number
} = {
  name: "samuel",
  age: 50
}
/*
  Class
*/
class Person {
  name: string = 'no name'
  gender: number
  age: number
  display() = {
    console.log(this.name, this.gender, this.age)
  }
  sum(a: number, b: number): number = {
    a + b
  }
}
class Student extends Person {
  grade: number
  registerClass(what:Class) = {
    console.log("register class", what)
  }
}
class Class {
  name: string
}
/*
  함수 호출
*/
s.startsWith("\r\n")
var list2 = s.concat("2" + 'def').trim().split(",")
//var list = if s.startsWith("* ") then s.trim() else s

/*
  함수 정의
*/
def sum(a: number, b: number): number = {
  a + b
}

val oncePerSecond = (callback: (p:string) => void): void => {
//def oncePerSecond(callback: (p: string) => void): void = {
  while (true) { callback('1초 지남!') /*Thread sleep 1000*/ }
  setTimeout(() => {
    callback('1초 지남!')
  }, 1000)
}

val timeFlies = (msg: string) => {
//def timeFlies(msg: string): void = {
  console.log("time flies like an arrow... ", msg)
}

//def main(args: Array[String]): Unit = {
//  oncePerSecond(timeFlies)
//}

/*
  조건문, 반복문 관련
*/
for (a <- 1 to 10; b <- 1 to 10; c <- 1 to 10) {
  console.log(a)
  if a == b
  then console.log('a == b')
  else if (a < b) console.log("a < b")
  elif (a > b) console.log("a > b")
  else {
    console.log("error")
    val x: number = 2
    x match {
      case 0 => "zero"
      case 1 => "one"
      case 2 => "two"
      case _ => "other"
    }
  }
}

if not a console log 'a is not true'
for (a <- array1; b <- array1) { console.log(a, b) }
while a < array1.length and sum(a, b) == 2 b += 1
do console.log(a) while a < array1.length and sum(a, b) == 2
do {
  console.log(a)
  a += 1
} while (a <= 10)

/*
  주석은 그대로 변환되어야 한다.
*/
def generateBypassElement(bypass: string[]): string = {
  var result = ""
  bypass.forEach(s:string => {
    // %%의 다음 줄부터 본문이 입력하기 때문에 s의 처음과 끝에 new line 문자가 존재하는데 이를 제거한다.
    var ns = s
    if (s.startsWith("\r\n")) ns = ns.slice(2)
    ns = ns.trimEnd()
    result += ns
  })
  result
}
