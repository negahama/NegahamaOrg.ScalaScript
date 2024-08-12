// This is transpiled by ScalaScript
"use strict";

/*
  자료형 및 선언과 정의, 다중 대입
*/
let a: number = 255, b: number = 255, c: number = 255;
a = b = c = 100000;
b = 3 + 9 + 17 + 11.1 + 11;
c = (1 + 2) * 3 % 2 ** 3;
const s: string = "abc" + 'def' + 's';
const array1: string[] = ['a','b','c'];
const tuple: [string, number, boolean] = ['Hello',42,true];
const s1 = array1[a + b] + array1[1];
interface BasicInfo {name: string, parts: string[]}
const car: BasicInfo = {
  name: 'car',
  parts: ['engine','wheel','body'],
};
const obj: {name: string, age: number} = {
  name: "samuel",
  age: 50,
};
/*
  Class
*/
class Person {
  name: string = 'no name';
  gender: number;
  age: number;
  display() {
    return console.log(this.name, this.gender, this.age)
  }
  sum(a: number, b: number): number {
    return a + b
  }
}
class Student extends Person {
  grade: number;
  registerClass(what: Class) {
    return console.log("register class", what)
  }
}
class Class {
  name: string;
}
/*
  함수 호출
*/
s.startsWith("\r\n")
let list2 = s.concat("2" + 'def').trim().split(",");
//var list = if s.startsWith("* ") then s.trim() else s
/*
  함수 정의
*/
function sum(a: number, b: number): number {
  return a + b
}
const lambda1 = () => { 1 };
const lambda2 = (arg: number) => { arg };
const lambda3 = (arg: number) => { arg };
const lambda4 = (arg1: number, arg2: number) => { arg1 + arg2 };
const lambda5 = (arg1: number, arg2: number): number => { arg1 + arg2 };
const oncePerSecond = (callback: (p: string) => void): void => {
  //def oncePerSecond(callback: (p: string) => void): void = {
  while (true) {
    callback('1초 지남!')
    /*Thread sleep 1000*/
  }
  setTimeout(() => {
    callback('1초 지남!')
  }, 1000)
};
const timeFlies = (msg: string) => {
  //def timeFlies(msg: string): void = {
  console.log("time flies like an arrow... ", msg)
};
//def main(args: Array[String]): Unit = {
//  oncePerSecond(timeFlies)
//}
/*
  조건문, 반복문 관련
*/
for (let a = 1; a <= 10; a++) {
  for (let b = 1; b <= 10; b++) {
    for (let c = 1; c <= 10; c++) {
      console.log(a)
      if (a == b) { console.log('a == b') }
      else if (a < b) { console.log("a < b") }
      else if (a > b) { console.log("a > b") }
      else {
        console.log("error")
        const x: number = 2;
        switch (x) {
          case 0: { "zero" }
          case 1: { "one" }
          case 2: { "two" }
          default: { "other" }
        }
      }
    }
  }
}
if (! a) { console.log('a is not true') }
for (const a of array1) {
  for (const b of array1) {
    console.log(a, b)
  }
}
while (a < array1.length && sum(a, b) == 2) { b += 1; }
do { console.log(a) } while (a < array1.length && sum(a, b) == 2)
do {
  console.log(a)
  a += 1;
} while (a <= 10)
/*
  주석은 그대로 변환되어야 한다.
*/
function generateBypassElement(bypass: string[]): string {
  let result = "";
  bypass.forEach((s: string) => {
    // %%의 다음 줄부터 본문이 입력하기 때문에 s의 처음과 끝에 new line 문자가 존재하는데 이를 제거한다.
    let ns = s;
    if (s.startsWith("\r\n")) { ns = ns.slice(2); }
    ns = ns.trimEnd();
    result += ns;
  })
  return result
}
