@NotTrans class Console { log() }
@NotTrans var console: Console
@NotTrans def string.length()
// @NotTrans def string.concat(str: string)-> string
// @NotTrans def string.includes(searchString: string, position: number)-> boolean
// @NotTrans def string.endsWith(searchString: string, endPosition: number)-> boolean
// @NotTrans def string.indexOf(searchValue: string, fromIndex: number)-> number
// @NotTrans def string.lastIndexOf(searchValue: string, fromIndex: number)-> number
// @NotTrans def string.repeat(count: number)-> string
// @NotTrans def string.replace(searchFor: string, replaceWith: string)-> string
// @NotTrans def string.replaceAll(searchFor: string, replaceWith: string)-> string
// @NotTrans def string.search(regexp: string)-> string
@NotTrans def string.slice(beginIndex: number, endIndex: number)-> string
// @NotTrans def string.split(sep: string, limit: number)-> string[]
@NotTrans def string.startsWith(searchString: string, position: number)-> boolean
// @NotTrans def string.substring(indexStart: number, indexEnd: number)-> string
// @NotTrans def string.toLowerCase()-> string
// @NotTrans def string.toUpperCase()-> string
// @NotTrans def string.toString()-> string
@NotTrans def string.trim()-> string
// @NotTrans def string.trimStart()-> string
// @NotTrans def string.trimEnd()-> string
// @NotTrans def string.valueOf()-> string
@NotTrans def string.forEach()-> string
@NotTrans def setTimeout()

class ClassA {
  b: ClassB
  getB(param: string)-> ClassB => {
    return this.b
  }
}
class ClassB {
  c: string
}
var classA: ClassA
%%//classA = new ClassA
val st1 = classA.b.c
val st2 = classA.getB("dummy").c

def fun(a: number) => {
  var b = 0
  b = 1
}

%%/*
  Class
*/%%
class Person {
  name: string = 'no name'
  gender: number
  age: number
  display() => {
    // console.log(this.name, this.gender, this.age)
  }
}
class Student extends Person {
  grade: number
  registerClass(what:Class) => {
    console.log("register class", what)
  }
}
class Class {
  name: string
}

var person: Person
%%//person = new Person()
person.display()

val oncePerSecond = (callback: (p:string)-> void)-> void => {
%%////def oncePerSecond(callback: (p: string)-> void)-> void => {
  while (true) { callback('1초 지남!')
  Thread sleep 1000 }
  setTimeout(() => {
  callback('1초 지남!')
  }, 1000)
}

%%////def main(args: Array[String])-> Unit => {
%%////  oncePerSecond(timeFlies)
%%////}

%%/*
  반복문 관련
*/%%
def sum(a: number, b: number) => return a + b
val array2: string[] = ['a', 'b', 'c']
for (a <- array2; b <- array2) { console.log(a, b) }
var arrLen = 1
while arrLen < array2.length and sum(arrLen, 1) == 2 arrLen += 1
do console.log(arrLen) while arrLen < array2.length and sum(arrLen, 1) == 2

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
